import { fixtures } from "@nosweat/fixtures";
import { Composition, FontId, TemplateId, type SiteImage, type SiteSpec } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteRenderer } from "./SiteRenderer";
import { foldMessage } from "./sections/fold-message";
import type { GalleryVariant } from "./sections/Gallery";
import { FONT_CSS_VARIABLES, FONT_PAIRS } from "./fonts";
import { readableTextOn, themeToCssVars } from "./theme";

describe("SiteRenderer", () => {
  it.each(Object.entries(fixtures))("renders %s without errors", (_slug, spec) => {
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    expect(html).toContain("ns-site");
    expect(html).toContain(`--ns-primary:${spec.theme.primary}`);
    // Nomes com "&" ou apóstrofo saem escapados no HTML.
    expect(html).toContain(spec.business.name.replace("&", "&amp;").replace("'", "&#x27;"));
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

  it.each(Composition.options)(
    "shows no trust badges unless the owner confirmed them (%s)",
    (composition) => {
      const spec = {
        ...base,
        design: { composition },
        business: { ...base.business, highlights: undefined },
      };
      const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
      for (const claim of ["Licensed", "Insured", "Guaranteed", "Same-Day", "Free estimate"]) {
        expect(html).not.toContain(claim);
      }
    },
  );

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

  it("credits licensed example photos even when they are local files", () => {
    const image: SiteImage = {
      ...scene,
      url: "/photos/models/example-1.webp",
      source: "upload",
      credit: { name: "Ana Lee", url: "https://www.flickr.com/photos/ana/1" },
    };
    const html = renderToStaticMarkup(<SiteRenderer spec={withHeroImage(image)} />);
    expect(html).toContain("Ana Lee");
    expect(html).toContain('href="https://www.flickr.com/photos/ana/1"');
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
    expect(html).not.toContain("Photo by");
    expect(html).not.toContain("Photo:");
  });

  it("renders the owner's gallery with lazy images and a default title", () => {
    const html = renderToStaticMarkup(
      <SiteRenderer spec={withGallery([owner(1), owner(2), owner(3)])} />,
    );
    // Título padrão do ramo (serviços para casa: "Recent jobs").
    expect(html).toContain(">Recent jobs</h2>");
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
      <SiteRenderer spec={withGallery([owner(1)], "Bathrooms we remodeled")} />,
    );
    expect(html).toContain(">Bathrooms we remodeled</h2>");
    expect(html).not.toContain(">Recent jobs</h2>");
  });

  const variants: [Composition, GalleryVariant][] = [
    ["service-led", "grid"],
    ["editorial", "sheet"],
    ["immersive", "wall"],
    ["typographic", "grid"],
    ["modular", "tiles"],
  ];
  it.each(variants)(
    "%s shows the gallery as %s, with the owner's captions",
    (composition, variant) => {
      const images = [1, 2, 3].map((n) => ({
        ...owner(n),
        caption: `Job ${n} · Round Rock · 2025`,
      }));
      const spec = { ...withGallery(images), design: { composition } };
      const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
      expect(html).toContain(`data-gallery="${variant}"`);
      expect(html).toContain("Job 2 · Round Rock · 2025");
      // Fotos do dono ficam fora dos filtros de preto e branco/véu de cor.
      expect(html.match(/data-kind="owner"/g)).toHaveLength(3);
    },
  );

  it("numbers the photos of a contact sheet", () => {
    const spec = {
      ...withGallery([owner(1), owner(2)]),
      design: { composition: "editorial" as const },
    };
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    expect(html).toMatch(/>01<\/span>/);
    expect(html).toMatch(/>02<\/span>/);
  });

  it("hides the gallery (and its menu link) when there are no owner photos", () => {
    // Sem a foto do topo (o exemplo tem uma), qualquer <img> seria da galeria.
    const heroWithoutPhoto = withHeroImage(undefined);
    for (const images of [[], [scene]]) {
      const spec: SiteSpec = {
        ...heroWithoutPhoto,
        sections: [...heroWithoutPhoto.sections, { type: "gallery", images }],
      };
      const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
      expect(html).not.toContain('id="work"');
      expect(html).not.toContain('href="#work"');
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

describe("compositions", () => {
  const plumbing = fixtures["joes-plumbing"];

  it("keeps the old layout for sites without a design plan", () => {
    const old: SiteSpec = { ...plumbing, design: undefined };
    const html = renderToStaticMarkup(<SiteRenderer spec={old} />);
    expect(html).toContain('data-composition="service-led"');
  });

  it.each(Composition.options)(
    "%s renders every section, one h1 and a working call link",
    (composition) => {
      const spec = { ...plumbing, design: { composition } };
      const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
      expect(html).toContain(`data-composition="${composition}"`);
      expect(html.match(/<h1/g)).toHaveLength(1);
      expect(html).toContain('href="tel:5125550142"');
      expect(html).toContain('id="services"');
      expect(html).toContain('id="faq"');
      expect(html).toContain('id="contact"');
      // Nenhuma composição repete âncoras.
      const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
      expect(new Set(ids).size).toBe(ids.length);
    },
  );

  it.each(Composition.options)(
    "%s works without a photo, phone or contact section",
    (composition) => {
      const spec = {
        ...plumbing,
        design: { composition },
        business: { name: "Quiet Studio" },
        sections: plumbing.sections
          .filter((s) => s.type !== "contact")
          .map((s) => (s.type === "hero" ? { ...s, image: undefined } : s)),
      };
      const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
      expect(html).toContain("Quiet Studio");
      expect(html).not.toContain("tel:");
      expect(html).not.toContain("<img");
    },
  );

  it("applies density and photo treatment from the plan", () => {
    const spec = {
      ...plumbing,
      design: {
        composition: "editorial" as const,
        density: "airy" as const,
        imageTreatment: "monochrome" as const,
      },
    };
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    expect(html).toContain('data-density="airy"');
    expect(html).toContain('data-image="monochrome"');
    expect(html).toContain("ns-photo");
  });

  it("puts the phone first only when calling is the main action", () => {
    const callFirst = renderToStaticMarkup(
      <SiteRenderer
        spec={{ ...plumbing, design: { composition: "editorial", primaryAction: "call" } }}
      />,
    );
    const ctaFirst = renderToStaticMarkup(
      <SiteRenderer
        spec={{ ...plumbing, design: { composition: "editorial", primaryAction: "quote" } }}
      />,
    );
    const hero = (html: string) =>
      html.slice(html.indexOf("<h1"), html.indexOf("</section>", html.indexOf("<h1")));
    expect(hero(callFirst).indexOf("tel:")).toBeLessThan(hero(callFirst).indexOf("#contact"));
    expect(hero(ctaFirst).indexOf("#contact")).toBeLessThan(hero(ctaFirst).indexOf("tel:"));
  });
});

describe("miniaturas dentro de outra página", () => {
  it.each(Composition.options)("%s sem âncoras não cria ids de seção", (composition) => {
    const spec = { ...fixtures["joes-plumbing"], design: { composition } };
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} anchors={false} />);
    for (const id of ["top", "services", "faq", "contact", "reviews", "work"]) {
      expect(html).not.toContain(`id="${id}"`);
    }
  });
});

describe("model sites", () => {
  it.each(Composition.options)("%s renders the about section with its people", (composition) => {
    const spec: SiteSpec = { ...fixtures["joes-plumbing"], design: { composition } };
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    expect(html).toContain('id="about"');
    expect(html).toContain('href="#about"');
    expect(html).toContain(">About us</h2>");
    expect(html).toContain("Maria Ramirez");
  });

  it("never shows a stock photo as the team in the about section", () => {
    const base = fixtures["hale-ortiz"];
    const stock: SiteImage = {
      url: "https://images.pexels.com/photos/9/office.jpeg",
      alt: "An office",
      source: "pexels",
      kind: "scene",
    };
    const spec: SiteSpec = {
      ...base,
      sections: base.sections.map((s) => (s.type === "about" ? { ...s, image: stock } : s)),
    };
    expect(renderToStaticMarkup(<SiteRenderer spec={spec} />)).not.toContain(stock.url);
  });

  it("groups a price list and shows the owner's prices", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={fixtures["glow-salon"]} />);
    for (const group of ["Cut &amp; style", "Color", "Treatments"]) {
      expect(html).toContain(`>${group}</h3>`);
    }
    expect(html).toContain("from $220");
    expect(html).toContain("tabular-nums");
  });

  it("sends the main button to the owner's booking link, in a new tab", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={fixtures["glow-salon"]} />);
    expect(html).toContain(
      'href="https://book.glowsalon.example.com" target="_blank" rel="noopener"',
    );
  });

  it("shows the street address with a Google Maps link and says Find us", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={fixtures["rosas-kitchen"]} />);
    expect(html).toContain("2196 Logan Ave");
    expect(html).toContain("https://www.google.com/maps/search/?api=1&amp;query=");
    expect(html).toContain("Find us");
    expect(html).not.toContain("Service area");
  });

  it("lists the towns served before the contact section", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={fixtures["joes-plumbing"]} />);
    const towns = html.indexOf(">Cedar Park</li>");
    expect(towns).toBeGreaterThan(-1);
    expect(towns).toBeLessThan(html.indexOf('id="contact"'));
  });

  it("uses the contact form preset of each business type", () => {
    const cases: [keyof typeof fixtures, string][] = [
      ["joes-plumbing", "Where is the job?"],
      ["glow-salon", "Preferred day and time"],
      ["rosas-kitchen", "Number of guests"],
      ["hale-ortiz", "What do you need help with?"],
      ["vega-photo", "Venue or location"],
    ];
    for (const [slug, label] of cases) {
      const html = renderToStaticMarkup(<SiteRenderer spec={fixtures[slug]} />);
      expect(html).toContain(label);
      // Os campos extras vão no `message`: nada de campo novo na API.
      expect(html).toMatch(/name="x_[a-z]+"/);
    }
  });

  it("puts the call on the wide mobile button only when calling is the main action", () => {
    const bar = (html: string) => html.slice(html.indexOf('aria-label="Quick contact"'));
    const call = bar(renderToStaticMarkup(<SiteRenderer spec={fixtures["joes-plumbing"]} />));
    expect(call).toContain("Call (512) 555-0142");
    const book = bar(renderToStaticMarkup(<SiteRenderer spec={fixtures["glow-salon"]} />));
    expect(book).toContain(">Book an appointment</a>");
    expect(book).toContain('aria-label="Call (305) 555-0187"');
  });

  it("keeps fixed claims, fake maps and star ratings out of the templates", () => {
    for (const spec of Object.values(fixtures)) {
      const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
      expect(html).not.toContain("5 out of 5 stars");
      expect(html).not.toContain("Service area map");
      expect(html).not.toContain("✓");
    }
  });
});

describe("foldMessage", () => {
  it("puts the extra fields before the message, one line each", () => {
    expect(
      foldMessage(
        [
          { label: "Event date", value: "2026-11-07" },
          { label: "Where is the job?", value: " 78704 " },
          { label: "Number of guests", value: "" },
        ],
        "Taco bar, please.",
      ),
    ).toBe("Event date: 2026-11-07\nWhere is the job: 78704\n\nTaco bar, please.");
    expect(foldMessage([], "  Hi  ")).toBe("Hi");
    expect(foldMessage([{ label: "Service", value: "Blowout" }], "")).toBe("Service: Blowout");
  });
});
