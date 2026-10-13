import { AiEditResult, SiteSpec } from "@nosweat/schema";
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
 * A IA não escolhe fotos: `image` e galerias da saída dela são descartados (a foto do topo é
 * buscada depois pelo servidor a partir de `hero.imageQuery`, ver server/images).
 */
export async function generateSiteSpec(
  brief: string,
  generator: SiteGenerator = getSiteGenerator(),
): Promise<SiteSpec> {
  const raw: unknown = await generator.generateSite(brief);
  return SiteSpec.parse(sanitizeAiImages(SiteSpec.parse(raw)));
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
