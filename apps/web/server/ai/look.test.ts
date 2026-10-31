import type { TemplateId, Theme } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  dropInvalidLook,
  lookHint,
  PALETTES,
  paletteProblems,
  pickTheme,
  variedLook,
} from "./look";

const GOOD: Theme = {
  primary: "#1F3A5F",
  secondary: "#C9A227",
  background: "#FAFAF7",
  surface: "#EEF1F5",
  text: "#101826",
  muted: "#4A5568",
  font: "refined",
};

const MODEL_THEME: Theme = {
  primary: "#0F5257",
  secondary: "#F28C28",
  background: "#FFFFFF",
  text: "#111111",
  font: "bold",
};

describe("contrast", () => {
  it("computes the WCAG contrast ratio", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#777777")).toBe(1);
  });

  it("accepts a readable palette", () => {
    expect(paletteProblems(GOOD)).toEqual([]);
  });

  it.each([
    ["light text", { ...GOOD, text: "#C8C8C8" }, /text on background/],
    ["pale primary", { ...GOOD, primary: "#9FC5E8" }, /primary on background/],
    ["muted too soft", { ...GOOD, muted: "#B0B0B0" }, /muted on background/],
    ["text lost on the surface", { ...GOOD, surface: "#202020" }, /text on surface/],
    ["not a hex color", { ...GOOD, primary: "navy" }, /primary: not a #RRGGBB/],
  ] as const)("rejects %s", (_label, theme, problem) => {
    expect(paletteProblems(theme).join(" ")).toMatch(problem);
  });

  it.each(Object.keys(PALETTES) as TemplateId[])(
    "every curated %s palette passes the checks",
    (template) => {
      for (const palette of PALETTES[template]) {
        expect(paletteProblems({ ...palette.colors, font: "modern" }), palette.name).toEqual([]);
      }
    },
  );
});

describe("pickTheme", () => {
  it("uses the AI palette when it is readable", () => {
    expect(pickTheme(GOOD, MODEL_THEME)).toEqual(GOOD);
  });

  it("falls back to the model's colors (keeping the AI font) when contrast fails", () => {
    const unreadable: Theme = { ...GOOD, text: "#DDDDDD", font: "luxe" };
    expect(pickTheme(unreadable, MODEL_THEME)).toEqual({ ...MODEL_THEME, font: "luxe" });
  });

  it("keeps the model theme without an AI theme", () => {
    expect(pickTheme(undefined, MODEL_THEME)).toEqual(MODEL_THEME);
  });
});

describe("dropInvalidLook", () => {
  it("drops invalid look parts instead of failing the whole answer", () => {
    const cleaned = dropInvalidLook({
      hero: { title: "x" },
      theme: { ...GOOD, primary: "blue" },
      style: { buttons: "pill", header: "centered" },
      sectionOrder: ["faq", "gallery"],
      dropSections: null,
      services: [
        { name: "A", description: "a", imageQuery: `  ${"tiles ".repeat(20)}  ` },
        { name: "B", description: "b", imageQuery: "   " },
      ],
    }) as Record<string, unknown>;
    expect(cleaned.theme).toBeUndefined();
    expect(cleaned.sectionOrder).toBeUndefined();
    expect("dropSections" in cleaned).toBe(false);
    expect(cleaned.style).toEqual({ buttons: "pill", header: "centered" });
    const [first, second] = cleaned.services as { imageQuery?: string }[];
    expect(first?.imageQuery?.length).toBe(80);
    expect(second && "imageQuery" in second).toBe(false);
  });

  it("leaves non-objects alone", () => {
    expect(dropInvalidLook(null)).toBeNull();
    expect(dropInvalidLook("x")).toBe("x");
  });
});

describe("variedLook", () => {
  it("is deterministic for the same name", () => {
    expect(variedLook("Bright Path Plumbing", "home-services")).toEqual(
      variedLook("  bright path plumbing ", "home-services"),
    );
  });

  it("gives different businesses of the same kind different looks", () => {
    const names = [
      "Bright Path Plumbing",
      "Blue Ox Plumbing",
      "Copper Creek Plumbing",
      "Rapid Rooter Plumbing",
      "Lone Star Plumbing",
    ];
    const looks = names.map((name) => JSON.stringify(variedLook(name, "home-services")));
    expect(new Set(looks).size).toBe(names.length);
    const palettes = new Set(names.map((name) => variedLook(name, "home-services").paletteName));
    expect(palettes.size).toBeGreaterThanOrEqual(2);
  });

  it("only picks readable palettes from the business's own kind", () => {
    for (const template of Object.keys(PALETTES) as TemplateId[]) {
      const look = variedLook(`Test ${template}`, template);
      expect(PALETTES[template].map((p) => p.name)).toContain(look.paletteName);
      expect(paletteProblems(look.theme)).toEqual([]);
    }
  });

  it("suggests a palette only when the owner did not pick a style", () => {
    const free = lookHint("Hair salon in Miami", "beauty", false);
    expect(free).toContain("<look_suggestion>");
    expect(free).toContain("palette");
    expect(free).toContain("sectionOrder");
    const styled = lookHint("Hair salon in Miami\n\nStyle: elegant.", "beauty", true);
    expect(styled).not.toContain("palette");
    expect(styled).toContain("buttons");
  });
});
