import { getAccount } from "../admin";
import {
  accessAppUrl,
  accessEmailConfigured,
  sendAccessEmail,
  simpleHtml,
  type AccessEmailEnv,
  type AccessEmailResult,
} from "../notify/access-email";
import { sameInstant } from "./grants";
import { PLANS } from "./plans";
import { getBillingStore, type BillingStore, type SubscriptionRecord } from "./store";
import { getStripeConfig, stripeRequest, type StripeConfig } from "./stripe";

// Aviso de renovação anual (leis de renovação automática dos EUA, como a da Califórnia: lembrete
// de 3 a 21 dias antes de renovar um plano com período anual). Roda no cron diário
// /api/cron/cleanup-guests. Um e-mail por data de renovação, 7 dias antes (se o cron falhar um
// dia, ainda sai até 3 dias antes; nunca depois disso).
// Planos MENSAIS: nenhum aviso é exigido por lei e não mandamos (o Stripe manda os recibos).
// O valor vem SEMPRE do Stripe (quem assinou com preço antigo continua com ele); nunca de plans.ts.
// Sem o valor, não manda nada e tenta de novo amanhã.

const DAY_MS = 24 * 60 * 60 * 1000;
/** Janela do aviso: de 7 a 3 dias antes da renovação. */
export const NOTICE_MAX_DAYS = 7;
export const NOTICE_MIN_DAYS = 3;

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

/** `true` se esta assinatura deve receber o aviso de renovação agora (já avisada = `false`). */
export function renewalNoticeDue(sub: SubscriptionRecord, now: Date = new Date()): boolean {
  if (sub.status !== "active" || sub.interval !== "annual" || sub.cancelAtPeriodEnd) return false;
  if (!sub.stripeSubscriptionId || !sub.currentPeriodEnd) return false;
  const left = Date.parse(sub.currentPeriodEnd) - now.getTime();
  if (Number.isNaN(left)) return false;
  if (left < NOTICE_MIN_DAYS * DAY_MS || left > NOTICE_MAX_DAYS * DAY_MS) return false;
  // Já avisamos ESTA renovação (Postgres devolve "+00:00": é o mesmo instante).
  return !sameInstant(sub.renewalNoticeFor, sub.currentPeriodEnd);
}

/** Valor da próxima cobrança, lido do Stripe. */
export type RenewalAmount = { amountCents: number; currency: string };

export function formatAmount(amount: RenewalAmount): string {
  const hasCents = amount.amountCents % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: amount.currency.toUpperCase(),
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount.amountCents / 100);
}

export function buildRenewalEmail(
  sub: Pick<SubscriptionRecord, "plan" | "currentPeriodEnd">,
  amount: RenewalAmount,
  appUrl: string,
): { subject: string; text: string; html: string } {
  const plan = sub.plan ? `${PLANS[sub.plan].name} plan` : "plan";
  const date = dateFormat.format(new Date(sub.currentPeriodEnd ?? 0));
  const billing = `${appUrl}/billing`;
  const paragraphs = [
    `Your No Sweat ${plan} renews on ${date} for ${formatAmount(amount)} per year.`,
    `It renews automatically. To cancel or change it, open Billing before that date and choose "Manage or cancel your plan": ${billing}`,
    "Questions? Reply to this e-mail.",
    "No Sweat",
  ];
  return {
    subject: `Your No Sweat plan renews on ${date}`,
    text: paragraphs.join("\n\n"),
    html: simpleHtml(paragraphs),
  };
}

type StripeSubForAmount = {
  status?: string;
  cancel_at_period_end?: boolean;
  discount?: unknown;
  discounts?: unknown[];
  items?: {
    data?: {
      quantity?: number;
      price?: {
        unit_amount?: number | null;
        currency?: string;
        recurring?: { interval?: string } | null;
      } | null;
    }[];
  };
};

/**
 * Lê no Stripe quanto será cobrado na renovação. `"not_renewing"` = a assinatura não vai renovar
 * (cancelada, não ativa); `null` = não deu para ler o valor (nada de número chutado).
 * Com desconto (cupom), vale a prévia da próxima fatura; sem, o preço do item da assinatura.
 */
export async function fetchRenewalAmount(
  config: StripeConfig,
  subscriptionId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RenewalAmount | "not_renewing" | null> {
  const sub = await stripeRequest<StripeSubForAmount>(
    config,
    "GET",
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {},
    fetchImpl,
  );
  if (sub.status !== "active" || sub.cancel_at_period_end) return "not_renewing";
  const items = sub.items?.data ?? [];
  const item = items[0];
  if (items.length !== 1 || !item) return null;
  const price = item.price;
  if (!price || price.recurring?.interval !== "year" || typeof price.unit_amount !== "number") {
    return null;
  }
  // Só dólar: os planos são em USD e o texto do e-mail formata centavos.
  if (price.currency?.toLowerCase() !== "usd") return null;
  const discounted = Boolean(sub.discount) || (sub.discounts?.length ?? 0) > 0;
  if (!discounted) {
    return { amountCents: price.unit_amount * (item.quantity ?? 1), currency: "usd" };
  }
  const preview = await stripeRequest<{ total?: number; currency?: string }>(
    config,
    "POST",
    "/invoices/create_preview",
    { subscription: subscriptionId },
    fetchImpl,
  );
  if (typeof preview.total !== "number" || preview.currency?.toLowerCase() !== "usd") return null;
  return { amountCents: preview.total, currency: "usd" };
}

export type RenewalNoticeDeps = {
  store: BillingStore;
  getAccount: (userId: string) => Promise<{ email: string | null; testAccount: boolean } | null>;
  send: (to: string, subject: string, text: string, html: string) => Promise<AccessEmailResult>;
  /** Stripe ligado (sem ele não há assinatura para avisar). */
  enabled: boolean;
  env: AccessEmailEnv;
  fetchAmount: (subscriptionId: string) => Promise<RenewalAmount | "not_renewing" | null>;
};

function defaultDeps(): RenewalNoticeDeps {
  const config = getStripeConfig();
  return {
    store: getBillingStore(),
    getAccount,
    send: (to, subject, text, html) => sendAccessEmail(to, subject, text, html),
    enabled: config !== null,
    env: process.env,
    fetchAmount: async (subscriptionId) =>
      config ? fetchRenewalAmount(config, subscriptionId) : null,
  };
}

export type RenewalNoticeSummary = {
  /** Por que não rodou (`null` = rodou). */
  disabled: "billing_off" | "email_off" | null;
  checked: number;
  sent: number;
  /** Falhou (e-mail, valor ilegível no Stripe ou erro de banco): tenta de novo amanhã. */
  failed: number;
  skipped: number;
};

/** Manda os avisos de renovação anual que estão devendo. Erro de um não para os outros. */
export async function sendRenewalNotices(
  now: Date = new Date(),
  deps: RenewalNoticeDeps = defaultDeps(),
): Promise<RenewalNoticeSummary> {
  const summary: RenewalNoticeSummary = {
    disabled: null,
    checked: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };
  if (!deps.enabled) return { ...summary, disabled: "billing_off" };
  if (!accessEmailConfigured(deps.env)) return { ...summary, disabled: "email_off" };

  const appUrl = accessAppUrl(deps.env);
  const due = (await deps.store.listAll()).filter((sub) => renewalNoticeDue(sub, now));
  summary.checked = due.length;

  for (const sub of due) {
    try {
      const account = await deps.getAccount(sub.userId);
      if (!account?.email || account.testAccount) {
        summary.skipped += 1;
        continue;
      }
      const amount = await deps.fetchAmount(sub.stripeSubscriptionId ?? "");
      if (amount === "not_renewing") {
        summary.skipped += 1;
        continue;
      }
      if (!amount) {
        console.error(`[billing] renewal notice skipped, could not read the amount: ${sub.userId}`);
        summary.failed += 1;
        continue;
      }
      // Grava ANTES de enviar: nunca sai duas vezes para a mesma renovação.
      await deps.store.setRenewalNotice(sub.userId, sub.currentPeriodEnd);
      const email = buildRenewalEmail(sub, amount, appUrl);
      const result = await deps.send(account.email, email.subject, email.text, email.html);
      if (result === "sent") {
        summary.sent += 1;
      } else {
        summary.failed += 1;
        // Volta a marca anterior para tentar de novo amanhã.
        await deps.store
          .setRenewalNotice(sub.userId, sub.renewalNoticeFor ?? null)
          .catch(() => undefined);
      }
    } catch (error) {
      summary.failed += 1;
      console.error(
        `[billing] renewal notice failed for ${sub.userId} (did migration 0040 run?)`,
        error,
      );
    }
  }
  return summary;
}
