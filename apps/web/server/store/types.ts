import type { SiteSpec, SiteStatus, VersionSource } from "@nosweat/schema";

export type SiteRecord = {
  id: string;
  /** Usuário dono do site (id do Supabase Auth). `null` em sites antigos, sem dono. */
  ownerId: string | null;
  /** Visitante sem conta que criou o site (cookie ns_guest). Vira `null` quando vai para uma conta. */
  guestId: string | null;
  /** Rascunho: o editor e a IA mudam só isto. */
  spec: SiteSpec;
  /** O que está no ar (copiado do rascunho ao publicar). `null` se nunca foi publicado. */
  publishedSpec: SiteSpec | null;
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
  Pick<SiteRecord, "status" | "slug" | "customDomain" | "publishedAt" | "publishedSpec">
>;

export type AiUsageKind = "generate" | "ai_edit";

/** Uso da IA por visitante sem conta. `ipHash` é o hash do IP (nunca o IP puro). */
export type GuestUsage = { guestId: string; ipHash: string | null };

/** Filtro da contagem de uso de visitantes. Vazio = todos os visitantes (limite global). */
export type GuestUsageFilter = { guestId?: string; ipHash?: string };

export type VersionRecord = {
  id: string;
  siteId: string;
  spec: SiteSpec;
  source: VersionSource;
  createdAt: string;
};

export type LeadRecord = {
  id: string;
  siteId: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  createdAt: string;
};

export type NewLead = Pick<LeadRecord, "name" | "email" | "phone" | "message">;

export class DomainTakenError extends Error {
  constructor(domain: string) {
    super(`Domain ${domain} is already connected to another site.`);
  }
}

export interface SiteStore {
  /** Cria um site de uma conta (`ownerId`) ou de um visitante (`{ guestId }`). */
  create(spec: SiteSpec, owner: string | { guestId: string }): Promise<SiteRecord>;
  /** Apaga sites de visitantes que nunca viraram conta, criados antes de `beforeIso`. */
  deleteAbandonedGuestSites(beforeIso: string): Promise<number>;
  /** Passa os sites do visitante (ainda sem dono) para a conta. Devolve quantos passou. */
  claimGuestSites(guestId: string, userId: string): Promise<number>;
  get(id: string): Promise<SiteRecord | null>;
  /** Salva um novo rascunho (e uma versão). Devolve `null` se o site não existir. */
  update(id: string, spec: SiteSpec, source?: VersionSource): Promise<SiteRecord | null>;
  /** Quantas versões o site ganhou desde `sinceIso` (limite de salvamentos). */
  countVersions(siteId: string, sinceIso: string): Promise<number>;
  /** Versões salvas do site, mais recentes primeiro. */
  listVersions(siteId: string): Promise<VersionRecord[]>;
  getVersion(siteId: string, versionId: string): Promise<VersionRecord | null>;
  /** Altera status/slug/domínio. Lança DomainTakenError se o domínio já for de outro site. */
  updateMeta(id: string, meta: SiteMeta): Promise<SiteRecord | null>;
  /** Apaga o site (e, junto, versões e mensagens). Devolve `false` se ele não existir. */
  delete(id: string): Promise<boolean>;
  /** Sites do usuário, mais recentes primeiro. */
  list(ownerId: string): Promise<SiteRecord[]>;
  /** Todos os sites de todos os clientes (só para o painel do admin). */
  listAll(): Promise<SiteRecord[]>;
  getBySlug(slug: string): Promise<SiteRecord | null>;
  getByDomain(domain: string): Promise<SiteRecord | null>;
  /** Pedidos de contato do formulário do site (mais recentes primeiro). */
  addLead(siteId: string, lead: NewLead, ipHash?: string | null): Promise<LeadRecord>;
  /** Mensagens recebidas pelo site desde `sinceIso` (só do IP `ipHash`, se informado). */
  countLeads(siteId: string, sinceIso: string, ipHash?: string): Promise<number>;
  /** Registra um uso da IA (para o limite diário por conta). */
  recordAiUsage(userId: string, kind: AiUsageKind): Promise<void>;
  /** Quantas vezes a conta usou a IA desde `sinceIso`. */
  countAiUsage(userId: string, kind: AiUsageKind, sinceIso: string): Promise<number>;
  listLeads(siteId: string): Promise<LeadRecord[]>;
  recordGuestAiUsage(usage: GuestUsage, kind: AiUsageKind): Promise<void>;
  countGuestAiUsage(filter: GuestUsageFilter, kind: AiUsageKind, sinceIso: string): Promise<number>;
}
