import { SiteSpec, TemplateId } from "@nosweat/schema";
import { MODEL_SLUG, type ModelStatus, type ModelSummary } from "@/lib/model-studio";
import { ALL_MODELS, clearModelPoolCache, type ModelChoice } from "../ai/models";
import { getModelStore, type ModelRecord } from "./store";

// Estúdio de modelos (/admin/models): o fundador revisa, edita e aprova os sites-modelo que a
// geração usa. Os modelos do código (packages/fixtures, ALL_MODELS) continuam sendo a base; o
// estúdio guarda versões na tabela model_sites (ver store.ts e ../ai/models.ts):
// - versão APROVADA de um modelo do código substitui o spec na geração;
// - modelo criado no estúdio entra na geração só quando aprovado;
// - salvar uma edição volta o modelo para rascunho (precisa aprovar de novo).
// Só admins chegam aqui (as rotas e as páginas chamam requireAdmin antes).

export type { ModelStatus, ModelSummary } from "@/lib/model-studio";

export type StudioModel = ModelSummary & { spec: SiteSpec };

export class ModelStudioError extends Error {
  constructor(
    readonly code: "not_found" | "invalid_request" | "conflict",
    message: string,
  ) {
    super(message);
    this.name = "ModelStudioError";
  }
}

const CODE_MODELS = new Map<string, ModelChoice>(ALL_MODELS.map((model) => [model.slug, model]));

/** JSON com as chaves em ordem (o jsonb do Postgres não guarda a ordem das chaves). */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Os dois specs são o mesmo site (depois do SiteSpec.parse)? */
export function sameModelSpec(a: SiteSpec, b: SiteSpec): boolean {
  return stableJson(SiteSpec.parse(a)) === stableJson(SiteSpec.parse(b));
}

function toModel(code: ModelChoice | undefined, row: ModelRecord | null): StudioModel | null {
  if (code) {
    const spec = row?.spec ?? code.spec;
    const edited = row ? !sameModelSpec(row.spec, code.spec) : false;
    const approved = row?.status === "approved";
    return {
      slug: code.slug,
      name: spec.business.name,
      category: code.category,
      status: row?.status ?? "draft",
      source: "code",
      edited,
      inUse: true,
      usesStudioVersion: approved,
      keywords: row?.keywords ?? code.keywords,
      updatedAt: row?.updatedAt ?? null,
      spec,
    };
  }
  if (!row) return null;
  const approved = row.status === "approved";
  return {
    slug: row.slug,
    name: row.spec.business.name,
    category: row.category ?? row.spec.template,
    status: row.status,
    source: "studio",
    edited: true,
    inUse: approved,
    usesStudioVersion: approved,
    keywords: row.keywords ?? [],
    updatedAt: row.updatedAt,
    spec: row.spec,
  };
}

/** Ordem da tela: categoria (ordem do TemplateId), depois a ordem da geração. */
function sortModels(models: StudioModel[]): StudioModel[] {
  const order = TemplateId.options;
  return models
    .map((model, index) => ({ model, index }))
    .sort(
      (a, b) =>
        order.indexOf(a.model.category) - order.indexOf(b.model.category) || a.index - b.index,
    )
    .map(({ model }) => model);
}

/** Todos os modelos: os do código (com a versão do estúdio, se houver) e os criados no estúdio. */
export async function listModels(): Promise<StudioModel[]> {
  const rows = await getModelStore().list();
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  const models: StudioModel[] = [];
  for (const code of ALL_MODELS) {
    const model = toModel(code, bySlug.get(code.slug) ?? null);
    if (model) models.push(model);
  }
  for (const row of rows) {
    if (CODE_MODELS.has(row.slug)) continue;
    const model = toModel(undefined, row);
    if (model) models.push(model);
  }
  return sortModels(models);
}

/** Um modelo pelo slug (`null` se não existe nem no código nem no estúdio). */
export async function getModel(slug: string): Promise<StudioModel | null> {
  if (!MODEL_SLUG.test(slug)) return null;
  const row = await getModelStore().get(slug);
  return toModel(CODE_MODELS.get(slug), row);
}

/** Só o resumo (sem o spec), para as respostas da API. */
export function summarize(model: StudioModel): ModelSummary {
  const { spec: _spec, ...summary } = model;
  void _spec;
  return summary;
}

type Existing = { code: ModelChoice | undefined; row: ModelRecord | null };

async function existing(slug: string): Promise<Existing | null> {
  if (!MODEL_SLUG.test(slug)) return null;
  const code = CODE_MODELS.get(slug);
  const row = await getModelStore().get(slug);
  return code || row ? { code, row } : null;
}

function categoryOf({ code, row }: Existing, spec: SiteSpec): TemplateId {
  return code?.category ?? row?.category ?? spec.template;
}

/**
 * Salva uma edição (vira rascunho: precisa aprovar de novo para valer na geração).
 * `baseUpdatedAt`: o `updatedAt` que o editor conhece; se a versão salva mudou depois disso,
 * ModelStudioError "conflict" (outra aba salvou antes). `keywords` undefined = mantém.
 */
export async function saveModel(
  slug: string,
  spec: SiteSpec,
  options: { userId?: string | null; baseUpdatedAt?: string; keywords?: string[] } = {},
): Promise<StudioModel | null> {
  const found = await existing(slug);
  if (!found) return null;
  if (
    options.baseUpdatedAt !== undefined &&
    found.row &&
    found.row.updatedAt !== options.baseUpdatedAt
  ) {
    throw new ModelStudioError(
      "conflict",
      "This model was changed in another tab. Reload to get the latest version.",
    );
  }
  const parsed = SiteSpec.parse(spec);
  const row = await getModelStore().upsert({
    slug,
    spec: parsed,
    status: "draft",
    category: categoryOf(found, parsed),
    keywords: options.keywords ?? found.row?.keywords ?? null,
    updatedBy: options.userId ?? null,
  });
  clearModelPoolCache();
  return toModel(found.code, row);
}

/** Aprova (entra na geração) ou volta para rascunho. Modelo do código sem versão: copia o do código. */
export async function setStatus(
  slug: string,
  status: ModelStatus,
  userId: string | null = null,
): Promise<StudioModel | null> {
  const found = await existing(slug);
  if (!found) return null;
  const spec = found.row?.spec ?? found.code?.spec;
  if (!spec) return null;
  // Modelo do código sem versão salva e voltando para rascunho: nada a gravar.
  if (!found.row && status === "draft") return toModel(found.code, null);
  const row = await getModelStore().upsert({
    slug,
    spec,
    status,
    category: categoryOf(found, spec),
    keywords: found.row?.keywords ?? null,
    updatedBy: userId,
  });
  clearModelPoolCache();
  return toModel(found.code, row);
}

/** Troca as palavras do ramo (o que faz a geração escolher este modelo). Mantém o status. */
export async function setKeywords(
  slug: string,
  keywords: string[],
  userId: string | null = null,
): Promise<StudioModel | null> {
  const found = await existing(slug);
  if (!found) return null;
  const spec = found.row?.spec ?? found.code?.spec;
  if (!spec) return null;
  const row = await getModelStore().upsert({
    slug,
    spec,
    status: found.row?.status ?? "draft",
    category: categoryOf(found, spec),
    keywords,
    updatedBy: userId,
  });
  clearModelPoolCache();
  return toModel(found.code, row);
}

/**
 * Modelo do código: apaga a versão do estúdio (volta ao original). Modelo criado no estúdio:
 * apaga o modelo. `null` se o slug não existe.
 */
export async function resetModel(slug: string): Promise<StudioModel | { deleted: true } | null> {
  const found = await existing(slug);
  if (!found) return null;
  if (found.row) await getModelStore().delete(slug);
  clearModelPoolCache();
  if (!found.code) return { deleted: true };
  return toModel(found.code, null);
}

/** Próximo slug livre: "<base>-copy", "<base>-copy-2"... */
async function freeSlug(base: string): Promise<string> {
  const rows = await getModelStore().list();
  const taken = new Set([...CODE_MODELS.keys(), ...rows.map((row) => row.slug)]);
  const stem = base.replace(/-copy(?:-\d+)?$/, "").slice(0, 50);
  for (let n = 1; n < 1000; n += 1) {
    const slug = n === 1 ? `${stem}-copy` : `${stem}-copy-${n}`;
    if (!taken.has(slug)) return slug;
  }
  throw new ModelStudioError("conflict", "Could not find a free name for the copy.");
}

/**
 * Cria um modelo novo (rascunho) copiando outro (a versão atual dele: a do estúdio, se houver).
 * `category` vira também o `template` do spec (vocabulário das seções).
 */
export async function createModel(
  category: TemplateId,
  fromSlug: string,
  options: { slug?: string; userId?: string | null } = {},
): Promise<StudioModel> {
  const source = await getModel(fromSlug);
  if (!source) throw new ModelStudioError("not_found", "The model to copy was not found.");
  let slug = options.slug;
  if (slug) {
    if (CODE_MODELS.has(slug) || (await getModelStore().get(slug))) {
      throw new ModelStudioError("conflict", `A model called "${slug}" already exists.`);
    }
  } else {
    slug = await freeSlug(fromSlug);
  }
  const spec = SiteSpec.parse({ ...structuredClone(source.spec), template: category });
  const row = await getModelStore().upsert({
    slug,
    spec,
    status: "draft",
    category,
    keywords: [...source.keywords],
    updatedBy: options.userId ?? null,
  });
  const model = toModel(undefined, row);
  if (!model) throw new Error("The new model could not be read back.");
  return model;
}
