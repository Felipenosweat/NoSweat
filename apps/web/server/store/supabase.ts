import { SiteSpec, SiteStatus } from "@nosweat/schema";
import { z } from "zod";
import type { SiteRecord, SiteStore } from "./types";

// SiteStore no Supabase, falando direto com a API REST (PostgREST) via fetch.
// Tabela: supabase/migrations/0001_create_sites.sql.
// Usa a chave secreta (service role): este arquivo só pode rodar no servidor.

const Row = z.object({
  id: z.string(),
  spec: SiteSpec,
  status: SiteStatus,
  created_at: z.string(),
  updated_at: z.string(),
});
type Row = z.infer<typeof Row>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toRecord(row: Row): SiteRecord {
  return {
    id: row.id,
    spec: row.spec,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
    this.endpoint = `${config.url.replace(/\/+$/, "")}/rest/v1/sites`;
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

  async create(spec: SiteSpec): Promise<SiteRecord> {
    const [row] = await this.request("", {
      method: "POST",
      body: JSON.stringify({ spec, status: "draft" }),
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

  async list(): Promise<SiteRecord[]> {
    // TODO: filtrar por usuário quando houver login, e paginar.
    const rows = await this.request("?select=*&order=created_at.desc&limit=100");
    return rows.map(toRecord);
  }
}
