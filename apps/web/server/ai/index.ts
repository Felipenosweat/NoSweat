import { AiEditResult, SiteSpec } from "@nosweat/schema";
import { applyDesignPlan, planDesign, type PlanOptions } from "../design";
import { sanitizeAiImages } from "../images/sanitize";
import { AnthropicGenerator } from "./anthropic";
import { MockGenerator } from "./mock";
import { OpenAIGenerator } from "./openai";
import type { SiteGenerator } from "./types";

export type { SiteGenerator } from "./types";

/** Produção de verdade na Vercel (não vale para Preview nem para o dev local). */
function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Escolhe o gerador pela variável AI_PROVIDER (padrão: mock, para o dev e os testes).
 * Erros de configuração aparecem AQUI, antes de a rota gastar um crédito do cliente:
 * - em produção, o mock nunca roda (ele devolve sites de exemplo, como o Joe's Plumbing);
 * - "anthropic" sem ANTHROPIC_API_KEY (nem ANTHROPIC_AUTH_TOKEN) falha na hora. A conferência
 *   fica aqui e não no construtor do AnthropicGenerator, porque os testes montam o gerador com
 *   um cliente de mentira e sem chave.
 */
export function getSiteGenerator(provider = process.env.AI_PROVIDER || "mock"): SiteGenerator {
  switch (provider) {
    case "mock":
      if (isVercelProduction()) {
        console.error(
          "[ai] AI_PROVIDER is mock (or not set) in production. Set AI_PROVIDER=anthropic and ANTHROPIC_API_KEY in Vercel.",
        );
        throw new Error(
          'The mock AI is not allowed in production. Set AI_PROVIDER="anthropic" and ANTHROPIC_API_KEY.',
        );
      }
      return new MockGenerator();
    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
        console.error("[ai] AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set.");
        throw new Error('AI_PROVIDER is "anthropic" but ANTHROPIC_API_KEY is not set.');
      }
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
