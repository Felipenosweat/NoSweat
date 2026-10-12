import type { SiteSpec, SiteStatus } from "@nosweat/schema";

export type SiteRecord = {
  id: string;
  spec: SiteSpec;
  status: SiteStatus;
  createdAt: string;
  updatedAt: string;
};

/** Persistência de sites. Hoje: memória. Depois: Supabase (mesma interface). */
export interface SiteStore {
  create(spec: SiteSpec): Promise<SiteRecord>;
  get(id: string): Promise<SiteRecord | null>;
  /** Devolve `null` se o site não existir. */
  update(id: string, spec: SiteSpec): Promise<SiteRecord | null>;
  /** Mais recentes primeiro. */
  list(): Promise<SiteRecord[]>;
}
