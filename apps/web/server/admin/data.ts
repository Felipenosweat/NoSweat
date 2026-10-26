import { cache } from "react";
import { billingEnforced } from "../billing";
import { getGrantStore, type AccessGrant } from "../billing/grants";
import { getBillingStore, type SubscriptionRecord } from "../billing/store";
import { getSiteStore, type AiUsageKind, type SiteSummary } from "../store";
import { adminCached } from "./cache";
import { listAdminIds, listClients, type ClientAccount } from "./index";
import { countLeadsBySite, leadsByOwner } from "./leads";
import {
  DAY_MS,
  grantsExpiringSoon,
  orNull,
  ownersWithActivePlan,
  summarizeActivePlans,
  usageSince,
  type PlanCount,
  type UsageByKind,
} from "./metrics";

// Leituras das abas do /admin, cada uma só com o que a aba usa (antes toda aba lia tudo:
// todas as contas, todos os sites com o SiteSpec inteiro, planos, pedidos e 8 contagens da IA).
// Duas camadas de cache:
// - `adminCached` (cache.ts): o resultado fica até 30 s no cache do Next, etiqueta "admin";
//   as ações do admin limpam na hora (revalidateAdmin). Só JSON lá dentro.
// - `cache` do React: no mesmo request, várias partes da página (seções em Suspense) dividem a
//   mesma leitura. Aqui os arrays viram Map/Set e entra o relógio (`now`).
// Quem chama já passou por requireAdmin().

const sinceDays = (days: number) => new Date(Date.now() - days * DAY_MS).toISOString();

const countAllUsage = (kind: AiUsageKind, sinceIso: string) =>
  getSiteStore().countAllAiUsage(kind, sinceIso);

// ---------- leituras guardadas no cache do Next (só dados simples) ----------

const cachedAccounts = adminCached("accounts", () => listClients());
const cachedAdminIds = adminCached("admin-ids", async () => [...(await listAdminIds())]);
const cachedGrants = adminCached("grants", () => getGrantStore().listAll());
const cachedSubscriptions = adminCached("subscriptions", () => getBillingStore().listAll());
const cachedSiteSummaries = adminCached("site-summaries", () => getSiteStore().listAllSummaries());
const cachedLeadsBySite = adminCached(
  "leads-by-site",
  async (): Promise<Record<string, number>> => Object.fromEntries(await countLeadsBySite()),
);
const cachedLeads7d = adminCached("leads-7d", () => getSiteStore().countAllLeads(sinceDays(7)));
const cachedAi24h = adminCached("ai-usage-24h", () => usageSince(sinceDays(1), countAllUsage));
const cachedAi30d = adminCached("ai-usage-30d", () => usageSince(sinceDays(30), countAllUsage));

// ---------- contas e planos ----------

export type AccountsData = {
  accounts: ClientAccount[];
  adminIds: Set<string>;
  grants: AccessGrant[];
  /** Assinaturas do Stripe de todas as contas (`null` = erro ao ler). */
  subscriptions: SubscriptionRecord[] | null;
  /** Relógio usado na leitura (a página usa o mesmo, fora do componente). */
  now: Date;
};

/** Contas, admins, acessos manuais e assinaturas (Overview, Accounts e Websites). */
export const loadAccountsData = cache(async (): Promise<AccountsData> => {
  const [accounts, adminIds, grants, subscriptions] = await Promise.all([
    cachedAccounts(),
    cachedAdminIds(),
    cachedGrants(),
    orNull("subscriptions", cachedSubscriptions()),
  ]);
  return { accounts, adminIds: new Set(adminIds), grants, subscriptions, now: new Date() };
});

export type PlanState = {
  plans: { byPlan: PlanCount[]; accounts: number } | null;
  /** Acessos manuais que acabam nos próximos 7 dias. */
  expiringGrants: AccessGrant[];
  /**
   * Donos com plano ativo (ou admins). `null` se as assinaturas não puderam ser lidas: aí a tela
   * não marca nenhum site como "sem plano" (melhor não acusar errado).
   */
  ownersWithAccess: Set<string> | null;
  /** Os planos valem (Stripe ou REQUIRE_PLAN): site de dono sem plano está fora do ar. */
  enforced: boolean;
};

/** Planos ativos, acessos vencendo e quem mantém o site no ar (conta pura, sem leitura). */
export function planState(
  data: Pick<AccountsData, "adminIds" | "grants" | "subscriptions" | "now">,
  enforced: boolean = billingEnforced(),
): PlanState {
  const { adminIds, grants, subscriptions, now } = data;
  return {
    plans: subscriptions ? summarizeActivePlans(subscriptions, grants, now) : null,
    expiringGrants: grantsExpiringSoon(grants, now, 7),
    ownersWithAccess: subscriptions
      ? ownersWithActivePlan(subscriptions, grants, adminIds, now)
      : null,
    enforced,
  };
}

// ---------- sites e pedidos ----------

/** Todos os sites, só com as colunas das listas (sem os SiteSpecs inteiros). */
export const loadSiteSummaries = cache((): Promise<SiteSummary[]> => cachedSiteSummaries());

/** Pedidos do formulário por site, desde sempre (`null` = erro ao ler). Só contagem. */
export const loadLeadsBySite = cache(async (): Promise<Map<string, number> | null> => {
  const counts = await orNull("leads by site", cachedLeadsBySite());
  return counts ? new Map(Object.entries(counts)) : null;
});

/** Mensagens do formulário de todos os sites nos últimos 7 dias. */
export const loadLeads7d = cache((): Promise<number | null> => orNull("leads", cachedLeads7d()));

export type OwnerSiteStats = { websites: number; live: number };

/** Quantos sites (e quantos no ar) cada conta tem. Visitantes sem conta ficam de fora. */
export function siteStatsByOwner(
  sites: Pick<SiteSummary, "ownerId" | "status">[],
): Map<string, OwnerSiteStats> {
  const stats = new Map<string, OwnerSiteStats>();
  for (const site of sites) {
    if (!site.ownerId) continue;
    const entry = stats.get(site.ownerId) ?? { websites: 0, live: 0 };
    entry.websites += 1;
    if (site.status === "published") entry.live += 1;
    stats.set(site.ownerId, entry);
  }
  return stats;
}

export type AccountsList = AccountsData & {
  /** Sites de cada conta. */
  siteStats: Map<string, OwnerSiteStats>;
  /** Pedidos recebidos pelos sites de cada conta (`null` = erro ao ler). */
  requestsByOwner: Map<string, number> | null;
};

/** Tudo o que a aba Accounts mostra: contas + números de sites e pedidos por conta. */
export const loadAccountsList = cache(async (): Promise<AccountsList> => {
  const [data, sites, leadsBySite] = await Promise.all([
    loadAccountsData(),
    loadSiteSummaries(),
    loadLeadsBySite(),
  ]);
  return {
    ...data,
    siteStats: siteStatsByOwner(sites),
    requestsByOwner: leadsBySite ? leadsByOwner(sites, leadsBySite) : null,
  };
});

// ---------- uso da IA ----------

export type AiUsage = {
  /** Usos da IA de todo mundo (contas e visitantes). `null` = erro ao ler. */
  ai24h: UsageByKind | null;
  ai30d: UsageByKind | null;
};

export const loadAiUsage = cache(async (): Promise<AiUsage> => {
  const [ai24h, ai30d] = await Promise.all([
    orNull("AI usage (24h)", cachedAi24h()),
    orNull("AI usage (30 days)", cachedAi30d()),
  ]);
  return { ai24h, ai30d };
});
