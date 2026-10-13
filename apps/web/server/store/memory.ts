import type { SiteSpec, VersionSource } from "@nosweat/schema";
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

// O Map fica em globalThis para sobreviver ao hot reload do `next dev`.
// Os dados somem quando o servidor reinicia: é só para desenvolvimento.
const globalForStore = globalThis as typeof globalThis & {
  __nosweatSites?: Map<string, SiteRecord>;
  __nosweatLeads?: StoredLead[];
  __nosweatVersions?: VersionRecord[];
  __nosweatAiUsage?: {
    userId: string | null;
    guestId?: string;
    ipHash?: string | null;
    kind: AiUsageKind;
    at: string;
  }[];
};

function aiUsage() {
  globalForStore.__nosweatAiUsage ??= [];
  return globalForStore.__nosweatAiUsage;
}

function versions(): VersionRecord[] {
  globalForStore.__nosweatVersions ??= [];
  return globalForStore.__nosweatVersions;
}

function addVersion(siteId: string, spec: SiteSpec, source: VersionSource): void {
  versions().push({
    id: crypto.randomUUID(),
    siteId,
    spec: clone(spec),
    source,
    createdAt: new Date().toISOString(),
  });
}

type StoredLead = LeadRecord & { ipHash?: string | null };

function leads(): StoredLead[] {
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
  async create(spec: SiteSpec, owner: string | { guestId: string }): Promise<SiteRecord> {
    const now = new Date().toISOString();
    const record: SiteRecord = {
      id: crypto.randomUUID(),
      ownerId: typeof owner === "string" ? owner : null,
      guestId: typeof owner === "string" ? null : owner.guestId,
      spec: clone(spec),
      publishedSpec: null,
      status: "draft",
      slug: null,
      customDomain: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    sites().set(record.id, record);
    addVersion(record.id, spec, "generate");
    return clone(record);
  }

  async claimGuestSites(guestId: string, userId: string): Promise<number> {
    let claimed = 0;
    for (const site of sites().values()) {
      if (site.ownerId === null && site.guestId === guestId) {
        sites().set(site.id, { ...site, ownerId: userId, guestId: null });
        claimed += 1;
      }
    }
    return claimed;
  }

  async get(id: string): Promise<SiteRecord | null> {
    const record = sites().get(id);
    return record ? clone(record) : null;
  }

  async update(
    id: string,
    spec: SiteSpec,
    source: VersionSource = "edit",
  ): Promise<SiteRecord | null> {
    const current = sites().get(id);
    if (!current) return null;
    const updated: SiteRecord = {
      ...current,
      spec: clone(spec),
      updatedAt: new Date().toISOString(),
    };
    sites().set(id, updated);
    addVersion(id, spec, source);
    return clone(updated);
  }

  async listVersions(siteId: string): Promise<VersionRecord[]> {
    return versions()
      .filter((v) => v.siteId === siteId)
      .reverse()
      .slice(0, 50)
      .map(clone);
  }

  async getVersion(siteId: string, versionId: string): Promise<VersionRecord | null> {
    const version = versions().find((v) => v.siteId === siteId && v.id === versionId);
    return version ? clone(version) : null;
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

  async delete(id: string): Promise<boolean> {
    if (!sites().delete(id)) return false;
    // Igual ao "on delete cascade" do banco.
    globalForStore.__nosweatVersions = versions().filter((v) => v.siteId !== id);
    globalForStore.__nosweatLeads = leads().filter((lead) => lead.siteId !== id);
    return true;
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

  async addLead(siteId: string, lead: NewLead, ipHash: string | null = null): Promise<LeadRecord> {
    const record: LeadRecord = {
      id: crypto.randomUUID(),
      siteId,
      ...lead,
      createdAt: new Date().toISOString(),
    };
    leads().push({ ...record, ipHash });
    return clone(record);
  }

  async listLeads(siteId: string): Promise<LeadRecord[]> {
    return leads()
      .filter((lead) => lead.siteId === siteId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((lead) =>
        clone({
          id: lead.id,
          siteId: lead.siteId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          message: lead.message,
          createdAt: lead.createdAt,
        }),
      );
  }

  async countLeads(siteId: string, sinceIso: string, ipHash?: string): Promise<number> {
    return leads().filter(
      (lead) =>
        lead.siteId === siteId &&
        lead.createdAt >= sinceIso &&
        (ipHash === undefined || lead.ipHash === ipHash),
    ).length;
  }

  async recordAiUsage(userId: string, kind: AiUsageKind): Promise<void> {
    aiUsage().push({ userId, kind, at: new Date().toISOString() });
  }

  async countAiUsage(userId: string, kind: AiUsageKind, sinceIso: string): Promise<number> {
    return aiUsage().filter((u) => u.userId === userId && u.kind === kind && u.at >= sinceIso)
      .length;
  }

  async recordGuestAiUsage(usage: GuestUsage, kind: AiUsageKind): Promise<void> {
    aiUsage().push({ userId: null, ...usage, kind, at: new Date().toISOString() });
  }

  async countGuestAiUsage(
    filter: GuestUsageFilter,
    kind: AiUsageKind,
    sinceIso: string,
  ): Promise<number> {
    return aiUsage().filter(
      (u) =>
        u.userId === null &&
        u.kind === kind &&
        u.at >= sinceIso &&
        (filter.guestId === undefined || u.guestId === filter.guestId) &&
        (filter.ipHash === undefined || u.ipHash === filter.ipHash),
    ).length;
  }
}
