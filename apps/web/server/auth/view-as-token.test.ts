import { describe, expect, it, vi } from "vitest";
import {
  VIEW_AS_TTL_SECONDS,
  isWriteBlockedWhileViewing,
  resolveViewer,
  signViewAsToken,
  verifyViewAsToken,
} from "./view-as-token";

const SECRET = "test-secret";
const ADMIN = "0b6a1f5e-2c3d-4e5f-8a9b-1c2d3e4f5a6b";
const TARGET = "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b";
const NOW = Date.UTC(2026, 9, 16, 12, 0, 0);

const sign = (now = NOW) => signViewAsToken(ADMIN, TARGET, { secret: SECRET, now });

describe("view-as cookie (HMAC)", () => {
  it("is valid for the admin who asked, until it expires", async () => {
    const token = await sign();
    expect(token.startsWith(`${TARGET}.`)).toBe(true);
    expect(await verifyViewAsToken(token, ADMIN, { secret: SECRET, now: NOW })).toBe(TARGET);
    // 1 segundo antes de vencer ainda vale; depois de vencer, não.
    const almost = NOW + (VIEW_AS_TTL_SECONDS - 1) * 1000;
    expect(await verifyViewAsToken(token, ADMIN, { secret: SECRET, now: almost })).toBe(TARGET);
  });

  it("refuses an expired cookie", async () => {
    const token = await sign();
    const later = NOW + (VIEW_AS_TTL_SECONDS + 1) * 1000;
    expect(await verifyViewAsToken(token, ADMIN, { secret: SECRET, now: later })).toBeNull();
  });

  it("refuses a tampered cookie (other account, other expiry, other signature)", async () => {
    const token = await sign();
    const [target, expiry, signature] = token.split(".") as [string, string, string];
    const otherTarget = "aaaaaaaa-4d5e-4f60-8a9b-0c1d2e3f4a5b";
    // Troca o PRIMEIRO caractere (o último tem bits de sobra que o base64 ignora).
    const flipped = `${signature.startsWith("A") ? "B" : "A"}${signature.slice(1)}`;
    const tampered = [
      `${otherTarget}.${expiry}.${signature}`,
      `${target}.${Number(expiry) + 60}.${signature}`,
      `${target}.${expiry}.${flipped}`,
      `${target}.${expiry}`,
      `${target}.${expiry}.${signature}.extra`,
      `${target}.soon.${signature}`,
      "",
    ];
    for (const value of tampered) {
      expect(await verifyViewAsToken(value, ADMIN, { secret: SECRET, now: NOW })).toBeNull();
    }
  });

  it("is bound to the admin and to the server secret", async () => {
    const token = await sign();
    const otherUser = "11111111-2222-4333-8444-555555555555";
    expect(await verifyViewAsToken(token, otherUser, { secret: SECRET, now: NOW })).toBeNull();
    expect(await verifyViewAsToken(token, ADMIN, { secret: "other", now: NOW })).toBeNull();
  });

  it("does not sign an invalid account id", async () => {
    await expect(signViewAsToken(ADMIN, "../etc", { secret: SECRET })).rejects.toThrow();
  });
});

describe("resolveViewer", () => {
  const admin = { id: ADMIN, email: "felipe@nosweatfd.com" };
  const target = { id: TARGET, email: "test+abc123@nosweatfd.com" };

  it("shows the viewed account to an admin with a valid cookie", async () => {
    const viewer = await resolveViewer({
      user: admin,
      token: await sign(),
      isAdmin: async () => true,
      findAccount: async (id) => (id === TARGET ? target : null),
      secret: SECRET,
      now: NOW,
    });
    expect(viewer).toEqual({ user: admin, ownerId: TARGET, viewingAs: target });
  });

  it("ignores the cookie when the user is not an admin", async () => {
    const isAdmin = vi.fn(async () => false);
    const findAccount = vi.fn(async () => target);
    const viewer = await resolveViewer({
      user: admin,
      token: await sign(),
      isAdmin,
      findAccount,
      secret: SECRET,
      now: NOW,
    });
    expect(viewer).toEqual({ user: admin, ownerId: ADMIN, viewingAs: null });
    expect(findAccount).not.toHaveBeenCalled();
  });

  it("ignores missing, expired or foreign cookies and accounts that no longer exist", async () => {
    const base = {
      user: admin,
      isAdmin: async () => true,
      findAccount: async () => target,
      secret: SECRET,
      now: NOW,
    };
    const self = { user: admin, ownerId: ADMIN, viewingAs: null };
    expect(await resolveViewer({ ...base, token: null })).toEqual(self);
    expect(
      await resolveViewer({ ...base, token: await sign(), now: NOW + 2 * 60 * 60 * 1000 }),
    ).toEqual(self);
    const foreign = await signViewAsToken("someone-else", TARGET, { secret: SECRET, now: NOW });
    expect(await resolveViewer({ ...base, token: foreign })).toEqual(self);
    expect(
      await resolveViewer({ ...base, token: await sign(), findAccount: async () => null }),
    ).toEqual(self);
  });
});

describe("isWriteBlockedWhileViewing", () => {
  it("blocks writes to the API and lets reads through", () => {
    expect(isWriteBlockedWhileViewing("POST", "/api/sites/generate")).toBe(true);
    expect(isWriteBlockedWhileViewing("PATCH", "/api/sites/abc")).toBe(true);
    expect(isWriteBlockedWhileViewing("delete", "/api/clients/abc")).toBe(true);
    expect(isWriteBlockedWhileViewing("GET", "/api/sites/abc")).toBe(false);
    expect(isWriteBlockedWhileViewing("HEAD", "/api/social/state")).toBe(false);
  });

  it("leaves pages (Server Actions, like Exit) and public endpoints alone", () => {
    expect(isWriteBlockedWhileViewing("POST", "/dashboard")).toBe(false);
    expect(isWriteBlockedWhileViewing("POST", "/api/sites/abc/leads")).toBe(false);
    expect(isWriteBlockedWhileViewing("POST", "/api/unsubscribe")).toBe(false);
    expect(isWriteBlockedWhileViewing("POST", "/api/billing/webhook")).toBe(false);
    expect(isWriteBlockedWhileViewing("POST", "/api/billing/checkout")).toBe(true);
  });
});
