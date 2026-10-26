import type { ClientAccount } from "@/server/admin";
import type { PlanState } from "@/server/admin/data";
import type { SiteOwnerInfo } from "@/server/admin/sites";
import type { SiteSummary } from "@/server/store";

// Contas derivadas que mais de uma página do /admin usa (Overview, Accounts, Websites), a partir
// das leituras de server/admin/data.ts. Só funções puras: quem lê o relógio são as leituras.

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
export function withoutPlanCheck(state: Pick<PlanState, "ownersWithAccess">) {
  const { ownersWithAccess } = state;
  return (site: Pick<SiteSummary, "status" | "ownerId">) =>
    site.status === "published" &&
    site.ownerId !== null &&
    ownersWithAccess !== null &&
    !ownersWithAccess.has(site.ownerId);
}

/** Dono de cada site (e-mail e marca de teste) para os filtros e a busca de sites. */
export function ownerInfo(data: { accounts: ClientAccount[] }): Map<string, SiteOwnerInfo> {
  return new Map(
    data.accounts.map((account) => [
      account.id,
      { email: account.email, testAccount: account.testAccount },
    ]),
  );
}
