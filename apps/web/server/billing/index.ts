import type {
  BillingInterval,
  BillingStatusResponse,
  CheckoutRequest,
  PlanId,
} from "@nosweat/schema";
import { isAdmin } from "../admin";
import type { CurrentUser } from "../auth/session";
import { errorResponse } from "../http";
import { PLANS, priceCents, setupCentsFor } from "./plans";
import { getBillingStore, type SubscriptionRecord } from "./store";
import { getStripeConfig, stripeRequest, type StripeConfig } from "./stripe";

export { PLANS } from "./plans";
export { getStripeConfig, StripeError, verifyWebhookSignature } from "./stripe";

// Cobrança com Stripe Checkout + webhook. Enquanto STRIPE_SECRET_KEY não existir, a cobrança
// fica desligada: publicar e conectar domínio continuam liberados (como antes).

/** Status do Stripe que mantêm o site no ar (past_due: o Stripe ainda está tentando cobrar). */
const ACTIVE = new Set(["active", "trialing", "past_due"]);

export function isActiveStatus(status: string | null): boolean {
  return status !== null && ACTIVE.has(status);
}

export async function getBillingStatus(user: CurrentUser): Promise<BillingStatusResponse> {
  const enabled = getStripeConfig() !== null;
  const sub = await getBillingStore().get(user.id);
  return {
    enabled,
    plan: sub?.plan ?? null,
    interval: sub?.interval ?? null,
    status: sub?.status ?? null,
    active: isActiveStatus(sub?.status ?? null),
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
  };
}

/** Plano ativo da conta (`null` sem assinatura ativa). */
async function activePlan(user: CurrentUser): Promise<PlanId | null> {
  const sub = await getBillingStore().get(user.id);
  return sub && isActiveStatus(sub.status) ? sub.plan : null;
}

/** 402 pronto se a conta precisa de um plano para publicar; senão `null`. */
export async function publishBlocked(user: CurrentUser): Promise<Response | null> {
  if (!getStripeConfig() || (await isAdmin(user.id))) return null;
  if (await activePlan(user)) return null;
  return errorResponse(402, "payment_required", "Choose a plan to put your website live.");
}

/** 402 pronto se o plano da conta não inclui domínio próprio; senão `null`. */
export async function customDomainBlocked(user: CurrentUser): Promise<Response | null> {
  if (!getStripeConfig() || (await isAdmin(user.id))) return null;
  const plan = await activePlan(user);
  if (plan && PLANS[plan].customDomain) return null;
  return errorResponse(
    402,
    "payment_required",
    "Connecting your own domain is part of the Pro and Premium plans.",
  );
}

type StripeCustomer = { id: string };
type StripeSession = { id: string; url: string | null };

/** Cliente do Stripe da conta (cria na primeira compra e guarda na tabela). */
async function ensureCustomer(config: StripeConfig, user: CurrentUser): Promise<string> {
  const store = getBillingStore();
  const existing = await store.get(user.id);
  if (existing) return existing.stripeCustomerId;
  const customer = await stripeRequest<StripeCustomer>(config, "POST", "/customers", {
    email: user.email ?? undefined,
    metadata: { user_id: user.id },
  });
  await store.upsert({
    userId: user.id,
    stripeCustomerId: customer.id,
    stripeSubscriptionId: null,
    plan: null,
    interval: null,
    status: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
  return customer.id;
}

/** Página de pagamento do Stripe para o plano escolhido. */
export async function createCheckoutUrl(
  config: StripeConfig,
  user: CurrentUser,
  input: CheckoutRequest,
  origin: string,
): Promise<string> {
  const plan = PLANS[input.plan];
  const customer = await ensureCustomer(config, user);
  const setup = setupCentsFor(plan, input.interval);
  const back = input.siteId ? `&site=${encodeURIComponent(input.siteId)}` : "";
  const meta = { user_id: user.id, plan: plan.id, interval: input.interval };

  const lineItems: Record<string, unknown>[] = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: priceCents(plan, input.interval),
        recurring: { interval: input.interval === "annual" ? "year" : "month" },
        product_data: { name: `No Sweat ${plan.name}` },
      },
    },
  ];
  if (setup) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: setup,
        product_data: { name: "One-time setup" },
      },
    });
  }

  const session = await stripeRequest<StripeSession>(config, "POST", "/checkout/sessions", {
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: lineItems,
    metadata: meta,
    subscription_data: { metadata: meta },
    allow_promotion_codes: true,
    success_url: `${origin}/billing?status=success${back}`,
    cancel_url: `${origin}/billing?status=cancelled${back}`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session.url;
}

/** Portal do Stripe para trocar de plano, atualizar cartão ou cancelar. */
export async function createPortalUrl(
  config: StripeConfig,
  user: CurrentUser,
  origin: string,
): Promise<string | null> {
  const sub = await getBillingStore().get(user.id);
  if (!sub) return null;
  const session = await stripeRequest<StripeSession>(config, "POST", "/billing_portal/sessions", {
    customer: sub.stripeCustomerId,
    return_url: `${origin}/billing`,
  });
  return session.url;
}

// ---------- Webhook ----------

type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  metadata?: Record<string, string>;
  items?: {
    data?: {
      current_period_end?: number;
      price?: { recurring?: { interval?: string } | null };
    }[];
  };
};

type StripeEvent = { id: string; type: string; data: { object: Record<string, unknown> } };

function planFrom(value: string | undefined): PlanId | null {
  return value === "starter" || value === "pro" || value === "premium" ? value : null;
}

function intervalFrom(sub: StripeSubscription): BillingInterval | null {
  const interval = sub.items?.data?.find((item) => item.price?.recurring)?.price?.recurring
    ?.interval;
  if (interval === "year") return "annual";
  if (interval === "month") return "monthly";
  const meta = sub.metadata?.interval;
  return meta === "annual" || meta === "monthly" ? meta : null;
}

/** Grava o estado da assinatura (achando a conta pelo metadata ou pelo cliente). */
async function syncSubscription(sub: StripeSubscription): Promise<void> {
  const store = getBillingStore();
  const existing = await store.getByCustomer(sub.customer);
  const userId = sub.metadata?.user_id ?? existing?.userId;
  if (!userId) {
    console.warn("[billing] subscription without a known account", sub.id);
    return;
  }
  const periodEnd =
    sub.items?.data?.find((item) => item.current_period_end)?.current_period_end ??
    sub.current_period_end;
  const record: SubscriptionRecord = {
    userId,
    stripeCustomerId: sub.customer,
    stripeSubscriptionId: sub.id,
    plan: planFrom(sub.metadata?.plan) ?? existing?.plan ?? null,
    interval: intervalFrom(sub) ?? existing?.interval ?? null,
    status: sub.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  };
  await store.upsert(record);
}

/** Trata um evento já verificado do Stripe. Eventos que não interessam são ignorados. */
export async function handleStripeEvent(config: StripeConfig, event: StripeEvent): Promise<void> {
  const object = event.data.object;
  switch (event.type) {
    case "checkout.session.completed": {
      const subscriptionId = object.subscription;
      if (typeof subscriptionId !== "string") return;
      const sub = await stripeRequest<StripeSubscription>(
        config,
        "GET",
        `/subscriptions/${encodeURIComponent(subscriptionId)}`,
      );
      await syncSubscription(sub);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(object as unknown as StripeSubscription);
      return;
    default:
      return;
  }
}
