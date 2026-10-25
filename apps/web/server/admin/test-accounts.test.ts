import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it, vi } from "vitest";
import { hasCompleteProfile, passwordProblems } from "@/lib/signup-rules";
import type { SiteRecord } from "../store";
import type { ClientAccount } from "./index";
import {
  accountDeleteBlocker,
  deleteAccount,
  deleteTestAccount,
  generatePassword,
  testAccountAppMetadata,
  testAccountDeleteBlocker,
  testAccountEmail,
  testAccountUserMetadata,
  type DeleteTestAccountDeps,
} from "./test-accounts";

const ADMIN_ID = "0b6a1f5e-2c3d-4e5f-8a9b-1c2d3e4f5a6b";

function account(overrides: Partial<ClientAccount> = {}): ClientAccount {
  return {
    id: "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b",
    email: "test+abc123@nosweatfd.com",
    createdAt: null,
    lastSignInAt: null,
    firstName: "Test",
    lastName: "Client 1",
    testAccount: true,
    bannedUntil: null,
    ...overrides,
  };
}

function site(id: string, ownerId: string): SiteRecord {
  const now = new Date().toISOString();
  return {
    id,
    ownerId,
    guestId: null,
    spec: fixtures["joes-plumbing"],
    publishedSpec: null,
    status: "draft",
    slug: null,
    customDomain: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function deps(target: ClientAccount | null, targetIsAdmin = false) {
  const calls: string[] = [];
  const fake: DeleteTestAccountDeps = {
    getAccount: async (id) => (target && target.id === id ? target : null),
    isAdmin: async () => targetIsAdmin,
    listSites: async (ownerId) => [site("site-1", ownerId), site("site-2", ownerId)],
    deleteSite: vi.fn(async (s: SiteRecord) => {
      calls.push(`site:${s.id}`);
      return true;
    }),
    deleteAuthUser: vi.fn(async (id: string) => {
      calls.push(`user:${id}`);
    }),
  };
  return { fake, calls };
}

describe("test account deletion guard", () => {
  it("only allows test accounts that are not admins and not yourself", () => {
    const opts = { targetIsAdmin: false, actorId: ADMIN_ID };
    expect(testAccountDeleteBlocker(account(), opts)).toBeNull();
    expect(testAccountDeleteBlocker(account({ testAccount: false }), opts)).toMatch(/only test/i);
    expect(testAccountDeleteBlocker(account(), { ...opts, targetIsAdmin: true })).toMatch(/admin/i);
    expect(testAccountDeleteBlocker(account({ id: ADMIN_ID }), opts)).toMatch(/your own/i);
    expect(testAccountDeleteBlocker(null, opts)).toMatch(/not found/i);
  });

  it("refuses real accounts without deleting anything", async () => {
    const real = account({ testAccount: false, email: "owner@joesplumbing.com" });
    const { fake, calls } = deps(real);
    expect(await deleteTestAccount(real.id, ADMIN_ID, fake)).toEqual({
      ok: false,
      error: "Only test accounts can be deleted here.",
    });
    expect(calls).toEqual([]);
  });

  it("refuses admin accounts, even marked as test, without deleting anything", async () => {
    const target = account();
    const { fake, calls } = deps(target, true);
    const result = await deleteTestAccount(target.id, ADMIN_ID, fake);
    expect(result.ok).toBe(false);
    expect(calls).toEqual([]);
  });

  it("refuses unknown accounts and the admin's own account", async () => {
    const own = account({ id: ADMIN_ID });
    const { fake, calls } = deps(own);
    expect((await deleteTestAccount(ADMIN_ID, ADMIN_ID, fake)).ok).toBe(false);
    expect((await deleteTestAccount("missing", ADMIN_ID, fake)).ok).toBe(false);
    expect(calls).toEqual([]);
  });

  it("deletes the sites first (releasing domains) and then the account", async () => {
    const target = account();
    const { fake, calls } = deps(target);
    expect(await deleteTestAccount(target.id, ADMIN_ID, fake)).toEqual({
      ok: true,
      email: target.email,
      sitesDeleted: 2,
    });
    expect(calls).toEqual(["site:site-1", "site:site-2", `user:${target.id}`]);
  });
});

describe("account deletion (customer request)", () => {
  it("never deletes admins or yourself, and asks for the email of a real account", () => {
    const opts = { targetIsAdmin: false, actorId: ADMIN_ID };
    const real = account({ testAccount: false, email: "Owner@JoesPlumbing.com" });
    expect(accountDeleteBlocker(account(), opts)).toBeNull();
    expect(accountDeleteBlocker(real, opts)).toMatch(/email/i);
    expect(accountDeleteBlocker(real, { ...opts, confirmEmail: "someone@else.com" })).toMatch(
      /email/i,
    );
    expect(
      accountDeleteBlocker(real, { ...opts, confirmEmail: " owner@joesplumbing.com " }),
    ).toBeNull();
    expect(
      accountDeleteBlocker(real, { ...opts, targetIsAdmin: true, confirmEmail: real.email }),
    ).toMatch(/admin/i);
    expect(accountDeleteBlocker(account({ id: ADMIN_ID }), opts)).toMatch(/your own/i);
  });

  it("deletes a real account (sites first) once the email is confirmed", async () => {
    const real = account({ testAccount: false, email: "owner@joesplumbing.com" });
    const { fake, calls } = deps(real);
    expect((await deleteAccount(real.id, ADMIN_ID, {}, fake)).ok).toBe(false);
    expect(calls).toEqual([]);
    expect(
      await deleteAccount(real.id, ADMIN_ID, { confirmEmail: "owner@joesplumbing.com" }, fake),
    ).toEqual({ ok: true, email: real.email, sitesDeleted: 2 });
    expect(calls).toEqual(["site:site-1", "site:site-2", `user:${real.id}`]);
  });

  it("refuses while a card subscription is still active", async () => {
    const real = account({ testAccount: false, email: "owner@joesplumbing.com" });
    const { fake, calls } = deps(real);
    const result = await deleteAccount(
      real.id,
      ADMIN_ID,
      { confirmEmail: real.email },
      { ...fake, hasActiveSubscription: async () => true },
    );
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/Stripe/) });
    expect(calls).toEqual([]);
  });
});

describe("test account details", () => {
  it("generates strong passwords that pass the sign-up rules", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const password = generatePassword();
      expect(password).toHaveLength(20);
      expect(passwordProblems(password)).toEqual([]);
      seen.add(password);
    }
    expect(seen.size).toBe(50);
  });

  it("uses a test+random address on the No Sweat domain", () => {
    expect(testAccountEmail()).toMatch(/^test\+[a-z0-9]{6}@nosweatfd\.com$/);
  });

  it("has a complete profile (no /welcome step) and is marked as a test account", () => {
    const metadata = testAccountUserMetadata(3, ADMIN_ID, new Date("2026-10-16T12:00:00Z"));
    expect(hasCompleteProfile(metadata)).toBe(true);
    expect(metadata).toMatchObject({
      first_name: "Test",
      last_name: "Client 3",
      full_name: "Test Client 3",
      marketing_opt_in: false,
      test_account: true,
      terms_accepted_at: "2026-10-16T12:00:00.000Z",
    });
    expect(testAccountAppMetadata(ADMIN_ID)).toEqual({
      test_account: true,
      created_by_admin: ADMIN_ID,
    });
  });
});
