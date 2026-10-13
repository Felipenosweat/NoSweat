import type { SiteSpec } from "@nosweat/schema";
import {
  DomainTakenError,
  type LeadRecord,
  type NewLead,
  type SiteMeta,
  type SiteRecord,
  type SiteStore,
} from "./types";

// O Map fica em globalThis para sobreviver ao hot reload do `next dev`.
// Os dados somem quando o servidor reinicia: é só para desenvolvimento.
const globalForStore = globalThis as typeof globalThis & {
  __nosweatSites?: Map<string, SiteRecord>;
  __nosweatLeads?: LeadRecord[];
};

function leads(): LeadRecord[] {
  globalForStore.__nosweatLeads ??= [];
  return globalForStore.__nosweatLeads;
}

function sites(): Map<string, SiteRecord> {
  globalForStore.__nosweatSites ??= new Map();
  return globalForStore.__nosweatSites;
}

// Cópias defensivas: quem lê não consegue alterar o que está guardado.
const clone = <T>(value: T): T => structuredClone(value);

export class MemorySiteStore implements SiteStore {
  async create(spec: SiteSpec, ownerId: string): Promise<SiteRecord> {
    const now = new Date().toISOString();
    const record: SiteRecord = {
      id: crypto.randomUUID(),
      ownerId,
      spec: clone(spec),
      status: "draft",
      slug: null,
      customDomain: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    sites().set(record.id, record);
    return clone(record);
  }

  async get(id: string): Promise<SiteRecord | null> {
    const record = sites().get(id);
    return record ? clone(record) : null;
  }

  async update(id: string, spec: SiteSpec): Promise<SiteRecord | null> {
    const current = sites().get(id);
    if (!current) return null;
    const updated: SiteRecord = {
      ...current,
      spec: clone(spec),
      updatedAt: new Date().toISOString(),
    };
    sites().set(id, updated);
    return clone(updated);
  }

  async updateMeta(id: string, meta: SiteMeta): Promise<SiteRecord | null> {
    const current = sites().get(id);
    if (!current) return null;
    if (meta.customDomain) {
      const owner = [...sites().values()].find((s) => s.customDomain === meta.customDomain);
      if (owner && owner.id !== id) throw new DomainTakenError(meta.customDomain);
    }
    const updated: SiteRecord = { ...current, ...meta, updatedAt: new Date().toISOString() };
    sites().set(id, updated);
    return clone(updated);
  }

  async list(ownerId: string): Promise<SiteRecord[]> {
    return [...sites().values()]
      .filter((site) => site.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(clone);
  }

  async listAll(): Promise<SiteRecord[]> {
    return [...sites().values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(clone);
  }

  async getBySlug(slug: string): Promise<SiteRecord | null> {
    const record = [...sites().values()].find((s) => s.slug === slug);
    return record ? clone(record) : null;
  }

  async getByDomain(domain: string): Promise<SiteRecord | null> {
    const record = [...sites().values()].find((s) => s.customDomain === domain);
    return record ? clone(record) : null;
  }

  async addLead(siteId: string, lead: NewLead): Promise<LeadRecord> {
    const record: LeadRecord = {
      id: crypto.randomUUID(),
      siteId,
      ...lead,
      createdAt: new Date().toISOString(),
    };
    leads().push(record);
    return clone(record);
  }

  async listLeads(siteId: string): Promise<LeadRecord[]> {
    return leads()
      .filter((lead) => lead.siteId === siteId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(clone);
  }
}
