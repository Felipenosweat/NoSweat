import { fixtures } from "@nosweat/fixtures";
import { FontId, TemplateId, type SiteImage, type SiteSpec } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteRenderer } from "./SiteRenderer";
import { FONT_CSS_VARIABLES, FONT_PAIRS } from "./fonts";
import { readableTextOn, themeToCssVars } from "./theme";

describe("SiteRenderer", () => {
  it.each(Object.entries(fixtures))("renders %s without errors", (_slug, spec) => {
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    expect(html).toContain("ns-site");
    expect(html).toContain(`--ns-primary:${spec.theme.primary}`);
    // Nomes com apóstrofo saem escapados no HTML.
    expect(html).toContain(spec.business.name.replace("'", "&#x27;"));
  });

  it("renders sections in the order of the array", () => {
    const spec = fixtures["joes-plumbing"];
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    const positions = ['id="services"', 'id="faq"', 'id="contact"'].map((marker) =>
      html.indexOf(marker),
    );
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it.each(TemplateId.options)("supports template %s", (template) => {
    const spec = { ...fixtures["joes-plumbing"], template };
    expect(() => renderToStaticMarkup(<SiteRenderer spec={spec} />)).not.toThrow();
  });
});

describe("honest by default", () => {
  const base = fixtures["joes-plumbing"];

  it("shows no trust badges unless the owner confirmed them", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={base} />);
    for (const claim of ["Licensed", "Insured", "Guaranteed", "Same-Day", "Free estimate"]) {
      expect(html).not.toContain(claim);
    }
  });

  it("shows the owner's highlights, hours and service area", () => {
    const spec = {
      ...base,
      business: {
        ...base.business,
        serviceArea: "Austin and Round Rock",
        hours: [{ days: "Mon–Sat", time: "8 AM – 6 PM" }],
        highlights: ["Licensed & insured"],
      },
    };
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    expect(html).toContain("Licensed &amp; insured");
    expect(html).toContain("Mon–Sat");
    expect(html).toContain("Austin and Round Rock");
  });
});

describe("readableTextOn", () => {
  it("picks light text on dark colors and dark text on light colors", () => {
    expect(readableTextOn("#1D4ED8")).toBe("#FFFFFF");
    expect(readableTextOn("#FDE68A")).not.toBe("#FFFFFF");
  });
});

describe("photos", () => {
  const base = fixtures["joes-plumbing"];
  const scene: SiteImage = {
    url: "https://images.pexels.com/photos/123/pexels-photo-123.jpeg",
    alt: "Plumber's tools on a kitchen counter",
    source: "pexels",
    kind: "scene",
    credit: { name: "Jane Doe", url: "https://www.pexels.com/@jane-doe" },
    width: 1600,
    height: 1067,
  };
  const owner = (n: number): SiteImage => ({
    url: `https://cdn.example.com/owner-${n}.jpg`,
    alt: `Finished bathroom remodel ${n}`,
    source: "upload",
    kind: "owner",
  });
  const withHeroImage = (image?: SiteImage): SiteSpec => ({
    ...base,
    sections: base.sections.map((s) => (s.type === "hero" ? { ...s, image } : s)),
  });
  const withGallery = (images: SiteImage[], title?: string): SiteSpec => ({
    ...base,
    sections: [...base.sections, { type: "gallery", title, images }],
  });

  it("renders the hero photo with alt, size and the photographer credit", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={withHeroImage(scene)} />);
    expect(html).toContain(`src="${scene.url}"`);
    expect(html).toContain('alt="Plumber&#x27;s tools on a kitchen counter"');
    expect(html).toContain('width="1600"');
    expect(html).toContain('loading="eager"');
    expect(html).toContain("Jane Doe");
    expect(html).toContain('href="https://www.pexels.com/@jane-doe"');
    expect(html).toContain("Pexels");
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("credits Unsplash photos the way Unsplash asks", () => {
    const image: SiteImage = {
      ...scene,
      source: "unsplash",
      credit: { name: "John Roe", url: "https://unsplash.com/@johnroe" },
    };
    const html = renderToStaticMarkup(<SiteRenderer spec={withHeroImage(image)} />);
    expect(html).toMatch(/Photo by <a[^>]*>John Roe<\/a> on <a[^>]*>Unsplash<\/a>/);
  });

  it("renders no image or credit when the hero has no photo", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={withHeroImage(undefined)} />);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<figcaption");
    expect(html).not.toContain("Photo:");
  });

  it("renders the owner's gallery with lazy images and a default title", () => {
    const html = renderToStaticMarkup(
      <SiteRenderer spec={withGallery([owner(1), owner(2), owner(3)])} />,
    );
    expect(html).toContain(">Our work</h2>");
    expect(html).toContain('id="work"');
    expect(html).toContain('href="#work"');
    for (const n of [1, 2, 3]) {
      expect(html).toContain(`src="https://cdn.example.com/owner-${n}.jpg"`);
      expect(html).toContain(`alt="Finished bathroom remodel ${n}"`);
    }
    expect(html.match(/loading="lazy"/g)).toHaveLength(3);
  });

  it("uses the owner's gallery title", () => {
    const html = renderToStaticMarkup(
      <SiteRenderer spec={withGallery([owner(1)], "Recent jobs")} />,
    );
    expect(html).toContain(">Recent jobs</h2>");
    expect(html).not.toContain(">Our work</h2>");
  });

  it("hides the gallery (and its menu link) when there are no owner photos", () => {
    for (const images of [[], [scene]]) {
      const html = renderToStaticMarkup(<SiteRenderer spec={withGallery(images)} />);
      expect(html).not.toContain("Our work");
      expect(html).not.toContain("<img");
    }
  });
});

describe("fonts", () => {
  it.each(FontId.options)("maps font %s to a heading and body pair", (font) => {
    const pair = FONT_PAIRS[font];
    expect(pair.heading).toMatch(/^var\(--ns-font-[a-z]+-heading/);
    expect(pair.body).toMatch(/^var\(--ns-font-[a-z]+-body/);
    // Toda variável usada no par é uma das que o app hospedeiro define.
    for (const value of [pair.heading, pair.body]) {
      const variable = value.match(/var\((--ns-font-[a-z]+-[a-z]+)/)?.[1];
      expect(FONT_CSS_VARIABLES).toContain(variable);
    }
    const vars = themeToCssVars({ ...fixtures["joes-plumbing"].theme, font });
    expect(vars["--ns-font-heading"]).toBe(pair.heading);
  });
});
