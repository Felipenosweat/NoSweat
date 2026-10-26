import { describe, expect, it } from "vitest";
import { photoPlan } from "./photos";

describe("photoPlan", () => {
  it("asks for a cover photo and a gallery on photo layouts", () => {
    for (const layout of ["service-led", "immersive", "editorial", "modular", "auto"] as const) {
      const plan = photoPlan(layout);
      expect(plan.total).toBe("7 to 11 photos");
      expect(plan.needs.map((need) => need.label)).toEqual(["Cover photo", "Photo gallery"]);
    }
  });

  it("asks for a portrait cover on the editorial layout", () => {
    expect(photoPlan("editorial").needs[0]?.tip).toMatch(/portrait/i);
  });

  it("skips the cover photo on the typographic layout", () => {
    const plan = photoPlan("typographic");
    expect(plan.total).toBe("6 to 10 photos");
    expect(plan.needs.map((need) => need.label)).toEqual(["Photo gallery"]);
  });
});
