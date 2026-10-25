import { isActiveStatus } from "../billing";
import { isGrantActive, type AccessGrant } from "../billing/grants";
import { PLANS } from "../billing/plans";
import type { SubscriptionRecord } from "../billing/store";
import { accountName, type ClientAccount } from "./index";

// Lista de contas do /admin: busca, ordem e o resumo do plano de cada conta. Só o necessário para
// administrar (e-mail, nome, datas, plano, números); nada de dados privados do cliente.

export const ACCOUNT_SORTS = ["signup", "login"] as const;
export type AccountSort = (typeof ACCOUNT_SORTS)[number];

export const ACCOUNT_SORT_LABELS: Record<AccountSort, string> = {
  signup: "Newest signup",
  login: "Last login",
};

/** Lê a ordem da URL; valor desconhecido = mais novas primeiro. */
export function parseAccountSort(value: string | null | undefined): AccountSort {
  return value === "login" ? "login" : "signup";
}

/** Contas cujo e-mail, nome ou id contém a busca (sem diferença de maiúsculas). */
export function filterAccounts(accounts: ClientAccount[], query: string): ClientAccount[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...accounts];
  return accounts.filter((account) =>
    [account.email, accountName(account), account.id].some((value) =>
      value?.toLowerCase().includes(needle),
    ),
  );
}

function time(value: string | null): number {
  const at = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(at) ? at : Number.NEGATIVE_INFINITY;
}

/** Mais recente primeiro (cadastro ou último login); sem data vai para o fim. Não muda a lista. */
export function sortAccounts(accounts: ClientAccount[], sort: AccountSort): ClientAccount[] {
  const key = (account: ClientAccount) =>
    time(sort === "login" ? account.lastSignInAt : account.createdAt);
  return [...accounts].sort((a, b) => {
    const [left, right] = [key(a), key(b)];
    if (left === right) return 0;
    return right > left ? 1 : -1;
  });
}

/** Login desligado pelo admin (ban do Supabase Auth ainda valendo). */
export function loginDisabled(
  account: Pick<ClientAccount, "bannedUntil">,
  now: Date = new Date(),
): boolean {
  if (!account.bannedUntil) return false;
  const until = Date.parse(account.bannedUntil);
  return Number.isFinite(until) && until > now.getTime();
}

export type PlanTone = "live" | "pending" | "neutral";

const dateOnly = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

/**
 * Selo do plano da conta: assinatura do Stripe ativa, acesso manual valendo, ou "No plan" (com o
 * aviso de cartão com problema ou acesso vencido).
 */
export function planStatus(
  subscription: SubscriptionRecord | null | undefined,
  grant: AccessGrant | null | undefined,
  now: Date = new Date(),
): { label: string; tone: PlanTone } {
  if (subscription && isActiveStatus(subscription.status)) {
    const plan = subscription.plan ? PLANS[subscription.plan].name : "Plan";
    return { label: `${plan} · card · ${subscription.status}`, tone: "live" };
  }
  const current = grant ?? null;
  if (isGrantActive(current, now)) {
    const end = dateOnly.format(new Date(current.expiresAt));
    return { label: `${PLANS[current.plan].name} until ${end}`, tone: "live" };
  }
  if (subscription?.status) return { label: `Card: ${subscription.status}`, tone: "pending" };
  if (grant) {
    return { label: `Access ended ${dateOnly.format(new Date(grant.expiresAt))}`, tone: "pending" };
  }
  return { label: "No plan", tone: "neutral" };
}
