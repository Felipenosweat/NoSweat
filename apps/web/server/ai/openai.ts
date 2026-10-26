import type { AiEditResult, SiteSpec } from "@nosweat/schema";
import type { DesignPlan } from "../design";
import type { SiteGenerator } from "./types";

/**
 * TODO(back): gerar o SiteSpec com a API da OpenAI.
 * - Ler OPENAI_API_KEY do ambiente (nunca expor no cliente).
 * - Usar saída estruturada com o JSON schema do SiteSpec (z.toJSONSchema(SiteSpec)).
 * - Não chamar a API aqui ainda: o projeto precisa rodar sem chaves.
 */
export class OpenAIGenerator implements SiteGenerator {
  readonly usesAi = true;

  async generateSite(_brief: string, _plan?: DesignPlan): Promise<SiteSpec> {
    throw new Error("OpenAIGenerator is not implemented yet. Use AI_PROVIDER=mock.");
  }

  async editSite(_spec: SiteSpec, _instruction: string): Promise<AiEditResult> {
    throw new Error("OpenAIGenerator is not implemented yet. Use AI_PROVIDER=anthropic or mock.");
  }
}
