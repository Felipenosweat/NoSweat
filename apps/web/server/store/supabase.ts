import { SiteSpec, SiteStatus } from "@nosweat/schema";
import { z } from "zod";
import {
  DomainTakenError,
  type LeadRecord,
  type NewLead,
  type SiteMeta,
  type SiteRecord,
  type SiteStore,
} from "./types";

// SiteStore no Supabase, falando direto com a API REST (PostgREST) via fetch.
// Tabela: supabase/migrations/ (0001_create_sites.sql, 0002_sites_owner.sql).
// Usa a chave secreta (service role): este arquivo só pode rodar no servidor.

const Row = z.object({
  id: z.string(),
  owner_id: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  custom_domain: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  spec: SiteSpec,
  status: SiteStatus,
  created_at: z.string(),
  updated_at: z.string(),
});
type Row = z.infer<typeof Row>;

const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/;
const DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class UniqueViolation extends Error {}

const LeadRow = z.object({
  id: z.string(),
  site_id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  message: z.string(),
  created_at: z.string(),
});
type LeadRow = z.infer<typeof LeadRow>;

function toLead(row: LeadRow): LeadRecord {
  return {
    id: row.id,
    siteId: row.site_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    createdAt: row.created_at,
  };
}

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
    slug: row.slug ?? null,
    customDomain: row.custom_domain ?? null,
    publishedAt: row.published_at ?? null,
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
    return z.array(Row).parse(await this.raw(this.endpoint, query, init));
  }

  private async raw(endpoint: string, query: string, init: RequestInit): Promise<unknown> {
    const res = await this.fetchImpl(`${endpoint}${query}`, {
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
      const body = await res.text();
      // 23505 = unique_violation (ex.: domínio já usado por outro site).
      if (res.status === 409 && body.includes("23505")) throw new UniqueViolation(body);
      throw new Error(`Supabase request failed (${res.status}): ${body}`);
    }
    return res.json();
  }

  private get leadsEndpoint(): string {
    return this.endpoint.replace(/\/sites$/, "/leads");
  }

  async addLead(siteId: string, lead: NewLead): Promise<LeadRecord> {
    if (!UUID.test(siteId)) throw new Error(`Invalid site id: ${siteId}`);
    const rows = z.array(LeadRow).parse(
      await this.raw(this.leadsEndpoint, "", {
        method: "POST",
        body: JSON.stringify({ site_id: siteId, ...lead }),
      }),
    );
    const [row] = rows;
    if (!row) throw new Error("Supabase did not return the created lead.");
    return toLead(row);
  }

  async listLeads(siteId: string): Promise<LeadRecord[]> {
    if (!UUID.test(siteId)) return [];
    const rows = z
      .array(LeadRow)
      .parse(
        await this.raw(
          this.leadsEndpoint,
          `?site_id=eq.${siteId}&select=*&order=created_at.desc&limit=500`,
          {},
        ),
      );
    return rows.map(toLead);
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

  async updateMeta(id: string, meta: SiteMeta): Promise<SiteRecord | null> {
    if (!UUID.test(id)) return null;
    const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (meta.status !== undefined) body.status = meta.status;
    if (meta.slug !== undefined) body.slug = meta.slug;
    if (meta.customDomain !== undefined) body.custom_domain = meta.customDomain;
    if (meta.publishedAt !== undefined) body.published_at = meta.publishedAt;
    try {
      const [row] = await this.request(`?id=eq.${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return row ? toRecord(row) : null;
    } catch (error) {
      if (error instanceof UniqueViolation && meta.customDomain) {
        throw new DomainTakenError(meta.customDomain);
      }
      throw error;
    }
  }

  async listAll(): Promise<SiteRecord[]> {
    // TODO: paginar quando houver mais de 1000 sites.
    const rows = await this.request("?select=*&order=created_at.desc&limit=1000");
    return rows.map(toRecord);
  }

  async getBySlug(slug: string): Promise<SiteRecord | null> {
    if (!SLUG.test(slug)) return null;
    const [row] = await this.request(`?slug=eq.${slug}&select=*`);
    return row ? toRecord(row) : null;
  }

  async getByDomain(domain: string): Promise<SiteRecord | null> {
    if (!DOMAIN.test(domain)) return null;
    const [row] = await this.request(`?custom_domain=eq.${domain}&select=*`);
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
