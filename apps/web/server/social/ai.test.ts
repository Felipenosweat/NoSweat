import { fixtures } from "@nosweat/fixtures";
import { SocialPlanItem, type SiteSpec } from "@nosweat/schema";
import { describe, expect, it, vi } from "vitest";
import { getSiteStore } from "../store";
import {
  AnthropicPostPlanner,
  getPostPlanner,
  MockPostPlanner,
  planDates,
  SocialAiError,
  type PlanMonthInput,
} from "./ai";
import { hasUnverifiedClaims } from "./claims";
import { buildBusinessContext, contextFromSpec, type BusinessContext } from "./context";

const ctx: BusinessContext = {
  siteId: "site-1",
  businessName: "Joe's Plumbing",
  city: "Austin",
  state: "TX",
  phone: "(512) 555-0100",
  services: ["Drain cleaning", "Water heaters"],
  highlights: [],
  serviceArea: "Austin and nearby cities",
  photos: [{ url: "https://x.supabase.co/storage/v1/object/public/site-images/a.jpg", alt: "Van" }],
};

const nov: PlanMonthInput = {
  month: "2026-11",
  postsPerWeek: 3,
  timezone: "America/Chicago",
  postDays: [1, 3, 5],
  postTime: "10:00",
  maxPosts: 30,
};

const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

describe("planDates", () => {
  it("spreads posts on the chosen weekdays, at most N per week", () => {
    const dates = planDates("2026-11", [1, 3, 5], 3, 30);
    expect(dates).toHaveLength(13);
    expect(dates.every((d) => [1, 3, 5].includes(weekday(d)))).toBe(true);
    expect(dates[0]).toBe("2026-11-02");

    // 7 dias marcados, mas só 2 por semana (semana de segunda a domingo).
    const two = planDates("2026-11", [0, 1, 2, 3, 4, 5, 6], 2, 30);
    expect(two.slice(0, 3)).toEqual(["2026-11-01", "2026-11-02", "2026-11-03"].slice(0, 1).concat(["2026-11-02", "2026-11-03"]));
  });

  it("uses default days when none were chosen and respects maxPosts", () => {
    const dates = planDates("2026-11", [], 2, 5);
    expect(dates).toHaveLength(5);
    expect(dates.every((d) => [2, 4].includes(weekday(d)))).toBe(true);
    expect(planDates("2026-11", [1], 3, 0)).toEqual([]);
  });
});

describe("MockPostPlanner", () => {
  it("returns valid posts in the month with the owner's time and business name", async () => {
    const items = await new MockPostPlanner().planMonth(ctx, nov);
    expect(items).toHaveLength(13);
    for (const item of items) {
      expect(SocialPlanItem.safeParse(item).success).toBe(true);
      expect(item.date.startsWith("2026-11-")).toBe(true);
      expect(item.time).toBe("10:00");
      expect(item.photoIndex).toBe(0);
      expect(hasUnverifiedClaims(item.caption, ctx.highlights)).toBe(false);
    }
    expect(items.some((i) => i.caption.includes("Joe's Plumbing"))).toBe(true);
    expect(items.some((i) => i.caption.includes("Drain cleaning"))).toBe(true);
    // As hashtags já vêm dentro da legenda.
    expect(items[0]?.caption).toContain("#JoesPlumbing");
  });

  it("stops at maxPosts and uses null photos when there are none", async () => {
    const items = await new MockPostPlanner().planMonth({ ...ctx, photos: [] }, { ...nov, maxPosts: 4 });
    expect(items).toHaveLength(4);
    expect(items.every((i) => i.photoIndex === null)).toBe(true);
  });

  it("writes captions, adding the phone only for the cta action", async () => {
    const planner = new MockPostPlanner();
    const written = await planner.writeCaption(ctx, { action: "write", idea: "Winter pipes" });
    expect(written.caption).toContain("Joe's Plumbing");
    expect(written.caption).not.toContain("555-0100");
    const cta = await planner.writeCaption(ctx, { action: "cta", currentCaption: "Hello there." });
    expect(cta.caption).toContain("(512) 555-0100");
  });

  it("is the default planner", () => {
    expect(getPostPlanner()).toBeInstanceOf(MockPostPlanner);
    expect(getPostPlanner("mock")).toBeInstanceOf(MockPostPlanner);
  });
});

type Client = ConstructorParameters<typeof AnthropicPostPlanner>[0];
type Request = { model: string; max_tokens: number; messages: { content: string }[] };

function item(date: string, extra: Partial<SocialPlanItem> = {}): SocialPlanItem {
  return {
    date,
    time: "08:00",
    pillar: "tip",
    caption: "Keep your drains clear this fall.",
    hashtags: ["austin", "#Plumbing"],
    ownerNotePt: "Dica de outono.",
    photoIndex: null,
    ...extra,
  };
}

describe("AnthropicPostPlanner", () => {
  it("plans with the plan model and cleans up the result", async () => {
    const parse = vi.fn(async () => ({
      stop_reason: "end_turn",
      parsed_output: {
        posts: [
          item("2026-11-02", { photoIndex: 7 }),
          item("2026-11-04", { photoIndex: 0 }),
          item("2026-12-01"),
          item("2026-11-03"),
        ],
      },
    }));
    const planner = new AnthropicPostPlanner(
      { messages: { parse } } as unknown as Client,
      "plan-model",
      "caption-model",
    );
    const items = await planner.planMonth(ctx, { ...nov, maxPosts: 10 });

    const [request] = parse.mock.calls[0] as unknown as [Request];
    expect(request.model).toBe("plan-model");
    expect(request.max_tokens).toBe(8000);
    expect(request.messages[0]?.content).toContain("Joe's Plumbing");
    expect(request.messages[0]?.content).toContain("2026-11-02 10:00");

    // Fora do mês e fora da agenda (terça) saem; foto inválida vira null; hora do dono.
    expect(items.map((i) => i.date)).toEqual(["2026-11-02", "2026-11-04"]);
    expect(items[0]?.photoIndex).toBeNull();
    expect(items[1]?.photoIndex).toBe(0);
    expect(items[0]?.time).toBe("10:00");
    expect(items[0]?.caption).toBe("Keep your drains clear this fall.\n\n#austin #Plumbing");
  });

  it("writes captions with the caption model", async () => {
    const parse = vi.fn(async () => ({
      stop_reason: "end_turn",
      parsed_output: { caption: " Hi Austin! ", ownerNotePt: "Oi." },
    }));
    const planner = new AnthropicPostPlanner(
      { messages: { parse } } as unknown as Client,
      "plan-model",
      "caption-model",
    );
    const result = await planner.writeCaption(ctx, { action: "write", idea: "say hi" });
    const [request] = parse.mock.calls[0] as unknown as [Request];
    expect(request.model).toBe("caption-model");
    expect(request.messages[0]?.content).toContain("Joe's Plumbing");
    expect(result).toEqual({ caption: "Hi Austin!", ownerNotePt: "Oi." });
  });

  it("retries once on an invalid answer, then fails", async () => {
    const parse = vi.fn(async () => {
      throw new SyntaxError("Unexpected token");
    });
    const planner = new AnthropicPostPlanner({ messages: { parse } } as unknown as Client);
    await expect(planner.writeCaption(ctx, { action: "write", idea: "x" })).rejects.toBeInstanceOf(
      SocialAiError,
    );
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("does not retry a refusal", async () => {
    const parse = vi.fn(async () => ({
      stop_reason: "refusal",
      stop_details: { category: "cyber" },
      parsed_output: null,
    }));
    const planner = new AnthropicPostPlanner({ messages: { parse } } as unknown as Client);
    await expect(planner.planMonth(ctx, nov)).rejects.toThrow(/declined/);
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("uses the default models", () => {
    const planner = new AnthropicPostPlanner({ messages: { parse: vi.fn() } } as unknown as Client);
    const fields = planner as unknown as { model: string; captionModel: string };
    if (!process.env.ANTHROPIC_MODEL) expect(fields.model).toBe("claude-sonnet-5-5");
    if (!process.env.ANTHROPIC_EDIT_MODEL) expect(fields.captionModel).toBe("claude-haiku-5-5");
  });
});

describe("hasUnverifiedClaims", () => {
  it.each([
    ["Same-day service in Austin!", [], true],
    ["Same-day service in Austin!", ["Same-day service"], false],
    ["We're licensed and insured.", [], true],
    ["We're licensed and insured.", ["Licensed & insured"], false],
    ["Rated 5 stars by our neighbors", [], true],
    ["Check our reviews", [], true],
    ["Best in town!", [], true],
    ["#1 plumber around", [], true],
    ["Award-winning team", [], true],
    ["Satisfaction guaranteed", [], true],
    ["20 years of experience", [], true],
    ["Get 10% off this week", [], true],
    ["Only $49 for a tune-up", [], true],
    ["Ask about our prices", [], true],
    ["Free estimates for everyone", ["Free estimates"], false],
    ["Keep your drains clear this fall. #Austin #Plumbing", [], false],
    ["Feel free to say hi!", [], false],
  ] as const)("%s (highlights %j) → %s", (text, highlights, expected) => {
    expect(hasUnverifiedClaims(text, [...highlights])).toBe(expected);
  });
});

describe("buildBusinessContext", () => {
  const OWNER = "a1b2c3d4-0000-4000-8000-000000000001";
  const upload = {
    url: "https://abc.supabase.co/storage/v1/object/public/site-images/s1/a.jpg",
    alt: "Our van",
    source: "upload" as const,
    kind: "owner" as const,
  };
  const stock = {
    url: "https://images.pexels.com/photos/1/pexels-photo-1.jpeg",
    alt: "A kitchen",
    source: "pexels" as const,
    kind: "scene" as const,
  };

  function specWithPhotos(): SiteSpec {
    const base = fixtures["joes-plumbing"];
    return {
      ...base,
      business: { ...base.business, highlights: ["Licensed & insured"] },
      sections: [
        ...base.sections.map((s) => (s.type === "hero" ? { ...s, image: stock } : s)),
        { type: "gallery", images: [upload, stock] },
      ],
    };
  }

  it("reads the owner's newest site and keeps only uploaded photos", async () => {
    await getSiteStore().create(fixtures["rosas-kitchen"], OWNER);
    const site = await getSiteStore().create(specWithPhotos(), OWNER);
    const result = await buildBusinessContext(OWNER);
    expect(result?.siteId).toBe(site.id);
    expect(result?.businessName).toBe("Joe's Plumbing");
    expect(result?.highlights).toEqual(["Licensed & insured"]);
    expect(result?.services.length).toBeGreaterThan(0);
    expect(result?.photos).toEqual([{ url: upload.url, alt: "Our van" }]);
  });

  it("ignores sites of other owners and returns null without a site", async () => {
    const other = await getSiteStore().create(fixtures["glow-salon"], "someone-else");
    expect(await buildBusinessContext("no-sites-owner")).toBeNull();
    expect(await buildBusinessContext("no-sites-owner", other.id)).toBeNull();
    expect(contextFromSpec("x", fixtures["glow-salon"]).photos.every((p) => p.url.includes("supabase"))).toBe(true);
  });
});
