import { describe, expect, it } from "vitest";
import type { AccessGrant } from "../billing/grants";
import type { SubscriptionRecord } from "../billing/store";
import { grantsExpiringSoon, ownersWithActivePlan, summarizeActivePlans } from "./metrics";

const NOW = new Date("2026-10-16T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function sub(userId: string, plan: SubscriptionRecord["plan"], status: string): SubscriptionRecord {
  return {
    userId,
    stripeCustomerId: `cus_${userId}`,
    stripeSubscriptionId: `sub_${userId}`,
    plan,
    interval: "monthly",
    status,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}

function grant(userId: string, plan: AccessGrant["plan"], inDays: number): AccessGrant {
  return {
    userId,
    plan,
    expiresAt: new Date(NOW.getTime() + inDays * DAY).toISOString(),
    note: null,
    grantedBy: null,
    updatedAt: NOW.toISOString(),
  };
}

describe("admin metrics", () => {
  it("counts active Stripe subscriptions and active manual grants by plan", () => {
    const summary = summarizeActivePlans(
      [sub("a", "pro", "active"), sub("b", "starter", "canceled"), sub("c", "pro", "past_due")],
      [grant("d", "premium", 10), grant("e", "pro", -1), grant("a", "starter", 3)],
      NOW,
    );
    expect(summary.byPlan).toEqual([
      { plan: "starter", stripe: 0, manual: 1 },
      { plan: "pro", stripe: 2, manual: 0 },
      { plan: "premium", stripe: 0, manual: 1 },
    ]);
    // "a" tem cartão e acesso manual: conta uma vez só.
    expect(summary.accounts).toBe(3);
  });

  it("lists manual access ending in the next 7 days, soonest first", () => {
    const grants = [
      grant("a", "pro", 6),
      grant("b", "pro", 8),
      grant("c", "pro", -2),
      grant("d", "starter", 1),
    ];
    expect(grantsExpiringSoon(grants, NOW, 7).map((g) => g.userId)).toEqual(["d", "a"]);
  });

  it("knows which owners keep their published sites live (card, manual access or admin)", () => {
    const owners = ownersWithActivePlan(
      [sub("a", "pro", "active"), sub("b", "starter", "canceled")],
      [grant("c", "pro", 3), grant("d", "pro", -1)],
      new Set(["admin"]),
      NOW,
    );
    expect([...owners].sort()).toEqual(["a", "admin", "c"]);
  });
});
