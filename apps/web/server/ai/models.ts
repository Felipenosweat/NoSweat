import { fixtures, MODEL_LIBRARY, type ModelEntry } from "@nosweat/fixtures";
import type { SiteSpec, TemplateId } from "@nosweat/schema";
import { readBrief, type DesignPlan } from "../design";

// Sites-modelo de cada categoria (docs/design/model-sites.md). A geração "a partir do modelo"
// parte de um destes: estrutura, tema, composição e ordem das seções vêm daqui; a IA só escreve
// os textos (ModelFill, ver model-fill.ts). Os FATOS dos modelos (nome, telefone, preços,
// pessoas...) nunca passam para o site do cliente: applyModelFill apaga tudo antes de juntar.
export const MODELS: Record<TemplateId, SiteSpec> = {
  "home-services": fixtures["joes-plumbing"],
  beauty: fixtures["glow-salon"],
  restaurant: fixtures["rosas-kitchen"],
  professional: fixtures["hale-ortiz"],
  portfolio: fixtures["vega-photo"],
};

/** Modelo alternativo de serviços para casa: limpeza (composição modular). */
export const CLEANING_MODEL: SiteSpec = fixtures["sparkle-cleaning"];

/** Sem acento e em minúsculas. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Categoria (template) do pedido, pelos mesmos sinais da direção de arte (server/design).
 * `null` quando não dá para ter certeza: nesse caso a geração usa o caminho completo, em que a
 * própria IA escolhe o template.
 */
export function templateFor(brief: string): TemplateId | null {
  const { industry } = readBrief(brief);
  switch (industry) {
    case "trades":
    case "cleaning":
      return "home-services";
    case "beauty":
      return "beauty";
    case "food":
      return "restaurant";
    case "professional":
      return "professional";
    case "creative":
      return "portfolio";
    case "wellness": {
      // Spa e massagem ficam com beleza; clínicas e terapias, com profissionais (como no
      // prompt do caminho completo). Academia, ioga etc.: caminho completo.
      const text = normalize(brief);
      if (/\b(spa|massage|facial|esthetic)/.test(text)) return "beauty";
      if (/\b(dentist|dental|clinic|therap|chiropract|acupunct)/.test(text)) return "professional";
      return null;
    }
    case "other":
      return null;
  }
}

/** Um site-modelo da biblioteca, sem o texto do dono (só o que a escolha usa). */
type ModelChoice = Pick<ModelEntry, "slug" | "category" | "keywords" | "spec">;

/**
 * Os modelos originais, com as palavras do ramo de cada um. O primeiro de cada categoria é o
 * padrão (quando nada no pedido aponta para outro).
 */
const BASE_MODELS: ModelChoice[] = [
  {
    slug: "joes-plumbing",
    category: "home-services",
    keywords: ["plumb", "drain", "water heater", "leak", "pipe", "sewer", "faucet", "toilet"],
    spec: fixtures["joes-plumbing"],
  },
  {
    slug: "sparkle-cleaning",
    category: "home-services",
    keywords: ["clean", "maid", "housekeep", "move-out", "move out", "janitorial"],
    spec: fixtures["sparkle-cleaning"],
  },
  {
    slug: "glow-salon",
    category: "beauty",
    keywords: ["hair", "salon", "balayage", "color", "blowout", "keratin", "stylist", "highlights"],
    spec: fixtures["glow-salon"],
  },
  {
    slug: "rosas-kitchen",
    category: "restaurant",
    keywords: ["mexican", "taco", "taqueria", "restaurant", "burrito", "family restaurant"],
    spec: fixtures["rosas-kitchen"],
  },
  {
    slug: "hale-ortiz",
    category: "professional",
    keywords: ["bookkeep", "tax", "accounting", "cpa", "payroll", "irs", "accountant"],
    spec: fixtures["hale-ortiz"],
  },
  {
    slug: "vega-photo",
    category: "portfolio",
    keywords: ["photograph", "wedding", "elopement", "portrait", "photo"],
    spec: fixtures["vega-photo"],
  },
];

/** Todos os sites-modelo (5 por categoria, cada um com uma composição diferente). */
export const ALL_MODELS: ModelChoice[] = [...BASE_MODELS, ...MODEL_LIBRARY];

/** Quantas palavras do ramo aparecem no pedido (cada palavra conta uma vez). */
function keywordHits(text: string, keywords: string[]): number {
  return keywords.filter((keyword) => text.includes(normalize(keyword))).length;
}

/**
 * Site-modelo mais parecido com o pedido, dentro da categoria:
 * 1. o ramo (palavras do pedido) pesa mais: uma barbearia parte da barbearia, não do salão;
 * 2. desempate pela composição que a direção de arte escolheu (o modelo já foi pensado para ela);
 * 3. sem nenhum sinal, o modelo padrão da categoria (o primeiro da lista).
 */
export function modelFor(template: TemplateId, brief: string, plan?: DesignPlan): SiteSpec {
  const text = normalize(brief);
  const candidates = ALL_MODELS.filter((model) => model.category === template);
  let best: ModelChoice | undefined;
  let bestScore = -1;
  for (const model of candidates) {
    const score =
      keywordHits(text, model.keywords) * 10 +
      (plan && model.spec.design?.composition === plan.composition ? 1 : 0);
    // Empate: fica o que veio antes (os modelos originais vêm primeiro).
    if (score > bestScore) {
      best = model;
      bestScore = score;
    }
  }
  if (!best || bestScore <= 0) return MODELS[template];
  return best.spec;
}
