import { SiteSpec } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import { MODEL_LIBRARY } from "./index";

// Mesmas regras dos sites-modelo originais (../fixtures.test.ts), para a biblioteca inteira.
const entries = MODEL_LIBRARY.map((entry) => [entry.slug, entry] as const);

describe("model library", () => {
  it("has unique slugs", () => {
    const slugs = MODEL_LIBRARY.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it.each(entries)("%s is a valid SiteSpec of its category", (_slug, entry) => {
    const parsed = SiteSpec.safeParse(entry.spec);
    expect(parsed.success ? [] : parsed.error.issues).toEqual([]);
    expect(entry.spec.template).toBe(entry.category);
    expect(entry.keywords.length).toBeGreaterThan(0);
  });

  it.each(entries)("%s has 4 to 8 sections and starts with a hero", (_slug, entry) => {
    expect(entry.spec.sections.length).toBeGreaterThanOrEqual(4);
    expect(entry.spec.sections.length).toBeLessThanOrEqual(8);
    expect(entry.spec.sections[0]?.type).toBe("hero");
  });

  // Regra 8: telefone, endereço e preços do exemplo vêm das palavras do "dono".
  it.each(entries)("%s only shows the owner's phone, address and prices", (_slug, entry) => {
    const { spec, brief } = entry;
    if (spec.business.phone) expect(brief).toContain(spec.business.phone);
    if (spec.business.address) expect(brief).toContain(spec.business.address);
    for (const section of spec.sections) {
      if (section.type !== "services") continue;
      for (const item of section.items) {
        for (const amount of item.price?.match(/\$[\d,]+/g) ?? []) expect(brief).toContain(amount);
      }
    }
  });

  it.each(entries)("%s has no fixed claims in the headline", (_slug, entry) => {
    const hero = entry.spec.sections.find((section) => section.type === "hero");
    expect(hero?.type === "hero" ? hero.title : "").not.toMatch(
      /trusted|on time every time|#1|best in/i,
    );
  });
});
