import { fixtures, type FixtureSlug } from "@nosweat/fixtures";
import type { AiEditResult, SiteSpec } from "@nosweat/schema";
import type { DesignPlan } from "../design";
import type { SiteGenerator } from "./types";

const RULES: { slug: FixtureSlug; keywords: string[] }[] = [
  { slug: "joes-plumbing", keywords: ["plumb"] },
  { slug: "glow-salon", keywords: ["salon", "beauty", "hair"] },
  { slug: "rosas-kitchen", keywords: ["restaurant", "food", "cafe"] },
  { slug: "sparkle-cleaning", keywords: ["clean", "maid", "janitor"] },
  { slug: "hale-ortiz", keywords: ["bookkeep", "tax", "accountant", "cpa"] },
];

const DEFAULT_SLUG: FixtureSlug = "joes-plumbing";

/** Busca de foto do topo de cada fixture (com PEXELS_API_KEY, o dev local já mostra foto). */
const IMAGE_QUERIES: Partial<Record<FixtureSlug, string>> = {
  "joes-plumbing": "plumber tools copper pipes",
  "glow-salon": "bright modern hair salon interior",
  "rosas-kitchen": "mexican tacos table warm light",
  "sparkle-cleaning": "cleaning crew bright kitchen",
  "hale-ortiz": "tidy desk ledger notebook",
};

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

  async generateSite(brief: string, plan?: DesignPlan): Promise<SiteSpec> {
    const delayMs = this.options.delayMs ?? 1500;
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const slug = selectFixture(brief);
    const spec = structuredClone(fixtures[slug]);
    // Como a IA de verdade: só o imageQuery (a foto é buscada pelo servidor).
    const imageQuery = IMAGE_QUERIES[slug];
    spec.sections = spec.sections.map((section) =>
      section.type === "hero" && !section.imageQuery && imageQuery
        ? { ...section, imageQuery }
        : section,
    );
    // Como a IA de verdade: segue a composição do plano (o texto é o da fixture).
    if (plan) spec.design = { composition: plan.composition };
    return spec;
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
