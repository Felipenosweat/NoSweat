import { fixtures, MODEL_LIBRARY } from "@nosweat/fixtures";
import { Composition, type SiteImage, type SiteSpec } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteRenderer } from "../../SiteRenderer";

const glow = fixtures["glow-salon"];
const render = (spec: SiteSpec, props: { bookingEndpoint?: string; bookingDemo?: boolean } = {}) =>
  renderToStaticMarkup(<SiteRenderer spec={spec} {...props} />);

const owner = (n: number, width = 1600, height = 1067): SiteImage => ({
  url: `https://cdn.example.com/owner-${n}.jpg`,
  alt: `Hair ${n}`,
  source: "upload",
  kind: "owner",
  width,
  height,
});

const withGallery = (images: SiteImage[]): SiteSpec => ({
  ...glow,
  sections: [
    ...glow.sections.filter((section) => section.type !== "gallery"),
    { type: "gallery", images },
  ],
});

describe("soft composition (beauty)", () => {
  it.each(Composition.options)("is used for beauty whatever design.composition says (%s)", (c) => {
    const html = render({ ...glow, design: { ...glow.design, composition: c } });
    expect(html).toContain('data-composition="soft"');
    expect(html).toContain('class="ns-soft"');
  });

  it("leaves the other templates alone", () => {
    const html = render(fixtures["joes-plumbing"]);
    expect(html).not.toContain("ns-soft");
    expect(html).not.toContain('data-composition="soft"');
  });

  it("renders hero, tiles, services, about, faq, contact, footer and the dock", () => {
    const html = render(glow);
    expect(html.match(/<h1/g)).toHaveLength(1);
    for (const marker of [
      "ns-s-hero",
      "Popular services",
      'id="services"',
      'id="about"',
      'id="faq"',
      'id="contact"',
      "ns-s-footer",
      'aria-label="Quick links"',
    ]) {
      expect(html).toContain(marker);
    }
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every piece of content visible by default (no reveal states)", () => {
    // O campo-isca anti-robô do formulário usa opacity-0 de propósito: fica de fora da conferência.
    const html = render(glow, { bookingDemo: true }).replace(/<input[^>]*ns_hp[^>]*>/g, "");
    expect(html).not.toMatch(
      /data-ns-(rise|fade|stagger|reveal|words|parallax|zoom|hscroll|magnetic)/,
    );
    expect(html).not.toContain("opacity-0");
    expect(html).not.toContain("ns-intro");
  });

  it("gives every + button a name and shows the Ask pill for services without a price", () => {
    for (const html of [render(glow), render(glow, { bookingDemo: true })]) {
      const plus = (html.match(/<a\s[^>]*class="ns-s-plus"[^>]*>/g) ?? []) as string[];
      expect(plus.length).toBe(6);
      for (const tag of plus) expect(tag).toMatch(/aria-label="(Book|Call to book) /);
      expect(html).toContain("ns-s-plus ns-s-plus--ask");
      expect(html).toContain("Ask<span");
    }
  });

  it("points the + buttons at #book only when booking is live", () => {
    const off = render(glow);
    expect(off).not.toContain('href="#book"');
    expect(off).not.toContain('id="book"');
    expect(off).toContain('aria-label="Book Balayage"');
    const on = render(glow, { bookingEndpoint: "/api/public/booking/site-1" });
    expect(on).toContain('id="book"');
    expect(on).toContain('href="#book"');
    expect(on).toContain("Book your next visit");
  });

  it("shows the demo booking block only in demo mode", () => {
    const demo = render(glow, { bookingDemo: true });
    expect(demo).toContain("ns-s-bookwrap");
    expect(demo).toContain("Example times, for this demo only.");
    expect(render(glow)).not.toContain("ns-s-bookwrap");
  });

  it("hides the banner when there is nothing to book", () => {
    const base = glow.business;
    const spec: SiteSpec = { ...glow, business: { ...base, links: undefined } };
    expect(render(spec)).not.toContain("Book your next visit");
  });

  it("never invents ratings, stars or popularity numbers", () => {
    const html = render(glow, { bookingDemo: true });
    expect(html).not.toMatch(/★|☆|\bstars?\b|\bratings?\b|\btop rated\b|\bopen now\b|\d\.\d\s*\(/i);
  });

  it("drops the dock slots that have no data", () => {
    const dock = (html: string) => html.slice(html.indexOf('aria-label="Quick links"'));
    const full = dock(render(glow));
    expect(full).toContain("<span>Call</span>");
    const noPhone: SiteSpec = { ...glow, business: { ...glow.business, phone: undefined } };
    const html = dock(render(noPhone));
    expect(html).not.toContain("<span>Call</span>");
    expect(html).toContain("<span>Services</span>");
    const bare: SiteSpec = {
      ...glow,
      business: { ...glow.business, phone: undefined, links: undefined },
    };
    // Só "Home" e "Services" sobram: não vale uma barra.
    expect(render(bare)).not.toContain('aria-label="Quick links"');
  });

  it("has no dock in thumbnails (anchors off)", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={glow} anchors={false} />);
    expect(html).not.toContain("ns-s-dock");
  });

  it("fills the gallery grid with no empty tile, for any photo count", () => {
    for (let count = 1; count <= 12; count++) {
      const images = Array.from({ length: count }, (_, i) => owner(i + 1));
      const html = render(withGallery(images));
      const tiles = html.match(/<li class="ns-s-tile"[^>]*>.*?<\/li>/g) ?? [];
      expect(tiles, `count ${count}`).toHaveLength(count);
      for (const tile of tiles) expect(tile).toContain("<img");
    }
  });

  it("drops gallery photos that are too small", () => {
    const html = render(withGallery([owner(1), owner(2, 400, 300), owner(3)]));
    expect(html.match(/<li class="ns-s-tile"/g)).toHaveLength(2);
    expect(html).not.toContain("owner-2.jpg");
  });

  it("falls back to a tinted panel with service tiles when the hero photo is too small", () => {
    const small: SiteSpec = {
      ...glow,
      sections: glow.sections.map((section) =>
        section.type === "hero" && section.image
          ? { ...section, image: { ...section.image, width: 900, height: 600 } }
          : section,
      ),
    };
    const html = render(small);
    expect(html).toContain('data-media="panel"');
    expect(html).toContain("ns-s-cluster");
  });

  it("never lists an srcset width above the real photo width", () => {
    const sized: SiteSpec = {
      ...glow,
      sections: glow.sections.map((section) =>
        section.type === "hero" && section.image
          ? { ...section, image: { ...section.image, width: 1300, height: 900 } }
          : section,
      ),
    };
    const html = render(sized);
    const hero = html.slice(html.indexOf('data-media="photo"'));
    const srcset = /srcSet="([^"]+)"|srcset="([^"]+)"/.exec(hero);
    expect(srcset?.[1] ?? srcset?.[2]).toContain("1300w");
    expect(srcset?.[1] ?? srcset?.[2]).not.toContain("1600w");
    // Sem zoom nem paralaxe nas fotos.
    expect(html).not.toContain("ns-hero-zoom");
  });

  it("shows initials when a person has no photo, and keeps the owner's testimonials", () => {
    const html = render(glow);
    expect(html).toContain(">CR</span>");
    expect(html).toContain("Natalie R.");
  });

  it("renders every beauty model of the library, light or dark", () => {
    const beauty = MODEL_LIBRARY.filter((entry) => entry.category === "beauty");
    expect(beauty.length).toBeGreaterThan(0);
    for (const entry of beauty) {
      expect(() => render(entry.spec, { bookingDemo: true })).not.toThrow();
      expect(render(entry.spec)).toContain("ns-soft");
    }
  });

  it("works in the editor, with a frame around every section", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={glow} editable />);
    expect(html).toContain('data-section-index="0"');
    expect(html).toContain("Online booking appears here once you turn it on");
  });
});
