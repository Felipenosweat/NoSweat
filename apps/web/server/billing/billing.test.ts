import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCheckoutUrl,
  customDomainBlocked,
  getBillingStatus,
  handleStripeEvent,
  publishBlocked,
  verifyWebhookSignature,
} from "./index";
import { getBillingStore } from "./store";
import { encodeForm } from "./stripe";

const config = { secretKey: "sk_test_123", webhookSecret: "whsec_test" };
const user = { id: "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b", email: "owner@example.com" };

function sign(payload: string, secret: string, timestamp = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${v1}`;
}

async function subscribe(plan: "starter" | "pro" | "premium", status = "active") {
  await handleStripeEvent(config, {
    id: "evt_1",
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_1",
        customer: "cus_1",
        status,
        cancel_at_period_end: false,
        metadata: { user_id: user.id, plan, interval: "monthly" },
        items: {
          data: [{ current_period_end: 1893456000, price: { recurring: { interval: "month" } } }],
        },
      },
    },
  });
}

beforeEach(() => {
  (globalThis as { __nosweatSubscriptions?: unknown }).__nosweatSubscriptions = undefined;
});

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  vi.unstubAllGlobals();
});

describe("encodeForm", () => {
  it("encodes nested objects and arrays like the Stripe API expects", () => {
    const parts = encodeForm({
      a: 1,
      line_items: [{ price_data: { unit_amount: 3900 } }],
      skip: null,
    });
    expect(parts).toEqual([
      "a=1",
      `${encodeURIComponent("line_items[0][price_data][unit_amount]")}=3900`,
    ]);
  });
});

describe("verifyWebhookSignature", () => {
  it("accepts a valid signature and rejects tampering, wrong secrets and old events", () => {
    const payload = JSON.stringify({ id: "evt_1" });
    expect(verifyWebhookSignature(payload, sign(payload, "whsec_test"), "whsec_test")).toBe(true);
    expect(verifyWebhookSignature(`${payload} `, sign(payload, "whsec_test"), "whsec_test")).toBe(
      false,
    );
    expect(verifyWebhookSignature(payload, sign(payload, "other"), "whsec_test")).toBe(false);
    const old = Math.floor(Date.now() / 1000) - 3600;
    expect(verifyWebhookSignature(payload, sign(payload, "whsec_test", old), "whsec_test")).toBe(
      false,
    );
    expect(verifyWebhookSignature(payload, null, "whsec_test")).toBe(false);
  });
});

describe("plan rules", () => {
  it("keeps everything free while Stripe is not configured", async () => {
    expect(await publishBlocked(user)).toBeNull();
    expect(await customDomainBlocked(user)).toBeNull();
    expect((await getBillingStatus(user)).enabled).toBe(false);
  });

  it("asks for a plan to publish, and for Pro or Premium to connect a domain", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    expect((await publishBlocked(user))?.status).toBe(402);

    await subscribe("starter");
    expect(await publishBlocked(user)).toBeNull();
    expect((await customDomainBlocked(user))?.status).toBe(402);

    await subscribe("pro");
    expect(await customDomainBlocked(user)).toBeNull();
    expect(await getBillingStatus(user)).toMatchObject({
      enabled: true,
      plan: "pro",
      interval: "monthly",
      active: true,
      currentPeriodEnd: new Date(1893456000 * 1000).toISOString(),
    });

    await subscribe("pro", "canceled");
    expect((await publishBlocked(user))?.status).toBe(402);
  });
});

describe("createCheckoutUrl", () => {
  it("adds the one-time setup fee only to monthly Starter and Pro", async () => {
    const calls: { url: string; body: string }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, body: String(init.body ?? "") });
        const json = url.endsWith("/customers")
          ? { id: "cus_new" }
          : { id: "cs_1", url: "https://checkout.stripe.com/c/pay/cs_1" };
        return Response.json(json);
      }),
    );

    const url = await createCheckoutUrl(
      config,
      user,
      { plan: "starter", interval: "monthly" },
      "https://nosweatfd.com",
    );
    expect(url).toBe("https://checkout.stripe.com/c/pay/cs_1");
    const monthly = decodeURIComponent(
      calls.find((c) => c.url.endsWith("/checkout/sessions"))!.body,
    );
    expect(monthly).toContain("line_items[0][price_data][unit_amount]=3900");
    expect(monthly).toContain("line_items[1][price_data][unit_amount]=24900");
    expect(monthly).toContain("mode=subscription");
    expect((await getBillingStore().get(user.id))?.stripeCustomerId).toBe("cus_new");

    calls.length = 0;
    await createCheckoutUrl(
      config,
      user,
      { plan: "starter", interval: "annual" },
      "https://nosweatfd.com",
    );
    const annual = decodeURIComponent(
      calls.find((c) => c.url.endsWith("/checkout/sessions"))!.body,
    );
    expect(annual).toContain("line_items[0][price_data][unit_amount]=39000");
    expect(annual).not.toContain("line_items[1]");
    // O cliente do Stripe é reaproveitado.
    expect(calls.some((c) => c.url.endsWith("/customers"))).toBe(false);
  });
});
