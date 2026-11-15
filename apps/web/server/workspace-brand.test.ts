import { describe, expect, it } from "vitest";
import { contrastRatio } from "./ai/look";
import { brandFromSpec, readableOnWhite } from "./workspace-brand";

const theme = {
  primary: "#1f6f5c",
  secondary: "#f2b84b",
  background: "#ffffff",
  text: "#111111",
  font: "modern" as const,
};

describe("readableOnWhite", () => {
  it("keeps a color that already reads on white", () => {
    expect(readableOnWhite("#1F6F5C")).toBe("#1f6f5c");
  });

  it("darkens a light color until white text passes AA", () => {
    const color = readableOnWhite("#ffd400");
    expect(color).not.toBe("#ffd400");
    expect(contrastRatio(color, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("brandFromSpec", () => {
  it("takes the business name, its initial and the site colors", () => {
    expect(brandFromSpec({ business: { name: " Joe's Plumbing " }, theme })).toEqual({
      name: "Joe's Plumbing",
      initial: "J",
      primary: "#1f6f5c",
      primaryDark: expect.stringMatching(/^#[0-9a-f]{6}$/),
      accent: "#f2b84b",
    });
  });

  it("uses the first letter or number, skipping symbols", () => {
    expect(brandFromSpec({ business: { name: "@ 24/7 Locks" }, theme })?.initial).toBe("2");
    expect(brandFromSpec({ business: { name: "élan studio" }, theme })?.initial).toBe("É");
  });

  it("has no brand without a business name", () => {
    expect(brandFromSpec({ business: { name: "  " }, theme })).toBeNull();
  });
});
