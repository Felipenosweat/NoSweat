import type {
  BillingInterval,
  BillingStatusResponse,
  CheckoutRequest,
  PlanId,
  SiteStatus,
} from "@nosweat/schema";
import { isAdmin } from "../admin";
import type { CurrentUser } from "../auth/session";
import { errorResponse } from "../http";
import { getSiteStore } from "../store";
import { revalidateOwnerSites } from "../store/revalidate";
import { getGrantStore, isGrantActive } from "./grants";
import { PLANS, priceCents, setupCentsFor } from "./plans";
import { getBillingStore, type SubscriptionRecord } from "./store";
import { getStripeConfig, StripeError, stripeRequest, type StripeConfig } from "./stripe";

export { extendExpiry, getGrantStore, isGrantActive, type AccessGrant } from "./grants";
export { PLANS } from "./plans";
export { getStripeConfig, StripeError, verifyWebhookSignature } from "./stripe";

// Cobrança com Stripe Checkout + webhook, ou acesso liberado à mão pelo admin (Pix/WhatsApp,
// ver grants.ts). Os planos valem quando há STRIPE_SECRET_KEY ou REQUIRE_PLAN=true; sem nenhum
// dos dois, publicar e conectar domínio continuam liberados (como antes).

/** `true` se o checkout do Stripe pode abrir (chave secreta E segredo do webhook). */
export function checkoutReady(): boolean {
  return Boolean(getStripeConfig()?.webhookSecret);
}

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
  const checkoutEnabled = checkoutReady();
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

/**
 * Plano ativo da conta: o maior entre Stripe e acesso manual (`null` sem nenhum ativo). Também
 * define a cota mensal de créditos da IA (server/credits).
 */
export async function activePlan(userId: string): Promise<PlanId | null> {
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

/** Resumo do acesso da conta para o painel (aviso de plano acabando ou acabado). */
export type AccessSummary = {
  /** Planos valendo (Stripe ou REQUIRE_PLAN=true). Sem isso, nada de aviso. */
  enforced: boolean;
  /** O site publicado do dono pode ficar no ar agora (mesma regra de `ownerHasLiveAccess`). */
  live: boolean;
  /**
   * Quando o acesso atual acaba (ISO): fim do acesso manual, ou fim do período do Stripe só se a
   * assinatura NÃO renova sozinha. `null` = renova sozinha, sem data ou sem plano.
   */
  endsAt: string | null;
  source: "stripe" | "manual" | null;
};

/**
 * Acesso da conta `ownerId` (a conta mostrada no painel, que no "ver como" não é a do admin).
 * Falha no banco = sem aviso (mesma regra de `ownerHasLiveAccess`: na dúvida, nada de alarme).
 */
export async function accessSummary(ownerId: string): Promise<AccessSummary> {
  const enforced = billingEnforced();
  const none: AccessSummary = { enforced, live: true, endsAt: null, source: null };
  if (!enforced) return none;
  try {
    if (await isAdmin(ownerId)) return none;
    const [sub, grant] = await Promise.all([
      getBillingStore().get(ownerId),
      getGrantStore().get(ownerId),
    ]);
    const subActive = Boolean(sub?.plan) && isActiveStatus(sub?.status ?? null);
    const grantActive = isGrantActive(grant);
    const live = subActive || grantActive;
    // Vale a data que vem por último: com um Stripe que renova sozinho, não há fim à vista.
    const ends: { at: string; source: "stripe" | "manual" }[] = [];
    if (subActive && sub?.cancelAtPeriodEnd && sub.currentPeriodEnd) {
      ends.push({ at: sub.currentPeriodEnd, source: "stripe" });
    }
    if (grant && grantActive) ends.push({ at: grant.expiresAt, source: "manual" });
    if (subActive && !sub?.cancelAtPeriodEnd) {
      return { enforced, live, endsAt: null, source: "stripe" };
    }
    const last = ends.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
    if (last) return { enforced, live, endsAt: last.at, source: last.source };
    return { enforced, live, endsAt: null, source: sub ? "stripe" : grant ? "manual" : null };
  } catch (error) {
    console.error("[billing] could not read the owner's access", error);
    return none;
  }
}

/**
 * `true` se o site do dono pode aparecer no domínio próprio. Quem desceu para um plano sem
 * domínio (ex.: Pro → Starter) continua no ar, mas só no endereço grátis.
 */
export async function ownerHasCustomDomainAccess(ownerId: string | null): Promise<boolean> {
  if (!billingEnforced() || !ownerId) return true;
  try {
    if (await isAdmin(ownerId)) return true;
    const plan = await activePlan(ownerId);
    return plan !== null && PLANS[plan].customDomain;
  } catch (error) {
    // Falha no banco não derruba o site do cliente.
    console.error("[billing] could not check the owner's plan", error);
    return true;
  }
}

/**
 * 402 pronto se a conta precisa de um plano para publicar `site`, ou se o plano já chegou ao
 * limite de sites no ar; senão `null`. Republicar um site que já está no ar sempre passa pelo
 * limite (só conta os OUTROS sites publicados). Admin e cobrança desligada: sem limite.
 */
export async function publishBlocked(
  user: CurrentUser,
  site?: { id: string; status: SiteStatus },
): Promise<Response | null> {
  if (!billingEnforced() || (await isAdmin(user.id))) return null;
  const plan = await activePlan(user.id);
  if (!plan) {
    return errorResponse(402, "payment_required", "Choose a plan to put your website live.");
  }
  if (!site || site.status === "published") return null;

  const limit = PLANS[plan].publishedSitesLimit;
  const live = (await getSiteStore().list(user.id)).filter(
    (other) => other.id !== site.id && other.status === "published",
  ).length;
  if (live < limit) return null;
  // Código próprio: a tela mostra a mensagem (em vez de mandar para /billing sem explicar nada).
  return errorResponse(
    402,
    "plan_limit",
    `Your plan includes ${limit} live ${limit === 1 ? "website" : "websites"}. Upgrade your plan in Billing to publish more.`,
  );
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

type StripeCustomer = { id: string; deleted?: boolean };
type StripeSession = { id: string; url: string | null };

/** `true` se o cliente guardado ainda existe no Stripe (some ao trocar a chave de teste pela real). */
async function customerExists(config: StripeConfig, customerId: string): Promise<boolean> {
  try {
    const customer = await stripeRequest<StripeCustomer>(
      config,
      "GET",
      `/customers/${encodeURIComponent(customerId)}`,
    );
    return !customer.deleted;
  } catch (error) {
    if (error instanceof StripeError && (error.status === 404 || error.status === 400)) {
      return false;
    }
    throw error;
  }
}

/** Cliente do Stripe da conta (cria na primeira compra e guarda na tabela). */
async function ensureCustomer(
  config: StripeConfig,
  user: CurrentUser,
  existing: SubscriptionRecord | null,
): Promise<string> {
  const store = getBillingStore();
  if (existing && (await customerExists(config, existing.stripeCustomerId))) {
    return existing.stripeCustomerId;
  }
  const customer = await stripeRequest<StripeCustomer>(config, "POST", "/customers", {
    email: user.email ?? undefined,
    metadata: { user_id: user.id },
  });
  // Cliente novo (primeira compra, ou o antigo não existe mais): começa sem assinatura.
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

/** Compra recusada antes de abrir o Stripe (ex.: a conta já tem este mesmo plano). */
export class CheckoutRefused extends Error {}

/** Página de pagamento do Stripe para o plano escolhido. */
export async function createCheckoutUrl(
  config: StripeConfig,
  user: CurrentUser,
  input: CheckoutRequest,
  origin: string,
): Promise<string> {
  const plan = PLANS[input.plan];
  const existing = await getBillingStore().get(user.id);
  const current = existing && isActiveStatus(existing.status) ? existing : null;
  // Mesmo plano e período já ativos: nada de pagar duas vezes (ex.: voltou do Stripe e clicou de
  // novo antes do webhook chegar).
  if (current && current.plan === plan.id && current.interval === input.interval) {
    throw new CheckoutRefused("You already have this plan.");
  }
  const customer = await ensureCustomer(config, user, existing);
  // Troca de plano (ex.: Starter → Pro): quem já paga não paga a taxa de instalação de novo. A
  // assinatura antiga é cancelada quando a nova fica ativa (ver syncSubscription).
  const setup = current ? 0 : setupCentsFor(plan, input.interval);
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
    // {CHECKOUT_SESSION_ID}: o Stripe troca pelo id da sessão; a página /billing usa para
    // confirmar o pagamento na hora, sem esperar o webhook.
    success_url: `${origin}/billing?status=success&session_id={CHECKOUT_SESSION_ID}${back}`,
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

/** Cancela uma assinatura antiga (troca de plano). O tempo não usado vira crédito no Stripe. */
async function cancelReplaced(config: StripeConfig, subscriptionId: string): Promise<void> {
  try {
    await stripeRequest(config, "DELETE", `/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      prorate: true,
      invoice_now: true,
    });
  } catch (error) {
    // Não derruba o webhook (o Stripe reenviaria): fica no log para cancelar à mão no painel.
    console.error("[billing] could not cancel the replaced subscription", subscriptionId, error);
  }
}

/** Grava o estado da assinatura (achando a conta pelo metadata ou pelo cliente). */
async function syncSubscription(config: StripeConfig, sub: StripeSubscription): Promise<void> {
  const store = getBillingStore();
  const existing = await store.getByCustomer(sub.customer);
  const userId = sub.metadata?.user_id ?? existing?.userId;
  if (!userId) {
    console.warn("[billing] subscription without a known account", sub.id);
    return;
  }
  const other =
    existing?.stripeSubscriptionId && existing.stripeSubscriptionId !== sub.id ? existing : null;
  // Evento de uma assinatura que não é a guardada, enquanto a guardada está ativa: só vale se esta
  // também estiver ativa (é a nova, de uma troca de plano). Senão é a antiga sendo cancelada ou
  // uma tentativa que não foi paga, e não pode tirar o site do ar.
  if (other && isActiveStatus(other.status) && !isActiveStatus(sub.status)) return;

  const periodEnd =
    sub.items?.data?.find((item) => item.current_period_end)?.current_period_end ??
    sub.current_period_end;
  const record: SubscriptionRecord = {
    userId,
    stripeCustomerId: sub.customer,
    stripeSubscriptionId: sub.id,
    plan: planFrom(sub.metadata?.plan) ?? (other ? null : existing?.plan) ?? null,
    interval: intervalFrom(sub) ?? (other ? null : existing?.interval) ?? null,
    status: sub.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  };
  await store.upsert(record);
  // Plano começou, mudou ou acabou: os sites no ar da conta aparecem, mudam ou somem já.
  revalidateOwnerSites(userId);
  // Troca de plano concluída: a assinatura antiga para de cobrar.
  if (other?.stripeSubscriptionId && isActiveStatus(other.status) && isActiveStatus(sub.status)) {
    await cancelReplaced(config, other.stripeSubscriptionId);
  }
}

/** Busca a assinatura no Stripe (estado atual, mesmo que os eventos cheguem fora de ordem). */
async function fetchSubscription(
  config: StripeConfig,
  subscriptionId: string,
): Promise<StripeSubscription> {
  return stripeRequest<StripeSubscription>(
    config,
    "GET",
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );
}

type StripeCheckoutSession = {
  id: string;
  client_reference_id?: string | null;
  subscription?: string | null;
};

/**
 * Volta do Stripe (/billing?status=success&session_id=...): confirma a sessão e grava a
 * assinatura na hora, sem esperar o webhook. Só vale para a sessão da própria conta.
 */
export async function syncCheckoutSession(
  config: StripeConfig,
  user: CurrentUser,
  sessionId: string,
): Promise<void> {
  const session = await stripeRequest<StripeCheckoutSession>(
    config,
    "GET",
    `/checkout/sessions/${encodeURIComponent(sessionId)}`,
  );
  if (session.client_reference_id !== user.id || typeof session.subscription !== "string") return;
  await syncSubscription(config, await fetchSubscription(config, session.subscription));
}

/** Trata um evento já verificado do Stripe. Eventos que não interessam são ignorados. */
export async function handleStripeEvent(config: StripeConfig, event: StripeEvent): Promise<void> {
  const object = event.data.object;
  switch (event.type) {
    case "checkout.session.completed": {
      const subscriptionId = object.subscription;
      if (typeof subscriptionId !== "string") return;
      await syncSubscription(config, await fetchSubscription(config, subscriptionId));
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // O evento pode chegar fora de ordem (um "created/incomplete" antigo depois do "active"):
      // grava o estado ATUAL da assinatura, buscado no Stripe.
      const subscriptionId = object.id;
      if (typeof subscriptionId !== "string") return;
      await syncSubscription(config, await fetchSubscription(config, subscriptionId));
      return;
    }
    default:
      return;
  }
}
