import { AiEditResult, SiteSpec } from "@nosweat/schema";
import { applyDesignPlan, planDesign, type PlanOptions } from "../design";
import { sanitizeAiImages } from "../images/sanitize";
import { AnthropicGenerator } from "./anthropic";
import { MockGenerator } from "./mock";
import { OpenAIGenerator } from "./openai";
import type { SiteGenerator } from "./types";

export type { SiteGenerator } from "./types";

/** Escolhe o gerador pela variável AI_PROVIDER (padrão: mock). */
export function getSiteGenerator(provider = process.env.AI_PROVIDER || "mock"): SiteGenerator {
  switch (provider) {
    case "mock":
      return new MockGenerator();
    case "anthropic":
      return new AnthropicGenerator();
    case "openai":
      return new OpenAIGenerator();
    default:
      throw new Error(`Unknown AI_PROVIDER "${provider}". Use mock, anthropic or openai.`);
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
  const spec = SiteSpec.parse(sanitizeAiImages(SiteSpec.parse(raw)));
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
): Promise<AiEditResult> {
  const raw: unknown = await generator.editSite(spec, instruction);
  const result = AiEditResult.parse(raw);
  // Fotos e galerias voltam como estavam (regras em server/images/sanitize.ts).
  return AiEditResult.parse({ ...result, spec: sanitizeAiImages(result.spec, spec) });
}
