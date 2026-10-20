import { exampleBriefs, fixtures, type FixtureSlug } from "@nosweat/fixtures";
import { SiteSpec } from "@nosweat/schema";
import { describe, expect, it, vi } from "vitest";
import { planDesign } from "../design";
import { AnthropicGenerator, modelFirstEnabled } from "./anthropic";
import { generateSiteSpec } from "./index";
import { MockGenerator } from "./mock";
import { applyModelFill, lintFill, STYLE_THEMES, verifyFacts, type ModelFill } from "./model-fill";
import { ALL_MODELS, CLEANING_MODEL, MODELS, modelFor, templateFor } from "./models";

const SAMPLE_BRIEF =
  "Bright Path Services in Tulsa, OK. Drain cleaning from $275 and water heater repair. Call (918) 555-0100 or hello@brightpath.example.com.";

/** Um fill válido e honesto para SAMPLE_BRIEF (serve para qualquer modelo). */
function sampleFill(overrides: Partial<ModelFill> = {}): ModelFill {
  return {
    hero: {
      title: "Tulsa repairs, explained before we start",
      subtitle: "Tell us what is going on and we will walk you through the options.",
      ctaLabel: "Request an estimate",
      imageQuery: "tools on a workbench",
    },
    services: [
      { name: "Drain cleaning", description: "Clogged sinks and slow drains, cleared." },
      { name: "Water heater repair", description: "Tank water heaters looked at and fixed." },
      { name: "Small repairs", description: "Leaky faucets and running toilets." },
    ],
    faq: [
      { q: "How do I get a price?", a: "Call us and describe the job." },
      { q: "Where do you work?", a: "In and around Tulsa." },
      { q: "Do I need to be home?", a: "Yes, at least at the start." },
    ],
    about: null,
    testimonials: [],
    category: "Plumber",
    business: {
      name: "Bright Path Services",
      phone: "(918) 555-0100",
      email: "hello@brightpath.example.com",
      city: "Tulsa",
      state: "OK",
      prices: [{ service: "drain cleaning", price: "from $275" }],
    },
    ...overrides,
  };
}

/** Fatos de cada modelo que nunca podem aparecer no site de outro negócio. */
function modelFacts(model: SiteSpec): string[] {
  const facts = [model.business.name];
  for (const key of ["phone", "email", "address"] as const) {
    const value = model.business[key];
    if (value) facts.push(value);
  }
  for (const section of model.sections) {
    if (section.type === "about") {
      facts.push(section.body);
      for (const person of section.people ?? []) facts.push(person.name);
    }
    if (section.type === "testimonials") {
      for (const item of section.items) facts.push(item.quote, item.author);
    }
    if (section.type === "services") {
      for (const item of section.items) if (item.price) facts.push(item.price);
    }
    if (section.type === "gallery") {
      for (const image of section.images) facts.push(image.url);
      for (const image of section.images) if (image.caption) facts.push(image.caption);
    }
    if (section.type === "hero" && section.image) facts.push(section.image.url);
  }
  return facts;
}

describe("applyModelFill", () => {
  it.each(Object.keys(fixtures) as FixtureSlug[])(
    "%s: keeps the structure and theme, clears every model fact",
    (slug) => {
      const model = fixtures[slug];
      const fill = sampleFill();
      const spec = applyModelFill(
        model,
        fill,
        planDesign(SAMPLE_BRIEF),
        verifyFacts(fill.business, SAMPLE_BRIEF),
      );
      expect(SiteSpec.safeParse(spec).success).toBe(true);
      expect(spec.template).toBe(model.template);
      expect(spec.theme).toEqual(model.theme);

      const json = JSON.stringify(spec);
      for (const fact of modelFacts(model)) expect(json).not.toContain(fact);
      expect(json).not.toMatch(/555-01(42|87|63|48|19)/);
      expect(spec.business.hours).toBeUndefined();
      expect(spec.business.highlights).toBeUndefined();
      expect(spec.business.links).toBeUndefined();
      expect(spec.business.address).toBeUndefined();

      // Seções vazias saem; a ordem das que ficam é a do modelo.
      const types = spec.sections.map((s) => s.type);
      expect(types).not.toContain("about");
      expect(types).not.toContain("testimonials");
      expect(types).not.toContain("gallery");
      const modelOrder = model.sections.map((s) => s.type).filter((t) => types.includes(t));
      expect(types).toEqual(modelOrder);
      expect(types[0]).toBe("hero");
      expect(types.at(-1)).toBe("contact");
    },
  );

  it("uses the colors and fonts of the style the owner picked", () => {
    const model = MODELS["home-services"];
    const brief = `${SAMPLE_BRIEF}\n\nPreferred layout: modular.\n\nStyle: elegant.`;
    const fill = sampleFill();
    const spec = applyModelFill(model, fill, planDesign(brief), verifyFacts(fill.business, brief));
    expect(spec.theme).toEqual(STYLE_THEMES.elegant);
    expect(spec.theme.font).not.toBe(model.theme.font);
    expect(spec.theme.primary).not.toBe(model.theme.primary);
    // O layout escolhido também vale no caminho a partir do modelo.
    expect(spec.design?.composition).toBe("modular");
  });

  it("has a theme for every style of the /create wizard", () => {
    for (const style of [
      "warm & friendly",
      "clean & professional",
      "bold & local",
      "elegant",
      "simple",
    ]) {
      expect(STYLE_THEMES[style], style).toBeDefined();
    }
  });

  it("never leaves the example's photos, people or quotes behind", () => {
    const spec = applyModelFill(
      fixtures["vega-photo"],
      sampleFill(),
      undefined,
      verifyFacts(sampleFill().business, SAMPLE_BRIEF),
    );
    const hero = spec.sections.find((s) => s.type === "hero");
    expect(hero?.type === "hero" ? hero.image : "x").toBeUndefined();
    // O portfólio não tem busca de foto no modelo (só foto da dona): continua sem.
    expect(hero?.type === "hero" ? hero.imageQuery : "x").toBeUndefined();
    expect(JSON.stringify(spec)).not.toMatch(/unsplash|Marisol|Biltmore/);
  });

  it("attaches the owner's prices to services by name and fills owner facts", () => {
    const base = sampleFill();
    const fill = sampleFill({
      business: {
        ...base.business,
        prices: [...(base.business.prices ?? []), { service: "Water heater repair", price: "$99" }],
      },
    });
    const facts = verifyFacts(fill.business, SAMPLE_BRIEF);
    // "$99" não está no pedido: sai.
    expect(facts.prices).toEqual([{ service: "drain cleaning", price: "from $275" }]);
    const spec = applyModelFill(MODELS["home-services"], fill, undefined, facts);
    const services = spec.sections.find((s) => s.type === "services");
    const items = services?.type === "services" ? services.items : [];
    expect(items[0]?.price).toBe("from $275");
    expect(items[1]?.price).toBeUndefined();
    expect(spec.business).toMatchObject({
      name: "Bright Path Services",
      phone: "(918) 555-0100",
      city: "Tulsa",
      state: "OK",
      category: "Plumber",
    });
  });

  it("keeps about, people and verbatim testimonials when the owner gave them", () => {
    const brief = `${SAMPLE_BRIEF} I'm Dana Fox, I run the shop. "They fixed it in an hour." (Sam K.)`;
    const fill = sampleFill({
      about: {
        body: "Dana Fox runs the shop.",
        people: [{ name: "Dana Fox", role: "Owner" }],
      },
      testimonials: [{ quote: "They fixed it in an hour.", author: "Sam K." }],
    });
    expect(lintFill(fill, brief, MODELS["home-services"])).toEqual([]);
    const spec = applyModelFill(
      MODELS["home-services"],
      fill,
      undefined,
      verifyFacts(fill.business, brief),
    );
    const types = spec.sections.map((s) => s.type);
    expect(types).toContain("about");
    expect(types).toContain("testimonials");
    const about = spec.sections.find((s) => s.type === "about");
    expect(about?.type === "about" ? about.people : []).toEqual([
      { name: "Dana Fox", role: "Owner" },
    ]);
  });
});

describe("verifyFacts", () => {
  it("drops contact details and links that are not in the brief", () => {
    const facts = verifyFacts(
      {
        name: "Bright Path Services",
        phone: "(512) 555-0142",
        email: "service@joesplumbing.example.com",
        city: "Austin",
        state: "TX",
        address: "2196 Logan Ave",
        hours: [{ days: "Mon–Fri", time: "8 AM – 6 PM" }],
        highlights: ["Licensed & insured"],
        links: { booking: "https://book.example.com" },
      },
      SAMPLE_BRIEF,
    );
    expect(facts).toEqual({ name: "Bright Path Services" });
  });

  it("keeps facts written in the brief", () => {
    const brief =
      "Glow Studio at 12 Main St, Miami, Florida. Open Tue–Sat 10 AM – 7 PM. Book at book.glow.example.com. Free consultations.";
    const facts = verifyFacts(
      {
        address: "12 Main St",
        city: "Miami",
        state: "FL",
        hours: [{ days: "Tue–Sat", time: "10 AM – 7 PM" }],
        highlights: ["Free consultations"],
        links: { booking: "https://book.glow.example.com/" },
      },
      brief,
    );
    expect(facts).toMatchObject({
      address: "12 Main St",
      city: "Miami",
      state: "FL",
      highlights: ["Free consultations"],
      links: { booking: "https://book.glow.example.com/" },
    });
    expect(facts.hours).toHaveLength(1);
  });
});

describe("lintFill", () => {
  const withSubtitle = (subtitle: string) =>
    sampleFill({ hero: { ...sampleFill().hero, subtitle } });

  it("accepts an honest fill", () => {
    expect(lintFill(sampleFill(), SAMPLE_BRIEF, MODELS["home-services"])).toEqual([]);
  });

  it.each([
    "Licensed plumbers you can trust.",
    "Fully insured and ready.",
    "Certified technicians.",
    "Every job is guaranteed.",
    "Same-day service across Tulsa.",
    "Open 24/7 for emergencies.",
    "An award-winning team.",
    "Tulsa's #1 plumber.",
    "The best in Tulsa.",
    "Over 15 years of experience.",
    "Service calls are just $49.",
  ])("rejects a claim the owner never made: %s", (subtitle) => {
    expect(lintFill(withSubtitle(subtitle), SAMPLE_BRIEF).length).toBeGreaterThan(0);
  });

  it("accepts the same claims when the owner wrote them", () => {
    const brief = `${SAMPLE_BRIEF} Licensed and insured, 15 years in business, open 24/7, same day service.`;
    const fill = withSubtitle("Licensed and insured, 15 years in business, open 24/7, same day.");
    expect(lintFill(fill, brief)).toEqual([]);
  });

  it("rejects testimonials that are not the owner's words", () => {
    const fill = sampleFill({ testimonials: [{ quote: "Best plumber ever.", author: "Ann B." }] });
    const errors = lintFill(fill, SAMPLE_BRIEF);
    expect(errors.some((e) => e.startsWith("testimonials[0]"))).toBe(true);
  });

  it("rejects facts copied from the example site", () => {
    const fill = withSubtitle("Call and you talk to Joe or Maria, not a call center.");
    const errors = lintFill(fill, SAMPLE_BRIEF, MODELS["home-services"]);
    expect(errors.join(" ")).toMatch(/Joe|Maria/);
  });

  it("rejects numbers in service details that the owner never gave", () => {
    const fill = sampleFill({
      services: [
        { name: "Drain cleaning", description: "Cleared.", detail: "45 min" },
        ...sampleFill().services.slice(1),
      ],
    });
    expect(lintFill(fill, SAMPLE_BRIEF)).toHaveLength(1);
  });
});

describe("models", () => {
  it.each([
    ["Plumbing and drains in Austin", "home-services"],
    ["Hair salon in Miami", "beauty"],
    ["Family taqueria in San Diego", "restaurant"],
    ["Bookkeeping and tax prep for small businesses", "professional"],
    ["Wedding photographer in Asheville", "portfolio"],
    ["Day spa with massage and facials", "beauty"],
    ["We sell things", null],
  ])("%s → %s", (brief, template) => {
    expect(templateFor(brief)).toBe(template);
  });

  it("uses the cleaning model for cleaning briefs", () => {
    expect(modelFor("home-services", "House cleaning in Worcester")).toBe(CLEANING_MODEL);
    expect(modelFor("home-services", "Roofing contractor")).toBe(MODELS["home-services"]);
  });

  it("picks the closest model of the category by trade words", () => {
    const pick = (template: Parameters<typeof modelFor>[0], brief: string) =>
      modelFor(template, brief).business.name;
    expect(pick("beauty", "Barbershop in Chicago, fades and beard trims")).toMatch(/fade/i);
    expect(pick("restaurant", "Wood-fired pizza place in Brooklyn")).toMatch(/pizza/i);
    expect(pick("professional", "Family dental office, cleanings and whitening")).toMatch(
      /dental/i,
    );
    expect(pick("portfolio", "Tattoo studio, custom fine line work")).toMatch(/tattoo/i);
    expect(pick("home-services", "Electrician for panel upgrades and EV chargers")).toMatch(
      /electric/i,
    );
  });

  it("has 5 or more models in every category", () => {
    for (const template of Object.keys(MODELS) as (keyof typeof MODELS)[]) {
      expect(
        ALL_MODELS.filter((model) => model.category === template).length,
      ).toBeGreaterThanOrEqual(5);
    }
  });

  it.each(Object.keys(exampleBriefs) as FixtureSlug[])(
    "%s: the mock builds a valid site from the brief through the model",
    async (slug) => {
      const spec = await generateSiteSpec(exampleBriefs[slug], new MockGenerator({ delayMs: 0 }));
      expect(SiteSpec.safeParse(spec).success).toBe(true);
      expect(spec.business.name).toBe(fixtures[slug].business.name);
      expect(spec.business.phone).toBe(fixtures[slug].business.phone);
    },
  );
});

describe("AnthropicGenerator, model-first", () => {
  type Client = ConstructorParameters<typeof AnthropicGenerator>[0];
  type Request = {
    model: string;
    max_tokens: number;
    system: { text: string; cache_control?: unknown }[];
    messages: { content: string }[];
  };
  const clientWith = (parse: (...args: unknown[]) => Promise<unknown>) =>
    ({ messages: { parse } }) as unknown as Client;

  it("is on by default and off with AI_MODEL_FIRST=false", () => {
    expect(modelFirstEnabled(undefined)).toBe(true);
    expect(modelFirstEnabled("true")).toBe(true);
    expect(modelFirstEnabled("false")).toBe(false);
    expect(modelFirstEnabled(" FALSE ")).toBe(false);
  });

  it("builds the site from the model with the cheap model and a cached prompt", async () => {
    const parse = vi.fn(async () => ({ stop_reason: "end_turn", parsed_output: sampleFill() }));
    const generator = new AnthropicGenerator(clientWith(parse), "big-model", "small-model", true);
    const spec = await generator.generateSite(SAMPLE_BRIEF, planDesign(SAMPLE_BRIEF));

    expect(generator.lastPath).toBe("model-first");
    expect(parse).toHaveBeenCalledTimes(1);
    const [request] = parse.mock.calls[0] as unknown as [Request];
    expect(request.model).toBe("small-model");
    expect(request.max_tokens).toBeLessThanOrEqual(2000);
    expect(request.system.every((block) => block.cache_control)).toBe(true);
    expect(request.messages[0]?.content).toContain(SAMPLE_BRIEF);
    expect(spec.business.name).toBe("Bright Path Services");
    expect(JSON.stringify(spec)).not.toContain("Joe");
  });

  it("retries once with the problems, then falls back to the full path", async () => {
    const full = structuredClone(fixtures["joes-plumbing"]);
    const dishonest = sampleFill({
      hero: { ...sampleFill().hero, subtitle: "Licensed, insured and guaranteed." },
    });
    const parse = vi
      .fn<(...args: unknown[]) => Promise<unknown>>()
      .mockResolvedValueOnce({ stop_reason: "end_turn", parsed_output: { not: "a fill" } })
      .mockResolvedValueOnce({ stop_reason: "end_turn", parsed_output: dishonest })
      .mockResolvedValueOnce({ stop_reason: "end_turn", parsed_output: full });
    const generator = new AnthropicGenerator(clientWith(parse), "big-model", "small-model", true);
    const spec = await generator.generateSite(SAMPLE_BRIEF);

    expect(parse).toHaveBeenCalledTimes(3);
    const requests = parse.mock.calls.map((call) => call[0] as Request);
    expect(requests.map((r) => r.model)).toEqual(["small-model", "small-model", "big-model"]);
    expect(requests[1]?.messages[0]?.content).toContain("<problems>");
    expect(generator.lastPath).toBe("full");
    expect(spec).toEqual(full);
  });

  it("falls back right away when the cheap model declines", async () => {
    const full = structuredClone(fixtures["glow-salon"]);
    const parse = vi
      .fn<(...args: unknown[]) => Promise<unknown>>()
      .mockResolvedValueOnce({ stop_reason: "refusal", stop_details: null, parsed_output: null })
      .mockResolvedValueOnce({ stop_reason: "end_turn", parsed_output: full });
    const generator = new AnthropicGenerator(clientWith(parse), "big-model", "small-model", true);
    expect(await generator.generateSite("Hair salon in Miami")).toEqual(full);
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("skips the cheap path when the category is unclear", async () => {
    const full = structuredClone(fixtures["joes-plumbing"]);
    const parse = vi.fn(async () => ({ stop_reason: "end_turn", parsed_output: full }));
    const generator = new AnthropicGenerator(clientWith(parse), "big-model", "small-model", true);
    await generator.generateSite("We sell things");
    expect(parse).toHaveBeenCalledTimes(1);
    expect((parse.mock.calls[0] as unknown as [Request])[0].model).toBe("big-model");
  });
});
