import { fixtures } from "@nosweat/fixtures";
import { Composition } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteRenderer } from "../SiteRenderer";
import { heroTone, toneOf, tonesOf } from "./tone";

describe("toneOf", () => {
  it("separates light and dark colors", () => {
    expect(toneOf("#FFFFFF")).toBe("light");
    expect(toneOf("#F6F1E7")).toBe("light");
    expect(toneOf("#0B0F19")).toBe("dark");
    expect(toneOf("#C2410C")).toBe("dark");
  });
});

describe("tonesOf", () => {
  it("reads the page from the background and the bands from the text color", () => {
    expect(tonesOf({ background: "#F6F1E7", text: "#1B1A17" })).toEqual({
      page: "light",
      band: "dark",
    });
    // Tema escuro: o fundo é escuro e as faixas na cor do texto são claras.
    expect(tonesOf({ background: "#0E1116", text: "#F2EFE8" })).toEqual({
      page: "dark",
      band: "light",
    });
  });
});

describe("heroTone", () => {
  const tones = { page: "light", band: "dark" } as const;

  it("puts photo and poster tops over the band color", () => {
    expect(heroTone("immersive", true, tones)).toBe("dark");
    expect(heroTone("service-led", true, tones)).toBe("dark");
    expect(heroTone("typographic", true, tones)).toBe("dark");
    expect(heroTone("typographic", false, tones)).toBe("dark");
    expect(heroTone("editorial", false, tones)).toBe("dark");
  });

  it("puts editorial and modular tops with a photo over the page color", () => {
    expect(heroTone("editorial", true, tones)).toBe("light");
    expect(heroTone("modular", true, tones)).toBe("light");
  });
});

describe("tone marks in the rendered site", () => {
  const navTone = (html: string) =>
    html.match(/<header[^>]*class="ns-nav [^"]*"[^>]*data-tone="(light|dark)"/)?.[1] ??
    html.match(/<header[^>]*data-tone="(light|dark)"[^>]*class="ns-nav /)?.[1];

  it.each(Object.entries(fixtures))("marks the menu and the footer of %s", (_slug, spec) => {
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    const tones = tonesOf(spec.theme);
    expect(navTone(html)).toMatch(/^(light|dark)$/);
    expect(html).toMatch(new RegExp(`<footer[^>]*data-tone="${tones.band}"`));
  });

  it("starts the menu with the tone of the top of the page", () => {
    for (const composition of Composition.options) {
      const spec = {
        ...fixtures["joes-plumbing"],
        design: { ...fixtures["joes-plumbing"].design, composition },
      };
      const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
      const hasImage = spec.sections.some((section) => section.type === "hero" && section.image);
      const expected = heroTone(composition, hasImage, tonesOf(spec.theme));
      expect(navTone(html)).toBe(expected);
    }
  });
});
