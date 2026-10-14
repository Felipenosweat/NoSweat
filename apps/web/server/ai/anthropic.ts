import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AiEditResult, SiteSpec } from "@nosweat/schema";
import { SITE_EDIT_SYSTEM_PROMPT, SITE_GENERATION_SYSTEM_PROMPT } from "./prompt";
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
 * Gera o SiteSpec com o Claude (Anthropic), usando saída estruturada: a resposta já vem no
 * formato do SiteSpec (o SDK valida com o Zod). Precisa de ANTHROPIC_API_KEY no servidor.
 */
export class AnthropicGenerator implements SiteGenerator {
  constructor(
    // Tempo máximo de cada chamada abaixo do limite da função (maxDuration = 300 s nas rotas) e
    // no máximo 1 nova tentativa: sem isso o SDK espera até 10 min e tenta 3 vezes.
    private readonly client: Anthropic = new Anthropic({ timeout: 240_000, maxRetries: 1 }),
    private readonly model: string = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    private readonly editModel: string = process.env.ANTHROPIC_EDIT_MODEL || DEFAULT_EDIT_MODEL,
  ) {}

  async generateSite(brief: string): Promise<SiteSpec> {
    const response = await this.client.messages.parse({
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
          content: `Here is how the business owner describes their business:\n\n<brief>\n${brief}\n</brief>`,
        },
      ],
    });

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
