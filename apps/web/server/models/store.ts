import { SiteSpec, TemplateId } from "@nosweat/schema";
import { z } from "zod";
import { MODEL_SLUG, ModelStatus } from "@/lib/model-studio";
import { normalizeSupabaseUrl } from "../store/supabase";

// Versões dos sites-modelo salvas pelo estúdio (/admin/models), tabela public.model_sites
// (migration 0020). Supabase em produção, memória no dev/testes (mesma regra do server/store).
// Usa a chave secreta: só roda no servidor.

export { MODEL_SLUG, ModelStatus };

export type ModelRecord = {
  slug: string;
  spec: SiteSpec;
  status: ModelStatus;
  category: TemplateId | null;
  keywords: string[] | null;
  updatedAt: string;
  updatedBy: string | null;
};

export type ModelWrite = Omit<ModelRecord, "updatedAt">;

export interface ModelStore {
  list(): Promise<ModelRecord[]>;
  get(slug: string): Promise<ModelRecord | null>;
  /** Cria ou substitui a linha do slug. */
  upsert(record: ModelWrite): Promise<ModelRecord>;
  /** Apaga a linha; `false` se não existia. */
  delete(slug: string): Promise<boolean>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const Row = z.object({
  slug: z.string(),
  spec: SiteSpec,
  status: ModelStatus,
  category: TemplateId.nullable(),
  keywords: z.array(z.string()).nullable(),
  updated_at: z.string(),
  updated_by: z.string().nullable(),
});
type Row = z.infer<typeof Row>;

function toRecord(row: Row): ModelRecord {
  return {
    slug: row.slug,
    spec: row.spec,
    status: row.status,
    category: row.category,
    keywords: row.keywords,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

/**
 * Linhas que não passam no SiteSpec atual (schema mudou) ficam de fora e vão para o log, em vez
 * de derrubar o estúdio e a geração inteira.
 */
export function parseRows(rows: unknown): ModelRecord[] {
  return z
    .array(z.unknown())
    .parse(rows)
    .flatMap((row) => {
      const parsed = Row.safeParse(row);
      if (parsed.success) return [toRecord(parsed.data)];
      const slug = (row as { slug?: unknown } | null)?.slug;
      console.error(
        "[models] skipping a model row that fails the schema",
        slug,
        parsed.error.issues,
      );
      return [];
    });
}

function assertSlug(slug: string): void {
  if (!MODEL_SLUG.test(slug)) throw new Error(`Invalid model slug: ${slug}`);
}

export class SupabaseModelStore implements ModelStore {
  private readonly endpoint: string;

  constructor(
    private readonly config: { url: string; serviceKey: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.endpoint = `${normalizeSupabaseUrl(config.url)}/rest/v1/model_sites`;
  }

  private async call(query: string, init: RequestInit = {}): Promise<unknown> {
    const res = await this.fetchImpl(`${this.endpoint}${query}`, {
      ...init,
      cache: "no-store",
      headers: {
        apikey: this.config.serviceKey,
        Authorization: `Bearer ${this.config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=merge-duplicates",
      },
    });
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    return res.json();
  }

  async list(): Promise<ModelRecord[]> {
    return parseRows(await this.call("?select=*&order=slug.asc&limit=1000"));
  }

  async get(slug: string): Promise<ModelRecord | null> {
    if (!MODEL_SLUG.test(slug)) return null;
    const [row] = parseRows(await this.call(`?slug=eq.${slug}&select=*&limit=1`));
    return row ?? null;
  }

  async upsert(record: ModelWrite): Promise<ModelRecord> {
    assertSlug(record.slug);
    const [row] = parseRows(
      await this.call("?on_conflict=slug", {
        method: "POST",
        body: JSON.stringify({
          slug: record.slug,
          spec: record.spec,
          status: record.status,
          category: record.category,
          keywords: record.keywords,
          updated_by: record.updatedBy && UUID.test(record.updatedBy) ? record.updatedBy : null,
          updated_at: new Date().toISOString(),
        }),
      }),
    );
    if (!row) throw new Error("Supabase did not return the saved model.");
    return row;
  }

  async delete(slug: string): Promise<boolean> {
    if (!MODEL_SLUG.test(slug)) return false;
    const rows = await this.call(`?slug=eq.${slug}`, { method: "DELETE" });
    return Array.isArray(rows) && rows.length > 0;
  }
}

const globalForModels = globalThis as typeof globalThis & {
  __nosweatModelSites?: Map<string, ModelRecord>;
};

/** Só para o dev local e os testes: some ao reiniciar. */
export class MemoryModelStore implements ModelStore {
  private get rows(): Map<string, ModelRecord> {
    globalForModels.__nosweatModelSites ??= new Map();
    return globalForModels.__nosweatModelSites;
  }

  async list(): Promise<ModelRecord[]> {
    return [...this.rows.values()]
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map((row) => structuredClone(row));
  }

  async get(slug: string): Promise<ModelRecord | null> {
    const row = this.rows.get(slug);
    return row ? structuredClone(row) : null;
  }

  async upsert(record: ModelWrite): Promise<ModelRecord> {
    assertSlug(record.slug);
    // Mesmo caminho do banco: o que volta passou pelo SiteSpec.
    const saved: ModelRecord = {
      ...structuredClone(record),
      spec: SiteSpec.parse(record.spec),
      updatedAt: new Date().toISOString(),
    };
    this.rows.set(record.slug, saved);
    return structuredClone(saved);
  }

  async delete(slug: string): Promise<boolean> {
    return this.rows.delete(slug);
  }

  /** Testes: começa vazio. */
  clear(): void {
    this.rows.clear();
  }
}

let store: ModelStore | undefined;

export function getModelStore(): ModelStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Como em getSiteStore: na produção da Vercel, sem Supabase é erro (a memória perderia tudo).
  if (!(url && serviceKey) && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Supabase is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  store = url && serviceKey ? new SupabaseModelStore({ url, serviceKey }) : new MemoryModelStore();
  return store;
}
