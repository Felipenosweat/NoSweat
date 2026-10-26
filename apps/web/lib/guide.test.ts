import { describe, expect, it } from "vitest";
import { GUIDE_FAQ, GUIDE_SECTIONS, guideHref } from "./guide";

describe("GUIDE_SECTIONS", () => {
  it("has unique anchors, a button and 3 steps per section", () => {
    expect(new Set(GUIDE_SECTIONS.map((s) => s.id)).size).toBe(GUIDE_SECTIONS.length);
    for (const section of GUIDE_SECTIONS) {
      expect(section.cta.href.startsWith("/")).toBe(true);
      expect(section.cta.label).toMatch(/^Open /);
      expect(section.steps).toHaveLength(3);
    }
  });

  it("covers every section the empty states link to", () => {
    const ids = GUIDE_SECTIONS.map((s) => s.id);
    for (const id of ["clients", "estimates", "invoices", "team", "settings", "schedule"]) {
      expect(ids).toContain(id);
    }
  });

  it("keeps each section short (2–4 sentences)", () => {
    for (const section of GUIDE_SECTIONS) {
      const sentences = section.body.split(/(?<=[.!?])\s+/).filter(Boolean);
      expect(sentences.length).toBeGreaterThanOrEqual(2);
      expect(sentences.length).toBeLessThanOrEqual(4);
    }
  });
});

describe("GUIDE_FAQ", () => {
  it("answers the 6 owner questions", () => {
    expect(GUIDE_FAQ.map((f) => f.question)).toEqual([
      "How do I get paid?",
      "Do my customers need an account?",
      "How do I connect my domain?",
      "Will AI post without me?",
      "How do I add my Google reviews?",
      "How do I cancel?",
    ]);
  });

  it("is honest about what isn't there yet", () => {
    const paid = GUIDE_FAQ.find((f) => f.id === "get-paid")?.answer ?? "";
    expect(paid).toMatch(/aren’t available yet/);
    const ai = GUIDE_FAQ.find((f) => f.id === "ai-posts")?.answer ?? "";
    expect(ai).toMatch(/until you approve/);
  });
});

describe("guideHref", () => {
  it("links to the section anchor", () => {
    expect(guideHref("clients")).toBe("/guide#clients");
  });
});
