import type { SiteSpec } from "@nosweat/schema";
import type { SiteRecord, SiteStore } from "./types";

// O Map fica em globalThis para sobreviver ao hot reload do `next dev`.
// Os dados somem quando o servidor reinicia: é só para desenvolvimento.
const globalForStore = globalThis as typeof globalThis & {
  __nosweatSites?: Map<string, SiteRecord>;
};

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

  async list(): Promise<SiteRecord[]> {
    return [...sites().values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(clone);
  }
}
