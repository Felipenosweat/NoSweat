import { SiteSpec } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
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
