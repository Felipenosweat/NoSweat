import type { SiteSpec, SiteStatus } from "@nosweat/schema";

export type SiteRecord = {
  id: string;
  /** Usuário dono do site (id do Supabase Auth). `null` em sites antigos, sem dono. */
  ownerId: string | null;
  spec: SiteSpec;
  status: SiteStatus;
  /** Endereço grátis: nosweatfd.com/s/<slug>. Definido na primeira publicação. */
  slug: string | null;
  /** Domínio próprio do cliente (raiz, sem "www"), ex.: "joesplumbing.com". */
  customDomain: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Persistência de sites: memória (dev) ou Supabase (produção), mesma interface.
 * Quem chama confere se `ownerId` bate com o usuário logado antes de mostrar ou alterar um site.
 */
/** Campos de publicação que podem ser alterados depois de criar o site. */
export type SiteMeta = Partial<
  Pick<SiteRecord, "status" | "slug" | "customDomain" | "publishedAt">
>;

export class DomainTakenError extends Error {
  constructor(domain: string) {
    super(`Domain ${domain} is already connected to another site.`);
  }
}

export interface SiteStore {
  create(spec: SiteSpec, ownerId: string): Promise<SiteRecord>;
  get(id: string): Promise<SiteRecord | null>;
  /** Devolve `null` se o site não existir. */
  update(id: string, spec: SiteSpec): Promise<SiteRecord | null>;
  /** Altera status/slug/domínio. Lança DomainTakenError se o domínio já for de outro site. */
  updateMeta(id: string, meta: SiteMeta): Promise<SiteRecord | null>;
  /** Sites do usuário, mais recentes primeiro. */
  list(ownerId: string): Promise<SiteRecord[]>;
  /** Todos os sites de todos os clientes (só para o painel do admin). */
  listAll(): Promise<SiteRecord[]>;
  getBySlug(slug: string): Promise<SiteRecord | null>;
  getByDomain(domain: string): Promise<SiteRecord | null>;
}
