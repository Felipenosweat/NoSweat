import { fixtures } from "@nosweat/fixtures";
import { SiteSpec, type TemplateId } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import {
  composeBrief,
  EMPTY_CHOICES,
  EMPTY_FIELDS,
  type CreateChoices,
  type CreateFields,
} from "@/app/(dashboard)/create/brief";
import { readBrief } from "../design";
import { generateSiteSpec } from "./index";
import { MockGenerator, templateModeChoice } from "./mock";
import { lintFill } from "./model-fill";
import { modelBySlug, modelFor, templateFor } from "./models";
import {
  GENERIC_PROFILE,
  PROFILES,
  TEMPLATE_COPY,
  profileFor,
  templateFill,
  type TemplateProfile,
} from "./template-mode";

// Produção roda SEM chave de IA: o site sai do "modo modelo". Estes testes passam o pedido
// exatamente como o /create monta (composeBrief) pelo gerador de produção.

const brief = (fields: Partial<CreateFields>, choices: CreateChoices = EMPTY_CHOICES) =>
  composeBrief({ ...EMPTY_FIELDS, ...fields }, choices);

const generator = new MockGenerator({ delayMs: 0, templateMode: true });
const build = (text: string) => generateSiteSpec(text, generator, { photos: true });

const servicesOf = (spec: SiteSpec) =>
  spec.sections.flatMap((section) =>
    section.type === "services" ? section.items.map((item) => item.name) : [],
  );
const titleOf = (spec: SiteSpec, type: SiteSpec["sections"][number]["type"]) =>
  spec.sections.find((section) => section.type === type)?.title;
const heroOf = (spec: SiteSpec) => {
  const hero = spec.sections.find((section) => section.type === "hero");
  if (!hero || hero.type !== "hero") throw new Error("no hero");
  return hero;
};

/** Textos genéricos nossos (podem coincidir com um texto de modelo sem problema). */
const OUR_TEXTS = new Set([
  ...[...PROFILES, GENERIC_PROFILE].flatMap((p) => [p.hero.title, ...p.services.map(([n]) => n)]),
  ...Object.values(TEMPLATE_COPY).flatMap((copy) => Object.values(copy.titles)),
]);

/** Textos específicos do site-modelo: nomes de serviço, títulos de seção e o topo. */
function modelTexts(model: SiteSpec): Set<string> {
  const texts: string[] = [];
  for (const section of model.sections) {
    if (section.title) texts.push(section.title);
    if (section.type === "hero") texts.push(section.subtitle, section.ctaLabel);
    if (section.type === "services") {
      for (const item of section.items) texts.push(item.name, item.description);
    }
  }
  return new Set(texts.filter((text) => !OUR_TEXTS.has(text)));
}

type Case = {
  label: string;
  fields: Partial<CreateFields>;
  choices?: CreateChoices;
  template: TemplateId;
  profile: string;
  /** Slug do modelo esperado (quando importa). */
  model?: string;
  name: string;
  phone?: string;
  city?: string;
  state?: string;
  serviceArea?: string;
  /** Serviços esperados; sem isto, os genéricos do tipo. */
  services?: string[];
};

const CASES: Case[] = [
  {
    label: "plumber in Austin",
    fields: {
      name: "Lone Star Plumbing",
      what: "Plumbing repairs, drain cleaning and water heater installs",
      city: "Austin",
      state: "TX",
      serviceArea: "Austin, Round Rock and Cedar Park",
      phone: "512-555-0177",
    },
    template: "home-services",
    profile: "plumbing",
    name: "Lone Star Plumbing",
    phone: "(512) 555-0177",
    city: "Austin",
    state: "TX",
    serviceArea: "Austin, Round Rock and Cedar Park",
    services: ["Plumbing Repairs", "Drain Cleaning", "Water Heater Installs"],
  },
  {
    label: "barber in McAllen",
    fields: {
      name: "Valley Cuts",
      what: "Fades, beard trims and kids cuts",
      city: "McAllen",
      state: "TX",
      phone: "(956)555-0110",
    },
    template: "beauty",
    profile: "barber",
    name: "Valley Cuts",
    phone: "(956) 555-0110",
    city: "McAllen",
    state: "TX",
    services: ["Fades", "Beard Trims", "Kids Cuts"],
  },
  {
    label: "realtor in St. Louis",
    fields: {
      name: "Gateway Realty Group",
      what: "Helping families buy and sell homes",
      city: "St. Louis",
      state: "MO",
      phone: "+1 314 555 0199",
    },
    template: "professional",
    profile: "real-estate",
    name: "Gateway Realty Group",
    phone: "(314) 555-0199",
    city: "St. Louis",
    state: "MO",
  },
  {
    label: "yoga studio in Winston-Salem",
    fields: {
      name: "Twin City Yoga",
      what: "Yoga classes for all levels",
      city: "Winston-Salem",
      state: "NC",
      phone: "336.555.0123",
    },
    template: "beauty",
    profile: "yoga",
    model: "still-water-spa",
    name: "Twin City Yoga",
    phone: "(336) 555-0123",
    city: "Winston-Salem",
    state: "NC",
  },
  {
    label: "a business that fits no category",
    fields: {
      name: "Bright Ideas Co.",
      what: "Custom gift baskets and party favors",
      city: "Boise",
      state: "ID",
      phone: "2085550177",
    },
    template: "professional",
    profile: "other",
    model: "keystone-insurance",
    name: "Bright Ideas Co.",
    phone: "(208) 555-0177",
    city: "Boise",
    state: "ID",
    services: ["Custom Gift Baskets", "Party Favors", "What we do"],
  },
  {
    label: "a wellness business that fits no category",
    fields: { what: "Wellness coaching and meditation", city: "Austin", state: "TX" },
    template: "professional",
    profile: "other",
    model: "keystone-insurance",
    name: "Austin Company",
    city: "Austin",
    state: "TX",
    services: ["Wellness Coaching", "Meditation", "What we do"],
  },
  {
    label: "taco food truck (not barbecue)",
    fields: {
      name: "Taco Loco",
      what: "Street tacos and burritos from our food truck",
      city: "Fresno",
      state: "CA",
    },
    template: "restaurant",
    profile: "food-truck",
    model: "rosas-kitchen",
    name: "Taco Loco",
    city: "Fresno",
    state: "CA",
  },
  {
    label: "barbecue food truck",
    fields: {
      name: "Smokin' Joe's",
      what: "Brisket, ribs and pulled pork",
      details: "We run a food truck downtown.",
      city: "Kansas City",
      state: "KS",
    },
    template: "restaurant",
    profile: "bbq",
    model: "smoke-and-rail-bbq",
    name: "Smokin' Joe's",
    city: "Kansas City",
    state: "KS",
    services: ["Brisket", "Ribs", "Pulled Pork"],
  },
  {
    label: "gym in Denver",
    fields: {
      name: "Iron Will Fitness",
      what: "Personal training, group classes and nutrition coaching",
      city: "Denver",
      state: "CO",
    },
    template: "beauty",
    profile: "fitness",
    name: "Iron Will Fitness",
    city: "Denver",
    state: "CO",
    services: ["Personal Training", "Group Classes", "Nutrition Coaching"],
  },
  {
    label: "pet groomer in Tampa",
    fields: { what: "Dog grooming, nail trims and baths", city: "Tampa", state: "FL" },
    template: "beauty",
    profile: "pet-grooming",
    name: "Tampa Pet Grooming",
    city: "Tampa",
    state: "FL",
    services: ["Dog Grooming", "Nail Trims", "Baths"],
  },
  {
    label: "auto repair shop",
    fields: {
      name: "Rio Grande Auto",
      what: "Brakes, oil changes and engine diagnostics",
      city: "Albuquerque",
      state: "NM",
    },
    template: "home-services",
    profile: "auto-repair",
    name: "Rio Grande Auto",
    city: "Albuquerque",
    state: "NM",
    services: ["Brakes", "Oil Changes", "Engine Diagnostics"],
  },
  {
    label: "HVAC company",
    fields: {
      name: "Polar Air",
      what: "AC repair, furnace tune-ups and heat pump installs",
      city: "Tulsa",
      state: "OK",
    },
    template: "home-services",
    profile: "hvac",
    name: "Polar Air",
    city: "Tulsa",
    state: "OK",
    services: ["AC Repair", "Furnace Tune-ups", "Heat Pump Installs"],
  },
  {
    label: "roofer without a list",
    fields: { name: "Summit Roofing", what: "Roofing contractor", city: "Omaha", state: "NE" },
    template: "home-services",
    profile: "roofing",
    name: "Summit Roofing",
    city: "Omaha",
    state: "NE",
  },
  {
    label: "tutor",
    fields: {
      name: "Bright Minds Tutoring",
      what: "Math tutoring, reading help and SAT prep",
      city: "Raleigh",
      state: "NC",
    },
    template: "professional",
    profile: "tutoring",
    name: "Bright Minds Tutoring",
    city: "Raleigh",
    state: "NC",
    services: ["Math Tutoring", "Reading Help", "SAT Prep"],
  },
  {
    label: "chiropractor",
    fields: {
      name: "Align Chiropractic",
      what: "Chiropractic care for back and neck pain",
      city: "Spokane",
      state: "WA",
    },
    template: "professional",
    profile: "chiropractor",
    name: "Align Chiropractic",
    city: "Spokane",
    state: "WA",
  },
  {
    label: "cleaner who caters to busy families",
    fields: {
      name: "Tidy Nest",
      what: "House cleaning",
      details: "We cater to busy families and pet owners.",
      city: "Columbus",
      state: "OH",
    },
    template: "home-services",
    profile: "cleaning",
    name: "Tidy Nest",
    city: "Columbus",
    state: "OH",
    services: ["House Cleaning"],
  },
  {
    label: "the business kind picked in the wizard wins",
    fields: { name: "Studio Nine", what: "Cuts and color", city: "Reno", state: "NV" },
    choices: { kind: "beauty", layout: "auto" },
    template: "beauty",
    // Nada no texto aponta um tipo de beleza: fica o genérico de beleza.
    profile: "beauty",
    name: "Studio Nine",
    city: "Reno",
    state: "NV",
    services: ["Cuts", "Color"],
  },
];

describe("template mode with real /create briefs", () => {
  it.each(CASES)("$label", async (c) => {
    const text = brief(c.fields, c.choices);
    const { profile, model } = templateModeChoice(text);
    expect(profile.id).toBe(c.profile);
    expect(profile.template).toBe(c.template);
    if (c.model) expect(model).toBe(modelBySlug(c.model)?.spec);
    // Sem categoria clara, nunca o encanador.
    if (c.template !== "home-services") expect(model).not.toBe(fixtures["joes-plumbing"]);

    const spec = await build(text);
    expect(SiteSpec.safeParse(spec).success).toBe(true);
    expect(spec.template).toBe(c.template);
    expect(spec.business.name).toBe(c.name);
    expect(spec.business.phone).toBe(c.phone);
    expect(spec.business.city).toBe(c.city);
    expect(spec.business.state).toBe(c.state);
    expect(spec.business.serviceArea).toBe(c.serviceArea);
    expect(spec.business.category).toBe(profile.category);

    // Serviços: os que o dono digitou (completados até 3), senão os genéricos do tipo.
    const services = servicesOf(spec);
    if (c.services && c.services.length >= 3) expect(services).toEqual(c.services);
    else if (c.services) expect(services.slice(0, c.services.length)).toEqual(c.services);
    else expect(services).toEqual(profile.services.map(([name]) => name));

    // Títulos genéricos do ramo: nada do modelo ("Visit us on Logan Ave", "Book a free...").
    const titles = TEMPLATE_COPY[c.template].titles;
    expect(titleOf(spec, "services")).toBe(titles.services);
    expect(titleOf(spec, "faq")).toBe(titles.faq);
    expect(titleOf(spec, "contact")).toBe(titles.contact);
    const leaked = modelTexts(model);
    // O que o dono digitou pode coincidir com um serviço do modelo (é dele, vale).
    for (const name of services) {
      if (!c.services?.includes(name)) expect(leaked.has(name)).toBe(false);
    }
    for (const section of spec.sections) {
      if (section.title) expect(leaked.has(section.title)).toBe(false);
    }
    const hero = heroOf(spec);
    expect(leaked.has(hero.title)).toBe(false);
    expect(leaked.has(hero.subtitle)).toBe(false);
    // Nenhum fato do modelo (nome, telefone) passa para o site do cliente.
    expect(JSON.stringify(spec)).not.toContain(model.business.name);
    if (model.business.phone) expect(JSON.stringify(spec)).not.toContain(model.business.phone);

    // Foto do topo: a busca genérica do tipo (portfólio fica só com as fotos do dono).
    if (profile.imageQuery) expect(hero.imageQuery).toBe(profile.imageQuery);

    // O texto passa na mesma checagem de honestidade da IA.
    expect(lintFill(templateFill(text, profile, model), text, model)).toEqual([]);
  });

  it("reads the hours the owner wrote in the details", async () => {
    const text = brief({
      name: "Valley Cuts",
      what: "Fades and beard trims",
      city: "McAllen",
      state: "TX",
      details: "Open Mon–Fri 9 AM – 7 PM, Sat 8 AM – 4 PM. Closed Sunday.",
    });
    const spec = await build(text);
    expect(spec.business.hours).toEqual([
      { days: "Mon–Fri", time: "9 AM – 7 PM" },
      { days: "Sat", time: "8 AM – 4 PM" },
      { days: "Sunday", time: "Closed" },
    ]);
  });

  it("uses the city-based name when the owner gave none, never a generic phrase", async () => {
    const spec = await build("The business does plumbing in Austin, TX. Call 512-555-0142.");
    expect(spec.business.name).toBe("Austin Plumbing");
    expect(spec.business.phone).toBe("(512) 555-0142");
    const nowhere = await build(brief({ what: "Plumbing repairs and drain cleaning" }));
    expect(nowhere.business.name).toBe("Main Street Plumbing");
  });

  it("answers the area question with the owner's service area", async () => {
    const spec = await build(
      brief({ name: "Joe's Plumbing", what: "Plumbing", serviceArea: "Austin and Round Rock" }),
    );
    const faq = spec.sections.find((section) => section.type === "faq");
    expect(JSON.stringify(faq)).toContain("We work in Austin and Round Rock.");
  });
});

describe("generic copy follows rule 8", () => {
  /** Promessas, números, dias e ruas que só o dono pode dizer. */
  const FORBIDDEN =
    /\b(free|emergenc\w*|same[- ]day|24\/7|guarantee\w*|licen[cs]ed|insured|certified|award\w*|years?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b|\d|\$|#/i;
  /** Nome de rua ("Logan Ave", "Washington Ave N"). */
  const STREET = /\b[A-Z][a-z]+ (?:St|Ave|Street|Avenue|Blvd|Rd|Road)\b/;

  const profiles: TemplateProfile[] = [...PROFILES, GENERIC_PROFILE];

  it.each(profiles.map((p) => [p.id, p] as const))("%s has no invented facts", (_id, p) => {
    const texts = [
      p.category,
      p.word,
      p.imageQuery ?? "",
      p.hero.title,
      p.hero.subtitle ?? "",
      p.hero.ctaLabel ?? "",
      ...p.services.flat(),
    ];
    for (const text of texts) {
      expect(text).not.toMatch(FORBIDDEN);
      expect(text).not.toMatch(STREET);
    }
    expect(p.services.length).toBeGreaterThanOrEqual(3);
    expect(p.services.length).toBeLessThanOrEqual(8);
  });

  it.each(Object.entries(TEMPLATE_COPY))("%s copy has no invented facts", (_id, copy) => {
    const texts = [
      copy.subtitle,
      copy.ctaLabel,
      ...copy.notes,
      ...Object.values(copy.titles),
      ...copy.faq(undefined).flatMap((item) => [item.q, item.a]),
    ];
    for (const text of texts) {
      expect(text).not.toMatch(FORBIDDEN);
      expect(text).not.toMatch(STREET);
    }
  });

  it("every typed template has a generic profile", () => {
    for (const template of Object.keys(TEMPLATE_COPY) as TemplateId[]) {
      expect(profiles.some((p) => p.template === template && !p.match)).toBe(true);
      expect(profileFor("Something nobody can classify", template).template).toBe(template);
    }
  });
});

describe("category routing", () => {
  it("keeps unclear briefs out of the plumber model", () => {
    expect(templateFor("We sell things")).toBeNull();
    expect(profileFor("We sell things", null)).toBe(GENERIC_PROFILE);
    expect(templateModeChoice("We sell things").model).not.toBe(fixtures["joes-plumbing"]);
  });

  it.each([
    ["Yoga studio with heated classes", "beauty"],
    ["Pilates reformer classes", "beauty"],
    ["Neighborhood gym and personal training", "beauty"],
    ["Chiropractor for back pain", "professional"],
    ["Day spa with massage and facials", "beauty"],
    // "spa" sem \b casava com "spacious".
    ["Dental clinic with spacious rooms", "professional"],
  ])("%s → %s", (text, template) => {
    expect(templateFor(text)).toBe(template);
  });

  it("does not treat 'we cater to' as a restaurant", () => {
    expect(readBrief("House cleaning. We cater to busy families.").industry).toBe("cleaning");
    expect(readBrief("We cater weddings and corporate events").industry).toBe("food");
  });

  it("picks the category's most generic model when no trade word matches", () => {
    expect(modelFor("home-services", "Roofing contractor")).toBe(fixtures["joes-plumbing"]);
  });
});
