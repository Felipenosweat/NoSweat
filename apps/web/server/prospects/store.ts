import { z } from "zod";
import { ProspectStatus, WebsiteStatus } from "@/lib/prospects";
import { normalizeSupabaseUrl } from "../store/supabase";
import type { ProspectPatch, ProspectRecord, ProspectUpsert } from "./types";

// Persistência da prospecção (tabela public.prospects, migration 0025). Supabase em produção,
// memória no dev/testes (mesma regra do server/store e do server/clients).
// Só o admin chega aqui (as rotas conferem antes).

export interface ProspectStore {
  /** Todos os prospects, mais novos primeiro. */
  list(): Promise<ProspectRecord[]>;
  get(id: string): Promise<ProspectRecord | null>;
  getByToken(token: string): Promise<ProspectRecord | null>;
  /**
   * Grava o resultado de uma busca: empresa nova entra como "new"; a que já existe (mesmo
   * place_id) só tem os dados do Places e do site atualizados (status, notas, prévia ficam).
   */
  upsertMany(rows: ProspectUpsert[]): Promise<{ added: number; updated: number }>;
  update(id: string, patch: ProspectPatch): Promise<ProspectRecord | null>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nowIso = () => new Date().toISOString();

const byCreatedDesc = (a: ProspectRecord, b: ProspectRecord) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.name.localeCompare(b.name);

// ---------- Supabase ----------

const Row = z.object({
  id: z.string(),
  place_id: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  hours: z.array(z.string()).nullable(),
  website_status: WebsiteStatus,
  website_notes: z.string().nullable(),
  email: z.string().nullable(),
  rating: z.coerce.number().nullable(),
  review_count: z.coerce.number().nullable(),
  search: z.string().nullable(),
  status: ProspectStatus,
  site_id: z.string().nullable(),
  preview_token: z.string().nullable(),
  notes: z.string().nullable(),
  last_fetched_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

function toRecord(row: z.infer<typeof Row>): ProspectRecord {
  return {
    id: row.id,
    placeId: row.place_id,
    name: row.name,
    category: row.category,
    address: row.address,
    city: row.city,
    state: row.state,
    phone: row.phone,
    website: row.website,
    hours: row.hours ?? [],
    websiteStatus: row.website_status,
    websiteNotes: row.website_notes,
    email: row.email,
    rating: row.rating,
    reviewCount: row.review_count,
    search: row.search,
    status: row.status,
    siteId: row.site_id,
    previewToken: row.preview_token,
    notes: row.notes,
    lastFetchedAt: row.last_fetched_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Colunas que uma busca atualiza (nunca status, notas, site ou token). */
function upsertRow(row: ProspectUpsert): Record<string, unknown> {
  return {
    place_id: row.placeId,
    name: row.name,
    category: row.category,
    address: row.address,
    city: row.city,
    state: row.state,
    phone: row.phone,
    website: row.website,
    hours: row.hours.length ? row.hours : null,
    website_status: row.websiteStatus,
    website_notes: row.websiteNotes,
    email: row.email,
    rating: row.rating,
    review_count: row.reviewCount,
    search: row.search,
    last_fetched_at: row.lastFetchedAt,
    updated_at: nowIso(),
  };
}

const PATCH_COLUMNS: Record<keyof ProspectPatch, string> = {
  status: "status",
  siteId: "site_id",
  previewToken: "preview_token",
  notes: "notes",
  name: "name",
  category: "category",
  address: "address",
  city: "city",
  state: "state",
  phone: "phone",
  website: "website",
  hours: "hours",
  rating: "rating",
  reviewCount: "review_count",
  lastFetchedAt: "last_fetched_at",
};

const PAGE = 1000;

export class SupabaseProspectStore implements ProspectStore {
  private readonly base: string;

  constructor(
    private readonly config: { url: string; serviceKey: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.base = `${normalizeSupabaseUrl(config.url)}/rest/v1/prospects`;
  }

  private async call(
    query: string,
    init: RequestInit & { prefer?: string } = {},
  ): Promise<ProspectRecord[]> {
    const { prefer, ...rest } = init;
    const res = await this.fetchImpl(`${this.base}${query}`, {
      ...rest,
      cache: "no-store",
      headers: {
        apikey: this.config.serviceKey,
        Authorization: `Bearer ${this.config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: prefer ?? "return=representation",
      },
    });
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    const text = res.status === 204 ? "" : await res.text();
    return z
      .array(Row)
      .parse(text ? JSON.parse(text) : [])
      .map(toRecord);
  }

  async list() {
    const all: ProspectRecord[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const rows = await this.call(
        `?select=*&order=created_at.desc,id.asc&limit=${PAGE}&offset=${offset}`,
      );
      all.push(...rows);
      if (rows.length < PAGE) return all;
    }
  }

  async get(id: string) {
    if (!UUID.test(id)) return null;
    const [row] = await this.call(`?id=eq.${id}&select=*&limit=1`);
    return row ?? null;
  }

  async getByToken(token: string) {
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return null;
    const [row] = await this.call(
      `?preview_token=eq.${encodeURIComponent(token)}&select=*&limit=1`,
    );
    return row ?? null;
  }

  async upsertMany(rows: ProspectUpsert[]) {
    if (rows.length === 0) return { added: 0, updated: 0 };
    // Quais já existem (para contar novos x atualizados).
    const ids = rows.map((row) => `"${row.placeId.replace(/"/g, "")}"`).join(",");
    const existing = await this.call(`?place_id=in.(${encodeURIComponent(ids)})&select=*`);
    const known = new Set(existing.map((row) => row.placeId));
    // merge-duplicates: no conflito do place_id, só as colunas enviadas mudam.
    await this.call("?on_conflict=place_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify(rows.map(upsertRow)),
    });
    const updated = rows.filter((row) => known.has(row.placeId)).length;
    return { added: rows.length - updated, updated };
  }

  async update(id: string, patch: ProspectPatch) {
    if (!UUID.test(id)) return null;
    const body: Record<string, unknown> = { updated_at: nowIso() };
    for (const [key, value] of Object.entries(patch) as [keyof ProspectPatch, unknown][]) {
      if (value === undefined) continue;
      body[PATCH_COLUMNS[key]] =
        key === "hours" && Array.isArray(value) && !value.length ? null : value;
    }
    const [row] = await this.call(`?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(body) });
    return row ?? null;
  }
}

// ---------- Memória (dev e testes) ----------

const globalForProspects = globalThis as typeof globalThis & {
  __nosweatProspects?: Map<string, ProspectRecord>;
};

export class MemoryProspectStore implements ProspectStore {
  private get rows(): Map<string, ProspectRecord> {
    globalForProspects.__nosweatProspects ??= new Map();
    return globalForProspects.__nosweatProspects;
  }

  async list() {
    return [...this.rows.values()].map((row) => ({ ...row })).sort(byCreatedDesc);
  }

  async get(id: string) {
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }

  async getByToken(token: string) {
    if (!token) return null;
    for (const row of this.rows.values()) if (row.previewToken === token) return { ...row };
    return null;
  }

  async upsertMany(rows: ProspectUpsert[]) {
    let added = 0;
    let updated = 0;
    const byPlace = new Map([...this.rows.values()].map((row) => [row.placeId, row]));
    for (const row of rows) {
      const now = nowIso();
      const fields = {
        placeId: row.placeId,
        name: row.name,
        category: row.category,
        address: row.address,
        city: row.city,
        state: row.state,
        phone: row.phone,
        website: row.website,
        hours: [...row.hours],
        websiteStatus: row.websiteStatus,
        websiteNotes: row.websiteNotes,
        email: row.email,
        rating: row.rating,
        reviewCount: row.reviewCount,
        search: row.search,
        lastFetchedAt: row.lastFetchedAt,
        updatedAt: now,
      };
      const current = byPlace.get(row.placeId);
      if (current) {
        this.rows.set(current.id, { ...current, ...fields });
        updated++;
      } else {
        const record: ProspectRecord = {
          ...fields,
          id: crypto.randomUUID(),
          status: "new",
          siteId: null,
          previewToken: null,
          notes: null,
          createdAt: now,
        };
        this.rows.set(record.id, record);
        byPlace.set(record.placeId, record);
        added++;
      }
    }
    return { added, updated };
  }

  async update(id: string, patch: ProspectPatch) {
    const current = this.rows.get(id);
    if (!current) return null;
    const defined = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as ProspectPatch;
    const next = { ...current, ...defined, updatedAt: nowIso() };
    this.rows.set(id, next);
    return { ...next };
  }

  /** Só para testes: apaga tudo. */
  clear(): void {
    this.rows.clear();
  }
}

let store: ProspectStore | undefined;

export function getProspectStore(): ProspectStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Como em getSiteStore: na produção da Vercel, sem Supabase é erro (a memória perderia tudo).
  if (!(url && serviceKey) && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Supabase is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  store =
    url && serviceKey ? new SupabaseProspectStore({ url, serviceKey }) : new MemoryProspectStore();
  return store;
}
