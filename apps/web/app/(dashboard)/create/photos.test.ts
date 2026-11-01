import { fixtures } from "@nosweat/fixtures";
import { SiteSpec, type SiteImage } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import { photoPlan, placeOwnerPhotos } from "./photos";

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

describe("placeOwnerPhotos", () => {
  const spec = SiteSpec.parse(structuredClone(fixtures["joes-plumbing"]));
  const heroOnly = (() => {
    const copy = structuredClone(spec);
    copy.sections = copy.sections
      .filter((section) => section.type !== "gallery")
      .map((section) => {
        if (section.type !== "hero") return section;
        const rest = { ...section };
        delete rest.image;
        return rest;
      });
    return copy;
  })();
  const photo = (n: number): SiteImage => ({
    url: `https://example.supabase.co/storage/v1/object/public/site-images/${n}.jpg`,
    alt: `Photo ${n}`,
    source: "upload",
    kind: "owner",
  });

  it("returns the same spec without photos", () => {
    expect(placeOwnerPhotos(heroOnly, [])).toBe(heroOnly);
  });

  it("puts the first photo on the hero and the rest in a gallery before the contact", () => {
    const result = placeOwnerPhotos(heroOnly, [photo(1), photo(2), photo(3)]);
    const hero = result.sections.find((section) => section.type === "hero");
    expect(hero?.type === "hero" && hero.image?.url).toBe(photo(1).url);
    const index = result.sections.findIndex((section) => section.type === "gallery");
    const gallery = result.sections[index];
    expect(gallery?.type === "gallery" && gallery.images.map((image) => image.url)).toEqual([
      photo(2).url,
      photo(3).url,
    ]);
    expect(result.sections[index + 1]?.type).toBe("contact");
    expect(SiteSpec.safeParse(result).success).toBe(true);
  });

  it("makes no gallery for a single photo and never uses stock photos", () => {
    const result = placeOwnerPhotos(heroOnly, [photo(1)]);
    expect(result.sections.some((section) => section.type === "gallery")).toBe(false);
    const stock: SiteImage = { ...photo(9), source: "pexels", kind: "scene" };
    expect(placeOwnerPhotos(heroOnly, [stock])).toBe(heroOnly);
  });
});
