import { ApiError, GenerateSiteResponse, UpdateSiteResponse } from "@nosweat/schema";
import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it, vi } from "vitest";
import type * as AiModule from "@/server/ai";
import { getSiteStore } from "@/server/store";

// Produção sem chave de IA ("modo modelo"): o gerador não usa IA. Gerar não gasta créditos
// nem conta no ai_usage; mudanças pela IA respondem 503 sem salvar versão.
vi.mock("@/server/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof AiModule>();
  const { MockGenerator } = await import("@/server/ai/mock");
  return {
    ...actual,
    getSiteGenerator: () => new MockGenerator({ delayMs: 0, templateMode: true }),
    aiEnabled: () => false,
  };
});
import { POST as aiEdit } from "./[id]/ai-edit/route";
import { PATCH } from "./[id]/route";
import { POST as generate } from "./generate/route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const json = (method: string, body: unknown) =>
  new Request("http://localhost/api/x", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const lastHour = () => new Date(Date.now() - 60 * 60 * 1000).toISOString();
// Sem Supabase nos testes, quem está logado é o DEV_USER ("local-dev").
const USER = "local-dev";

describe("template mode (no AI key)", () => {
  it("generates a site without spending credits or recording AI usage", async () => {
    const store = getSiteStore();
    const before = await store.countAiUsage(USER, "generate", lastHour());
    const res = await generate(
      json("POST", {
        brief:
          "The business is called Lone Star Plumbing. Plumbing repairs and drain cleaning. Based in Austin, TX. Phone: 512-555-0177.",
      }),
    );
    expect(res.status).toBe(201);
    const body = GenerateSiteResponse.parse(await res.json());
    expect(body.spec.business.name).toBe("Lone Star Plumbing");
    expect(body.spec.business.phone).toBe("(512) 555-0177");
    expect(await store.countAiUsage(USER, "generate", lastHour())).toBe(before);
  });

  it("answers AI edits with 503 ai_unavailable, without a version or a charge", async () => {
    const store = getSiteStore();
    const site = await store.create(fixtures["joes-plumbing"], USER);
    const versions = (await store.listVersions(site.id)).length;
    const usage = await store.countAiUsage(USER, "ai_edit", lastHour());

    const res = await aiEdit(json("POST", { instruction: "Make it blue" }), ctx(site.id));
    expect(res.status).toBe(503);
    const error = ApiError.parse(await res.json()).error;
    expect(error.code).toBe("ai_unavailable");
    expect(error.message).toBe(
      "AI changes aren't switched on yet. You can edit every text, color and photo yourself.",
    );

    expect(await store.listVersions(site.id)).toHaveLength(versions);
    expect(await store.countAiUsage(USER, "ai_edit", lastHour())).toBe(usage);
    expect((await store.get(site.id))?.spec).toEqual(site.spec);
  });
});

describe("PATCH /api/sites/[id] keeps the review link", () => {
  const LINK = "https://g.page/r/CbX1ab2Cd3EfEAI/review";

  it("a stale draft without the link does not erase it", async () => {
    const store = getSiteStore();
    const base = fixtures["joes-plumbing"];
    const site = await store.create(
      { ...base, business: { ...base.business, googleReviewUrl: LINK } },
      USER,
    );
    // Rascunho aberto no editor ANTES do dono colar o link (sem googleReviewUrl).
    const stale = { ...base, business: { ...base.business, name: "Joe's Plumbing & Drains" } };
    const res = await PATCH(json("PATCH", { spec: stale }), ctx(site.id));
    expect(res.status).toBe(200);
    const body = UpdateSiteResponse.parse(await res.json());
    expect(body.spec.business.name).toBe("Joe's Plumbing & Drains");
    expect(body.spec.business.googleReviewUrl).toBe(LINK);
    expect((await store.get(site.id))?.spec.business.googleReviewUrl).toBe(LINK);
  });

  it("the editor cannot swap the link either (only /reviews changes it)", async () => {
    const store = getSiteStore();
    const site = await store.create(fixtures["glow-salon"], USER);
    const base = fixtures["glow-salon"];
    const sneaky = {
      ...base,
      business: { ...base.business, googleReviewUrl: "https://g.page/r/other/review" },
    };
    const res = await PATCH(json("PATCH", { spec: sneaky }), ctx(site.id));
    expect(res.status).toBe(200);
    expect((await store.get(site.id))?.spec.business.googleReviewUrl).toBeUndefined();
  });
});
