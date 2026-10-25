import { fixtures, type FixtureSlug } from "@nosweat/fixtures";
import type { AiEditResult, SiteSpec, TemplateId } from "@nosweat/schema";
import type { DesignPlan } from "../design";
import { applyModelFill, verifyFacts, type ModelFill } from "./model-fill";
import { modelFor, templateFor } from "./models";
import type { SiteGenerator } from "./types";

const RULES: { slug: FixtureSlug; keywords: string[] }[] = [
  { slug: "joes-plumbing", keywords: ["plumb"] },
  { slug: "glow-salon", keywords: ["salon", "beauty", "hair"] },
  { slug: "sparkle-cleaning", keywords: ["clean", "maid", "janitor"] },
  {
    slug: "rosas-kitchen",
    keywords: [
      "restaurant",
      "food",
      "cafe",
      "taqueria",
      "taco",
      "bakery",
      "pizza",
      "kitchen",
      "diner",
    ],
  },
  { slug: "hale-ortiz", keywords: ["bookkeep", "tax", "accountant", "cpa"] },
  { slug: "vega-photo", keywords: ["photograph"] },
];

const DEFAULT_SLUG: FixtureSlug = "joes-plumbing";

/** Busca de foto do topo de cada fixture (com PEXELS_API_KEY, o dev local já mostra foto). */
const IMAGE_QUERIES: Partial<Record<FixtureSlug, string>> = {
  "joes-plumbing": "plumber tools copper pipes",
  "glow-salon": "bright modern hair salon interior",
  "rosas-kitchen": "mexican tacos table warm light",
  "sparkle-cleaning": "cleaning crew bright kitchen",
  "hale-ortiz": "tidy desk ledger notebook",
};

/** Textos genéricos do mock por categoria (nenhum fato: valem para qualquer negócio do ramo). */
const MOCK_COPY: Record<
  TemplateId,
  Pick<ModelFill, "hero" | "faq"> & { word: string; category: string; description: string }
> = {
  "home-services": {
    word: "Home Services",
    category: "Home services",
    description: "Done carefully, explained clearly and cleaned up after.",
    hero: {
      title: "Home repairs and care, done right",
      subtitle: "Tell us what is going on and we will explain the options before any work starts.",
      ctaLabel: "Request an estimate",
    },
    faq: [
      {
        q: "How do I get a price?",
        a: "Send the form or call us and describe the job. We explain the price before we start.",
      },
      { q: "What areas do you work in?", a: "Ask us about your address when you get in touch." },
      {
        q: "Do I need to be home?",
        a: "For most jobs, yes, at least at the start, so we can walk through it together.",
      },
    ],
  },
  beauty: {
    word: "Studio",
    category: "Beauty studio",
    description: "Planned with you at the chair before we start.",
    hero: {
      title: "A look planned with you first",
      subtitle: "Every appointment starts with a conversation about what you want.",
      ctaLabel: "Book an appointment",
    },
    faq: [
      {
        q: "Do I need an appointment?",
        a: "Booking ahead is the best way to get the time you want.",
      },
      {
        q: "How long does a visit take?",
        a: "It depends on the service. We'll tell you when you book.",
      },
      {
        q: "Can I ask questions before booking?",
        a: "Of course. Send the form and we'll get back to you.",
      },
    ],
  },
  restaurant: {
    word: "Kitchen",
    category: "Restaurant",
    description: "Made in our kitchen, served the way we like to eat it.",
    hero: {
      title: "Good food, made in our kitchen",
      subtitle: "Come hungry. Ask us what is good today.",
      ctaLabel: "Plan your visit",
    },
    faq: [
      { q: "Do you take reservations?", a: "Call us or send the form and we'll let you know." },
      {
        q: "Can you cater an event?",
        a: "Tell us the date and how many people, and we'll talk it through.",
      },
      {
        q: "Do you have options for dietary needs?",
        a: "Ask us about any dish and we'll tell you what is in it.",
      },
    ],
  },
  professional: {
    word: "Advisors",
    category: "Professional services",
    description: "Explained in plain words, with a clear next step.",
    hero: {
      title: "Clear answers, from people who listen",
      subtitle: "Start with a conversation about where things stand and what you need.",
      ctaLabel: "Book a consultation",
    },
    faq: [
      { q: "How do we start?", a: "Book a consultation and tell us what is going on." },
      {
        q: "What should I bring?",
        a: "Any documents about your question. We'll tell you if anything else is needed.",
      },
      { q: "Can we meet online?", a: "Ask us when you book and we'll find what works for you." },
    ],
  },
  portfolio: {
    word: "Studio",
    category: "Creative studio",
    description: "Planned together, delivered with care.",
    hero: {
      title: "Work made with care, start to finish",
      subtitle: "Tell me about your project and we'll see if it is a good fit.",
      ctaLabel: "Get in touch",
    },
    faq: [
      { q: "How do we start?", a: "Send the form with a few details about your project." },
      { q: "How far ahead should I book?", a: "As early as you can. Ask me about your date." },
      { q: "Do you travel?", a: "Ask me about your location when you get in touch." },
    ],
  },
};

/** Nome no início da descrição ("Joe's Plumbing in Austin..." → "Joe's Plumbing"). */
function nameFromBrief(brief: string): string | undefined {
  const first = brief.split("\n")[0]?.trim() ?? "";
  const cut = [",", " is ", " in ", " at "]
    .map((sep) => first.indexOf(sep))
    .filter((i) => i > 0)
    .sort((a, b) => a - b)[0];
  const name = (cut === undefined ? "" : first.slice(0, cut)).trim();
  return /^[A-Z]/.test(name) && name.length <= 60 && name.split(" ").length <= 6 ? name : undefined;
}

/**
 * Um ModelFill de mentira, montado só com o que está na descrição (sem IA, sem rede): textos
 * genéricos da categoria, nomes de serviço do modelo e fatos tirados do texto com expressões
 * simples. Passa pelo mesmo applyModelFill da IA de verdade.
 */
export function mockFill(brief: string, model: SiteSpec, slug?: FixtureSlug): ModelFill {
  const copy = MOCK_COPY[model.template];
  const services = model.sections.flatMap((s) => (s.type === "services" ? s.items : []));
  const place = /\b([A-Z][a-z]+(?: [A-Z][a-z]+)*),\s([A-Z]{2})\b/.exec(brief);
  const phone = /\(\d{3}\) \d{3}-\d{4}/.exec(brief)?.[0];
  const email = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.exec(brief)?.[0];
  const testimonials = [...brief.matchAll(/"([^"]{10,300})"\s*\(([^)]{2,60})\)/g)].flatMap((m) =>
    m[1] && m[2] ? [{ quote: m[1], author: m[2] }] : [],
  );
  const imageQuery = slug ? IMAGE_QUERIES[slug] : undefined;
  const name = nameFromBrief(brief);
  const city = place?.[1];
  return {
    hero: { ...copy.hero, ...(imageQuery ? { imageQuery } : {}) },
    services: services.slice(0, 8).map((item) => ({
      name: item.name,
      description: copy.description,
      ...(item.group ? { group: item.group } : {}),
    })),
    faq: copy.faq,
    about: null,
    testimonials: testimonials.slice(0, 6),
    category: copy.category,
    business: {
      name: name ?? (city ? `${city} ${copy.word}` : `Main Street ${copy.word}`),
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      ...(city ? { city } : {}),
      ...(place?.[2] ? { state: place[2] } : {}),
    },
  };
}

/** Escolhe a fixture por palavra-chave no brief (sem acento e sem diferenciar maiúsculas). */
export function selectFixture(brief: string): FixtureSlug {
  const text = brief
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  return RULES.find((rule) => rule.keywords.some((k) => text.includes(k)))?.slug ?? DEFAULT_SLUG;
}

/**
 * Gerador sem IA (não usa rede nem chave).
 * - Dev e testes: parte das 6 fixtures originais, com um atraso para simular a IA.
 * - `templateMode` (produção sem chave de IA): parte do site-modelo mais parecido da biblioteca
 *   inteira (server/ai/models.ts), e mudanças pela IA avisam que a IA ainda não está ligada.
 */
export class MockGenerator implements SiteGenerator {
  constructor(private readonly options: { delayMs?: number; templateMode?: boolean } = {}) {}

  /**
   * Como a geração a partir do modelo: parte do site-modelo e junta um ModelFill de mentira
   * (mockFill) com applyModelFill, que apaga os fatos do modelo.
   */
  async generateSite(brief: string, plan?: DesignPlan): Promise<SiteSpec> {
    const delayMs = this.options.delayMs ?? 1500;
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (this.options.templateMode) {
      const template = templateFor(brief);
      if (template) {
        const model = modelFor(template, brief, plan);
        const fill = mockFill(brief, model);
        return applyModelFill(model, fill, plan, verifyFacts(fill.business, brief));
      }
    }
    const slug = selectFixture(brief);
    const model = fixtures[slug];
    const fill = mockFill(brief, model, slug);
    return applyModelFill(model, fill, plan, verifyFacts(fill.business, brief));
  }

  /** Sem IA: devolve o site igual, explicando o que fazer. */
  async editSite(spec: SiteSpec, instruction: string): Promise<AiEditResult> {
    const delayMs = this.options.delayMs ?? 1500;
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const summary = this.options.templateMode
      ? "AI changes aren't switched on yet, so nothing was changed. You can edit every text, color and photo yourself in the Edit tab."
      : `Demo mode: nothing was changed for "${instruction.slice(0, 80)}". Set AI_PROVIDER=anthropic to let the AI edit your site.`;
    return { spec: structuredClone(spec), summary };
  }
}
