import { fixtures, MODEL_LIBRARY, type ModelEntry } from "@nosweat/fixtures";
import type { SiteSpec, TemplateId } from "@nosweat/schema";
import { readBrief, type DesignPlan } from "../design";
import { getModelStore, type ModelRecord } from "../models/store";

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
      // prompt do caminho completo). Academia, ioga, pilates e personal: beleza também, pelo
      // vocabulário (aula marcada, "Book your visit", formulário de horário, endereço para ir),
      // que combina mais com um estúdio do que o de profissionais ("Book a consultation").
      const text = normalize(brief);
      if (/\b(spas?|massages?|facials?|esthetics?|esthetician|estheticians)\b/.test(text)) {
        return "beauty";
      }
      if (/\b(dentist|dental|clinic|therap|chiropract|acupunct)/.test(text)) return "professional";
      if (/\b(yoga|pilates|fitness|gyms?|trainers?|personal training)\b/.test(text))
        return "beauty";
      return null;
    }
    case "other":
      return null;
  }
}

/** Um site-modelo da biblioteca, sem o texto do dono (só o que a escolha usa). */
export type ModelChoice = Pick<ModelEntry, "slug" | "category" | "keywords" | "spec">;

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
 * Site-modelo mais parecido com o pedido, dentro da categoria, entre os modelos de `pool`:
 * 1. o ramo (palavras do pedido) pesa mais: uma barbearia parte da barbearia, não do salão;
 * 2. desempate pela composição que a direção de arte escolheu (o modelo já foi pensado para ela);
 * 3. nenhuma palavra do ramo no pedido: o modelo padrão da categoria (o primeiro da lista, o
 *    mais genérico), sem olhar a composição. Senão um telhadista partia, por exemplo, do
 *    paisagismo só porque o layout combinava (a composição vem do plano de qualquer jeito).
 */
export function pickModel(
  pool: readonly ModelChoice[],
  template: TemplateId,
  brief: string,
  plan?: DesignPlan,
): SiteSpec {
  const text = normalize(brief);
  const candidates = pool.filter((model) => model.category === template);
  let best: ModelChoice | undefined;
  let bestScore = -1;
  let bestHits = 0;
  for (const model of candidates) {
    const hits = keywordHits(text, model.keywords);
    const score = hits * 10 + (plan && model.spec.design?.composition === plan.composition ? 1 : 0);
    // Empate: fica o que veio antes (os modelos originais vêm primeiro).
    if (score > bestScore) {
      best = model;
      bestScore = score;
    }
    bestHits = Math.max(bestHits, hits);
  }
  if (!best || bestHits === 0) return candidates[0]?.spec ?? MODELS[template];
  return best.spec;
}

/** Site-modelo do código pelo slug (ex.: o preferido de um tipo de negócio no modo modelo). */
export function modelBySlug(slug: string): ModelChoice | undefined {
  return ALL_MODELS.find((model) => model.slug === slug);
}

/** Igual a pickModel, só com os modelos do código (síncrono; usado nos testes). */
export function modelFor(template: TemplateId, brief: string, plan?: DesignPlan): SiteSpec {
  return pickModel(ALL_MODELS, template, brief, plan);
}

/**
 * Junta os modelos do código com as versões do estúdio (/admin/models, tabela model_sites):
 * - modelo do código com versão APROVADA: a versão do estúdio substitui o spec (mesmo lugar na
 *   lista, então continua sendo o padrão da categoria se era); palavras do estúdio, se houver;
 * - versão em rascunho: não muda nada (vale a do código);
 * - modelo novo (só no estúdio): entra no fim da lista, e só quando aprovado.
 */
export function mergeModelPool(
  base: readonly ModelChoice[],
  overrides: readonly ModelRecord[],
): ModelChoice[] {
  const approved = new Map(
    overrides.filter((row) => row.status === "approved").map((row) => [row.slug, row]),
  );
  const merged = base.map((model): ModelChoice => {
    const row = approved.get(model.slug);
    if (!row) return model;
    approved.delete(model.slug);
    return { ...model, spec: row.spec, keywords: row.keywords ?? model.keywords };
  });
  for (const row of approved.values()) {
    const category = row.category ?? row.spec.template;
    merged.push({ slug: row.slug, category, keywords: row.keywords ?? [], spec: row.spec });
  }
  return merged;
}

/** Quanto tempo a lista juntada fica em memória (cada instância do servidor tem a sua). */
export const MODEL_POOL_TTL_MS = 60_000;

let poolCache: { pool: ModelChoice[]; expiresAt: number } | null = null;

/**
 * Modelos que a geração usa agora: os do código + as versões aprovadas no estúdio (ver
 * mergeModelPool). Fica 60 s em cache. Se o banco falhar (ou a tabela ainda não existir), usa
 * só os do código: gerar o site nunca depende do estúdio.
 */
export async function loadModelPool(now = Date.now()): Promise<ModelChoice[]> {
  if (poolCache && poolCache.expiresAt > now) return poolCache.pool;
  let pool: ModelChoice[];
  try {
    pool = mergeModelPool(ALL_MODELS, await getModelStore().list());
  } catch (error) {
    console.error("[models] could not load studio models; using the code models", error);
    pool = ALL_MODELS;
  }
  poolCache = { pool, expiresAt: now + MODEL_POOL_TTL_MS };
  return pool;
}

/** Esquece a lista em cache (o estúdio chama ao salvar; os testes, entre um caso e outro). */
export function clearModelPoolCache(): void {
  poolCache = null;
}
