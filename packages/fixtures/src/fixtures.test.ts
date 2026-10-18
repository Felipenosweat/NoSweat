import { describe, expect, it } from "vitest";
import { exampleBriefs } from "./briefs";
import { fixtures } from "./index";

describe("fixtures", () => {
  it.each(Object.entries(fixtures))("%s has 4 to 8 sections", (_slug, spec) => {
    expect(spec.sections.length).toBeGreaterThanOrEqual(4);
    expect(spec.sections.length).toBeLessThanOrEqual(8);
  });

  it.each(Object.entries(fixtures))("%s starts with a hero", (_slug, spec) => {
    expect(spec.sections[0]?.type).toBe("hero");
  });

  // Regra 8: telefone, preços e endereço do exemplo vêm das palavras do "dono".
  it.each(Object.entries(fixtures))("%s only shows the owner's phone and prices", (slug, spec) => {
    const brief = exampleBriefs[slug as keyof typeof exampleBriefs];
    if (spec.business.phone) expect(brief).toContain(spec.business.phone);
    if (spec.business.address) expect(brief).toContain(spec.business.address);
    for (const section of spec.sections) {
      if (section.type !== "services") continue;
      for (const item of section.items) {
        const amount = item.price?.match(/\$[\d,]+/)?.[0];
        if (amount) expect(brief).toContain(amount);
      }
    }
  });

  it.each(Object.entries(fixtures))("%s has no fixed claims in the headline", (_slug, spec) => {
    const hero = spec.sections.find((section) => section.type === "hero");
    expect(hero?.type === "hero" ? hero.title : "").not.toMatch(
      /trusted|on time every time|#1|best in/i,
    );
  });
});
