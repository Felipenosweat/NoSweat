import { describe, expect, it } from "vitest";
import type { AccessGrant } from "../billing/grants";
import type { SubscriptionRecord } from "../billing/store";
import { CUSTOMER_GOAL, realCustomers } from "./customers";

const NOW = new Date("2026-11-20T12:00:00Z");

function sub(userId: string, over: Partial<SubscriptionRecord> = {}): SubscriptionRecord {
  return {
    userId,
    stripeCustomerId: `cus_${userId}`,
    stripeSubscriptionId: `sub_${userId}`,
    plan: "starter",
    interval: "monthly",
    status: "active",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    ...over,
  };
}

function grant(userId: string, over: Partial<AccessGrant> = {}): AccessGrant {
  return {
    userId,
    plan: "starter",
    expiresAt: new Date(NOW.getTime() + 5 * 86_400_000).toISOString(),
    note: null,
    grantedBy: null,
    updatedAt: NOW.toISOString(),
    ...over,
  };
}

describe("realCustomers", () => {
  it("counts active card subscriptions and manual access with confirmed payment", () => {
    const result = realCustomers(
      [sub("a"), sub("b", { status: "canceled" }), sub("c", { plan: null })],
      [
        grant("d", { paymentConfirmedAt: NOW.toISOString() }),
        grant("e"), // cortesia: vale, mas não conta
        grant("f", { paymentConfirmedAt: NOW.toISOString(), expiresAt: "2026-11-01T00:00:00Z" }),
      ],
      new Set(),
      NOW,
    );
    expect(result).toMatchObject({ count: 2, stripe: 1, manual: 1, unconfirmed: 1 });
    expect(result.goal).toBe(CUSTOMER_GOAL);
    expect(result.reached).toBe(false);
  });

  it("counts an account once, leaves out admins and test accounts, and reaches the goal", () => {
    const many = Array.from({ length: 10 }, (_, i) => sub(`u${i}`));
    const result = realCustomers(
      [...many, sub("admin")],
      [grant("u0", { paymentConfirmedAt: NOW.toISOString() }), grant("test")],
      new Set(["admin", "test"]),
      NOW,
    );
    expect(result.count).toBe(10);
    expect(result.reached).toBe(true);
    expect(result.unconfirmed).toBe(0);
  });
});
