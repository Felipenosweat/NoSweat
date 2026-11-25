import { beforeEach, describe, expect, it } from "vitest";
import { errorResponse } from "../http";
import { runAutopilot, type AutopilotDeps } from "./autopilot";
import type { AutopilotDigest } from "./notify";
import type { PlanMonthResult } from "./plan";
import { MemorySocialStore, resetMemorySocialStore } from "./store";
import type { NewSocialPost } from "./types";

// Piloto automático com o store em memória e tudo de fora trocado (e-mail, plano, IA, relógio).

const OWNER = "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b";
const HOUR = 3_600_000;
// 25/11/2026 às 9 h em Nova York: dia 25 (planeja dezembro) e depois das 8 h (aviso do dia).
const NOW = new Date("2026-11-25T14:00:00.000Z");
const at = (hours: number) => new Date(NOW.getTime() + hours * HOUR).toISOString();
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
let digests: AutopilotDigest[];
let plans: string[];
let sendOk: boolean;
let planResult: () => PlanMonthResult;

function deps(now: Date, overrides: Partial<AutopilotDeps> = {}): AutopilotDeps {
  return {
    store,
    now: () => now,
    hasAutopilot: async () => true,
    ownerUser: async (ownerId) => ({ id: ownerId, email: "owner@example.com" }),
    canAutoPublish: async () => true,
    monthlyCap: async () => null,
    planMonth: async (_user, input) => {
      plans.push(input.month);
      return planResult();
    },
    sendDigest: async (ownerId, digest) => {
      expect(ownerId).toBe(OWNER);
      digests.push(digest);
      return sendOk;
    },
    ...overrides,
  };
}

function aiDraft(overrides: Partial<NewSocialPost> = {}) {
  return store.createPost({
    ownerId: OWNER,
    caption: "Spotless kitchens all week in Austin.",
    media,
    scheduledAt: at(20),
    source: "ai",
    status: "draft",
    ...overrides,
  });
}

beforeEach(async () => {
  resetMemorySocialStore();
  store = new MemorySocialStore();
  digests = [];
  plans = [];
  sendOk = true;
  planResult = () => ({ ok: true, posts: [] });
  await store.upsertSettings(OWNER, { autopilot: true, autopilotSince: at(-48) });
  await store.insertAccount({
    id: "0b6c7d8e-9f00-4a1b-8c2d-3e4f5a6b7c8d",
    ownerId: OWNER,
    provider: "instagram",
    externalId: "ig-1",
    appScopedId: null,
    username: "demo",
    accountType: "BUSINESS",
    avatarUrl: null,
    accessTokenEnc: "enc",
    tokenKeyVersion: "v1",
    tokenExpiresAt: null,
    tokenRefreshedAt: null,
    scopes: [],
    status: "active",
    lastError: null,
    revokedAt: null,
  });
});

describe("runAutopilot", () => {
  it("sends one notice a day, then approves the post close to its time", async () => {
    const post = await aiDraft();

    const first = await runAutopilot({}, deps(NOW));
    expect(first).toMatchObject({ digests: 1, noticed: 1, approved: 0 });
    expect(digests[0]?.goingOut).toHaveLength(1);
    expect((await store.getPostById(post.id))?.autopilotNoticeAt).toBe(NOW.toISOString());

    // Uma hora depois: nada de novo (um e-mail por dia).
    const later = await runAutopilot({}, deps(new Date(NOW.getTime() + HOUR)));
    expect(later).toMatchObject({ digests: 0, approved: 0 });

    // 1,5 h antes da hora (18,5 h depois do aviso): aprova e põe na fila.
    const approveAt = new Date(NOW.getTime() + 18.5 * HOUR);
    const run = await runAutopilot({}, deps(approveAt));
    expect(run.approved).toBe(1);
    const saved = await store.getPostById(post.id);
    expect(saved).toMatchObject({
      status: "scheduled",
      nextAttemptAt: post.scheduledAt,
      autoApprovedAt: approveAt.toISOString(),
      approvedBy: OWNER,
      igContainerId: null,
    });
  });

  it("never approves a post whose notice could not be sent", async () => {
    const post = await aiDraft();
    sendOk = false;
    expect((await runAutopilot({}, deps(NOW))).digests).toBe(0);
    expect((await store.getPostById(post.id))?.autopilotNoticeAt).toBeNull();
    const run = await runAutopilot({}, deps(new Date(NOW.getTime() + 18.5 * HOUR)));
    expect(run.approved).toBe(0);
    expect((await store.getPostById(post.id))?.status).toBe("draft");
  });

  it("leaves skipped, edited, manual, flagged and incomplete drafts for the owner", async () => {
    const skipped = await aiDraft();
    await store.updatePost(skipped.id, { autopilotSkip: true });
    const edited = await aiDraft();
    await store.updatePost(edited.id, { ownerEditedAt: at(-1) });
    await aiDraft({ source: "manual" });
    await aiDraft({ claimsFlagged: true });
    await aiDraft({ media: [] });

    const run = await runAutopilot({}, deps(NOW));
    expect(run.noticed).toBe(0);
    expect(digests).toHaveLength(0);
  });

  it("does not approve if the owner skips the post after the notice", async () => {
    const post = await aiDraft();
    await runAutopilot({}, deps(NOW));
    await store.updatePost(post.id, { autopilotSkip: true }, ["draft"]);
    const run = await runAutopilot({}, deps(new Date(NOW.getTime() + 18.5 * HOUR)));
    expect(run.approved).toBe(0);
    expect((await store.getPostById(post.id))?.status).toBe("draft");
  });

  it("never approves past posts and respects the monthly cap", async () => {
    const post = await aiDraft();
    await runAutopilot({}, deps(NOW));
    // Já passou da hora: segue as regras de "missed" do publicador.
    const late = await runAutopilot({}, deps(new Date(NOW.getTime() + 21 * HOUR)));
    expect(late.approved).toBe(0);

    // No limite do plano (1 por mês e um já aprovado): fica como rascunho.
    await store.createPost({
      ownerId: OWNER,
      caption: "Already approved",
      media,
      status: "approved",
      approvedAt: at(-1),
      scheduledAt: at(30),
    });
    const capped = await runAutopilot(
      {},
      deps(new Date(NOW.getTime() + 18.5 * HOUR), { monthlyCap: async () => 1 }),
    );
    expect(capped).toMatchObject({ approved: 0, overCap: 1 });
    expect((await store.getPostById(post.id))?.status).toBe("draft");
  });

  it("only approves when Instagram publishes on its own", async () => {
    await aiDraft();
    const run = await runAutopilot({}, deps(NOW, { canAutoPublish: async () => false }));
    expect(run).toMatchObject({ noticed: 0, digests: 0 });
  });

  it("does nothing when the plan no longer has Autopilot", async () => {
    await aiDraft();
    const run = await runAutopilot({}, deps(NOW, { hasAutopilot: async () => false }));
    expect(run).toMatchObject({ inactive: 1, digests: 0 });
    expect(plans).toEqual([]);
  });

  it("plans next month once from the 25th", async () => {
    await runAutopilot({}, deps(NOW));
    expect(plans).toEqual(["2026-12"]);
    expect((await store.getSettings(OWNER)).autopilotPlanStatus).toBe("planned");
    await runAutopilot({}, deps(new Date(NOW.getTime() + 24 * HOUR)));
    expect(plans).toEqual(["2026-12"]);
  });

  it("mentions running out of credits in the notice", async () => {
    planResult = () => ({
      ok: false,
      reason: "limited",
      response: errorResponse(402, "out_of_credits", "Not enough credits."),
    });
    const run = await runAutopilot({}, deps(NOW));
    expect(run).toMatchObject({ outOfCredits: 1, digests: 1 });
    expect(digests[0]?.planNote).toMatch(/out of AI credits/);
    expect((await store.getSettings(OWNER)).autopilotPlanStatus).toBe("out_of_credits");
  });
});
