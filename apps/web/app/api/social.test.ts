import { fixtures } from "@nosweat/fixtures";
import {
  ApiError,
  PlanMonthResponse,
  SocialPostResponse,
  SocialPostsResponse,
  SocialStateResponse,
  UploadSocialMediaResponse,
} from "@nosweat/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { DEV_USER } from "@/server/auth/session";
import { connectInstagramAccount } from "@/server/social/accounts";
import { getInstagramClient } from "@/server/social/config";
import { getSocialStore, resetMemorySocialStore } from "@/server/social/store";
import { getSiteStore } from "@/server/store";
import { POST as caption } from "./social/caption/route";
import { POST as uploadMedia } from "./social/media/route";
import { POST as planMonth } from "./social/plan/route";
import { POST as approve } from "./social/posts/approve/route";
import { POST as markPosted } from "./social/posts/[id]/mark-posted/route";
import { POST as publishNow } from "./social/posts/[id]/publish-now/route";
import {
  DELETE as deletePost,
  GET as getPost,
  PATCH as patchPost,
} from "./social/posts/[id]/route";
import { GET as listPosts, POST as createPost } from "./social/posts/route";
import { PATCH as patchSettings } from "./social/settings/route";
import { GET as getState } from "./social/state/route";

// Sem Supabase e sem chaves: o usuário é o DEV_USER, o Instagram é o cliente de mentira e a IA é
// o MockPostPlanner. O fluxo inteiro roda em memória.

const BASE = "http://localhost/api/social";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const inFuture = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

function jsonRequest(path: string, method: string, body: unknown): Request {
  return new Request(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** JPEG mínimo com o cabeçalho SOF0 (só o que o servidor lê: tipo e tamanho). */
function fakeJpeg(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(64);
  bytes.set([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08]);
  bytes.set([height >> 8, height & 0xff, width >> 8, width & 0xff], 7);
  return bytes;
}

async function upload(width = 1080, height = 1350) {
  const form = new FormData();
  form.set(
    "file",
    new File([fakeJpeg(width, height) as BlobPart], "photo.jpg", { type: "image/jpeg" }),
  );
  return uploadMedia(new Request(`${BASE}/media`, { method: "POST", body: form }));
}

async function newDraft(hoursAhead = 48) {
  const media = UploadSocialMediaResponse.parse(await (await upload()).json()).media;
  const res = await createPost(
    jsonRequest("/posts", "POST", {
      caption: "Fresh, spotless kitchens all week in Austin.",
      media: [media],
      scheduledAt: inFuture(hoursAhead),
    }),
  );
  expect(res.status).toBe(201);
  return SocialPostResponse.parse(await res.json()).post;
}

beforeEach(() => {
  resetMemorySocialStore();
});

describe("/api/social", () => {
  it("returns the state for a new owner", async () => {
    const res = await getState();
    expect(res.status).toBe(200);
    const state = SocialStateResponse.parse(await res.json());
    expect(state.account).toBeNull();
    expect(state.capability).toMatchObject({ configured: true, publishMode: "auto" });
    expect(state.usage).toEqual({ used: 0, cap: null });
  });

  it("accepts only JPEG photos in the Instagram ratio", async () => {
    expect((await upload(1080, 1350)).status).toBe(201);
    const tooTall = await upload(1080, 2000);
    expect(tooTall.status).toBe(400);
    expect(ApiError.parse(await tooTall.json()).error.message).toMatch(/4:5/);
  });

  it("keeps posts approved for manual posting until Instagram is connected", async () => {
    const draft = await newDraft();
    expect(draft.status).toBe("draft");

    const res = await approve(jsonRequest("/posts/approve", "POST", { ids: [draft.id] }));
    expect(res.status).toBe(200);
    const [approved] = SocialPostsResponse.parse(await res.json()).posts;
    expect(approved?.status).toBe("approved");

    const posted = await markPosted(new Request(`${BASE}/x`, { method: "POST" }), ctx(draft.id));
    expect(SocialPostResponse.parse(await posted.json()).post.status).toBe("manual_published");
  });

  it("queues approved posts and publishes now once Instagram is connected", async () => {
    const client = getInstagramClient();
    if (!client) throw new Error("mock client expected");
    await connectInstagramAccount({ user: DEV_USER, client, code: "test" });
    const state = SocialStateResponse.parse(await (await getState()).json());
    expect(state.account?.username).toBe("nosweat_demo");

    const queued = await newDraft();
    const approved = await approve(jsonRequest("/posts/approve", "POST", { ids: [queued.id] }));
    expect(SocialPostsResponse.parse(await approved.json()).posts[0]?.status).toBe("scheduled");

    const now = await newDraft();
    const res = await publishNow(new Request(`${BASE}/x`, { method: "POST" }), ctx(now.id));
    expect(res.status).toBe(200);
    // Fora de um request do Next o publicador roda na hora, sem esperar a resposta.
    let after = SocialPostResponse.parse(
      await (await getPost(new Request(BASE), ctx(now.id))).json(),
    );
    for (let i = 0; i < 40 && after.post.status !== "published"; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      after = SocialPostResponse.parse(
        await (await getPost(new Request(BASE), ctx(now.id))).json(),
      );
    }
    expect(after.post.status).toBe("published");
    expect(after.post.permalink).toMatch(/instagram\.com/);
  });

  it("refuses to approve a post without a photo or with a past date", async () => {
    const noPhoto = SocialPostResponse.parse(
      await (
        await createPost(jsonRequest("/posts", "POST", { caption: "Hi", scheduledAt: inFuture(5) }))
      ).json(),
    ).post;
    const res = await approve(jsonRequest("/posts/approve", "POST", { ids: [noPhoto.id] }));
    expect(res.status).toBe(400);

    const draft = await newDraft();
    await patchPost(
      jsonRequest("/x", "PATCH", { scheduledAt: new Date(Date.now() - 3_600_000).toISOString() }),
      ctx(draft.id),
    );
    expect((await approve(jsonRequest("/posts/approve", "POST", { ids: [draft.id] }))).status).toBe(
      400,
    );
  });

  it("hides other owners' posts", async () => {
    const other = await getSocialStore().createPost({
      ownerId: "someone-else",
      caption: "x",
      media: [],
    });
    expect((await getPost(new Request(BASE), ctx(other.id))).status).toBe(404);
    expect((await deletePost(new Request(BASE), ctx(other.id))).status).toBe(404);
    const list = SocialPostsResponse.parse(
      await (await listPosts(new Request(`${BASE}/posts`))).json(),
    );
    expect(list.posts.some((p) => p.id === other.id)).toBe(false);
  });

  it("fills the month with AI drafts from the owner's website", async () => {
    await getSiteStore().create(fixtures["joes-plumbing"], DEV_USER.id);
    const next = new Date();
    next.setUTCMonth(next.getUTCMonth() + 1, 1);
    const month = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
    const res = await planMonth(jsonRequest("/plan", "POST", { month, postsPerWeek: 3 }));
    expect(res.status).toBe(201);
    const { posts } = PlanMonthResponse.parse(await res.json());
    expect(posts.length).toBeGreaterThan(5);
    expect(posts.every((p) => p.status === "draft" && p.source === "ai")).toBe(true);

    const written = await caption(
      jsonRequest("/caption", "POST", { action: "write", idea: "Spring cleaning promo" }),
    );
    expect(written.status).toBe(200);
  });

  it("validates settings", async () => {
    const bad = await patchSettings(jsonRequest("/settings", "PATCH", { timezone: "Mars/Base" }));
    expect(bad.status).toBe(400);
    const ok = await patchSettings(
      jsonRequest("/settings", "PATCH", { timezone: "America/Chicago" }),
    );
    expect(ok.status).toBe(200);
  });
});
