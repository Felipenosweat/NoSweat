import { MODEL_LIBRARY, fixtures } from "@nosweat/fixtures";
import type { SiteSpec } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteRenderer } from "../../SiteRenderer";

const render = (spec: SiteSpec, props: { bookingEndpoint?: string; editable?: boolean } = {}) =>
  renderToStaticMarkup(<SiteRenderer spec={spec} {...props} />);

const dockOf = (html: string) => html.slice(html.indexOf('aria-label="Quick links"'));
const dockItems = (html: string) => dockOf(html).match(/ns-s-dock-item/g) ?? [];
const textOf = (html: string) => html.replace(/<[^>]*>/g, " ");

const plumber = fixtures["joes-plumbing"];
const rosa = fixtures["rosas-kitchen"];
const hale = fixtures["hale-ortiz"];
const vega = fixtures["vega-photo"];

describe("soft variant: home services", () => {
  it("sells the call on the first screen: title, Call pill, estimate pill, then the fact card", () => {
    const html = render(plumber);
    const h1 = html.indexOf("<h1");
    const call = html.search(
      /<a href="tel:5125550142" class="ns-s-btn"><span>Call \(512\) 555-0142<\/span>/,
    );
    const estimate = html.indexOf('<a href="#contact" class="ns-v-quiet"><span>Get an estimate');
    const facts = html.indexOf('class="ns-v-facts ns-s-card"');
    expect(h1).toBeGreaterThan(-1);
    expect(call).toBeGreaterThan(h1);
    expect(estimate).toBeGreaterThan(call);
    expect(facts).toBeGreaterThan(estimate);
    for (const label of ["Hours", "Serving", "Phone"]) expect(html).toContain(`${label}</dt>`);
    expect(html).toContain('data-count="3"');
    expect(html).toContain('href="sms:5125550142"');
    // A cor de ação (laranja) vem do tema e só pinta o botão de ligar.
    expect(html).toContain("--v-action:#C2410C");
  });

  it("shows hours only when the owner wrote them (never invents 24/7)", () => {
    const spec: SiteSpec = {
      ...plumber,
      business: { ...plumber.business, hours: undefined, highlights: undefined },
      sections: plumber.sections.map((s) =>
        s.type === "services"
          ? { ...s, items: s.items.map((i) => ({ ...i, detail: undefined })) }
          : s,
      ),
    };
    const html = render(spec);
    expect(html).not.toContain("Hours</dt>");
    expect(textOf(html)).not.toMatch(/24\/7|open now/i);
  });

  it("offers 'Schedule a visit' only when live booking exists", () => {
    expect(render(plumber)).not.toContain("Schedule a visit");
    const booked: SiteSpec = {
      ...plumber,
      sections: [...plumber.sections, { type: "booking", intro: "Pick a time." }],
    };
    const html = render(booked, { bookingEndpoint: "/api/public/booking/site-1" });
    expect(html).toContain("Schedule a visit");
    expect(html).toContain('id="book"');
    expect(render(booked)).not.toContain("Schedule a visit");
  });

  it("has no photo card when the owner has no usable photo", () => {
    const spec: SiteSpec = {
      ...plumber,
      sections: plumber.sections.map((s) => (s.type === "hero" ? { ...s, image: undefined } : s)),
    };
    const html = render(spec);
    expect(html).not.toContain("ns-v-photo");
    expect(html).not.toContain("<img");
    expect(render(plumber)).toContain("ns-v-photo");
  });

  it("lists services as rows with a trade icon tile and an inline Estimate pill", () => {
    const html = render(plumber);
    expect(html.match(/class="ns-v-tile"/g)).toHaveLength(6);
    expect(html.match(/class="ns-v-pill">Estimate/g)).toHaveLength(6);
    // Sem agendamento ligado não há "+" de seleção.
    expect(html).not.toContain("ns-s-plus");
    expect(html).toContain("from $149");
  });

  it("shows the cities as a cloud of chips and a Call / Estimate / Area dock", () => {
    const html = render(plumber);
    expect(html).toContain('<ul class="ns-v-chips">');
    expect(html).toContain("<li>Round Rock</li>");
    expect(html).toContain('id="area"');
    const dock = dockOf(html);
    for (const label of ["Call", "Estimate", "Area"])
      expect(dock).toContain(`<span>${label}</span>`);
    expect(dockItems(html)).toHaveLength(3);
  });

  it("shows the owner's highlights as chips, and none when they wrote none", () => {
    expect(render(plumber)).toContain("<li>Licensed &amp; insured</li>");
    const none: SiteSpec = { ...plumber, business: { ...plumber.business, highlights: undefined } };
    expect(render(none)).not.toContain("Licensed");
  });
});

describe("soft variant: restaurant", () => {
  const withOrder: SiteSpec = {
    ...rosa,
    business: { ...rosa.business, links: { order: "https://order.rosaskitchen.example.com" } },
  };

  it("shows the Order pill only when the owner has an order link", () => {
    const without = render(rosa);
    expect(without).not.toContain("ns-v-pill");
    expect(without).not.toContain("Order online");
    const items = rosa.sections.find((s) => s.type === "services")?.items.length ?? 0;
    const html = render(withOrder);
    expect(html.match(/class="ns-v-pill"/g)).toHaveLength(items);
    expect(html).toContain('href="https://order.rosaskitchen.example.com" target="_blank"');
    expect(html).toContain("Order online");
  });

  it("falls back to Call when there is no order or booking link", () => {
    const html = render(rosa);
    expect(html).toMatch(/<a href="tel:6195550163" class="ns-s-btn"><span>Call \(619\) 555-0163/);
    expect(dockOf(html)).toContain("<span>Call</span>");
  });

  it("opens with an info strip (hours as written, Find us, directions) and no date strip", () => {
    const html = render(rosa);
    expect(html).toContain("Find us</dt>");
    expect(html).toContain("Tue–Sat");
    expect(html).toContain("Directions<span");
    expect(html).toContain("2196 Logan Ave, San Diego, CA 92113");
    expect(html).not.toContain("ns-s-day");
    expect(html).not.toContain("ns-s-times");
  });

  it("makes one card per menu group, with an icon tile for each dish", () => {
    const html = render(rosa);
    expect(html.match(/class="ns-s-card ns-s-list"/g)).toHaveLength(4);
    for (const group of ["Plates", "Tacos", "Sunday brunch", "Catering"]) {
      expect(html).toContain(`>${group}</h3>`);
    }
    expect(html.match(/class="ns-v-tile"/g)).toHaveLength(6);
  });

  it("uses a Menu / Order / Call / Find us dock when there is an order link", () => {
    const html = render(withOrder);
    for (const label of ["Menu", "Order", "Call", "Find us"]) {
      expect(dockOf(html)).toContain(`<span>${label}</span>`);
    }
    expect(dockItems(html)).toHaveLength(4);
  });
});

describe("soft variant: professional", () => {
  it("has a two-slot dock (Book, Call)", () => {
    const html = render(hale);
    expect(dockItems(html)).toHaveLength(2);
    expect(dockOf(html)).toContain("<span>Book</span>");
    expect(dockOf(html)).toContain("<span>Call</span>");
    expect(dockOf(html)).toContain('href="https://haleortiz.example.com/book"');
  });

  it("opens with a typographic hero: one h1, the consult button and the phone", () => {
    const html = render(hale);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("<span>Book a consultation</span>");
    expect(html).toContain("Call (720) 555-0148");
    expect(html).not.toContain("ns-v-photo");
  });

  it("numbers the ways we can help and keeps a quiet pill on each row", () => {
    const html = render(hale);
    expect(html).toContain(">Ways we can help</h2>");
    for (const n of ["01", "02", "03", "04", "05"]) expect(html).toContain(`>${n}</span>`);
    expect(html.match(/class="ns-v-pill"/g)).toHaveLength(5);
  });

  it("opens the first question and keeps the credentials inside the owner's own text", () => {
    const html = render(hale);
    expect(html).toContain('<details class="ns-s-qa" open="">');
    // Só as perguntas (o menu do celular também é um <details>).
    expect(html.match(/<details class="ns-s-qa"/g)).toHaveLength(3);
    expect(html).toContain("CPA, licensed in Colorado");
  });

  it("shows an owner portrait only when the owner has one", () => {
    const portrait: SiteSpec = {
      ...hale,
      sections: hale.sections.map((s) =>
        s.type === "hero"
          ? {
              ...s,
              image: {
                url: "https://cdn.example.com/dana.jpg",
                alt: "Dana Hale at her desk",
                source: "upload" as const,
                kind: "owner" as const,
                width: 1600,
                height: 2000,
              },
            }
          : s,
      ),
    };
    expect(render(portrait)).toContain('data-shape="portrait"');
    const stock: SiteSpec = {
      ...portrait,
      sections: portrait.sections.map((s) =>
        s.type === "hero" && s.image ? { ...s, image: { ...s.image, kind: "scene" as const } } : s,
      ),
    };
    expect(render(stock)).not.toContain("ns-v-photo");
  });
});

describe("soft variant: portfolio", () => {
  const galleryCount = vega.sections.find((s) => s.type === "gallery")?.images.length ?? 0;

  it("puts the gallery right after the hero, even when the spec lists it later", () => {
    const html = render(vega);
    expect(html.indexOf('id="work"')).toBeGreaterThan(html.indexOf('data-v="work"'));
    expect(html.indexOf('id="work"')).toBeLessThan(html.indexOf('id="services"'));

    const reordered: SiteSpec = {
      ...vega,
      sections: [
        ...vega.sections.filter((s) => s.type !== "gallery"),
        ...vega.sections.filter((s) => s.type === "gallery"),
      ],
    };
    const late = render(reordered);
    expect(late.indexOf('id="work"')).toBeLessThan(late.indexOf('id="services"'));
    expect(late.match(/<li class="ns-v-wk"/g)).toHaveLength(galleryCount);
  });

  it("has no empty tile, shows captions as written and keeps the hero photo out of the way", () => {
    const html = render(vega);
    const tiles = html.match(/<li class="ns-v-wk"[^>]*>.*?<\/li>/g) ?? [];
    expect(galleryCount).toBeGreaterThan(0);
    expect(tiles).toHaveLength(galleryCount);
    for (const tile of tiles) expect(tile).toContain("<img");
    expect(html).toContain("Biltmore Estate");
    expect(html).not.toContain("ns-v-photo");
  });

  it("falls back to the hero photo when the gallery has nothing usable", () => {
    const bare: SiteSpec = {
      ...vega,
      sections: vega.sections.filter((s) => s.type !== "gallery"),
    };
    expect(render(bare)).toContain("ns-v-photo");
  });

  it("lists packages with price and an Inquire pill, and a two-slot dock (Inquire, Call)", () => {
    const html = render(vega);
    expect(html.match(/class="ns-v-pill">Inquire/g)).toHaveLength(3);
    expect(html).toContain("from $1,800");
    expect(dockItems(html)).toHaveLength(2);
    expect(dockOf(html)).toContain("<span>Inquire</span>");
    expect(dockOf(html)).toContain("<span>Call</span>");
    expect(html).toContain("Check your date");
  });
});

describe("soft variants: shared rules", () => {
  const all = Object.entries(fixtures);

  it.each(all)("%s never shows stars, ratings or 'popular' claims", (_slug, spec) => {
    expect(textOf(render(spec))).not.toMatch(
      /★|☆|\bstars?\b|\bratings?\b|\bpopular\b|\btop rated\b|\bopen now\b|\bbest in\b/i,
    );
  });

  it.each(all)("%s keeps everything visible by default", (_slug, spec) => {
    // O campo-isca anti-robô do formulário usa opacity-0 de propósito: fica de fora.
    const html = render(spec).replace(/<input[^>]*ns_hp[^>]*>/g, "");
    expect(html).not.toContain("opacity-0");
    expect(html).not.toContain("ns-intro");
    expect(html).not.toMatch(
      /data-ns-(rise|fade|stagger|reveal|words|parallax|zoom|hscroll|magnetic)/,
    );
  });

  it.each(all)(
    "%s has a header, a footer, a main landmark and labeled phone links",
    (_slug, spec) => {
      const html = render(spec);
      expect(html).toContain('<header class="ns-s-header">');
      expect(html).toContain('<footer class="ns-s-footer">');
      expect(html).toContain('<main id="main"');
      if (spec.business.phone) {
        expect(html).toContain(`aria-label="Call ${spec.business.phone}"`);
      }
    },
  );

  it.each(all)("%s sizes every image and loads only the first one eagerly", (_slug, spec) => {
    const images = render(spec).match(/<img[^>]*>/g) ?? [];
    for (const tag of images) {
      expect(tag).toMatch(/ width="\d+"/);
      expect(tag).toMatch(/ height="\d+"/);
      expect(tag).toContain('decoding="async"');
    }
    const eager = images.filter((tag) => tag.includes('loading="eager"'));
    expect(eager.length).toBeLessThanOrEqual(2);
  });

  it.each(all)("%s has no empty gallery tile and no duplicate ids", (_slug, spec) => {
    const html = render(spec);
    const tiles = html.match(/<li class="ns-(?:s-tile|v-wk)"[^>]*>.*?<\/li>/g) ?? [];
    for (const tile of tiles) expect(tile).toContain("<img");
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(all)("%s works in the editor, one frame per section", (_slug, spec) => {
    const html = render(spec, { editable: true });
    for (const index of spec.sections.keys()) {
      expect(html).toContain(`data-section-index="${index}"`);
    }
  });

  it("renders the non-beauty library models with their own theme colors", () => {
    const others = MODEL_LIBRARY.filter((entry) => entry.category !== "beauty");
    expect(others.length).toBeGreaterThan(0);
    for (const entry of others) {
      const html = render(entry.spec);
      expect(html, entry.slug).toContain('data-composition="soft"');
      expect(html, entry.slug).toContain(`--ns-primary:${entry.spec.theme.primary}`);
      expect(html.match(/<h1/g), entry.slug).toHaveLength(1);
    }
  });
});
