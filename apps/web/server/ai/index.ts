import { AiEditResult, SiteSpec } from "@nosweat/schema";
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

/** Gera e VALIDA o SiteSpec. Nada sai daqui sem passar por SiteSpec.parse. */
export async function generateSiteSpec(
  brief: string,
  generator: SiteGenerator = getSiteGenerator(),
): Promise<SiteSpec> {
  const raw: unknown = await generator.generateSite(brief);
  return SiteSpec.parse(raw);
}

/** Pede uma mudança à IA e VALIDA o resultado (o site inteiro precisa continuar válido). */
export async function editSiteSpec(
  spec: SiteSpec,
  instruction: string,
  generator: SiteGenerator = getSiteGenerator(),
): Promise<AiEditResult> {
  const raw: unknown = await generator.editSite(spec, instruction);
  return AiEditResult.parse(raw);
}
