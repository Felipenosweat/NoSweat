import { fixtures, type FixtureSlug } from "@nosweat/fixtures";
import { SiteSpec, type AiEditResult, type TemplateId } from "@nosweat/schema";
import { readBrief, type DesignPlan } from "../design";
import { factsFromBrief } from "./brief-facts";
import { variedLook } from "./look";
import { applyModelFill, verifyFacts, type ModelFill } from "./model-fill";
import { modelBySlug, modelFor, templateFor } from "./models";
import { profileFor, templateFill, type TemplateProfile } from "./template-mode";
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

/**
 * Um ModelFill de mentira, montado só com o que está na descrição (sem IA, sem rede): textos
 * genéricos da categoria, nomes de serviço do modelo e fatos tirados do texto (brief-facts.ts).
 * O visual (paleta, fonte, botões, cabeçalho, contato e ordem das seções) é sorteado pelo nome
 * do negócio (variedLook): dois negócios diferentes não saem com a cara do mesmo modelo. Com
 * estilo escolhido pelo dono ("Style: ..."), a paleta é a do estilo.
 * Passa pelo mesmo applyModelFill da IA de verdade. Só no dev e nos testes: em produção sem IA
 * vale o modo modelo (template-mode.ts), que nunca copia serviços do modelo.
 */
export function mockFill(brief: string, model: SiteSpec, slug?: FixtureSlug): ModelFill {
  const copy = MOCK_COPY[model.template];
  const services = model.sections.flatMap((s) => (s.type === "services" ? s.items : []));
  const facts = factsFromBrief(brief);
  const testimonials = [...brief.matchAll(/"([^"]{10,300})"\s*\(([^)]{2,60})\)/g)].flatMap((m) =>
    m[1] && m[2] ? [{ quote: m[1], author: m[2] }] : [],
  );
  const imageQuery = slug ? IMAGE_QUERIES[slug] : undefined;
  const city = facts.city;
  const name = facts.name ?? (city ? `${city} ${copy.word}` : `Main Street ${copy.word}`);
  const look = variedLook(name, model.template);
  // Só reordena as seções que o modelo tem (o mock não escreve "quem somos").
  const modelTypes = new Set<string>(model.sections.map((s) => s.type));
  return {
    hero: { ...copy.hero, ...(imageQuery ? { imageQuery } : {}) },
    services: services.slice(0, 8).map((item) => ({
      name: item.name,
      description: copy.description,
      ...(item.group ? { group: item.group } : {}),
      ...(model.template === "portfolio" ? {} : { imageQuery: item.name.toLowerCase().slice(0, 80) }),
    })),
    faq: copy.faq,
    about: null,
    testimonials: testimonials.slice(0, 6),
    category: copy.category,
    business: { ...facts, name },
    ...(readBrief(brief).style ? {} : { theme: look.theme }),
    style: look.style,
    sectionOrder: look.sectionOrder.filter((type) => modelTypes.has(type)),
  };
}

/** Põe a busca da foto do topo quando o modelo não tinha (o modelo mostrava a foto dele). */
function withHeroQuery(spec: SiteSpec, query: string | undefined): SiteSpec {
  const clean = query?.trim();
  if (!clean) return spec;
  return SiteSpec.parse({
    ...spec,
    sections: spec.sections.map((section) =>
      section.type === "hero" && !section.image && !section.imageQuery?.trim()
        ? { ...section, imageQuery: clean.slice(0, 80) }
        : section,
    ),
  });
}

/**
 * Tipo de negócio e site-modelo do modo modelo: o modelo preferido do tipo (ex.: o de BBQ só
 * para churrasco, nunca para qualquer food truck), senão o mais parecido da categoria.
 */
export function templateModeChoice(
  brief: string,
  plan?: DesignPlan,
): { profile: TemplateProfile; model: SiteSpec } {
  const profile = profileFor(brief, templateFor(brief));
  const preferred = profile.model ? modelBySlug(profile.model) : undefined;
  const model =
    preferred && preferred.category === profile.template
      ? preferred.spec
      : modelFor(profile.template, brief, plan);
  return { profile, model };
}

/**
 * Modo modelo (produção sem chave de IA): tipo de negócio → site-modelo → textos genéricos do
 * tipo + fatos do pedido (template-mode.ts). Nenhum texto do modelo fica no site.
 */
export function templateModeSite(brief: string, plan?: DesignPlan): SiteSpec {
  const { profile, model } = templateModeChoice(brief, plan);
  const fill = templateFill(brief, profile, model);
  const spec = applyModelFill(model, fill, plan, verifyFacts(fill.business, brief));
  return withHeroQuery(spec, fill.hero.imageQuery);
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
 *   inteira, com os textos genéricos do tipo de negócio (templateModeSite), e mudanças pela IA
 *   avisam que a IA ainda não está ligada (a rota nem chega aqui: responde 503 antes).
 */
export class MockGenerator implements SiteGenerator {
  /**
   * O mock do dev simula a IA (gasta créditos, para testar o fluxo inteiro). O modo modelo não
   * usa IA: gerar não desconta créditos e mudanças pela IA ficam desligadas (503).
   */
  readonly usesAi: boolean;

  constructor(private readonly options: { delayMs?: number; templateMode?: boolean } = {}) {
    this.usesAi = !options.templateMode;
  }

  /**
   * Como a geração a partir do modelo: parte do site-modelo e junta um ModelFill de mentira
   * (mockFill) com applyModelFill, que apaga os fatos do modelo.
   */
  async generateSite(brief: string, plan?: DesignPlan): Promise<SiteSpec> {
    const delayMs = this.options.delayMs ?? 1500;
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (this.options.templateMode) return templateModeSite(brief, plan);
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
