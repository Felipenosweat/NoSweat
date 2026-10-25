import { z } from "zod";
import { deleteSiteForever } from "../sites";
import { getSiteStore, type SiteRecord } from "../store";

// Sites no painel do admin: filtros, busca e as ações (tirar do ar, apagar, faxina dos rascunhos
// de visitantes). As ações reaproveitam os mesmos caminhos das rotas da API:
// - tirar do ar = POST /api/sites/[id]/unpublish (status "draft", guarda slug, domínio e versão);
// - apagar = DELETE /api/sites/[id] (deleteSiteForever: libera o domínio na Vercel, cascade);
// - faxina = cron cleanup-guests (deleteAbandonedGuestSites), com o número de dias escolhido.
// Quem chama confere antes se é admin (requireAdmin).

const DAY_MS = 24 * 60 * 60 * 1000;

/** Filtros da lista de sites do /admin. */
export const SITE_FILTERS = ["all", "drafts", "live", "guest", "test"] as const;
export type SiteFilter = (typeof SITE_FILTERS)[number];

export const SITE_FILTER_LABELS: Record<SiteFilter, string> = {
  all: "All",
  drafts: "Drafts",
  live: "Live",
  guest: "Guest (no owner)",
  test: "Test accounts",
};

/** Quantos sites a lista mostra de cada vez ("Show more" soma mais esta quantidade). */
export const SITES_PAGE_SIZE = 50;
/** Máximo de sites apagados de uma vez (seleção em massa). */
export const MAX_BULK_DELETE = 200;

/** Lê o filtro da URL; valor desconhecido = "all". */
export function parseSiteFilter(value: string | null | undefined): SiteFilter {
  return (SITE_FILTERS as readonly string[]).includes(value ?? "") ? (value as SiteFilter) : "all";
}

/** Lê o limite da URL ("Show more"): múltiplo do tamanho da página, entre 1 página e 1000 sites. */
export function parseSiteLimit(value: string | null | undefined): number {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n) || n < SITES_PAGE_SIZE) return SITES_PAGE_SIZE;
  return Math.min(1000, Math.ceil(n / SITES_PAGE_SIZE) * SITES_PAGE_SIZE);
}

/** O que a lista precisa saber do dono de cada site. */
export type SiteOwnerInfo = { email: string | null; testAccount: boolean };

/** Endereço do site no ar: domínio próprio ou /s/<slug>. `null` se não está publicado. */
export function liveHref(site: Pick<SiteRecord, "status" | "customDomain" | "slug">): string | null {
  if (site.status !== "published") return null;
  if (site.customDomain) return `https://${site.customDomain}`;
  return site.slug ? `/s/${site.slug}` : null;
}

/** Endereço para mostrar (mesmo fora do ar): domínio, /s/<slug> ou `null`. */
export function siteAddress(site: Pick<SiteRecord, "customDomain" | "slug">): string | null {
  return site.customDomain ?? (site.slug ? `/s/${site.slug}` : null);
}

function siteMatchesFilter(
  site: SiteRecord,
  filter: SiteFilter,
  owners: Map<string, SiteOwnerInfo>,
): boolean {
  switch (filter) {
    case "drafts":
      return site.status !== "published";
    case "live":
      return site.status === "published";
    case "guest":
      return site.ownerId === null;
    case "test":
      return site.ownerId !== null && owners.get(site.ownerId)?.testAccount === true;
    case "all":
      return true;
  }
}

/**
 * Sites que passam no filtro e na busca (nome do negócio, e-mail do dono, slug, domínio ou id;
 * sem diferença de maiúsculas). Mantém a ordem recebida (mais novos primeiro, como o store).
 */
export function filterSites(
  sites: SiteRecord[],
  options: { filter: SiteFilter; query: string },
  owners: Map<string, SiteOwnerInfo>,
): SiteRecord[] {
  const needle = options.query.trim().toLowerCase();
  return sites.filter((site) => {
    if (!siteMatchesFilter(site, options.filter, owners)) return false;
    if (!needle) return true;
    const ownerEmail = site.ownerId ? owners.get(site.ownerId)?.email : null;
    return [site.spec.business.name, ownerEmail, site.slug, site.customDomain, site.id].some(
      (value) => value?.toLowerCase().includes(needle),
    );
  });
}

/** Quantos sites há em cada filtro (para os números nas abas). */
export function countSitesByFilter(
  sites: SiteRecord[],
  owners: Map<string, SiteOwnerInfo>,
): Record<SiteFilter, number> {
  const counts = { all: 0, drafts: 0, live: 0, guest: 0, test: 0 } satisfies Record<
    SiteFilter,
    number
  >;
  for (const site of sites) {
    for (const filter of SITE_FILTERS) {
      if (siteMatchesFilter(site, filter, owners)) counts[filter] += 1;
    }
  }
  return counts;
}

// ---------- ações ----------

/** Id de site válido (os sites do Supabase usam UUID; o store em memória também). */
const SiteId = z.string().trim().min(1).max(64);

export const UnpublishSiteInput = z.object({ siteId: SiteId });
export const DeleteSitesInput = z.object({
  siteIds: z
    .array(SiteId)
    .min(1, "Select at least one website.")
    .max(MAX_BULK_DELETE, `Delete at most ${MAX_BULK_DELETE} websites at a time.`),
});
export const GuestCleanupInput = z.object({
  days: z.coerce
    .number()
    .int("Use a whole number of days.")
    .min(1, "Use at least 1 day.")
    .max(365, "Use at most 365 days."),
});

export type AdminSiteDeps = {
  getSite: (id: string) => Promise<SiteRecord | null>;
  unpublish: (id: string) => Promise<SiteRecord | null>;
  deleteSite: (site: SiteRecord) => Promise<boolean>;
  deleteGuestSitesBefore: (beforeIso: string) => Promise<number>;
};

function defaultDeps(): AdminSiteDeps {
  const store = getSiteStore();
  return {
    getSite: (id) => store.get(id),
    unpublish: (id) => store.updateMeta(id, { status: "draft" }),
    deleteSite: deleteSiteForever,
    deleteGuestSitesBefore: (beforeIso) => store.deleteAbandonedGuestSites(beforeIso),
  };
}

export type UnpublishResult =
  | { ok: true; name: string; alreadyOffline: boolean }
  | { ok: false; error: string };

/**
 * Tira o site do ar sem apagar nada (mesma regra do POST /api/sites/[id]/unpublish): slug, domínio
 * e versão publicada ficam guardados; publicar de novo volta tudo. Já fora do ar não é erro.
 */
export async function adminUnpublishSite(
  siteId: string,
  deps: AdminSiteDeps = defaultDeps(),
): Promise<UnpublishResult> {
  const site = await deps.getSite(siteId);
  if (!site) return { ok: false, error: "This website no longer exists. Reload the page." };
  const name = site.spec.business.name;
  if (site.status === "draft") return { ok: true, name, alreadyOffline: true };
  const updated = await deps.unpublish(site.id);
  if (!updated) return { ok: false, error: "This website no longer exists. Reload the page." };
  return { ok: true, name, alreadyOffline: false };
}

export type DeleteSitesResult = {
  deleted: { id: string; name: string }[];
  /** Ids que já não existiam (outra aba, cron): não é erro. */
  missing: string[];
  /** Ids que deram erro ao apagar (o erro vai para o log). */
  failed: string[];
};

/**
 * Apaga os sites pelo mesmo caminho do DELETE /api/sites/[id] (deleteSiteForever: tira do ar,
 * libera o domínio na Vercel e apaga versões e mensagens em cascata). Um por vez, para a Vercel não
 * receber tudo junto; um erro num site não impede os outros.
 */
export async function adminDeleteSites(
  siteIds: string[],
  deps: AdminSiteDeps = defaultDeps(),
): Promise<DeleteSitesResult> {
  const result: DeleteSitesResult = { deleted: [], missing: [], failed: [] };
  for (const id of [...new Set(siteIds)]) {
    try {
      const site = await deps.getSite(id);
      if (!site) {
        result.missing.push(id);
        continue;
      }
      if (await deps.deleteSite(site)) {
        result.deleted.push({ id: site.id, name: site.spec.business.name });
      } else {
        result.missing.push(id);
      }
    } catch (error) {
      console.error(`[admin] could not delete site ${id}`, error);
      result.failed.push(id);
    }
  }
  return result;
}

/** Data de corte da faxina: sites de visitante criados antes disto saem. */
export function guestCutoff(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

/** Rascunhos de visitante (sem conta) mais velhos que `days` dias, como a faxina os escolhe. */
export function guestDraftsOlderThan(
  sites: SiteRecord[],
  days: number,
  now: Date = new Date(),
): SiteRecord[] {
  const cutoff = Date.parse(guestCutoff(days, now));
  return sites.filter(
    (site) => site.ownerId === null && site.guestId !== null && Date.parse(site.createdAt) < cutoff,
  );
}

/**
 * Apaga os sites de visitantes que nunca viraram conta, criados há mais de `days` dias (a mesma
 * consulta do cron cleanup-guests, que usa 30 dias). Sites de visitante nunca são publicados.
 */
export async function adminDeleteGuestDrafts(
  days: number,
  deps: AdminSiteDeps = defaultDeps(),
  now: Date = new Date(),
): Promise<number> {
  return deps.deleteGuestSitesBefore(guestCutoff(days, now));
}
