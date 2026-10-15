import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as dataDeletion } from "@/app/api/meta/data-deletion/route";
import { POST as deauthorize } from "@/app/api/meta/deauthorize/route";
import {
  connectInstagramAccount,
  disconnectAccount,
  getDecryptedToken,
  SocialConnectError,
} from "./accounts";
import { MockInstagramClient } from "./instagram-mock";
import { getSocialStore, resetMemorySocialStore } from "./store";

const USER = { id: "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b", email: "joe@example.com" };
const OTHER = { id: "local-dev", email: "dev@localhost" };
const media = [
  {
    path: `${USER.id}/a.jpg`,
    url: "https://x.supabase.co/storage/v1/object/public/social-media/a.jpg",
    width: 1080,
    height: 1350,
    mime: "image/jpeg" as const,
  },
];

beforeEach(() => resetMemorySocialStore());
afterEach(() => vi.unstubAllEnvs());

async function connect(user = USER, client = new MockInstagramClient(), code = "mock") {
  return connectInstagramAccount({ user, client, code });
}

async function connectError(promise: Promise<unknown>): Promise<string | null> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error instanceof SocialConnectError ? error.code : "other";
  }
}

describe("connectInstagramAccount", () => {
  it("saves the account with an encrypted token", async () => {
    const account = await connect();
    expect(account.status).toBe("active");
    expect(account.username).toBe("nosweat_demo");
    expect(account.appScopedId).toBe("mock-app-scoped-1");
    expect(account.scopes).toContain("instagram_business_content_publish");
    expect(account.accessTokenEnc).not.toContain("mock-token");
    expect(getDecryptedToken(account)).toBe("mock-token-mock");
    expect(Date.parse(account.tokenExpiresAt ?? "")).toBeGreaterThan(Date.now() + 59 * 86_400_000);
  });

  it("reuses the same row on reconnect and the new token still decrypts", async () => {
    const first = await connect();
    await disconnectAccount(first, USER.id, "disconnect");
    const second = await connect(USER, new MockInstagramClient(), "again");
    expect(second.id).toBe(first.id);
    expect(second.status).toBe("active");
    expect(second.revokedAt).toBeNull();
    expect(getDecryptedToken(second)).toBe("mock-token-again");
  });

  it("refuses an Instagram account connected to another owner", async () => {
    await connect();
    expect(await connectError(connect(OTHER))).toBe("account_in_use");
  });

  it("requires the publish permission and a professional account", async () => {
    const noPublish = new MockInstagramClient({ scopes: ["instagram_business_basic"] });
    expect(await connectError(connect(USER, noPublish))).toBe("missing_permission");
    const personal = new MockInstagramClient({ profile: { accountType: "PERSONAL" } });
    expect(await connectError(connect(USER, personal))).toBe("not_business");
    expect(await getSocialStore().getAccountForOwner(USER.id, "instagram")).toBeNull();
  });

  it("puts future paused posts back in the queue and marks past ones missed", async () => {
    const store = getSocialStore();
    const account = await connect();
    const future = new Date(Date.now() + 2 * 86_400_000).toISOString();
    const past = new Date(Date.now() - 2 * 86_400_000).toISOString();
    const base = { ownerId: USER.id, caption: "Hi", media, accountId: account.id };
    const later = await store.createPost({ ...base, status: "scheduled", scheduledAt: future });
    const late = await store.createPost({ ...base, status: "scheduled", scheduledAt: past });
    const approved = await store.createPost({
      ownerId: USER.id,
      caption: "Hi",
      media,
      status: "approved",
      scheduledAt: future,
    });

    await disconnectAccount(account, USER.id, "disconnect");
    expect((await store.getPostById(later.id))?.status).toBe("paused");
    expect((await store.getPostById(late.id))?.status).toBe("paused");
    expect((await store.getAccount(account.id))?.accessTokenEnc).toBeNull();

    await connect();
    const resumed = await store.getPostById(later.id);
    expect(resumed?.status).toBe("scheduled");
    expect(resumed?.nextAttemptAt).toBe(future);
    expect((await store.getPostById(late.id))?.status).toBe("missed");
    // Com publicação automática (cliente de mentira), aprovados com data futura entram na fila.
    const queued = await store.getPostById(approved.id);
    expect(queued?.status).toBe("scheduled");
    expect(queued?.accountId).toBe(account.id);
  });
});

describe("Meta compliance callbacks", () => {
  const SECRET = "meta-app-secret";

  function signedRequest(userId: string, secret = SECRET): Request {
    const body = Buffer.from(JSON.stringify({ algorithm: "HMAC-SHA256", user_id: userId })).toString(
      "base64url",
    );
    const sig = createHmac("sha256", secret).update(body).digest("base64url");
    return new Request("https://nosweatfd.com/api/meta/x", {
      method: "POST",
      body: new URLSearchParams({ signed_request: `${sig}.${body}` }),
    });
  }

  it("deauthorize wipes the token and pauses posts", async () => {
    const account = await connect();
    vi.stubEnv("INSTAGRAM_APP_ID", "app");
    vi.stubEnv("INSTAGRAM_APP_SECRET", SECRET);

    expect((await deauthorize(signedRequest("mock-app-scoped-1", "wrong"))).status).toBe(400);
    const res = await deauthorize(signedRequest("mock-app-scoped-1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const stored = await getSocialStore().getAccount(account.id);
    expect(stored?.status).toBe("revoked");
    expect(stored?.accessTokenEnc).toBeNull();
  });

  it("data deletion removes the account and returns the confirmation", async () => {
    const store = getSocialStore();
    const account = await connect();
    const post = await store.createPost({
      ownerId: USER.id,
      caption: "Hi",
      media,
      accountId: account.id,
    });
    vi.stubEnv("INSTAGRAM_APP_ID", "app");
    vi.stubEnv("INSTAGRAM_APP_SECRET", SECRET);

    expect((await dataDeletion(signedRequest("mock-app-scoped-1", "wrong"))).status).toBe(400);
    const res = await dataDeletion(signedRequest("mock-app-scoped-1"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { url: string; confirmation_code: string };
    expect(body.url).toBe(`https://nosweatfd.com/data-deletion?code=${body.confirmation_code}`);
    expect(await store.getAccount(account.id)).toBeNull();
    expect(await store.getPostById(post.id)).toBeNull();
    expect((await store.getDeletionRequest(body.confirmation_code))?.status).toBe("completed");
  });
});
