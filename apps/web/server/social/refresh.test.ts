import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { InstagramError, type InstagramClient } from "./client";
import { decryptToken, encryptToken, tokenAad } from "./crypto";
import { refreshExpiringTokens, type RefreshDeps } from "./refresh";
import { MemorySocialStore, resetMemorySocialStore } from "./store";
import type { SocialAccountRecord } from "./types";

vi.mock("./config", () => ({ getInstagramClient: () => null }));
vi.mock("./accounts", () => ({
  getDecryptedToken: () => "token",
  pauseAccountPosts: async () => 0,
}));

const OWNER = "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b";
const DAY = 86_400_000;
const aad = (externalId: string) => tokenAad(OWNER, "instagram", externalId);
const KEY_V1 = `v1:${Buffer.alloc(32, 1).toString("base64")}`;
const KEY_V2 = `v2:${Buffer.alloc(32, 2).toString("base64")}`;

let store: MemorySocialStore;
beforeEach(() => {
  resetMemorySocialStore();
  store = new MemorySocialStore();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

async function addAccount(
  externalId: string,
  options: { expiresInDays: number; refreshedDaysAgo: number },
): Promise<SocialAccountRecord> {
  const now = Date.now();
  const enc = encryptToken(`token-${externalId}`, aad(externalId));
  return store.insertAccount({
    id: `acc-${externalId}`,
    ownerId: OWNER,
    provider: "instagram",
    externalId,
    appScopedId: null,
    username: externalId,
    accountType: "BUSINESS",
    avatarUrl: null,
    accessTokenEnc: enc.value,
    tokenKeyVersion: enc.version,
    tokenExpiresAt: new Date(now + options.expiresInDays * DAY).toISOString(),
    tokenRefreshedAt: new Date(now - options.refreshedDaysAgo * DAY).toISOString(),
    scopes: [],
    status: "active",
    lastError: null,
    revokedAt: null,
  });
}

function fakeClient() {
  return {
    mode: "mock" as const,
    authorizeUrl: vi.fn(() => "https://example.com"),
    exchangeCode: vi.fn(),
    refresh: vi.fn<InstagramClient["refresh"]>(async (token) => ({
      accessToken: `${token}-new`,
      expiresIn: 60 * 86_400,
    })),
    getProfile: vi.fn(),
    createImageContainer: vi.fn(),
    createCarouselContainer: vi.fn(),
    getContainerStatus: vi.fn(),
    publish: vi.fn(),
    getMedia: vi.fn(),
    getPublishingUsage: vi.fn(),
  } satisfies InstagramClient;
}

function deps(client: InstagramClient): RefreshDeps & {
  sendReconnectEmail: Mock<(ownerId: string) => Promise<void>>;
} {
  return {
    client,
    store,
    getToken: (account) => decryptToken(account.accessTokenEnc ?? "", aad(account.externalId)),
    pauseAccountPosts: async (ownerId, accountId, reason) =>
      (
        await store.updateOwnerPosts(
          ownerId,
          ["scheduled", "needs_check"],
          { status: "paused", lastError: reason },
          accountId,
        )
      ).length,
    sendReconnectEmail: vi.fn<(ownerId: string) => Promise<void>>(async () => {}),
  };
}

describe("refreshExpiringTokens", () => {
  it("refreshes tokens close to expiry and skips the others", async () => {
    const due = await addAccount("due", { expiresInDays: 5, refreshedDaysAgo: 55 });
    await addAccount("fresh", { expiresInDays: 5, refreshedDaysAgo: 0.5 });
    await addAccount("far", { expiresInDays: 40, refreshedDaysAgo: 20 });
    const client = fakeClient();

    const summary = await refreshExpiringTokens({}, deps(client));

    expect(summary).toMatchObject({ refreshed: 1, needsReconnect: 0, failed: 0 });
    expect(client.refresh).toHaveBeenCalledTimes(1);
    expect(client.refresh).toHaveBeenCalledWith("token-due");
    const saved = await store.getAccount(due.id);
    expect(decryptToken(saved?.accessTokenEnc ?? "", aad("due"))).toBe("token-due-new");
    expect(Date.parse(saved?.tokenExpiresAt ?? "")).toBeGreaterThan(Date.now() + 59 * DAY);
    expect(Date.parse(saved?.tokenRefreshedAt ?? "")).toBeGreaterThan(Date.now() - 60_000);
    expect(await store.countEventsSince(OWNER, "token_refresh", new Date(0).toISOString())).toBe(1);
  });

  it("asks to reconnect and pauses posts when Instagram refuses the token", async () => {
    const account = await addAccount("bad", { expiresInDays: 2, refreshedDaysAgo: 58 });
    const future = new Date(Date.now() + 3 * DAY).toISOString();
    const post = await store.createPost({
      ownerId: OWNER,
      accountId: account.id,
      caption: "Hi",
      media: [],
      status: "scheduled",
      scheduledAt: future,
      nextAttemptAt: future,
    });
    const client = fakeClient();
    client.refresh.mockRejectedValueOnce(new InstagramError("Session expired", "auth", 190));
    const d = deps(client);

    const summary = await refreshExpiringTokens({}, d);

    expect(summary.needsReconnect).toBe(1);
    expect(await store.getAccount(account.id)).toMatchObject({
      status: "needs_reconnect",
      accessTokenEnc: null,
    });
    expect((await store.getPostById(post.id))?.status).toBe("paused");
    expect(d.sendReconnectEmail).toHaveBeenCalledWith(OWNER);
  });

  it("keeps the account on a temporary error", async () => {
    const account = await addAccount("flaky", { expiresInDays: 2, refreshedDaysAgo: 58 });
    const client = fakeClient();
    client.refresh.mockRejectedValueOnce(new InstagramError("Timeout", "transient"));

    const summary = await refreshExpiringTokens({}, deps(client));

    expect(summary.failed).toBe(1);
    expect((await store.getAccount(account.id))?.status).toBe("active");
  });

  it("re-encrypts tokens saved with an old key", async () => {
    vi.stubEnv("SOCIAL_TOKEN_KEYS", KEY_V1);
    const account = await addAccount("old", { expiresInDays: 50, refreshedDaysAgo: 10 });
    expect(account.tokenKeyVersion).toBe("v1");
    vi.stubEnv("SOCIAL_TOKEN_KEYS", `${KEY_V2},${KEY_V1}`);
    const client = fakeClient();

    const summary = await refreshExpiringTokens({}, deps(client));

    expect(summary.rekeyed).toBe(1);
    expect(client.refresh).not.toHaveBeenCalled();
    const saved = await store.getAccount(account.id);
    expect(saved?.tokenKeyVersion).toBe("v2");
    vi.stubEnv("SOCIAL_TOKEN_KEYS", KEY_V2);
    expect(decryptToken(saved?.accessTokenEnc ?? "", aad("old"))).toBe("token-old");
  });

  it("does nothing without an Instagram client", async () => {
    await addAccount("due", { expiresInDays: 5, refreshedDaysAgo: 55 });
    expect((await refreshExpiringTokens({}, { client: null, store })).checked).toBe(0);
  });
});
