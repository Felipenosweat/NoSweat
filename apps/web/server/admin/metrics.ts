import type { PlanId } from "@nosweat/schema";
import { isActiveStatus } from "../billing";
import { isGrantActive, type AccessGrant } from "../billing/grants";
import type { SubscriptionRecord } from "../billing/store";
import { getClientStore } from "../clients/store";
import { getSocialStore } from "../social/store";
import { getSiteStore, type AiUsageKind } from "../store";
import { AI_USAGE_KINDS } from "./costs";

// Números do painel do admin. Tudo vem do banco (nada estimado, menos o custo da IA, que é
// calculado em costs.ts). Uma leitura que falha vira `null` ("—" na tela) sem derrubar a página.
// Aqui ficam as contas puras e a ficha de uma conta; as leituras de cada aba (com cache) estão
// em data.ts.

export const DAY_MS = 24 * 60 * 60 * 1000;
const PLAN_ORDER: PlanId[] = ["starter", "pro", "premium"];

/** O valor, ou `null` se a leitura falhar (o erro vai para o log). */
export async function orNull<T>(label: string, promise: Promise<T>): Promise<T | null> {
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

/** Usos da IA de cada tipo desde `sinceIso`, com a contagem `count` (todo mundo ou uma conta). */
export async function usageSince(
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
