import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildRenewalEmail,
  fetchRenewalAmount,
  formatAmount,
  renewalNoticeDue,
  sendRenewalNotices,
  type RenewalNoticeDeps,
} from "./renewal-notice";
import { MemoryBillingStore, type SubscriptionRecord } from "./store";

const NOW = new Date("2026-10-20T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const USER = "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b";

function sub(inDays: number, overrides: Partial<SubscriptionRecord> = {}): SubscriptionRecord {
  return {
    userId: USER,
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    plan: "starter",
    interval: "annual",
    status: "active",
    currentPeriodEnd: new Date(NOW.getTime() + inDays * DAY).toISOString(),
    cancelAtPeriodEnd: false,
    renewalNoticeFor: null,
    ...overrides,
  };
}

beforeEach(() => {
  (globalThis as { __nosweatSubscriptions?: unknown }).__nosweatSubscriptions = undefined;
});

describe("renewalNoticeDue", () => {
  it("is due from 7 days out until 3 days out, and not before or after", () => {
    expect(renewalNoticeDue(sub(20), NOW)).toBe(false);
    expect(renewalNoticeDue(sub(7.5), NOW)).toBe(false);
    expect(renewalNoticeDue(sub(7), NOW)).toBe(true);
    expect(renewalNoticeDue(sub(5), NOW)).toBe(true);
    expect(renewalNoticeDue(sub(3), NOW)).toBe(true);
    expect(renewalNoticeDue(sub(2.9), NOW)).toBe(false);
    expect(renewalNoticeDue(sub(-1), NOW)).toBe(false);
  });

  it("covers annual, active and renewing subscriptions only", () => {
    expect(renewalNoticeDue(sub(6, { interval: "monthly" }), NOW)).toBe(false);
    expect(renewalNoticeDue(sub(6, { cancelAtPeriodEnd: true }), NOW)).toBe(false);
    expect(renewalNoticeDue(sub(6, { status: "past_due" }), NOW)).toBe(false);
    expect(renewalNoticeDue(sub(6, { stripeSubscriptionId: null }), NOW)).toBe(false);
    expect(renewalNoticeDue(sub(6, { currentPeriodEnd: null }), NOW)).toBe(false);
  });

  it("sends once per renewal date and starts over with a new period", () => {
    const base = sub(6);
    const notified = { ...base, renewalNoticeFor: base.currentPeriodEnd };
    expect(renewalNoticeDue(notified, NOW)).toBe(false);
    // Postgres devolve "+00:00": é o mesmo instante.
    const pgDate = (base.currentPeriodEnd ?? "").replace("Z", "+00:00");
    expect(renewalNoticeDue({ ...base, renewalNoticeFor: pgDate }, NOW)).toBe(false);
    // Um ano depois: o período novo não bate com a marca antiga.
    const nextYear = new Date(NOW.getTime() + 365 * DAY);
    const renewed = sub(371, { renewalNoticeFor: base.currentPeriodEnd });
    expect(renewalNoticeDue(renewed, nextYear)).toBe(true);
  });
});

describe("renewal e-mail", () => {
  it("names the plan, date, amount and the Billing link", () => {
    const email = buildRenewalEmail(
      sub(7),
      { amountCents: 19000, currency: "usd" },
      "https://nosweatfd.com",
    );
    expect(email.subject).toBe("Your No Sweat plan renews on October 27, 2026");
    expect(email.text).toContain("Your No Sweat Starter plan renews on October 27, 2026 for $190");
    expect(email.text).toContain("per year");
    expect(email.text).toContain("renews automatically");
    expect(email.text).toContain("https://nosweatfd.com/billing");
    expect(email.text).toContain("Reply to this e-mail");
    expect(email.html).toContain('href="https://nosweatfd.com/billing"');
  });

  it("formats whole dollars and cents", () => {
    expect(formatAmount({ amountCents: 19000, currency: "usd" })).toBe("$190");
    expect(formatAmount({ amountCents: 18950, currency: "usd" })).toBe("$189.50");
  });
});

describe("fetchRenewalAmount", () => {
  const config = { secretKey: "sk_test", webhookSecret: null };
  function stripe(body: unknown, calls: string[] = []) {
    return vi.fn(async (url: string) => {
      calls.push(url);
      return Response.json(body);
    }) as unknown as typeof fetch;
  }
  const item = { quantity: 1, price: { unit_amount: 1900, currency: "usd", recurring: { interval: "year" } } };

  it("reads the real price from the subscription item, not from the plan list", async () => {
    const result = await fetchRenewalAmount(
      config,
      "sub_1",
      stripe({ status: "active", items: { data: [item] } }),
    );
    expect(result).toEqual({ amountCents: 1900, currency: "usd" });
  });

  it("uses the upcoming invoice when a discount applies", async () => {
    const calls: string[] = [];
    const result = await fetchRenewalAmount(
      config,
      "sub_1",
      vi.fn(async (url: string) => {
        calls.push(url);
        return Response.json(
          url.includes("create_preview")
            ? { total: 1500, currency: "usd" }
            : { status: "active", discounts: ["di_1"], items: { data: [item] } },
        );
      }) as unknown as typeof fetch,
    );
    expect(result).toEqual({ amountCents: 1500, currency: "usd" });
    expect(calls.some((url) => url.includes("create_preview"))).toBe(true);
  });

  it("returns null when the amount cannot be read and not_renewing when canceled", async () => {
    expect(
      await fetchRenewalAmount(config, "sub_1", stripe({ status: "active", items: { data: [] } })),
    ).toBeNull();
    expect(
      await fetchRenewalAmount(
        config,
        "sub_1",
        stripe({ status: "active", items: { data: [{ price: { unit_amount: null, recurring: { interval: "year" } } }] } }),
      ),
    ).toBeNull();
    expect(
      await fetchRenewalAmount(
        config,
        "sub_1",
        stripe({ status: "active", cancel_at_period_end: true, items: { data: [item] } }),
      ),
    ).toBe("not_renewing");
  });
});

describe("sendRenewalNotices", () => {
  function deps(overrides: Partial<RenewalNoticeDeps> = {}) {
    const store = new MemoryBillingStore();
    const send = vi.fn<RenewalNoticeDeps["send"]>(async () => "sent");
    const value: RenewalNoticeDeps = {
      store,
      getAccount: async () => ({ email: "owner@joesplumbing.com", testAccount: false }),
      send,
      enabled: true,
      env: { RESEND_API_KEY: "re_test", APP_URL: "https://nosweatfd.com/" },
      fetchAmount: async () => ({ amountCents: 1900, currency: "usd" }),
      ...overrides,
    };
    return { store, send, value };
  }

  it("does nothing while Stripe or e-mail are off", async () => {
    const off = deps({ enabled: false });
    expect((await sendRenewalNotices(NOW, off.value)).disabled).toBe("billing_off");
    const noKey = deps({ env: {} });
    expect((await sendRenewalNotices(NOW, noKey.value)).disabled).toBe("email_off");
    expect(noKey.send).not.toHaveBeenCalled();
  });

  it("sends one e-mail per renewal with the amount from Stripe and never twice", async () => {
    const { store, send, value } = deps();
    const record = sub(6);
    await store.upsert(record);

    expect(await sendRenewalNotices(NOW, value)).toMatchObject({ checked: 1, sent: 1, failed: 0 });
    const [to, subject, text] = send.mock.calls[0] ?? [];
    expect(to).toBe("owner@joesplumbing.com");
    expect(subject).toMatch(/renews on October 26, 2026/);
    expect(text).toContain("$19 per year");
    expect(text).toContain("https://nosweatfd.com/billing");
    expect((await store.get(USER))?.renewalNoticeFor).toBe(record.currentPeriodEnd);

    send.mockClear();
    expect(await sendRenewalNotices(NOW, value)).toMatchObject({ checked: 0, sent: 0 });
    expect(send).not.toHaveBeenCalled();
  });

  it("skips when the amount cannot be read, and retries tomorrow", async () => {
    const { store, send, value } = deps({ fetchAmount: async () => null });
    await store.upsert(sub(6));
    expect(await sendRenewalNotices(NOW, value)).toMatchObject({ sent: 0, failed: 1 });
    expect(send).not.toHaveBeenCalled();
    expect((await store.get(USER))?.renewalNoticeFor).toBeNull();
  });

  it("skips test accounts and subscriptions that are not renewing", async () => {
    const test = deps({ getAccount: async () => ({ email: "t@nosweatfd.com", testAccount: true }) });
    await test.store.upsert(sub(6));
    expect(await sendRenewalNotices(NOW, test.value)).toMatchObject({ skipped: 1, sent: 0 });

    const canceled = deps({ fetchAmount: async () => "not_renewing" });
    await canceled.store.upsert(sub(6));
    expect(await sendRenewalNotices(NOW, canceled.value)).toMatchObject({ skipped: 1, sent: 0 });
    expect(canceled.send).not.toHaveBeenCalled();
  });

  it("clears the mark when the e-mail fails so tomorrow's run tries again", async () => {
    const { store, value } = deps({ send: vi.fn<RenewalNoticeDeps["send"]>(async () => "failed") });
    await store.upsert(sub(6));
    expect(await sendRenewalNotices(NOW, value)).toMatchObject({ sent: 0, failed: 1 });
    expect((await store.get(USER))?.renewalNoticeFor).toBeNull();
  });

  it("does not remind monthly plans", async () => {
    const { store, send, value } = deps();
    await store.upsert(sub(6, { interval: "monthly" }));
    expect(await sendRenewalNotices(NOW, value)).toMatchObject({ checked: 0, sent: 0 });
    expect(send).not.toHaveBeenCalled();
  });
});
