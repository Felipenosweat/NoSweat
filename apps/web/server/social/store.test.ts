import { beforeEach, describe, expect, it } from "vitest";
import { MemorySocialStore, resetMemorySocialStore } from "./store";

const OWNER = "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b";
const media = [
  {
    path: `${OWNER}/a.jpg`,
    url: "https://x.supabase.co/storage/v1/object/public/social-media/a.jpg",
    width: 1080,
    height: 1350,
    mime: "image/jpeg" as const,
  },
];

let store: MemorySocialStore;
beforeEach(() => {
  resetMemorySocialStore();
  store = new MemorySocialStore();
});

describe("MemorySocialStore", () => {
  it("only lets one worker claim a due post", async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const post = await store.createPost({
      ownerId: OWNER,
      caption: "Hi",
      media,
      status: "scheduled",
      approvedAt: past,
      scheduledAt: past,
      nextAttemptAt: past,
    });
    const [first, second] = await Promise.all([store.claimDue(10), store.claimDue(10)]);
    expect([...first, ...second].map((p) => p.id)).toEqual([post.id]);
    expect(await store.claimPost(post.id)).toBeNull();
    expect((await store.getPostById(post.id))?.status).toBe("publishing");
  });

  it("changes state only from the expected status", async () => {
    const post = await store.createPost({ ownerId: OWNER, caption: "Hi", media });
    expect(await store.updatePost(post.id, { status: "failed" }, ["scheduled"])).toBeNull();
    expect((await store.updatePost(post.id, { caption: "New" }, ["draft"]))?.caption).toBe("New");
  });

  it("counts approved posts in the month and hides other owners' posts", async () => {
    const inMonth = "2026-11-10T15:00:00.000Z";
    await store.createPost({
      ownerId: OWNER,
      caption: "a",
      media,
      status: "approved",
      approvedAt: inMonth,
      scheduledAt: inMonth,
    });
    await store.createPost({
      ownerId: OWNER,
      caption: "b",
      media,
      status: "draft",
      scheduledAt: inMonth,
    });
    const other = await store.createPost({ ownerId: "other-owner", caption: "c", media });
    expect(
      await store.countCountedInRange(
        OWNER,
        "2026-11-01T00:00:00.000Z",
        "2026-12-01T00:00:00.000Z",
      ),
    ).toBe(1);
    expect(await store.getPost(OWNER, other.id)).toBeNull();
    expect(
      await store.listPosts(OWNER, "2026-11-01T00:00:00.000Z", "2026-12-01T00:00:00.000Z"),
    ).toHaveLength(2);
  });

  it("returns default settings until the owner saves some", async () => {
    expect(await store.getSettings(OWNER)).toMatchObject({
      timezone: "America/New_York",
      tester: false,
    });
    await store.upsertSettings(OWNER, { timezone: "America/Chicago" });
    expect((await store.getSettings(OWNER)).timezone).toBe("America/Chicago");
  });
});
