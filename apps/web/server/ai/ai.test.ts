import { SiteSpec } from "@nosweat/schema";
import { describe, expect, it, vi } from "vitest";
import { generateSiteSpec, getSiteGenerator } from "./index";
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
    expect(spec.business.name).toBe("Joe's Plumbing");
  });

  it("rejects an invalid result from a generator", async () => {
    const broken = { generateSite: async () => ({ version: 1 }) as unknown as SiteSpec };
    await expect(generateSiteSpec("anything", broken)).rejects.toThrow();
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

    const result = await new AnthropicGenerator(client, "claude-opus-5-5").generateSite(
      "Mexican restaurant in San Diego",
    );
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
