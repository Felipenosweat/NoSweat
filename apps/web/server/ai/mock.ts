import { fixtures, type FixtureSlug } from "@nosweat/fixtures";
import type { AiEditResult, SiteSpec } from "@nosweat/schema";
import type { SiteGenerator } from "./types";

const RULES: { slug: FixtureSlug; keywords: string[] }[] = [
  { slug: "joes-plumbing", keywords: ["plumb"] },
  { slug: "glow-salon", keywords: ["salon", "beauty", "hair"] },
  { slug: "rosas-kitchen", keywords: ["restaurant", "food", "cafe"] },
];

const DEFAULT_SLUG: FixtureSlug = "joes-plumbing";

/** Escolhe a fixture por palavra-chave no brief (sem acento e sem diferenciar maiúsculas). */
export function selectFixture(brief: string): FixtureSlug {
  const text = brief
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  return RULES.find((rule) => rule.keywords.some((k) => text.includes(k)))?.slug ?? DEFAULT_SLUG;
}

/** Gerador falso: devolve uma fixture depois de um atraso, para simular a IA. Não usa rede nem chave. */
export class MockGenerator implements SiteGenerator {
  constructor(private readonly options: { delayMs?: number } = {}) {}

  async generateSite(brief: string): Promise<SiteSpec> {
    const delayMs = this.options.delayMs ?? 1500;
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    return structuredClone(fixtures[selectFixture(brief)]);
  }

  /** O mock não entende pedidos: devolve o site igual, explicando como ligar a IA de verdade. */
  async editSite(spec: SiteSpec, instruction: string): Promise<AiEditResult> {
    const delayMs = this.options.delayMs ?? 1500;
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    return {
      spec: structuredClone(spec),
      summary: `Demo mode: nothing was changed for "${instruction.slice(0, 80)}". Set AI_PROVIDER=anthropic to let the AI edit your site.`,
    };
  }
}
