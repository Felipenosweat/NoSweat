import type {
  BillingInterval,
  BillingStatusResponse,
  CheckoutRequest,
  PlanId,
} from "@nosweat/schema";
import { isAdmin } from "../admin";
import type { CurrentUser } from "../auth/session";
import { errorResponse } from "../http";
import { getGrantStore, isGrantActive } from "./grants";
import { PLANS, priceCents, setupCentsFor } from "./plans";
import { getBillingStore, type SubscriptionRecord } from "./store";
import { getStripeConfig, stripeRequest, type StripeConfig } from "./stripe";

export { extendExpiry, getGrantStore, isGrantActive, type AccessGrant } from "./grants";
export { PLANS } from "./plans";
export { getStripeConfig, StripeError, verifyWebhookSignature } from "./stripe";

// Cobrança com Stripe Checkout + webhook, ou acesso liberado à mão pelo admin (Pix/WhatsApp,
// ver grants.ts). Os planos valem quando há STRIPE_SECRET_KEY ou REQUIRE_PLAN=true; sem nenhum
// dos dois, publicar e conectar domínio continuam liberados (como antes).

/** `true` se publicar exige plano (Stripe ligado ou REQUIRE_PLAN=true). */
export function billingEnforced(): boolean {
  return getStripeConfig() !== null || process.env.REQUIRE_PLAN === "true";
}

/** Status do Stripe que mantêm o site no ar (past_due: o Stripe ainda está tentando cobrar). */
const ACTIVE = new Set(["active", "trialing", "past_due"]);

export function isActiveStatus(status: string | null): boolean {
  return status !== null && ACTIVE.has(status);
}

export async function getBillingStatus(user: CurrentUser): Promise<BillingStatusResponse> {
  const enabled = billingEnforced();
  const checkoutEnabled = getStripeConfig() !== null;
  const [sub, grant] = await Promise.all([
    getBillingStore().get(user.id),
    getGrantStore().get(user.id),
  ]);
  // Assinatura do Stripe ativa tem prioridade (tem renovação e portal); senão, o acesso manual.
  if (!isActiveStatus(sub?.status ?? null) && isGrantActive(grant)) {
    return {
      enabled,
      checkoutEnabled,
      source: "manual",
      plan: grant.plan,
      interval: null,
      status: "active",
      active: true,
      currentPeriodEnd: grant.expiresAt,
      cancelAtPeriodEnd: true,
    };
  }
  return {
    enabled,
    checkoutEnabled,
    source: sub ? "stripe" : null,
    plan: sub?.plan ?? null,
    interval: sub?.interval ?? null,
    status: sub?.status ?? null,
    active: isActiveStatus(sub?.status ?? null),
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
  };
}

const RANK: Record<PlanId, number> = { starter: 1, pro: 2, premium: 3 };

/** Plano ativo da conta: o maior entre Stripe e acesso manual (`null` sem nenhum ativo). */
async function activePlan(userId: string): Promise<PlanId | null> {
  const [sub, grant] = await Promise.all([
    getBillingStore().get(userId),
    getGrantStore().get(userId),
  ]);
  const plans: PlanId[] = [];
  if (sub?.plan && isActiveStatus(sub.status)) plans.push(sub.plan);
  if (isGrantActive(grant)) plans.push(grant.plan);
  return plans.sort((a, b) => RANK[b] - RANK[a])[0] ?? null;
}

/**
 * `true` se o site publicado do dono pode ficar no ar. Com planos valendo, o site sai do ar
 * quando o plano (Stripe ou acesso manual) acaba; volta sozinho quando renovar.
 */
export async function ownerHasLiveAccess(ownerId: string | null): Promise<boolean> {
  if (!billingEnforced() || !ownerId) return true;
  try {
    if (await isAdmin(ownerId)) return true;
    return (await activePlan(ownerId)) !== null;
  } catch (error) {
    // Falha no banco não derruba o site do cliente.
    console.error("[billing] could not check the owner's plan", error);
    return true;
  }
}

/** 402 pronto se a conta precisa de um plano para publicar; senão `null`. */
export async function publishBlocked(user: CurrentUser): Promise<Response | null> {
  if (!billingEnforced() || (await isAdmin(user.id))) return null;
  if (await activePlan(user.id)) return null;
  return errorResponse(402, "payment_required", "Choose a plan to put your website live.");
}

/** 402 pronto se o plano da conta não inclui domínio próprio; senão `null`. */
export async function customDomainBlocked(user: CurrentUser): Promise<Response | null> {
  if (!billingEnforced() || (await isAdmin(user.id))) return null;
  const plan = await activePlan(user.id);
  if (plan && PLANS[plan].customDomain) return null;
  return errorResponse(
    402,
    "payment_required",
    "Connecting your own domain is part of the Pro and Premium plans.",
  );
}

// ---------- Redes sociais ----------

/** 402 pronto se o plano da conta não inclui posts nas redes sociais; senão `null`. */
export async function socialBlocked(user: CurrentUser): Promise<Response | null> {
  if (!billingEnforced() || (await isAdmin(user.id))) return null;
  const plan = await activePlan(user.id);
  if (plan && PLANS[plan].socialPostsPerMonth > 0) return null;
  return errorResponse(402, "payment_required", "Social posting is part of the paid plans.");
}

/**
 * Posts aprovados por mês que o plano permite (`null` = sem limite: cobrança desligada ou
 * admin). Sem plano ativo = 0.
 */
export async function socialMonthlyCap(user: CurrentUser): Promise<number | null> {
  if (!billingEnforced() || (await isAdmin(user.id))) return null;
  const plan = await activePlan(user.id);
  return plan ? PLANS[plan].socialPostsPerMonth : 0;
}

/**
 * `true` se o publicador pode postar pelo dono agora. Diferente de `ownerHasLiveAccess`, falha
 * no banco não libera nem bloqueia: o erro sobe e o publicador tenta de novo depois.
 */
export async function ownerHasSocialAccess(ownerId: string): Promise<boolean> {
  if (!billingEnforced()) return true;
  if (await isAdmin(ownerId)) return true;
  const plan = await activePlan(ownerId);
  return plan !== null && PLANS[plan].socialPostsPerMonth > 0;
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
