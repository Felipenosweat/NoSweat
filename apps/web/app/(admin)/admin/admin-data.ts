import type { Overview } from "@/server/admin/metrics";
import type { SiteOwnerInfo } from "@/server/admin/sites";
import type { SiteRecord } from "@/server/store";

// Contas derivadas que mais de uma página do /admin usa (Overview, Accounts, Websites), a partir
// do `loadOverview()`. Só funções puras: quem lê o relógio é o loadOverview.

export type Param = string | string[] | undefined;

export function firstParam(value: Param): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatDate = (value: string | null) =>
  value ? dateFormat.format(new Date(value)) : "—";

export const formatCount = (value: number | null) =>
  value === null ? "—" : value.toLocaleString("en-US");

/**
 * Site publicado de dono sem plano: com os planos valendo, o público vê "temporarily
 * unavailable" (ownerHasLiveAccess); sem eles, sairia do ar ao ligar REQUIRE_PLAN.
 */
export function withoutPlanCheck(overview: Pick<Overview, "ownersWithAccess">) {
  const { ownersWithAccess } = overview;
  return (site: SiteRecord) =>
    site.status === "published" &&
    site.ownerId !== null &&
    ownersWithAccess !== null &&
    !ownersWithAccess.has(site.ownerId);
}

/** Dono de cada site (e-mail e marca de teste) para os filtros e a busca de sites. */
export function ownerInfo(overview: Pick<Overview, "accounts">): Map<string, SiteOwnerInfo> {
  return new Map(
    overview.accounts.map((account) => [
      account.id,
      { email: account.email, testAccount: account.testAccount },
    ]),
  );
}

/** Sites de cada conta (visitantes sem conta ficam de fora). */
export function sitesByOwner(sites: SiteRecord[]): Map<string, SiteRecord[]> {
  const map = new Map<string, SiteRecord[]>();
  for (const site of sites) {
    if (!site.ownerId) continue;
    map.set(site.ownerId, [...(map.get(site.ownerId) ?? []), site]);
  }
  return map;
}
