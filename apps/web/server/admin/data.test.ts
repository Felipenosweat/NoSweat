import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it, vi } from "vitest";
import { DEV_USER } from "../auth/session";
import type { AccessGrant } from "../billing/grants";
import type { SubscriptionRecord } from "../billing/store";
import { getSiteStore } from "../store";
import { ADMIN_CACHE_TAG, revalidateAdmin } from "./cache";
import {
  loadAccountsList,
  loadAiUsage,
  loadSiteSummaries,
  planState,
  siteStatsByOwner,
} from "./data";

// Fora de um request do Next não há cache de dados: o unstable_cache vira só a própria função.
const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock("next/cache", () => ({
  revalidateTag,
  unstable_cache: <T>(fn: T) => fn,
}));

const NOW = new Date("2026-10-16T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function grant(userId: string, inDays: number): AccessGrant {
  return {
    userId,
    plan: "pro",
    expiresAt: new Date(NOW.getTime() + inDays * DAY).toISOString(),
    note: null,
    grantedBy: null,
    updatedAt: NOW.toISOString(),
  };
}

function sub(userId: string, status: string): SubscriptionRecord {
  return {
    userId,
    stripeCustomerId: `cus_${userId}`,
    stripeSubscriptionId: `sub_${userId}`,
    plan: "starter",
    interval: "monthly",
    status,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}

describe("admin data loaders", () => {
  it("counts websites and live websites per account, leaving guests out", () => {
    const stats = siteStatsByOwner([
      { ownerId: "a", status: "published" },
      { ownerId: "a", status: "draft" },
      { ownerId: "b", status: "draft" },
      { ownerId: null, status: "draft" },
    ]);
    expect(Object.fromEntries(stats)).toEqual({
      a: { websites: 2, live: 1 },
      b: { websites: 1, live: 0 },
    });
  });

  it("derives plans, expiring access and who keeps sites live", () => {
    const state = planState(
      {
        adminIds: new Set(["admin"]),
        grants: [grant("g1", 3), grant("g2", 20), grant("old", -1)],
        subscriptions: [sub("s1", "active"), sub("s2", "canceled")],
        now: NOW,
      },
      true,
    );
    expect(state.enforced).toBe(true);
    expect(state.plans?.accounts).toBe(3);
    expect(state.expiringGrants.map((g) => g.userId)).toEqual(["g1"]);
    expect([...(state.ownersWithAccess ?? [])].sort()).toEqual(["admin", "g1", "g2", "s1"]);
  });

  it("never marks sites as 'no plan' when subscriptions could not be read", () => {
    const state = planState(
      { adminIds: new Set(), grants: [grant("g1", 3)], subscriptions: null, now: NOW },
      false,
    );
    expect(state.plans).toBeNull();
    expect(state.ownersWithAccess).toBeNull();
    expect(state.expiringGrants).toHaveLength(1);
  });

  it("lists light site summaries and per-account numbers from the store", async () => {
    const store = getSiteStore();
    const owned = await store.create(fixtures["joes-plumbing"], DEV_USER.id);
    await store.updateMeta(owned.id, { status: "published", slug: `joes-${owned.id.slice(0, 6)}` });
    await store.addLead(owned.id, { name: "Ann", email: null, phone: null, message: "Hi" });
    const guest = await store.create(fixtures["sparkle-cleaning"], {
      guestId: crypto.randomUUID(),
    });

    const summaries = await loadSiteSummaries();
    const summary = summaries.find((site) => site.id === owned.id);
    expect(summary).toMatchObject({ ownerId: DEV_USER.id, status: "published" });
    expect(summary?.spec).toEqual({
      business: { name: fixtures["joes-plumbing"].business.name },
      template: fixtures["joes-plumbing"].template,
    });
    // Linha leve: sem o rascunho nem a versão no ar inteiros.
    expect(summary).not.toHaveProperty("publishedSpec");
    expect(summaries.some((site) => site.id === guest.id)).toBe(true);

    const list = await loadAccountsList();
    expect(list.accounts.map((account) => account.id)).toContain(DEV_USER.id);
    const mine = summaries.filter((site) => site.ownerId === DEV_USER.id);
    expect(list.siteStats.get(DEV_USER.id)).toEqual({
      websites: mine.length,
      live: mine.filter((site) => site.status === "published").length,
    });
    expect(list.requestsByOwner?.get(DEV_USER.id)).toBeGreaterThanOrEqual(1);
  });

  it("reads AI usage for 24 hours and 30 days", async () => {
    const before = await loadAiUsage();
    await getSiteStore().recordAiUsage(DEV_USER.id, "generate");
    const after = await loadAiUsage();
    expect(after.ai24h?.generate).toBe((before.ai24h?.generate ?? 0) + 1);
    expect(after.ai30d?.generate).toBe((before.ai30d?.generate ?? 0) + 1);
  });

  it("expires the admin cache tag right away", () => {
    revalidateAdmin();
    expect(revalidateTag).toHaveBeenCalledWith(ADMIN_CACHE_TAG, { expire: 0 });
  });
});
