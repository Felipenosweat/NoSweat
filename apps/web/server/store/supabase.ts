import { SiteSpec, SiteStatus, VersionSource } from "@nosweat/schema";
import { z } from "zod";
import {
  DomainTakenError,
  type LeadRecord,
  type NewLead,
  type SiteMeta,
  type SiteRecord,
  type AiUsageKind,
  type GuestUsage,
  type GuestUsageFilter,
  type SiteStore,
  type VersionRecord,
} from "./types";

// SiteStore no Supabase, falando direto com a API REST (PostgREST) via fetch.
// Tabela: supabase/migrations/ (0001_create_sites.sql, 0002_sites_owner.sql).
// Usa a chave secreta (service role): este arquivo só pode rodar no servidor.

const Row = z.object({
  id: z.string(),
  owner_id: z.string().nullable().optional(),
  guest_id: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  custom_domain: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  published_spec: SiteSpec.nullable().optional(),
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

const VersionRow = z.object({
  id: z.string(),
  site_id: z.string(),
  spec: SiteSpec,
  source: VersionSource,
  created_at: z.string(),
});
type VersionRow = z.infer<typeof VersionRow>;

function toVersion(row: VersionRow): VersionRecord {
  return {
    id: row.id,
    siteId: row.site_id,
    spec: row.spec,
    source: row.source,
    createdAt: row.created_at,
  };
}

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
    guestId: row.guest_id ?? null,
    spec: row.spec,
    status: row.status,
    slug: row.slug ?? null,
    customDomain: row.custom_domain ?? null,
    publishedAt: row.published_at ?? null,
    publishedSpec: row.published_spec ?? null,
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

  async addLead(siteId: string, lead: NewLead, ipHash: string | null = null): Promise<LeadRecord> {
    if (!UUID.test(siteId)) throw new Error(`Invalid site id: ${siteId}`);
    const rows = z.array(LeadRow).parse(
      await this.raw(this.leadsEndpoint, "", {
        method: "POST",
        body: JSON.stringify({ site_id: siteId, ...lead, ip_hash: ipHash }),
      }),
    );
    const [row] = rows;
    if (!row) throw new Error("Supabase did not return the created lead.");
    return toLead(row);
  }

  private get aiUsageEndpoint(): string {
    return this.endpoint.replace(/\/sites$/, "/ai_usage");
  }

  async recordAiUsage(userId: string, kind: AiUsageKind): Promise<void> {
    assertUuid(userId);
    await this.raw(this.aiUsageEndpoint, "", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, kind }),
    });
  }

  async countAiUsage(userId: string, kind: AiUsageKind, sinceIso: string): Promise<number> {
    assertUuid(userId);
    const since = encodeURIComponent(new Date(sinceIso).toISOString());
    const rows = await this.raw(
      this.aiUsageEndpoint,
      `?user_id=eq.${userId}&kind=eq.${kind}&created_at=gte.${since}&select=id&limit=1000`,
      {},
    );
    return Array.isArray(rows) ? rows.length : 0;
  }

  async recordGuestAiUsage(usage: GuestUsage, kind: AiUsageKind): Promise<void> {
    assertUuid(usage.guestId);
    await this.raw(this.aiUsageEndpoint, "", {
      method: "POST",
      body: JSON.stringify({ user_id: null, guest_id: usage.guestId, ip_hash: usage.ipHash, kind }),
    });
  }

  async countGuestAiUsage(
    filter: GuestUsageFilter,
    kind: AiUsageKind,
    sinceIso: string,
  ): Promise<number> {
    const since = encodeURIComponent(new Date(sinceIso).toISOString());
    let query = `?user_id=is.null&kind=eq.${kind}&created_at=gte.${since}`;
    if (filter.guestId !== undefined) {
      if (!UUID.test(filter.guestId)) return 0;
      query += `&guest_id=eq.${filter.guestId}`;
    }
    if (filter.ipHash !== undefined) {
      if (!/^[0-9a-f]{64}$/.test(filter.ipHash)) return 0;
      query += `&ip_hash=eq.${filter.ipHash}`;
    }
    const rows = await this.raw(this.aiUsageEndpoint, `${query}&select=id&limit=10000`, {});
    return Array.isArray(rows) ? rows.length : 0;
  }

  async countLeads(siteId: string, sinceIso: string, ipHash?: string): Promise<number> {
    if (!UUID.test(siteId)) return 0;
    const since = encodeURIComponent(new Date(sinceIso).toISOString());
    let query = `?site_id=eq.${siteId}&created_at=gte.${since}`;
    if (ipHash !== undefined) {
      if (!/^[0-9a-f]{64}$/.test(ipHash)) return 0;
      query += `&ip_hash=eq.${ipHash}`;
    }
    const rows = await this.raw(this.leadsEndpoint, `${query}&select=id&limit=1000`, {});
    return Array.isArray(rows) ? rows.length : 0;
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

  async create(spec: SiteSpec, owner: string | { guestId: string }): Promise<SiteRecord> {
    const who =
      typeof owner === "string" ? { owner_id: owner } : { owner_id: null, guest_id: owner.guestId };
    if (typeof owner === "string") assertUuid(owner);
    else assertUuid(owner.guestId);
    const [row] = await this.request("", {
      method: "POST",
      body: JSON.stringify({ spec, status: "draft", ...who }),
    });
    if (!row) throw new Error("Supabase did not return the created site.");
    await this.addVersion(row.id, spec, "generate");
    return toRecord(row);
  }

  async claimGuestSites(guestId: string, userId: string): Promise<number> {
    if (!UUID.test(guestId)) return 0;
    assertUuid(userId);
    const rows = await this.request(`?guest_id=eq.${guestId}&owner_id=is.null`, {
      method: "PATCH",
      body: JSON.stringify({ owner_id: userId, guest_id: null }),
    });
    return rows.length;
  }

  async get(id: string): Promise<SiteRecord | null> {
    // Id que não é UUID nunca existe (e o Postgres responderia 400).
    if (!UUID.test(id)) return null;
    const [row] = await this.request(`?id=eq.${id}&select=*`);
    return row ? toRecord(row) : null;
  }

  async update(
    id: string,
    spec: SiteSpec,
    source: VersionSource = "edit",
  ): Promise<SiteRecord | null> {
    if (!UUID.test(id)) return null;
    const [row] = await this.request(`?id=eq.${id}`, {
      method: "PATCH",
      body: JSON.stringify({ spec, updated_at: new Date().toISOString() }),
    });
    if (!row) return null;
    // TODO: fazer as duas escritas numa transação (função no Postgres) se precisar de garantia total.
    await this.addVersion(row.id, spec, source);
    return toRecord(row);
  }

  async delete(id: string): Promise<boolean> {
    if (!UUID.test(id)) return false;
    // Versões e mensagens saem junto (on delete cascade nas migrations 0005 e 0006).
    const rows = await this.request(`?id=eq.${id}`, { method: "DELETE" });
    return rows.length > 0;
  }

  private get versionsEndpoint(): string {
    return this.endpoint.replace(/\/sites$/, "/site_versions");
  }

  private async addVersion(siteId: string, spec: SiteSpec, source: VersionSource): Promise<void> {
    await this.raw(this.versionsEndpoint, "", {
      method: "POST",
      body: JSON.stringify({ site_id: siteId, spec, source }),
    });
  }

  async listVersions(siteId: string): Promise<VersionRecord[]> {
    if (!UUID.test(siteId)) return [];
    const rows = z
      .array(VersionRow)
      .parse(
        await this.raw(
          this.versionsEndpoint,
          `?site_id=eq.${siteId}&select=*&order=created_at.desc&limit=50`,
          {},
        ),
      );
    return rows.map(toVersion);
  }

  async getVersion(siteId: string, versionId: string): Promise<VersionRecord | null> {
    if (!UUID.test(siteId) || !UUID.test(versionId)) return null;
    const [row] = z
      .array(VersionRow)
      .parse(
        await this.raw(
          this.versionsEndpoint,
          `?site_id=eq.${siteId}&id=eq.${versionId}&select=*`,
          {},
        ),
      );
    return row ? toVersion(row) : null;
  }

  async updateMeta(id: string, meta: SiteMeta): Promise<SiteRecord | null> {
    if (!UUID.test(id)) return null;
    const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (meta.status !== undefined) body.status = meta.status;
    if (meta.slug !== undefined) body.slug = meta.slug;
    if (meta.customDomain !== undefined) body.custom_domain = meta.customDomain;
    if (meta.publishedAt !== undefined) body.published_at = meta.publishedAt;
    if (meta.publishedSpec !== undefined) body.published_spec = meta.publishedSpec;
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
