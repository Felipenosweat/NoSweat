import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { SiteSpec } from "@nosweat/schema";
import { SITE_GENERATION_SYSTEM_PROMPT } from "./prompt";
import type { SiteGenerator } from "./types";

/** Modelo padrão; dá para trocar com ANTHROPIC_MODEL sem mexer no código. */
const DEFAULT_MODEL = "claude-opus-5-5";

/**
 * Gera o SiteSpec com o Claude (Anthropic), usando saída estruturada: a resposta já vem no
 * formato do SiteSpec (o SDK valida com o Zod). Precisa de ANTHROPIC_API_KEY no servidor.
 */
export class AnthropicGenerator implements SiteGenerator {
  constructor(
    private readonly client: Anthropic = new Anthropic(),
    private readonly model: string = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
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
}
