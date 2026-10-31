import { AiEditResult, SiteSpec } from "@nosweat/schema";
import { applyDesignPlan, planDesign, type PlanOptions } from "../design";
import { sanitizeAiImages } from "../images/sanitize";
import { keepReviewUrl } from "../reviews";
import { AnthropicGenerator } from "./anthropic";
import { MockGenerator } from "./mock";
import { OpenAIGenerator } from "./openai";
import type { SiteGenerator } from "./types";

export type { SiteGenerator } from "./types";

/** Produção de verdade na Vercel (não vale para Preview nem para o dev local). */
function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/** Sem IA configurada: monta o site a partir do site-modelo mais parecido (sem chamar API). */
function templateMode(reason: string, quiet = false): SiteGenerator {
  if (!quiet) console.warn(`[ai] template mode (no AI): ${reason}`);
  return new MockGenerator({ delayMs: 800, templateMode: true });
}

/**
 * Escolhe o gerador pela variável AI_PROVIDER (padrão: mock, para o dev e os testes).
 * Em produção sem IA configurada (mock, ou "anthropic" sem ANTHROPIC_API_KEY) o site continua
 * funcionando no "modo modelo": parte do site-modelo mais parecido da biblioteca (25 modelos),
 * com textos genéricos do ramo e só os fatos que estão no pedido. A IA de verdade entra quando a
 * chave for configurada; até lá, mudanças pela IA respondem que ainda não estão ligadas.
 */
export function getSiteGenerator(
  provider = process.env.AI_PROVIDER || "mock",
  options: { quiet?: boolean } = {},
): SiteGenerator {
  switch (provider) {
    case "mock":
      if (isVercelProduction()) {
        return templateMode("AI_PROVIDER is mock or not set", options.quiet);
      }
      return new MockGenerator();
    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
        return templateMode(
          "AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set",
          options.quiet,
        );
      }
      return new AnthropicGenerator();
    case "openai":
      return new OpenAIGenerator();
    default:
      throw new Error(`Unknown AI_PROVIDER "${provider}". Use mock, anthropic or openai.`);
  }
}

/**
 * As mudanças pela IA estão ligadas? `false` no modo modelo (produção sem chave de IA): o
 * editor esconde o pedido à IA e o "Rewrite with AI". O mock do dev local conta como ligado
 * (simula a IA, com créditos e limites, para testar o fluxo inteiro). Configuração inválida =
 * desligado (a rota responde o erro de configuração quando alguém tentar).
 */
export function aiEnabled(provider = process.env.AI_PROVIDER || "mock"): boolean {
  try {
    return getSiteGenerator(provider, { quiet: true }).usesAi;
  } catch {
    return false;
  }
}

/**
 * Gera e VALIDA o SiteSpec. Nada sai daqui sem passar por SiteSpec.parse.
 * 1. Direção de arte (server/design): composição, ação principal e referências, sem IA.
 * 2. A IA escreve o site para essa direção (o plano vai no pedido). Com a Anthropic, primeiro
 *    a partir do site-modelo da categoria (só um ModelFill no modelo barato, ver model-fill.ts);
 *    se falhar, o caminho completo.
 * 3. O plano fica gravado em `spec.design` (com os ids das referências, para depuração).
 * A IA não escolhe fotos: `image` e galerias da saída dela são descartados (a foto do topo é
 * buscada depois pelo servidor a partir de `hero.imageQuery`, ver server/images).
 */
export async function generateSiteSpec(
  brief: string,
  generator: SiteGenerator = getSiteGenerator(),
  planOptions: PlanOptions = {},
): Promise<SiteSpec> {
  const plan = planDesign(brief, planOptions);
  console.info("[design] plan", {
    composition: plan.composition,
    allowed: plan.allowed,
    references: plan.references.map((ref) => ref.id),
    fallback: plan.fallback,
  });
  const raw: unknown = await generator.generateSite(brief, plan);
  // O link de avaliações do Google só vem do dono (página /reviews): a IA nunca põe um.
  const spec = SiteSpec.parse(keepReviewUrl(sanitizeAiImages(SiteSpec.parse(raw)), null));
  return SiteSpec.parse({ ...spec, design: applyDesignPlan(spec.design, plan) });
}

/**
 * Pede uma mudança à IA e VALIDA o resultado (o site inteiro precisa continuar válido).
 * Fotos (`hero.image`) e galerias do site anterior são restauradas: a IA não mexe nelas.
 */
export async function editSiteSpec(
  spec: SiteSpec,
  instruction: string,
  generator: SiteGenerator = getSiteGenerator(),
): Promise<AiEditResult & { changed: boolean }> {
  const raw: unknown = await generator.editSite(spec, instruction);
  const result = AiEditResult.parse(raw);
  // A IA devolveu o mesmo site (pedido impossível ou já atendido): quem chama não salva nada.
  const changed = stableJson(result.spec) !== stableJson(SiteSpec.parse(spec));
  // Fotos e galerias voltam como estavam (regras em server/images/sanitize.ts). O link de
  // avaliações do Google também: só o dono muda (página /reviews).
  const edited = keepReviewUrl(sanitizeAiImages(result.spec, spec), spec);
  return { ...AiEditResult.parse({ ...result, spec: edited }), changed };
}

/** JSON com as chaves em ordem (o Zod e a IA podem reordenar campos): compara só o conteúdo. */
function stableJson(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === "object") {
      return Object.fromEntries(
        Object.entries(v as Record<string, unknown>)
          .filter(([, item]) => item !== undefined)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, item]) => [k, sort(item)]),
      );
    }
    return v;
  };
  return JSON.stringify(sort(value));
}
