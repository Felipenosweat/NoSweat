import type { SiteSpec } from "@nosweat/schema";
import type { SiteGenerator } from "./types";

/**
 * TODO(back): gerar o SiteSpec com a API da Anthropic (Claude).
 * - Ler ANTHROPIC_API_KEY do ambiente (nunca expor no cliente).
 * - Pedir saída estruturada no formato do SiteSpec (tool use / JSON schema gerado do Zod
 *   com z.toJSONSchema(SiteSpec)) e escolher um dos 5 templates.
 * - Não chamar a API aqui ainda: o projeto precisa rodar sem chaves.
 */
export class AnthropicGenerator implements SiteGenerator {
  async generateSite(_brief: string): Promise<SiteSpec> {
    throw new Error("AnthropicGenerator is not implemented yet. Use AI_PROVIDER=mock.");
  }
}
