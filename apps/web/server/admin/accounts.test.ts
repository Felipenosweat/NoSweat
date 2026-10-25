import { describe, expect, it, vi } from "vitest";
import type { AccessGrant } from "../billing/grants";
import type { SubscriptionRecord } from "../billing/store";
import { loginChangeBlocker, setLoginDisabled, type LoginAccessDeps } from "./account-access";
import {
  filterAccounts,
  loginDisabled,
  parseAccountSort,
  planStatus,
  sortAccounts,
} from "./accounts";
import { setAuthUserLoginDisabled } from "./auth-api";
import type { ClientAccount } from "./index";
import { countLeadsBySiteFromSupabase, leadsByOwner } from "./leads";

const NOW = new Date("2026-10-25T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const ADMIN_ID = "0b6a1f5e-2c3d-4e5f-8a9b-1c2d3e4f5a6b";
const USER_ID = "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b";

function account(overrides: Partial<ClientAccount> = {}): ClientAccount {
  return {
    id: USER_ID,
    email: "owner@joesplumbing.com",
    createdAt: null,
    lastSignInAt: null,
    firstName: "Joe",
    lastName: "Smith",
    testAccount: false,
    bannedUntil: null,
    ...overrides,
  };
}

function grant(plan: AccessGrant["plan"], inDays: number): AccessGrant {
  return {
    userId: USER_ID,
    plan,
    expiresAt: new Date(NOW.getTime() + inDays * DAY).toISOString(),
    note: null,
    grantedBy: null,
    updatedAt: NOW.toISOString(),
  };
}

function sub(status: string): SubscriptionRecord {
  return {
    userId: USER_ID,
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    plan: "pro",
    interval: "monthly",
    status,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };
}

describe("account list", () => {
  const accounts = [
    account({ id: "a", email: "amy@x.com", createdAt: "2026-01-01T00:00:00Z" }),
    account({
      id: "b",
      email: "bob@y.com",
      firstName: "Robert",
      createdAt: "2026-03-01T00:00:00Z",
      lastSignInAt: "2026-03-02T00:00:00Z",
    }),
    account({ id: "c", email: null, createdAt: null, lastSignInAt: "2026-10-01T00:00:00Z" }),
  ];

  it("searches email and name", () => {
    expect(filterAccounts(accounts, "BOB").map((a) => a.id)).toEqual(["b"]);
    expect(filterAccounts(accounts, "robert").map((a) => a.id)).toEqual(["b"]);
    expect(filterAccounts(accounts, "").map((a) => a.id)).toEqual(["a", "b", "c"]);
  });

  it("sorts by signup or last login, newest first, missing dates last", () => {
    expect(sortAccounts(accounts, "signup").map((a) => a.id)).toEqual(["b", "a", "c"]);
    expect(sortAccounts(accounts, "login").map((a) => a.id)).toEqual(["c", "b", "a"]);
    expect(parseAccountSort("login")).toBe("login");
    expect(parseAccountSort("x")).toBe("signup");
  });

  it("reads the login ban", () => {
    expect(loginDisabled(account(), NOW)).toBe(false);
    expect(loginDisabled(account({ bannedUntil: "2126-01-01T00:00:00Z" }), NOW)).toBe(true);
    expect(loginDisabled(account({ bannedUntil: "2020-01-01T00:00:00Z" }), NOW)).toBe(false);
  });

  it("summarizes the plan", () => {
    expect(planStatus(sub("active"), null, NOW)).toMatchObject({ tone: "live" });
    expect(planStatus(null, grant("starter", 5), NOW).label).toMatch(/^Starter until/);
    // Cartão falhando: o plano continua valendo (site no ar), mas aparece como pendente.
    const pastDue = planStatus(sub("past_due"), null, NOW);
    expect(pastDue.tone).toBe("pending");
    expect(pastDue.label).toMatch(/card · past_due$/);
    expect(planStatus(null, grant("pro", -1), NOW).label).toMatch(/^Access ended/);
    expect(planStatus(null, null, NOW)).toEqual({ label: "No plan", tone: "neutral" });
  });
});

describe("disable login", () => {
  function deps(target: ClientAccount | null, targetIsAdmin = false) {
    const fake: LoginAccessDeps = {
      getAccount: async (id) => (target && target.id === id ? target : null),
      isAdmin: async () => targetIsAdmin,
      setLoginDisabled: vi.fn(async () => undefined),
    };
    return fake;
  }

  it("never touches admins or your own account", () => {
    const opts = { targetIsAdmin: false, actorId: ADMIN_ID };
    expect(loginChangeBlocker(account(), opts)).toBeNull();
    expect(loginChangeBlocker(null, opts)).toMatch(/not found/i);
    expect(loginChangeBlocker(account({ id: ADMIN_ID }), opts)).toMatch(/own/i);
    expect(loginChangeBlocker(account(), { ...opts, targetIsAdmin: true })).toMatch(/admin/i);
  });

  it("bans and unbans a real account without deleting it", async () => {
    const fake = deps(account());
    await expect(setLoginDisabled(USER_ID, ADMIN_ID, true, fake)).resolves.toEqual({
      ok: true,
      email: "owner@joesplumbing.com",
    });
    expect(fake.setLoginDisabled).toHaveBeenCalledWith(USER_ID, true);
    await setLoginDisabled(USER_ID, ADMIN_ID, false, fake);
    expect(fake.setLoginDisabled).toHaveBeenLastCalledWith(USER_ID, false);
  });

  it("refuses admins", async () => {
    const fake = deps(account(), true);
    await expect(setLoginDisabled(USER_ID, ADMIN_ID, true, fake)).resolves.toMatchObject({
      ok: false,
    });
    expect(fake.setLoginDisabled).not.toHaveBeenCalled();
  });

  it("sends ban_duration to the Supabase Auth admin API", async () => {
    const config = { url: "https://example.supabase.co", key: "service-key" };
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: USER_ID })));
    await setAuthUserLoginDisabled(config, USER_ID, true, fetchImpl as unknown as typeof fetch);
    await setAuthUserLoginDisabled(config, USER_ID, false, fetchImpl as unknown as typeof fetch);
    const bodies = (fetchImpl.mock.calls as unknown as [string, RequestInit][]).map(([, init]) =>
      JSON.parse(String(init.body)),
    );
    expect(bodies).toEqual([{ ban_duration: "876000h" }, { ban_duration: "none" }]);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://example.supabase.co/auth/v1/admin/users/${USER_ID}`);
    expect(init.method).toBe("PUT");
    await expect(
      setAuthUserLoginDisabled(config, "nope", true, fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow("Invalid user id");
  });
});

describe("lead counts", () => {
  it("counts leads per site across pages, reading only site_id", async () => {
    const page1 = Array.from({ length: 1000 }, (_, i) => ({ site_id: i % 2 ? "s1" : "s2" }));
    const page2 = [{ site_id: "s1" }, { site_id: "s3" }];
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(page1)))
      .mockResolvedValueOnce(new Response(JSON.stringify(page2)));
    const counts = await countLeadsBySiteFromSupabase(
      { url: "https://example.supabase.co", key: "k" },
      fetchImpl as unknown as typeof fetch,
    );
    expect(counts.get("s1")).toBe(501);
    expect(counts.get("s2")).toBe(500);
    expect(counts.get("s3")).toBe(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [url] = fetchImpl.mock.calls[1] as unknown as [string];
    expect(url).toContain("select=site_id");
    expect(url).toContain("offset=1000");
  });

  it("sums leads per owner and skips guest sites", () => {
    const totals = leadsByOwner(
      [
        { id: "s1", ownerId: "u1" },
        { id: "s2", ownerId: "u1" },
        { id: "s3", ownerId: null },
        { id: "s4", ownerId: "u2" },
      ],
      new Map([
        ["s1", 2],
        ["s2", 3],
        ["s3", 9],
      ]),
    );
    expect(totals.get("u1")).toBe(5);
    expect(totals.get("u2")).toBe(0);
    expect(totals.size).toBe(2);
  });
});
