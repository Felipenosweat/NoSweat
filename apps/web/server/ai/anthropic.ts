import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AiEditResult, SiteSpec } from "@nosweat/schema";
import { designBriefForPrompt, type DesignPlan } from "../design";
import { applyModelFill, lintFill, ModelFill, modelCopyForPrompt, verifyFacts } from "./model-fill";
import { loadModelPool, pickModel, templateFor } from "./models";
import {
  MODEL_FILL_SYSTEM_PROMPT,
  SITE_EDIT_SYSTEM_PROMPT,
  SITE_GENERATION_SYSTEM_PROMPT,
} from "./prompt";
import type { SiteGenerator } from "./types";

/**
 * Modelos padrão (trocáveis por variável, sem mexer no código):
 * - criar o site (primeira impressão do cliente, textos de marketing): Sonnet, ANTHROPIC_MODEL;
 * - editar com IA (quase toda chamada, mudança pequena no mesmo JSON): Haiku, ~20× mais barato,
 *   ANTHROPIC_EDIT_MODEL.
 */
const DEFAULT_MODEL = "claude-sonnet-5-5";
const DEFAULT_EDIT_MODEL = "claude-haiku-5-5";

/**
 * Geração a partir do modelo (padrão ligado; AI_MODEL_FIRST=false desliga): o modelo barato
 * (o mesmo da edição) escreve só o ModelFill; se falhar duas vezes, volta para o caminho completo.
 */
const MODEL_FIRST_MAX_TOKENS = 2000;
/** Tempo máximo de cada chamada do caminho barato: sobra tempo para o caminho completo. */
const MODEL_FIRST_TIMEOUT_MS = 30_000;
/**
 * Orçamento total de uma geração (caminho barato + completo). A rota tem maxDuration = 300 s na
 * Vercel: terminando antes, a rota sempre devolve o próprio erro em JSON (502) em vez de a Vercel
 * cortar a função com um 504 sem corpo.
 */
const GENERATION_BUDGET_MS = 270_000;
/** Tempo mínimo dado ao caminho completo, mesmo que o barato tenha gastado quase tudo. */
const FULL_MIN_TIMEOUT_MS = 20_000;

export function modelFirstEnabled(value = process.env.AI_MODEL_FIRST): boolean {
  return value?.trim().toLowerCase() !== "false";
}

/** Caminho usado na última geração (para o log e para os testes). */
export type GenerationPath = "model-first" | "full";

/**
 * Gera o SiteSpec com o Claude (Anthropic), usando saída estruturada: a resposta já vem no
 * formato do SiteSpec (o SDK valida com o Zod). Precisa de ANTHROPIC_API_KEY no servidor.
 */
export class AnthropicGenerator implements SiteGenerator {
  readonly usesAi = true;

  constructor(
    // Tempo máximo de cada chamada abaixo do limite da função (maxDuration = 300 s nas rotas) e
    // no máximo 1 nova tentativa: sem isso o SDK espera até 10 min e tenta 3 vezes.
    private readonly client: Anthropic = new Anthropic({ timeout: 240_000, maxRetries: 1 }),
    private readonly model: string = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    private readonly editModel: string = process.env.ANTHROPIC_EDIT_MODEL || DEFAULT_EDIT_MODEL,
    private readonly modelFirst: boolean = modelFirstEnabled(),
  ) {}

  /** Caminho da última chamada de generateSite. */
  lastPath: GenerationPath | null = null;

  async generateSite(brief: string, plan?: DesignPlan): Promise<SiteSpec> {
    const deadline = Date.now() + GENERATION_BUDGET_MS;
    if (this.modelFirst) {
      const spec = await this.generateFromModel(brief, plan);
      if (spec) {
        this.lastPath = "model-first";
        return spec;
      }
    }
    this.lastPath = "full";
    console.info("[ai] generate path", { path: "full", model: this.model });
    // O que sobrou do orçamento, sem nova tentativa do SDK (que passaria do limite da função).
    return this.generateFull(brief, plan, {
      timeout: Math.max(FULL_MIN_TIMEOUT_MS, deadline - Date.now()),
      maxRetries: 0,
    });
  }

  /**
   * Caminho barato: parte do site-modelo da categoria e pede só o ModelFill ao modelo de edição
   * (Haiku), com pouco esforço e poucos tokens. Até 2 tentativas (a segunda leva os erros da
   * primeira). Devolve null quando não dá (categoria incerta, recusa, erro da API, resposta
   * inválida ou desonesta duas vezes): aí quem chamou usa o caminho completo.
   */
  private async generateFromModel(brief: string, plan?: DesignPlan): Promise<SiteSpec | null> {
    const template = templateFor(brief);
    if (!template) {
      console.info("[ai] model-first skipped", { reason: "unsure_category" });
      return null;
    }
    // Modelos do código + versões aprovadas no estúdio (/admin/models), com cache curto.
    const model = pickModel(await loadModelPool(), template, brief);
    let problems: string[] = [];
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      let raw: unknown;
      try {
        const response = await this.client.messages.parse(
          {
            model: this.editModel,
            max_tokens: MODEL_FIRST_MAX_TOKENS,
            // Pedido curto e bem definido: pouco esforço. No Haiku o pensamento estendido fica
            // desligado (em outros modelos "disabled" pode ser recusado, então só no Haiku).
            ...(this.editModel.startsWith("claude-haiku")
              ? { thinking: { type: "disabled" as const } }
              : {}),
            output_config: {
              effort: "low",
              format: zodOutputFormat(ModelFill),
            },
            // Texto fixo + resumo do modelo da categoria: os dois ficam em cache (iguais para
            // todo cliente da mesma categoria); só o pedido do dono muda.
            system: [
              {
                type: "text",
                text: MODEL_FILL_SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" },
              },
              {
                type: "text",
                text: `<example_site>\n${modelCopyForPrompt(model)}\n</example_site>`,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages: [{ role: "user", content: fillRequest(brief, plan, problems) }],
          },
          // Sem nova tentativa do SDK: no pior caso (2 × 30 s) ainda sobra tempo para o completo.
          { timeout: MODEL_FIRST_TIMEOUT_MS, maxRetries: 0 },
        );
        if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
          console.warn("[ai] model-first fallback", { reason: response.stop_reason, attempt });
          return null;
        }
        raw = response.parsed_output;
      } catch (error) {
        // Erro da API (rede, limite, 5xx): não insiste no caminho barato.
        if (error instanceof Anthropic.APIError) {
          console.warn("[ai] model-first fallback", { reason: "api_error", status: error.status });
          return null;
        }
        // Resposta que não passou no formato (o SDK valida com o Zod): tenta de novo.
        problems = [`The answer did not match the required format: ${String(error).slice(0, 300)}`];
        continue;
      }

      const parsed = ModelFill.safeParse(raw);
      if (!parsed.success) {
        problems = parsed.error.issues
          .slice(0, 10)
          .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
        continue;
      }
      const fill = parsed.data;
      problems = lintFill(fill, brief, model);
      if (problems.length > 0) continue;

      try {
        const spec = applyModelFill(model, fill, plan, verifyFacts(fill.business, brief));
        console.info("[ai] generate path", {
          path: "model-first",
          model: this.editModel,
          template,
          attempt,
        });
        return spec;
      } catch (error) {
        problems = [`The site could not be built from this answer: ${String(error).slice(0, 300)}`];
      }
    }
    console.warn("[ai] model-first fallback", { reason: "invalid_fill", problems });
    return null;
  }

  /** Caminho completo (o de sempre): o modelo principal escreve o SiteSpec inteiro. */
  private async generateFull(
    brief: string,
    plan?: DesignPlan,
    options?: { timeout?: number; maxRetries?: number },
  ): Promise<SiteSpec> {
    const response = await this.client.messages.parse(
      {
        model: this.model,
        max_tokens: 16000,
        // Pensamento adaptativo é o padrão neste modelo; "medium" equilibra qualidade e tempo de espera.
        output_config: {
          effort: "medium",
          format: zodOutputFormat(SiteSpec),
        },
        system: SITE_GENERATION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: generationRequest(brief, plan),
          },
        ],
      },
      options,
    );

    if (response.stop_reason === "refusal") {
      throw new Error(
        `Claude declined to generate this site (${response.stop_details?.category ?? "unknown"}).`,
      );
    }
    if (response.stop_reason === "max_tokens") {
      throw new Error("Claude's response was cut off before the site was complete.");
    }
    if (!response.parsed_output) {
      throw new Error("Claude did not return a valid SiteSpec.");
    }
    return response.parsed_output;
  }

  async editSite(spec: SiteSpec, instruction: string): Promise<AiEditResult> {
    const response = await this.client.messages.parse({
      model: this.editModel,
      max_tokens: 16000,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(AiEditResult),
      },
      system: SITE_EDIT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `<current_site>\n${JSON.stringify(spec)}\n</current_site>\n\nThe owner's request:\n<request>\n${instruction}\n</request>`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      throw new Error(
        `Claude declined this change (${response.stop_details?.category ?? "unknown"}).`,
      );
    }
    if (response.stop_reason === "max_tokens") {
      throw new Error("Claude's response was cut off before the change was complete.");
    }
    if (!response.parsed_output) {
      throw new Error("Claude did not return a valid site.");
    }
    return response.parsed_output;
  }
}

/** Pedido do caminho barato: a descrição do dono, a direção de arte e os erros da tentativa anterior. */
export function fillRequest(brief: string, plan?: DesignPlan, problems: string[] = []): string {
  const parts = [generationRequest(brief, plan, "write the copy for it")];
  if (problems.length > 0) {
    parts.push(
      `Your previous answer had these problems. Fix every one:\n\n<problems>\n${problems.map((p) => `- ${p}`).join("\n")}\n</problems>`,
    );
  }
  return parts.join("\n\n");
}

/** Pedido de criação: a descrição do dono e, quando houver, a direção de arte já escolhida. */
export function generationRequest(
  brief: string,
  plan?: DesignPlan,
  planNote = 'fill "design" and write the copy for it',
): string {
  const parts = [
    `Here is how the business owner describes their business:\n\n<brief>\n${brief}\n</brief>`,
  ];
  if (plan) {
    parts.push(
      `Art direction chosen for this site (${planNote}):\n\n<design_plan>\n${designBriefForPrompt(plan)}\n</design_plan>`,
    );
  }
  return parts.join("\n\n");
}
