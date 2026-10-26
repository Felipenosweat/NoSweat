import { fixtures } from "@nosweat/fixtures";
import { SiteSpec, type AiEditResult } from "@nosweat/schema";
import { describe, expect, it, vi } from "vitest";
import { editSiteSpec, generateSiteSpec, getSiteGenerator } from "./index";
import { MockGenerator, selectFixture } from "./mock";

describe("selectFixture", () => {
  it.each([
    ["plumbing company in Austin", "joes-plumbing"],
    ["Hair salon in Miami", "glow-salon"],
    ["beauty studio", "glow-salon"],
    ["Mexican RESTAURANT", "rosas-kitchen"],
    ["Cozy café downtown", "rosas-kitchen"],
    ["food truck", "rosas-kitchen"],
    ["roofing contractor", "joes-plumbing"],
  ])("%s → %s", (brief, slug) => {
    expect(selectFixture(brief)).toBe(slug);
  });
});

describe("generateSiteSpec", () => {
  it("returns a valid SiteSpec from the mock", async () => {
    const spec = await generateSiteSpec(
      "plumbing company in Austin",
      new MockGenerator({ delayMs: 0 }),
    );
    expect(SiteSpec.safeParse(spec).success).toBe(true);
    // O mock também parte do modelo e junta um fill: os fatos do modelo não ficam.
    expect(spec.template).toBe("home-services");
    expect(spec.business.name).not.toBe("Joe's Plumbing");
  });

  it("rejects an invalid result from a generator", async () => {
    const broken = {
      generateSite: async () => ({ version: 1 }) as unknown as SiteSpec,
      editSite: async () => ({ summary: "x", spec: { version: 1 } }) as unknown as AiEditResult,
    };
    await expect(generateSiteSpec("anything", broken)).rejects.toThrow();
    await expect(editSiteSpec(fixtures["joes-plumbing"], "anything", broken)).rejects.toThrow();
  });

  it("a IA nunca põe, troca nem tira o link de avaliações do Google", async () => {
    const base = fixtures["joes-plumbing"];
    const owners = "https://g.page/r/owner/review";
    const invented = "https://g.page/r/invented/review";
    const withLink = (spec: SiteSpec, url: string): SiteSpec => ({
      ...spec,
      business: { ...spec.business, googleReviewUrl: url },
    });
    const sneaky = {
      generateSite: async () => withLink(base, invented),
      editSite: async () => ({ summary: "Done.", spec: withLink(base, invented) }),
    };
    const generated = await generateSiteSpec("plumber in Austin", sneaky);
    expect(generated.business.googleReviewUrl).toBeUndefined();

    const edited = await editSiteSpec(withLink(base, owners), "change it", sneaky);
    expect(edited.spec.business.googleReviewUrl).toBe(owners);

    const dropping = { ...sneaky, editSite: async () => ({ summary: "Done.", spec: base }) };
    const kept = await editSiteSpec(withLink(base, owners), "remove stuff", dropping);
    expect(kept.spec.business.googleReviewUrl).toBe(owners);
  });

  it("uses the mock by default and rejects unknown providers", () => {
    expect(getSiteGenerator()).toBeInstanceOf(MockGenerator);
    expect(() => getSiteGenerator("gemini")).toThrow(/Unknown AI_PROVIDER/);
  });
});

describe("AnthropicGenerator", () => {
  it("returns the parsed SiteSpec from Claude's structured output", async () => {
    const { AnthropicGenerator } = await import("./anthropic");
    const spec = (await import("@nosweat/fixtures")).fixtures["rosas-kitchen"];
    const parse = vi.fn(async () => ({ stop_reason: "end_turn", parsed_output: spec }));
    const client = { messages: { parse } } as unknown as ConstructorParameters<
      typeof AnthropicGenerator
    >[0];

    // Caminho completo (sem a geração a partir do modelo).
    const result = await new AnthropicGenerator(
      client,
      "claude-opus-5-5",
      undefined,
      false,
    ).generateSite("Mexican restaurant in San Diego");
    expect(result).toEqual(spec);
    const [request] = parse.mock.calls[0] as unknown as [{ model: string; messages: unknown[] }];
    expect(request.model).toBe("claude-opus-5-5");
    expect(JSON.stringify(request.messages)).toContain("Mexican restaurant in San Diego");
  });

  it("fails clearly when Claude declines", async () => {
    const { AnthropicGenerator } = await import("./anthropic");
    const parse = vi.fn(async () => ({
      stop_reason: "refusal",
      stop_details: { category: null },
      parsed_output: null,
    }));
    const client = { messages: { parse } } as unknown as ConstructorParameters<
      typeof AnthropicGenerator
    >[0];
    await expect(new AnthropicGenerator(client).generateSite("anything")).rejects.toThrow(
      /declined/,
    );
  });
});

describe("AnthropicGenerator.editSite", () => {
  it("returns the edited spec and summary from Claude", async () => {
    const { AnthropicGenerator } = await import("./anthropic");
    const spec = fixtures["joes-plumbing"];
    const edited = {
      ...spec,
      business: { ...spec.business, hours: [{ days: "Mon–Sat", time: "8 AM – 6 PM" }] },
    };
    const parse = vi.fn(async () => ({
      stop_reason: "end_turn",
      parsed_output: { summary: "Updated your hours.", spec: edited },
    }));
    const client = { messages: { parse } } as unknown as ConstructorParameters<
      typeof AnthropicGenerator
    >[0];

    const result = await new AnthropicGenerator(client, "gen-model", "edit-model").editSite(
      spec,
      "Mon–Sat 8 to 6",
    );
    expect(result.summary).toBe("Updated your hours.");
    expect(result.spec.business.hours).toEqual([{ days: "Mon–Sat", time: "8 AM – 6 PM" }]);
    const [request] = parse.mock.calls[0] as unknown as [
      { model: string; messages: { content: string }[] },
    ];
    expect(request.model).toBe("edit-model");
    expect(request.messages[0]?.content).toContain("<request>");
  });
});
