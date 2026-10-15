import { beforeEach, describe, expect, it, vi } from "vitest";
import { InstagramError, type ContainerStatus, type InstagramClient } from "./client";
import { MISSED_MESSAGE, PLAN_MESSAGE, publishDuePosts, publishOne } from "./publisher";
import { MemorySocialStore, resetMemorySocialStore } from "./store";
import type { SocialAccountRecord } from "./types";

// Os módulos vizinhos entram por injeção (deps); aqui só evitamos carregar os de verdade.
vi.mock("@/server/billing", () => ({ ownerHasSocialAccess: async () => true }));
vi.mock("./config", () => ({ getInstagramClient: () => null }));
vi.mock("./accounts", () => ({
  getDecryptedToken: () => "token",
  pauseAccountPosts: async () => 0,
}));

const OWNER = "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b";
const photo = (name: string) => ({
  path: `${OWNER}/${name}.jpg`,
  url: `https://x.supabase.co/storage/v1/object/public/social-media/${name}.jpg`,
  width: 1080,
  height: 1350,
  mime: "image/jpeg" as const,
});

function fakeClient(statuses: ContainerStatus[] = ["FINISHED"]) {
  let containers = 0;
  const queue = [...statuses];
  const client = {
    mode: "mock" as const,
    authorizeUrl: vi.fn(() => "https://example.com"),
    exchangeCode: vi.fn(),
    refresh: vi.fn(),
    getProfile: vi.fn(),
    createImageContainer: vi.fn(async () => `c${++containers}`),
    createCarouselContainer: vi.fn(async () => "carousel"),
    getContainerStatus: vi.fn(async (): Promise<ContainerStatus> => queue.shift() ?? "FINISHED"),
    publish: vi.fn(async () => "media-1"),
    getMedia: vi.fn(async (_t: string, id: string) => ({
      id,
      permalink: "https://instagram.com/p/x",
    })),
    getPublishingUsage: vi.fn(async () => 0),
  } satisfies InstagramClient;
  return client;
}

let store: MemorySocialStore;
let account: SocialAccountRecord;

beforeEach(async () => {
  resetMemorySocialStore();
  store = new MemorySocialStore();
  account = await store.insertAccount({
    id: "acc-1",
    ownerId: OWNER,
    provider: "instagram",
    externalId: "ig-1",
    appScopedId: "app-1",
    username: "joes",
    accountType: "BUSINESS",
    avatarUrl: null,
    accessTokenEnc: "enc",
    tokenKeyVersion: "dev",
    tokenExpiresAt: new Date(Date.now() + 50 * 86_400_000).toISOString(),
    tokenRefreshedAt: new Date().toISOString(),
    scopes: [],
    status: "active",
    lastError: null,
    revokedAt: null,
  });
});

async function duePost(options: { photos?: number; minutesAgo?: number } = {}) {
  const at = new Date(Date.now() - (options.minutesAgo ?? 1) * 60_000).toISOString();
  return store.createPost({
    ownerId: OWNER,
    accountId: account.id,
    caption: "Spring cleaning special",
    media: Array.from({ length: options.photos ?? 1 }, (_, i) => photo(`p${i}`)),
    status: "scheduled",
    scheduledAt: at,
    nextAttemptAt: at,
    approvedAt: at,
  });
}

function deps(client: InstagramClient, extra: Record<string, unknown> = {}) {
  return {
    client,
    store,
    sleep: async () => {},
    hasSocialAccess: async () => true,
    getToken: () => "token",
    pauseAccountPosts: async (ownerId: string, accountId: string, reason: string) =>
      (await store.updateOwnerPosts(ownerId, ["scheduled", "needs_check"], {
        status: "paused",
        lastError: reason,
      }, accountId)).length,
    sendPostFailedEmail: vi.fn(async () => {}),
    sendReconnectEmail: vi.fn(async () => {}),
    ...extra,
  };
}

describe("publishDuePosts", () => {
  it("publishes a single photo post", async () => {
    const post = await duePost();
    const client = fakeClient();
    const summary = await publishDuePosts({}, deps(client));
    expect(summary).toMatchObject({ claimed: 1, published: 1 });
    expect(client.createImageContainer).toHaveBeenCalledWith("token", "ig-1", {
      imageUrl: post.media[0]?.url,
      caption: post.caption,
    });
    const saved = await store.getPostById(post.id);
    expect(saved).toMatchObject({
      status: "published",
      igContainerId: "c1",
      igMediaId: "media-1",
      permalink: "https://instagram.com/p/x",
      lastError: null,
      lockedAt: null,
      attempts: 1,
    });
    expect(saved?.publishedAt).not.toBeNull();
  });

  it("publishes a carousel from child containers", async () => {
    const post = await duePost({ photos: 3 });
    const client = fakeClient();
    await publishDuePosts({}, deps(client));
    expect(client.createImageContainer).toHaveBeenCalledTimes(3);
    expect(client.createImageContainer.mock.calls.every((c) => c[2].isCarouselItem)).toBe(true);
    expect(client.createCarouselContainer).toHaveBeenCalledWith("token", "ig-1", {
      children: ["c1", "c2", "c3"],
      caption: post.caption,
    });
    expect(client.publish).toHaveBeenCalledWith("token", "ig-1", "carousel");
    expect((await store.getPostById(post.id))?.status).toBe("published");
  });

  it("never publishes twice: a container already PUBLISHED is just marked published", async () => {
    const post = await duePost();
    await store.updatePost(post.id, { status: "needs_check", igContainerId: "old" });
    const client = fakeClient(["PUBLISHED"]);
    const summary = await publishDuePosts({}, deps(client));
    expect(summary.published).toBe(1);
    expect(client.publish).not.toHaveBeenCalled();
    expect(client.createImageContainer).not.toHaveBeenCalled();
    expect(await store.getPostById(post.id)).toMatchObject({
      status: "published",
      igMediaId: null,
      igContainerId: "old",
    });
  });

  it("publishes a FINISHED container without creating a new one", async () => {
    const post = await duePost();
    await store.updatePost(post.id, { status: "needs_check", igContainerId: "old" });
    const client = fakeClient(["FINISHED"]);
    await publishDuePosts({}, deps(client));
    expect(client.createImageContainer).not.toHaveBeenCalled();
    expect(client.publish).toHaveBeenCalledWith("token", "ig-1", "old");
    expect((await store.getPostById(post.id))?.status).toBe("published");
  });

  it("recreates an expired container", async () => {
    const post = await duePost();
    await store.updatePost(post.id, { status: "needs_check", igContainerId: "old" });
    const client = fakeClient(["EXPIRED", "FINISHED"]);
    await publishDuePosts({}, deps(client));
    expect(client.createImageContainer).toHaveBeenCalledTimes(1);
    expect(client.publish).toHaveBeenCalledWith("token", "ig-1", "c1");
  });

  it("reschedules a container still IN_PROGRESS", async () => {
    const post = await duePost();
    await store.updatePost(post.id, { status: "needs_check", igContainerId: "old" });
    const client = fakeClient(["IN_PROGRESS"]);
    const summary = await publishDuePosts({}, deps(client));
    expect(summary.retried).toBe(1);
    expect(client.publish).not.toHaveBeenCalled();
    const saved = await store.getPostById(post.id);
    expect(saved).toMatchObject({ status: "scheduled", igContainerId: "old", attempts: 0 });
    expect(Date.parse(saved?.nextAttemptAt ?? "")).toBeGreaterThan(Date.now());
  });

  it("pauses posts and asks to reconnect on an auth error", async () => {
    const post = await duePost();
    const other = await store.createPost({
      ownerId: OWNER,
      accountId: account.id,
      caption: "Later",
      media: [photo("x")],
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
      nextAttemptAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
    const client = fakeClient();
    client.createImageContainer.mockRejectedValueOnce(
      new InstagramError("Invalid OAuth access token.", "auth", 190),
    );
    const d = deps(client);
    const summary = await publishDuePosts({}, d);
    expect(summary.paused).toBe(1);
    expect((await store.getPostById(post.id))?.status).toBe("paused");
    expect((await store.getPostById(other.id))?.status).toBe("paused");
    expect(await store.getAccount(account.id)).toMatchObject({
      status: "needs_reconnect",
      accessTokenEnc: null,
    });
    expect(d.sendReconnectEmail).toHaveBeenCalledTimes(1);
  });

  it("retries transient errors with backoff and fails after 5 attempts", async () => {
    const post = await duePost();
    const client = fakeClient();
    client.createImageContainer.mockRejectedValue(new InstagramError("Timeout", "transient"));
    const d = deps(client);

    await publishDuePosts({}, d);
    let saved = await store.getPostById(post.id);
    expect(saved).toMatchObject({ status: "scheduled", attempts: 1 });
    const wait = Date.parse(saved?.nextAttemptAt ?? "") - Date.now();
    expect(wait).toBeGreaterThan(50_000);
    expect(wait).toBeLessThanOrEqual(60_000);

    // Mais 4 tentativas (forçando a hora da próxima tentativa).
    for (let i = 0; i < 4; i++) {
      await store.updatePost(post.id, { nextAttemptAt: new Date(Date.now() - 1000).toISOString() });
      await publishDuePosts({}, d);
    }
    saved = await store.getPostById(post.id);
    expect(saved).toMatchObject({ status: "failed", attempts: 5 });
    expect(d.sendPostFailedEmail).toHaveBeenCalledTimes(1);
  });

  it("fails a post on a permanent error and emails the owner", async () => {
    const post = await duePost();
    const client = fakeClient();
    client.publish.mockRejectedValueOnce(new InstagramError("Bad image", "permanent"));
    const d = deps(client);
    expect((await publishDuePosts({}, d)).failed).toBe(1);
    expect((await store.getPostById(post.id))?.status).toBe("failed");
    expect(d.sendPostFailedEmail).toHaveBeenCalledWith(OWNER, post.id, expect.any(String));
  });

  it("marks a post missed when it is too late", async () => {
    const post = await duePost({ minutesAgo: 7 * 60 });
    const client = fakeClient();
    const summary = await publishDuePosts({}, deps(client));
    expect(summary.missed).toBe(1);
    expect(client.createImageContainer).not.toHaveBeenCalled();
    expect(await store.getPostById(post.id)).toMatchObject({
      status: "missed",
      lastError: MISSED_MESSAGE,
    });
  });

  it("pauses posts when the plan is not active", async () => {
    const post = await duePost();
    const client = fakeClient();
    const summary = await publishDuePosts({}, deps(client, { hasSocialAccess: async () => false }));
    expect(summary.paused).toBe(1);
    expect(client.createImageContainer).not.toHaveBeenCalled();
    expect(await store.getPostById(post.id)).toMatchObject({
      status: "paused",
      lastError: PLAN_MESSAGE,
    });
  });

  it("pauses posts when the account is not active", async () => {
    const post = await duePost();
    await store.updateAccount(account.id, { status: "needs_reconnect" });
    const summary = await publishDuePosts({}, deps(fakeClient()));
    expect(summary.paused).toBe(1);
    expect((await store.getPostById(post.id))?.status).toBe("paused");
  });

  it("respects the daily cap per account", async () => {
    vi.stubEnv("SOCIAL_DAILY_POST_CAP", "1");
    try {
      const done = await duePost();
      await store.updatePost(done.id, { status: "published", publishedAt: new Date().toISOString() });
      const post = await duePost();
      const client = fakeClient();
      const summary = await publishDuePosts({}, deps(client));
      expect(summary.retried).toBe(1);
      expect(client.createImageContainer).not.toHaveBeenCalled();
      expect((await store.getPostById(post.id))?.status).toBe("scheduled");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("does nothing without an Instagram client", async () => {
    const post = await duePost();
    const summary = await publishDuePosts({}, deps(fakeClient(), { client: null }));
    expect(summary.claimed).toBe(0);
    expect((await store.getPostById(post.id))?.status).toBe("scheduled");
  });
});

describe("publishOne", () => {
  it("publishes the claimed post", async () => {
    const post = await duePost();
    const client = fakeClient();
    await publishOne(post.id, deps(client));
    expect((await store.getPostById(post.id))?.status).toBe("published");
  });

  it("does nothing when the claim fails", async () => {
    const post = await duePost();
    await store.claimPost(post.id);
    const client = fakeClient();
    await publishOne(post.id, deps(client));
    expect(client.createImageContainer).not.toHaveBeenCalled();
    expect(client.getContainerStatus).not.toHaveBeenCalled();
    expect((await store.getPostById(post.id))?.status).toBe("publishing");
  });
});
