import { SiteSpec, SiteStatus } from "@nosweat/schema";
import { z } from "zod";
import type { SiteRecord, SiteStore } from "./types";

// SiteStore no Supabase, falando direto com a API REST (PostgREST) via fetch.
// Tabela: supabase/migrations/ (0001_create_sites.sql, 0002_sites_owner.sql).
// Usa a chave secreta (service role): este arquivo só pode rodar no servidor.

const Row = z.object({
  id: z.string(),
  owner_id: z.string().nullable().optional(),
  spec: SiteSpec,
  status: SiteStatus,
  created_at: z.string(),
  updated_at: z.string(),
});
type Row = z.infer<typeof Row>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids de usuário vêm do Supabase Auth (UUID); qualquer outra coisa é bug. */
function assertUuid(ownerId: string): void {
  if (!UUID.test(ownerId)) throw new Error(`Invalid owner id: ${ownerId}`);
}

function toRecord(row: Row): SiteRecord {
  return {
    id: row.id,
    ownerId: row.owner_id ?? null,
    spec: row.spec,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Aceita a URL com ou sem barra final e com ou sem `/rest/v1` (erro comum ao copiar do painel). */
export function normalizeSupabaseUrl(url: string): string {
  return url
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/, "");
}

export type SupabaseConfig = {
  url: string;
  /** Chave "service_role" (legada) ou "secret" (sb_secret_...). Nunca expor no navegador. */
  serviceKey: string;
  fetch?: typeof fetch;
};

export class SupabaseSiteStore implements SiteStore {
  private readonly endpoint: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly config: SupabaseConfig) {
    this.endpoint = `${normalizeSupabaseUrl(config.url)}/rest/v1/sites`;
    this.fetchImpl = config.fetch ?? fetch;
  }

  private async request(query: string, init: RequestInit = {}): Promise<Row[]> {
    const res = await this.fetchImpl(`${this.endpoint}${query}`, {
      ...init,
      cache: "no-store",
      headers: {
        apikey: this.config.serviceKey,
        Authorization: `Bearer ${this.config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    });
    if (!res.ok) {
      throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    }
    return z.array(Row).parse(await res.json());
  }

  async create(spec: SiteSpec, ownerId: string): Promise<SiteRecord> {
    assertUuid(ownerId);
    const [row] = await this.request("", {
      method: "POST",
      body: JSON.stringify({ spec, status: "draft", owner_id: ownerId }),
    });
    if (!row) throw new Error("Supabase did not return the created site.");
    return toRecord(row);
  }

  async get(id: string): Promise<SiteRecord | null> {
    // Id que não é UUID nunca existe (e o Postgres responderia 400).
    if (!UUID.test(id)) return null;
    const [row] = await this.request(`?id=eq.${id}&select=*`);
    return row ? toRecord(row) : null;
  }

  async update(id: string, spec: SiteSpec): Promise<SiteRecord | null> {
    if (!UUID.test(id)) return null;
    const [row] = await this.request(`?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ spec, updated_at: new Date().toISOString() }),
    });
    return row ? toRecord(row) : null;
  }

  async list(ownerId: string): Promise<SiteRecord[]> {
    assertUuid(ownerId);
    // TODO: paginar quando alguém tiver mais de 100 sites.
    const rows = await this.request(
      `?owner_id=eq.${ownerId}&select=*&order=created_at.desc&limit=100`,
    );
    return rows.map(toRecord);
  }
}
