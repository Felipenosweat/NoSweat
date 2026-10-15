import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCheckoutUrl,
  customDomainBlocked,
  getBillingStatus,
  extendExpiry,
  getGrantStore,
  handleStripeEvent,
  ownerHasLiveAccess,
  ownerHasSocialAccess,
  publishBlocked,
  socialBlocked,
  socialMonthlyCap,
  verifyWebhookSignature,
} from "./index";
import { fixtures } from "@nosweat/fixtures";
import { getSiteStore } from "../store";
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
  (globalThis as { __nosweatGrants?: unknown }).__nosweatGrants = undefined;
});

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.REQUIRE_PLAN;
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

describe("manual access (Pix/WhatsApp)", () => {
  const DAY = 24 * 60 * 60 * 1000;

  async function grant(plan: "starter" | "pro" | "premium", expiresAt: Date) {
    await getGrantStore().upsert({
      userId: user.id,
      plan,
      expiresAt: expiresAt.toISOString(),
      note: null,
      grantedBy: null,
      updatedAt: new Date().toISOString(),
    });
  }

  it("lets REQUIRE_PLAN turn plans on without Stripe and unlocks with a grant until it expires", async () => {
    process.env.REQUIRE_PLAN = "true";
    expect((await publishBlocked(user))?.status).toBe(402);
    expect(await ownerHasLiveAccess(user.id)).toBe(false);
    expect(await getBillingStatus(user)).toMatchObject({ enabled: true, checkoutEnabled: false });

    const until = new Date(Date.now() + 30 * DAY);
    await grant("pro", until);
    expect(await publishBlocked(user)).toBeNull();
    expect(await customDomainBlocked(user)).toBeNull();
    expect(await ownerHasLiveAccess(user.id)).toBe(true);
    expect(await getBillingStatus(user)).toMatchObject({
      source: "manual",
      plan: "pro",
      active: true,
      currentPeriodEnd: until.toISOString(),
    });

    await grant("pro", new Date(Date.now() - DAY));
    expect((await publishBlocked(user))?.status).toBe(402);
    expect(await ownerHasLiveAccess(user.id)).toBe(false);
  });

  it("keeps every site live while plans are off", async () => {
    expect(await ownerHasLiveAccess(user.id)).toBe(true);
  });

  it("adds days on top of the time left, or from today once expired", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const base = { userId: user.id, plan: "pro" as const, note: null, grantedBy: null };
    const active = { ...base, expiresAt: "2026-01-11T00:00:00Z", updatedAt: "" };
    const expired = { ...base, expiresAt: "2025-12-01T00:00:00Z", updatedAt: "" };
    expect(extendExpiry(active, 30, now)).toBe("2026-02-10T00:00:00.000Z");
    expect(extendExpiry(expired, 30, now)).toBe("2026-01-31T00:00:00.000Z");
    expect(extendExpiry(null, 1, now)).toBe("2026-01-02T00:00:00.000Z");
  });
});

describe("social plan rules", () => {
  const DAY = 24 * 60 * 60 * 1000;

  async function grant(plan: "starter" | "pro" | "premium") {
    await getGrantStore().upsert({
      userId: user.id,
      plan,
      expiresAt: new Date(Date.now() + 30 * DAY).toISOString(),
      note: null,
      grantedBy: null,
      updatedAt: new Date().toISOString(),
    });
  }

  it("leaves social posting open with no cap while plans are off", async () => {
    expect(await socialBlocked(user)).toBeNull();
    expect(await socialMonthlyCap(user)).toBeNull();
    expect(await ownerHasSocialAccess(user.id)).toBe(true);
  });

  it("blocks without a plan and unlocks with a grant (REQUIRE_PLAN)", async () => {
    process.env.REQUIRE_PLAN = "true";
    const blocked = await socialBlocked(user);
    expect(blocked?.status).toBe(402);
    expect(await blocked?.json()).toMatchObject({
      error: { code: "payment_required", message: "Social posting is part of the paid plans." },
    });
    expect(await socialMonthlyCap(user)).toBe(0);
    expect(await ownerHasSocialAccess(user.id)).toBe(false);

    await grant("pro");
    expect(await socialBlocked(user)).toBeNull();
    expect(await ownerHasSocialAccess(user.id)).toBe(true);
  });

  it("caps approved posts per month by plan", async () => {
    process.env.REQUIRE_PLAN = "true";
    await grant("starter");
    expect(await socialMonthlyCap(user)).toBe(12);
    await grant("pro");
    expect(await socialMonthlyCap(user)).toBe(30);
    await grant("premium");
    expect(await socialMonthlyCap(user)).toBe(60);
  });
});

describe("published sites limit", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const owner = { id: "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d", email: "limit@example.com" };

  beforeEach(() => {
    (globalThis as { __nosweatSites?: unknown }).__nosweatSites = undefined;
  });

  async function grant(plan: "starter" | "pro" | "premium") {
    await getGrantStore().upsert({
      userId: owner.id,
      plan,
      expiresAt: new Date(Date.now() + 30 * DAY).toISOString(),
      note: null,
      grantedBy: null,
      updatedAt: new Date().toISOString(),
    });
  }

  async function liveSite() {
    const store = getSiteStore();
    const site = await store.create(fixtures["joes-plumbing"], owner.id);
    const published = await store.updateMeta(site.id, { status: "published" });
    if (!published) throw new Error("site not found");
    return published;
  }

  it("has no limit while plans are off", async () => {
    for (let i = 0; i < 3; i++) await liveSite();
    const draft = await getSiteStore().create(fixtures["glow-salon"], owner.id);
    expect(await publishBlocked(owner, draft)).toBeNull();
  });

  it("allows 3 live sites on Starter, more on Pro, and always lets a live site republish", async () => {
    process.env.REQUIRE_PLAN = "true";
    await grant("starter");
    const live = [await liveSite(), await liveSite(), await liveSite()];

    const draft = await getSiteStore().create(fixtures["glow-salon"], owner.id);
    const blocked = await publishBlocked(owner, draft);
    expect(blocked?.status).toBe(402);
    expect(await blocked?.json()).toMatchObject({
      error: {
        code: "payment_required",
        message: "Your plan includes 3 live websites. Upgrade to publish more.",
      },
    });
    // Publicar as mudanças de um site que já está no ar nunca é bloqueado pelo limite.
    expect(await publishBlocked(owner, live[0])).toBeNull();

    await grant("pro");
    expect(await publishBlocked(owner, draft)).toBeNull();
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
