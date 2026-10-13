import type { SiteSpec, SiteStatus } from "@nosweat/schema";

export type SiteRecord = {
  id: string;
  /** Usuário dono do site (id do Supabase Auth). `null` em sites antigos, sem dono. */
  ownerId: string | null;
  spec: SiteSpec;
  status: SiteStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Persistência de sites: memória (dev) ou Supabase (produção), mesma interface.
 * Quem chama confere se `ownerId` bate com o usuário logado antes de mostrar ou alterar um site.
 */
export interface SiteStore {
  create(spec: SiteSpec, ownerId: string): Promise<SiteRecord>;
  get(id: string): Promise<SiteRecord | null>;
  /** Devolve `null` se o site não existir. */
  update(id: string, spec: SiteSpec): Promise<SiteRecord | null>;
  /** Sites do usuário, mais recentes primeiro. */
  list(ownerId: string): Promise<SiteRecord[]>;
}
