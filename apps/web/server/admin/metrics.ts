import type { PlanId } from "@nosweat/schema";
import { billingEnforced, isActiveStatus } from "../billing";
import { getGrantStore, isGrantActive, type AccessGrant } from "../billing/grants";
import { getBillingStore, type SubscriptionRecord } from "../billing/store";
import { getClientStore } from "../clients/store";
import { getSocialStore } from "../social/store";
import { getSiteStore, type AiUsageKind, type SiteRecord } from "../store";
import { AI_USAGE_KINDS } from "./costs";
import { listAdminIds, listClients, type ClientAccount } from "./index";
import { countLeadsBySite } from "./leads";

// Números do painel do admin. Tudo vem do banco (nada estimado, menos o custo da IA, que é
// calculado em costs.ts). Uma leitura que falha vira `null` ("—" na tela) sem derrubar a página.

const DAY_MS = 24 * 60 * 60 * 1000;
const PLAN_ORDER: PlanId[] = ["starter", "pro", "premium"];

/** O valor, ou `null` se a leitura falhar (o erro vai para o log). */
async function orNull<T>(label: string, promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    console.error(`[admin] could not load ${label}`, error);
    return null;
  }
}

export type UsageByKind = Record<AiUsageKind, number>;

export type PlanCount = { plan: PlanId; stripe: number; manual: number };

/** Planos ativos: assinaturas do Stripe que mantêm o site no ar + acessos manuais valendo. */
export function summarizeActivePlans(
  subscriptions: SubscriptionRecord[],
  grants: AccessGrant[],
  now: Date = new Date(),
): { byPlan: PlanCount[]; accounts: number } {
  const byPlan = PLAN_ORDER.map((plan): PlanCount => ({ plan, stripe: 0, manual: 0 }));
  const row = (plan: PlanId) => byPlan.find((entry) => entry.plan === plan);
  const accounts = new Set<string>();
  for (const sub of subscriptions) {
    const entry = sub.plan ? row(sub.plan) : undefined;
    if (!entry || !isActiveStatus(sub.status)) continue;
    entry.stripe += 1;
    accounts.add(sub.userId);
  }
  for (const grant of grants) {
    const entry = row(grant.plan);
    if (!entry || !isGrantActive(grant, now)) continue;
    entry.manual += 1;
    accounts.add(grant.userId);
  }
  return { byPlan, accounts: accounts.size };
}

/**
 * Contas cujo site publicado fica no ar com os planos valendo (mesmo critério de
 * ownerHasLiveAccess): admins, assinatura do Stripe ativa ou acesso manual valendo.
 */
export function ownersWithActivePlan(
  subscriptions: SubscriptionRecord[],
  grants: AccessGrant[],
  adminIds: Set<string>,
  now: Date = new Date(),
): Set<string> {
  const owners = new Set(adminIds);
  for (const sub of subscriptions) {
    if (sub.plan && isActiveStatus(sub.status)) owners.add(sub.userId);
  }
  for (const grant of grants) {
    if (isGrantActive(grant, now)) owners.add(grant.userId);
  }
  return owners;
}

/** Acessos manuais que ainda valem e acabam nos próximos `days` dias (o que vence antes primeiro). */
export function grantsExpiringSoon(
  grants: AccessGrant[],
  now: Date = new Date(),
  days = 7,
): AccessGrant[] {
  const limit = now.getTime() + days * DAY_MS;
  return grants
    .filter((grant) => isGrantActive(grant, now) && Date.parse(grant.expiresAt) <= limit)
    .sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));
}

async function usageSince(
  sinceIso: string,
  count: (kind: AiUsageKind, sinceIso: string) => Promise<number>,
): Promise<UsageByKind> {
  const values = await Promise.all(AI_USAGE_KINDS.map((kind) => count(kind, sinceIso)));
  const usage: UsageByKind = { generate: 0, ai_edit: 0, social_plan: 0, social_caption: 0 };
  AI_USAGE_KINDS.forEach((kind, i) => {
    usage[kind] = values[i] ?? 0;
  });
  return usage;
}

export type Overview = {
  accounts: ClientAccount[];
  adminIds: Set<string>;
  sites: SiteRecord[];
  grants: AccessGrant[];
  /** Assinaturas do Stripe de todas as contas (`null` = erro ao ler). */
  subscriptions: SubscriptionRecord[] | null;
  /** Pedidos do formulário por site, desde sempre (`null` = erro ao ler). Só contagem. */
  leadsBySite: Map<string, number> | null;
  /** Mensagens do formulário de todos os sites nos últimos 7 dias. */
  leads7d: number | null;
  /** Usos da IA de todo mundo (contas e visitantes). */
  ai24h: UsageByKind | null;
  ai30d: UsageByKind | null;
  plans: { byPlan: PlanCount[]; accounts: number } | null;
  expiringGrants: AccessGrant[];
  /**
   * Donos com plano ativo (ou admins). `null` se as assinaturas não puderam ser lidas: aí a tela
   * não marca nenhum site como "sem plano" (melhor não acusar errado).
   */
  ownersWithAccess: Set<string> | null;
  /** Os planos valem (Stripe ou REQUIRE_PLAN): site de dono sem plano está fora do ar. */
  enforced: boolean;
  /** Relógio usado na leitura (a página usa o mesmo, fora do componente). */
  now: Date;
};

/** Tudo o que a página /admin mostra, lido de uma vez (fora do componente: usa o relógio). */
export async function loadOverview(): Promise<Overview> {
  const now = new Date();
  const store = getSiteStore();
  const since = (days: number) => new Date(now.getTime() - days * DAY_MS).toISOString();
  const count = (kind: AiUsageKind, sinceIso: string) => store.countAllAiUsage(kind, sinceIso);

  const [accounts, adminIds, sites, grants, subscriptions, leads7d, ai24h, ai30d] =
    await Promise.all([
      listClients(),
      listAdminIds(),
      store.listAll(),
      getGrantStore().listAll(),
      orNull("subscriptions", getBillingStore().listAll()),
      orNull("leads", store.countAllLeads(since(7))),
      orNull("AI usage (24h)", usageSince(since(1), count)),
      orNull("AI usage (30 days)", usageSince(since(30), count)),
    ]);

  // Depende da lista de sites (no store em memória conta site por site).
  const leadsBySite = await orNull("leads by site", countLeadsBySite(sites));

  return {
    accounts,
    adminIds,
    sites,
    grants,
    subscriptions,
    leadsBySite,
    leads7d,
    ai24h,
    ai30d,
    plans: subscriptions ? summarizeActivePlans(subscriptions, grants, now) : null,
    expiringGrants: grantsExpiringSoon(grants, now, 7),
    ownersWithAccess: subscriptions
      ? ownersWithActivePlan(subscriptions, grants, adminIds, now)
      : null,
    enforced: billingEnforced(),
    now,
  };
}

export type AccountActivity = {
  /** Clientes no CRM do dono e quantos estão em "new" (`null` = erro ao ler). */
  clients: { total: number; newCount: number } | null;
  /** Posts do mês atual (UTC): agendados e publicados. */
  social: { scheduledThisMonth: number; publishedThisMonth: number } | null;
  /** Usos da IA da conta nos últimos 30 dias. */
  ai30d: UsageByKind | null;
};

/** Início e fim do mês atual (UTC). */
function monthRange(now: Date): { from: string; to: string } {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * Números de uma conta para /admin/clients/[id]. Só lê: os clientes vêm direto do store (sem o
 * sync dos pedidos do site, que grava) e nada é registrado.
 */
export async function loadAccountActivity(userId: string): Promise<AccountActivity> {
  const now = new Date();
  const store = getSiteStore();
  const month = monthRange(now);
  const since30d = new Date(now.getTime() - 30 * DAY_MS).toISOString();

  const [clientRecords, monthPosts, ai30d] = await Promise.all([
    orNull("clients", getClientStore().listClients(userId)),
    orNull("social posts", getSocialStore().listPosts(userId, month.from, month.to)),
    orNull(
      "account AI usage",
      usageSince(since30d, (kind, sinceIso) => store.countAiUsage(userId, kind, sinceIso)),
    ),
  ]);

  const [monthStart, monthEnd] = [Date.parse(month.from), Date.parse(month.to)];
  const inMonth = (iso: string | null) => {
    if (iso === null) return false;
    const at = Date.parse(iso);
    return at >= monthStart && at < monthEnd;
  };

  return {
    clients: clientRecords
      ? {
          total: clientRecords.length,
          newCount: clientRecords.filter((client) => client.stage === "new").length,
        }
      : null,
    social: monthPosts
      ? {
          scheduledThisMonth: monthPosts.filter(
            (post) => post.status === "scheduled" && inMonth(post.scheduledAt),
          ).length,
          publishedThisMonth: monthPosts.filter(
            (post) =>
              (post.status === "published" || post.status === "manual_published") &&
              inMonth(post.publishedAt ?? post.scheduledAt),
          ).length,
        }
      : null,
    ai30d,
  };
}
