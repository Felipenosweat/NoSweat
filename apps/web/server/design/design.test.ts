import { readFileSync } from "node:fs";
import { join } from "node:path";
import { exampleBriefs, fixtures, secondDirectionBrief, type FixtureSlug } from "@nosweat/fixtures";
import type { SiteSpec } from "@nosweat/schema";
import { describe, expect, it, vi } from "vitest";
import { AnthropicGenerator, generationRequest } from "../ai/anthropic";
import { generateSiteSpec } from "../ai/index";
import { MockGenerator } from "../ai/mock";
import { DESIGN_LIBRARY, type DesignReference } from "./library";
import { applyDesignPlan, designBriefForPrompt, fitDesignToPhoto, planDesign } from "./plan";
import { readBrief } from "./signals";

const mock = () => new MockGenerator({ delayMs: 0 });

const TEST_REFERENCE: DesignReference = {
  id: "test-warm-hospitality",
  name: "Test hospitality reference",
  approved: true,
  compositions: ["immersive", "editorial"],
  fits: { businesses: ["food"], tones: ["warm"], goals: ["book", "visit"] },
  principles: ["Lead with one honest photograph of the place.", "Put hours next to the headline."],
};

describe("readBrief", () => {
  it("reads business type, owner style and main action", () => {
    const s = readBrief(exampleBriefs["glow-salon"]);
    expect(s.industry).toBe("beauty");
    expect(s.style).toBe("elegant");
    expect(s.styleTones).toEqual(["premium", "refined"]);
    expect(s.primaryAction).toBe("book");
    expect(readBrief(exampleBriefs["joes-plumbing"]).primaryAction).toBe("call");
    expect(readBrief("We cater weddings").industry).toBe("food");
  });
});

describe("planDesign", () => {
  it("covers every composition across the showcase businesses", () => {
    // Seis modelos, cinco composições: o fotógrafo e o salão dividem a editorial.
    const compositions = Object.values(exampleBriefs).map((b) => planDesign(b).composition);
    expect(new Set(compositions).size).toBe(5);
  });

  it("changes the composition (not just colors) when the owner picks another style", () => {
    const first = planDesign(exampleBriefs["rosas-kitchen"]);
    const second = planDesign(secondDirectionBrief);
    expect(second.composition).not.toBe(first.composition);
  });

  it("avoids repeating the layout this person just received", () => {
    const brief = exampleBriefs["joes-plumbing"];
    const first = planDesign(brief).composition;
    expect(planDesign(brief, { recent: [first, first] }).composition).not.toBe(first);
  });

  it("leaves the photo-first layout out when there is no photo source", () => {
    const brief = exampleBriefs["rosas-kitchen"];
    expect(planDesign(brief).composition).toBe("immersive");
    const plan = planDesign(brief, { photos: false });
    expect(plan.composition).not.toBe("immersive");
    expect(plan.allowed).not.toContain("immersive");
  });

  it("switches an immersive site without a hero photo to editorial", () => {
    const spec = structuredClone(fixtures["rosas-kitchen"]) as SiteSpec;
    expect(fitDesignToPhoto(spec).design?.composition).toBe("immersive");
    spec.sections = spec.sections.map((s) => (s.type === "hero" ? { ...s, image: undefined } : s));
    const fitted = fitDesignToPhoto(spec);
    expect(fitted.design?.composition).toBe("editorial");
    expect(fitted.design?.rationale).toContain("no hero photo");
  });

  it("is deterministic (same brief, same plan)", () => {
    const brief = exampleBriefs["sparkle-cleaning"];
    expect(planDesign(brief)).toEqual(planDesign(brief));
  });

  it("selects matching references and puts their principles in the prompt", () => {
    const plan = planDesign(exampleBriefs["rosas-kitchen"], { library: [TEST_REFERENCE] });
    expect(plan.references.map((r) => r.id)).toEqual(["test-warm-hospitality"]);
    expect(plan.fallback).toBe(false);
    const text = designBriefForPrompt(plan);
    expect(text).toContain(`Composition: "${plan.composition}"`);
    expect(text).toContain("Lead with one honest photograph of the place.");
  });

  it("falls back to the general rules when no reference fits", () => {
    const plan = planDesign(exampleBriefs["hale-ortiz"], { library: [] });
    expect(plan.fallback).toBe(true);
    expect(plan.references).toEqual([]);
    expect(plan.rationale).toContain("no matching reference");
    expect(designBriefForPrompt(plan)).not.toContain("approved design references");
  });

  it("only accepts the AI's composition when the plan allows it", () => {
    const plan = planDesign(exampleBriefs["joes-plumbing"]);
    const outside = (
      ["editorial", "immersive", "typographic", "modular", "service-led"] as const
    ).find((c) => !plan.allowed.includes(c))!;
    expect(applyDesignPlan({ composition: outside }, plan).composition).toBe(plan.composition);
    const alternative = plan.allowed[1] ?? plan.allowed[0]!;
    expect(applyDesignPlan({ composition: alternative }, plan).composition).toBe(alternative);
  });
});

describe("the generation pipeline uses the plan", () => {
  it.each(Object.keys(exampleBriefs) as FixtureSlug[])(
    "showcase %s matches what the generator produces from its brief",
    async (slug) => {
      const spec = await generateSiteSpec(exampleBriefs[slug], mock());
      const expected = fixtures[slug].design!;
      expect(spec.business.name).toBe(fixtures[slug].business.name);
      expect(spec.design).toMatchObject(expected);
      // O plano fica salvo no site para depuração.
      expect(spec.design?.rationale).toBeTruthy();
      expect(Array.isArray(spec.design?.references)).toBe(true);
    },
  );

  it("still generates a valid site when reference data is missing", async () => {
    const spec = await generateSiteSpec(exampleBriefs["joes-plumbing"], mock(), { library: [] });
    expect(spec.design?.composition).toBe("service-led");
    expect(spec.design?.references).toEqual([]);
  });

  it("sends the design plan and reference principles to Claude", async () => {
    const parse = vi.fn(async () => ({
      stop_reason: "end_turn",
      parsed_output: structuredClone(fixtures["rosas-kitchen"]) as SiteSpec,
    }));
    const client = { messages: { parse } } as unknown as ConstructorParameters<
      typeof AnthropicGenerator
    >[0];
    const spec = await generateSiteSpec(
      exampleBriefs["rosas-kitchen"],
      new AnthropicGenerator(client, "test-model", "test-edit-model"),
      { library: [TEST_REFERENCE] },
    );
    const sent = JSON.stringify(parse.mock.calls[0]);
    expect(sent).toContain("<design_plan>");
    expect(sent).toContain("Lead with one honest photograph of the place.");
    expect(spec.design?.references).toEqual(["test-warm-hospitality"]);
  });

  it("keeps the old request when there is no plan", () => {
    expect(generationRequest("A bakery")).not.toContain("<design_plan>");
  });
});

describe("design library", () => {
  // A biblioteca do app é um resumo de docs/design/references.json: todo id precisa existir lá
  // e estar aprovado (pesquisa verificada), e as listas não podem vir vazias.
  const records = () =>
    JSON.parse(
      readFileSync(join(__dirname, "../../../../docs/design/references.json"), "utf8"),
    ) as { id: string; approved: boolean }[];

  it("has approved summaries for the generator", () => {
    expect(DESIGN_LIBRARY.length).toBeGreaterThanOrEqual(4);
  });

  it.each(DESIGN_LIBRARY.map((ref) => [ref.id, ref] as const))(
    "%s is approved research",
    (id, ref) => {
      const record = records().find((r) => r.id === id);
      expect(record, `${id} missing from docs/design/references.json`).toBeDefined();
      expect(record?.approved).toBe(true);
      expect(ref.principles.length).toBeGreaterThan(0);
      expect(ref.compositions.length).toBeGreaterThan(0);
    },
  );
});
