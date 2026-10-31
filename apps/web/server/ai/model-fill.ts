import {
  SiteSpec,
  Theme,
  type Business,
  type Section,
  type SectionOf,
  type SectionType,
  type SiteDesign,
} from "@nosweat/schema";
import { z } from "zod";
import { applyDesignPlan, readBrief, type DesignPlan } from "../design";
import { DropSections, FillStyle, MiddleSection, pickTheme, SectionOrder } from "./look";

// Geração a partir do modelo (docs/design/model-sites.md, "Geração a partir do modelo").
// A IA barata devolve só um ModelFill (textos + fatos que estão no pedido); o código junta com o
// site-modelo da categoria. Três camadas de honestidade:
// 1. verifyFacts: fato do negócio (telefone, e-mail, endereço, links, preços...) só entra se
//    estiver escrito no pedido; o resto é descartado em silêncio.
// 2. lintFill: textos com afirmações (preço, anos, licença, garantia, 24/7...) que não estão no
//    pedido, depoimentos que não são palavra por palavra do dono e fatos do modelo que vazaram
//    viram erro (nova tentativa ou volta para o caminho completo).
// 3. applyModelFill: apaga TODOS os fatos do modelo antes de juntar.

const Text = (max: number) => z.string().min(1).max(max);
const HttpsLink = z
  .string()
  .max(500)
  .regex(/^https:\/\/\S+$/);

export const ModelFill = z.object({
  hero: z.object({
    title: Text(90),
    subtitle: Text(300),
    ctaLabel: Text(40),
    /** 2 a 5 palavras em inglês para a busca da foto do topo (cena genérica, sem pessoas). */
    imageQuery: z.string().max(80).optional(),
  }),
  services: z
    .array(
      z.object({
        name: Text(60),
        description: Text(220),
        group: z.string().max(40).optional(),
        detail: z.string().max(80).optional(),
        /** 2 a 5 palavras em inglês para a foto do serviço (cena genérica, sem pessoas). */
        imageQuery: z.string().max(80).optional(),
      }),
    )
    .min(3)
    .max(8),
  faq: z
    .array(z.object({ q: Text(140), a: Text(450) }))
    .min(3)
    .max(5),
  /** Quem somos; null quando o pedido não diz nada sobre quem atende. */
  about: z
    .object({
      title: z.string().max(80).optional(),
      body: Text(700),
      /** Pessoas citadas pelo dono (nome como está no pedido). */
      people: z
        .array(
          z.object({
            name: Text(80),
            role: z.string().max(80).optional(),
            note: z.string().max(200).optional(),
          }),
        )
        .max(6)
        .optional(),
    })
    .nullable(),
  /** Depoimentos citados pelo dono, palavra por palavra. Sem citação no pedido: lista vazia. */
  testimonials: z.array(z.object({ quote: Text(400), author: Text(80) })).max(6),
  /** Títulos de seção (opcionais; sem eles, os do modelo). */
  titles: z
    .object({
      services: z.string().max(80).optional(),
      about: z.string().max(80).optional(),
      testimonials: z.string().max(80).optional(),
      faq: z.string().max(80).optional(),
      contact: z.string().max(80).optional(),
    })
    .optional(),
  /** Categoria como o cliente procuraria ("Electrician", "Nail salon"). */
  category: z.string().max(60).optional(),
  /** Fatos do negócio, SÓ se estiverem escritos no pedido (conferidos por verifyFacts). */
  business: z.object({
    name: z.string().max(80).optional(),
    phone: z.string().max(40).optional(),
    email: z.email().optional(),
    city: z.string().max(60).optional(),
    state: z.string().length(2).optional(),
    address: z.string().max(120).optional(),
    serviceArea: z.string().max(120).optional(),
    hours: z
      .array(z.object({ days: z.string().max(40), time: z.string().max(40) }))
      .max(7)
      .optional(),
    highlights: z.array(z.string().max(40)).max(4).optional(),
    links: z
      .object({
        booking: HttpsLink.optional(),
        order: HttpsLink.optional(),
        menu: HttpsLink.optional(),
        instagram: HttpsLink.optional(),
        facebook: HttpsLink.optional(),
        tiktok: HttpsLink.optional(),
        google: HttpsLink.optional(),
        yelp: HttpsLink.optional(),
        linkedin: HttpsLink.optional(),
      })
      .optional(),
    /** Preços ditos pelo dono, ligados a um serviço pelo nome. */
    prices: z
      .array(z.object({ service: Text(60), price: Text(40) }))
      .max(12)
      .optional(),
  }),
  // Aparência (look.ts). Tudo opcional: sem estes campos, vale o visual do modelo.
  /** Paleta e fonte para ESTE negócio (contraste AA conferido; reprovada → a do modelo). */
  theme: Theme.optional(),
  /** Botões, cabeçalho, bloco de contato, respiro e tratamento das fotos. */
  style: FillStyle.optional(),
  /** Ordem das seções entre o topo e o contato (as que faltarem seguem na ordem do modelo). */
  sectionOrder: SectionOrder.optional(),
  /** Seções que este negócio não precisa (serviços, topo e contato ficam sempre). */
  dropSections: DropSections.optional(),
});
export type ModelFill = z.infer<typeof ModelFill>;

/** Fatos do negócio que passaram na conferência com o pedido (mesmo formato do ModelFill). */
export type BriefFacts = ModelFill["business"];

// ---------------------------------------------------------------------------------------------
// Comparação de textos

/** Sem acento, minúsculas, aspas retas e espaços simples. */
function norm(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const digits = (text: string) => text.replace(/\D/g, "");

const STOPWORDS = new Set([
  "and",
  "the",
  "with",
  "from",
  "your",
  "for",
  "our",
  "that",
  "this",
  "nearby",
  "area",
  "areas",
  "cities",
  "towns",
  "around",
]);

/** Palavras com conteúdo (4+ letras, sem as vazias). */
function contentWords(text: string): string[] {
  return norm(text)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word));
}

/** Pelo menos metade das palavras com conteúdo do texto aparece no pedido. */
function mentionedIn(text: string, brief: string): boolean {
  const words = contentWords(text);
  if (words.length === 0) return false;
  const haystack = norm(brief);
  const found = words.filter((word) => haystack.includes(word)).length;
  return found * 2 >= words.length;
}

const STATE_NAMES: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  DC: "district of columbia",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "new hampshire",
  NJ: "new jersey",
  NM: "new mexico",
  NY: "new york",
  NC: "north carolina",
  ND: "north dakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  RI: "rhode island",
  SC: "south carolina",
  SD: "south dakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "west virginia",
  WI: "wisconsin",
  WY: "wyoming",
};

/** A sigla é de um estado dos EUA (ou DC)? */
export function isUsStateCode(code: string): boolean {
  return Object.hasOwn(STATE_NAMES, code);
}

/**
 * Telefones escritos no pedido (só os dígitos, os 10 últimos). Aceita (512) 555-0142,
 * 512-555-0142, 512.555.0142, 5125550142, +1 512 555 0142 e (512)555-0142.
 */
export function phonesIn(brief: string): string[] {
  const matches = brief.match(/\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g) ?? [];
  return matches.map((m) => digits(m).slice(-10));
}

/** "5125550142" (ou com +1) → "(512) 555-0142". `undefined` se não for um número dos EUA. */
export function formatUsPhone(raw: string): string | undefined {
  const all = digits(raw);
  const ten = all.length === 11 && all.startsWith("1") ? all.slice(1) : all;
  if (ten.length !== 10 || !/^[2-9]/.test(ten)) return undefined;
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

/** Valores em dólar de um texto, sem vírgulas ("$1,800" → "$1800"). */
function dollarAmounts(text: string): string[] {
  return (text.match(/\$\s?\d[\d,]*(?:\.\d+)?/g) ?? []).map((m) => m.replace(/[\s,]/g, ""));
}

/** Link sem "https://", "www." e barra final, para procurar no pedido. */
function bareLink(url: string): string {
  return norm(url)
    .replace(/^https:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------------------------
// 1. Fatos do negócio

/**
 * Fica só o que está escrito no pedido. O nome é a exceção: sem nome no pedido, a IA pode
 * sugerir um curto (mesma regra do caminho completo); ele ainda passa pelo lintFill.
 */
export function verifyFacts(facts: BriefFacts, brief: string): BriefFacts {
  const text = norm(brief);
  const result: BriefFacts = {};

  const name = facts.name?.trim();
  if (name) result.name = name;

  const phone = facts.phone?.trim();
  if (phone && digits(phone).length >= 10 && phonesIn(brief).includes(digits(phone).slice(-10))) {
    result.phone = phone;
  }

  const email = facts.email?.trim();
  if (email && text.includes(email.toLowerCase())) result.email = email;

  const city = facts.city?.trim();
  if (city && text.includes(norm(city))) result.city = city;

  const state = facts.state?.trim().toUpperCase();
  const stateName = state ? STATE_NAMES[state] : undefined;
  if (
    state &&
    stateName &&
    (new RegExp(`\\b${state}\\b`).test(brief) || text.includes(stateName))
  ) {
    result.state = state;
  }

  const address = facts.address?.trim();
  if (address && text.includes(norm(address))) result.address = address;

  const serviceArea = facts.serviceArea?.trim();
  if (serviceArea && mentionedIn(serviceArea, brief)) result.serviceArea = serviceArea;

  // Horário: só se o dono falou de horário (os textos variam demais para comparar um por um).
  if (facts.hours?.length && readBrief(brief).mentionsHours) result.hours = facts.hours;

  const highlights = (facts.highlights ?? []).filter((h) => mentionedIn(h, brief));
  if (highlights.length) result.highlights = highlights;

  if (facts.links) {
    const links: NonNullable<BriefFacts["links"]> = {};
    for (const [key, url] of Object.entries(facts.links) as [keyof typeof links, string][]) {
      if (url && text.includes(bareLink(url))) links[key] = url;
    }
    if (Object.keys(links).length) result.links = links;
  }

  const briefAmounts = new Set(dollarAmounts(brief));
  const prices = (facts.prices ?? []).filter((p) => {
    const amounts = dollarAmounts(p.price);
    return amounts.length > 0 && amounts.every((amount) => briefAmounts.has(amount));
  });
  if (prices.length) result.prices = prices;

  return result;
}

// ---------------------------------------------------------------------------------------------
// 2. Checagem de honestidade dos textos

/**
 * Afirmações que só podem aparecer se o dono disse (regra 8 do CLAUDE.md). Se o texto da IA
 * casa com a expressão e o pedido não, é erro. Preços e anos têm checagem própria (o valor).
 */
const CLAIMS: { label: string; re: RegExp }[] = [
  { label: "licensed", re: /\blicen[cs]ed\b/i },
  { label: "insured", re: /\binsured\b/i },
  { label: "certified", re: /\bcertified\b/i },
  { label: "guarantee", re: /\bguarantee[ds]?\b/i },
  { label: "same-day", re: /\bsame[- ]day\b/i },
  { label: "24/7", re: /\b24\s?\/\s?7\b|\b24-7\b/i },
  { label: "award", re: /\baward(?:s|ed|-winning)?\b/i },
  { label: "#1", re: /#\s?1\b|\bnumber one\b|\bno\. 1\b/i },
  { label: "best in", re: /\bbest in\b/i },
];

const YEARS_RE =
  /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|\w+teen|\w+ty)\+?\s*(?:years?|yrs?)\b/gi;

type Field = { path: string; text: string };

/** Todos os textos do fill que aparecem no site (menos os depoimentos, conferidos à parte). */
function copyFields(fill: ModelFill): Field[] {
  const fields: Field[] = [
    { path: "hero.title", text: fill.hero.title },
    { path: "hero.subtitle", text: fill.hero.subtitle },
    { path: "hero.ctaLabel", text: fill.hero.ctaLabel },
  ];
  fill.services.forEach((s, i) => {
    fields.push({ path: `services[${i}].name`, text: s.name });
    fields.push({ path: `services[${i}].description`, text: s.description });
    if (s.group) fields.push({ path: `services[${i}].group`, text: s.group });
    if (s.detail) fields.push({ path: `services[${i}].detail`, text: s.detail });
  });
  fill.faq.forEach((item, i) => {
    fields.push({ path: `faq[${i}].q`, text: item.q });
    fields.push({ path: `faq[${i}].a`, text: item.a });
  });
  if (fill.about) {
    if (fill.about.title) fields.push({ path: "about.title", text: fill.about.title });
    fields.push({ path: "about.body", text: fill.about.body });
    (fill.about.people ?? []).forEach((p, i) => {
      if (p.role) fields.push({ path: `about.people[${i}].role`, text: p.role });
      if (p.note) fields.push({ path: `about.people[${i}].note`, text: p.note });
    });
  }
  for (const [key, title] of Object.entries(fill.titles ?? {})) {
    if (title) fields.push({ path: `titles.${key}`, text: title });
  }
  if (fill.category) fields.push({ path: "category", text: fill.category });
  const b = fill.business;
  if (b.name) fields.push({ path: "business.name", text: b.name });
  if (b.serviceArea) fields.push({ path: "business.serviceArea", text: b.serviceArea });
  (b.highlights ?? []).forEach((h, i) =>
    fields.push({ path: `business.highlights[${i}]`, text: h }),
  );
  (b.hours ?? []).forEach((h, i) =>
    fields.push({ path: `business.hours[${i}]`, text: `${h.days} ${h.time}` }),
  );
  (b.prices ?? []).forEach((p, i) => fields.push({ path: `business.prices[${i}]`, text: p.price }));
  return fields;
}

/** Fatos do site-modelo que nunca podem aparecer num site de outro negócio. */
function modelFactTokens(model: SiteSpec): string[] {
  const tokens: string[] = [];
  const { business } = model;
  tokens.push(business.name);
  if (business.phone) tokens.push(business.phone);
  if (business.email) tokens.push(business.email);
  if (business.address) tokens.push(business.address);
  if (business.city) tokens.push(business.city);
  const firstName = (name: string) =>
    name
      .split(/[\s,&]+/)
      .filter((word) => /^[A-Z][a-z]{2,}$/.test(word))
      .slice(0, 1);
  for (const section of model.sections) {
    if (section.type === "about") {
      for (const person of section.people ?? []) tokens.push(...firstName(person.name));
      // Nomes próprios citados no texto do modelo (ex.: "Joe Ramirez", "Camila Reyes").
      for (const match of section.body.matchAll(/\b([A-Z][a-z]{2,})\s+[A-Z][a-z]+\b/g)) {
        if (match[1]) tokens.push(match[1]);
      }
    }
    if (section.type === "testimonials") {
      for (const item of section.items) {
        for (const part of item.author.split("&")) tokens.push(...firstName(part.trim()));
      }
    }
  }
  return [...new Set(tokens.filter((token) => token.length >= 3))];
}

const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Erros de honestidade do fill (lista vazia = ok). Cada erro diz o campo e o motivo, para a
 * nova tentativa da IA saber o que corrigir. Com `model`, também acusa fatos do modelo que
 * vazaram para o texto (nome, telefone, pessoas, cidade...) e que não estão no pedido.
 */
export function lintFill(fill: ModelFill, brief: string, model?: SiteSpec): string[] {
  const errors: string[] = [];
  const briefText = norm(brief);
  const briefAmounts = new Set(dollarAmounts(brief));
  const fields = copyFields(fill);

  for (const { path, text } of fields) {
    for (const claim of CLAIMS) {
      if (claim.re.test(text) && !claim.re.test(brief)) {
        errors.push(`${path}: says "${claim.label}", but the owner never said it`);
      }
    }
    const amounts = dollarAmounts(text);
    if (text.includes("$") && amounts.length === 0 && !brief.includes("$")) {
      errors.push(`${path}: mentions a price, but the owner gave none`);
    }
    for (const amount of amounts) {
      if (!briefAmounts.has(amount)) {
        errors.push(`${path}: the price ${amount} is not in the owner's description`);
      }
    }
    for (const match of text.matchAll(YEARS_RE)) {
      if (!briefText.includes(norm(match[0]))) {
        errors.push(`${path}: "${match[0]}" is not in the owner's description`);
      }
    }
  }

  // Números em detalhes de serviço (duração, quantidade) só se o dono disse.
  fill.services.forEach((s, i) => {
    for (const n of s.detail?.match(/\d+/g) ?? []) {
      if (!briefText.includes(n)) {
        errors.push(`services[${i}].detail: the number ${n} is not in the owner's description`);
      }
    }
  });

  // Depoimentos: palavra por palavra do pedido, com o nome de quem disse.
  fill.testimonials.forEach((t, i) => {
    const quote = norm(t.quote).replace(/^["']+|["'.!]+$/g, "");
    if (!quote || !briefText.includes(quote)) {
      errors.push(`testimonials[${i}]: the quote is not written in the owner's description`);
    }
    const first = contentWords(t.author)[0] ?? norm(t.author).split(" ")[0] ?? "";
    if (!first || !briefText.includes(first)) {
      errors.push(`testimonials[${i}]: the author is not in the owner's description`);
    }
  });

  (fill.about?.people ?? []).forEach((p, i) => {
    if (!briefText.includes(norm(p.name))) {
      errors.push(`about.people[${i}]: "${p.name}" is not in the owner's description`);
    }
  });

  if (model) {
    const all = [
      ...fields,
      ...fill.testimonials.map((t, i) => ({
        path: `testimonials[${i}]`,
        text: `${t.quote} ${t.author}`,
      })),
    ];
    for (const token of modelFactTokens(model)) {
      if (briefText.includes(norm(token))) continue;
      const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(token)}($|[^\\p{L}\\p{N}])`, "u");
      const hit = all.find((field) => re.test(field.text));
      if (hit)
        errors.push(`${hit.path}: "${token}" belongs to the example site, not this business`);
    }
  }

  return [...new Set(errors)];
}

// ---------------------------------------------------------------------------------------------
// 3. Junção com o modelo

/** Chave para comparar nomes de serviços. */
const serviceKey = (name: string) =>
  norm(name)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function priceFor(name: string, prices: BriefFacts["prices"]): string | undefined {
  const key = serviceKey(name);
  if (!key) return undefined;
  const match = (prices ?? []).find((p) => {
    const other = serviceKey(p.service);
    return other.length > 0 && (other === key || key.includes(other) || other.includes(key));
  });
  return match?.price;
}

/** Nome quando nem o pedido nem a IA deram um: a categoria (com a cidade, se houver). */
function fallbackName(fill: ModelFill, facts: BriefFacts): string {
  const category = fill.category?.trim();
  if (category && facts.city) return `${facts.city} ${category}`;
  return category || "My Business";
}

function buildBusiness(fill: ModelFill, facts: BriefFacts): Business {
  const business: Business = { name: facts.name || fallbackName(fill, facts) };
  const category = fill.category?.trim();
  if (category) business.category = category;
  if (facts.phone) business.phone = facts.phone;
  if (facts.email) business.email = facts.email;
  if (facts.city) business.city = facts.city;
  if (facts.state) business.state = facts.state;
  if (facts.address) business.address = facts.address;
  if (facts.serviceArea) business.serviceArea = facts.serviceArea;
  if (facts.hours?.length) business.hours = facts.hours.slice(0, 7);
  if (facts.highlights?.length) business.highlights = facts.highlights.slice(0, 4);
  if (facts.links && Object.keys(facts.links).length) business.links = { ...facts.links };
  return business;
}

/**
 * Tema de cada estilo do passo "Colors" do /create (chave = nome do estilo na linha "Style: …",
 * como em STYLE_OPTIONS de app/(dashboard)/create/brief.ts). As cores são as das amostras que o
 * dono viu ao escolher; texto sobre o fundo e cor principal sobre o fundo passam no AA (4,5:1).
 * Sem estilo escolhido, o site fica com a paleta da IA (conferida) ou com o tema do modelo.
 */
export const STYLE_THEMES: Record<string, Theme> = {
  "warm & friendly": {
    primary: "#B4532A",
    secondary: "#E3B448",
    background: "#FBF6EE",
    text: "#2B211B",
    font: "fresh",
  },
  "clean & professional": {
    primary: "#1E3A5F",
    secondary: "#5B7A99",
    background: "#F4F7FA",
    text: "#0F1B2D",
    font: "refined",
  },
  "bold & local": {
    primary: "#C8102E",
    secondary: "#FFB703",
    background: "#FFFFFF",
    text: "#111111",
    font: "bold",
  },
  elegant: {
    primary: "#3D2B3D",
    secondary: "#C9A96E",
    background: "#FAF7F2",
    text: "#241A24",
    font: "luxe",
  },
  simple: {
    primary: "#2563EB",
    secondary: "#111827",
    background: "#FFFFFF",
    text: "#111827",
    font: "modern",
  },
};

/**
 * Junta o fill da IA com o site-modelo. O modelo é a BASE, não um molde:
 * - estrutura: topo primeiro e contato por último sempre; no meio, a ordem que a IA escolheu
 *   (`sectionOrder`, o que faltar segue a ordem do modelo), menos as seções em `dropSections`.
 *   Seção que a IA pôs na ordem e o modelo não tinha entra se o fill tiver conteúdo para ela.
 *   Sem `sectionOrder`, só as seções do modelo, na ordem dele;
 * - tema: o estilo escolhido pelo dono (passo "Colors") vale sobre tudo; senão a paleta da IA
 *   se passar no contraste AA (pickTheme), senão a do modelo;
 * - direção de arte: composição e ação do plano; botões, cabeçalho, contato, respiro e fotos
 *   da IA (`style`), quando vierem. O visual de botões/cabeçalho do modelo não é copiado.
 * Todos os fatos do modelo saem: nome, telefone, e-mail, endereço, horário, selos, links,
 * preços, pessoas, depoimentos, fotos (do topo, do "quem somos", da galeria) e legendas. Seção
 * que fica vazia sai (about null, sem depoimentos, galeria sem fotos do dono). O resultado
 * passa por SiteSpec.parse.
 */
export function applyModelFill(
  model: SiteSpec,
  fill: ModelFill,
  plan: DesignPlan | undefined,
  facts: BriefFacts,
): SiteSpec {
  const titles = fill.titles ?? {};
  const modelSection = <T extends SectionType>(type: T): SectionOf<T> | undefined =>
    model.sections.find((section): section is SectionOf<T> => section.type === type);
  // Portfólio: foto de banco num serviço pareceria trabalho do dono (só fotos dela).
  const serviceQueries = model.template !== "portfolio";

  const build = (type: MiddleSection): Section | null => {
    switch (type) {
      case "services": {
        const items = fill.services.slice(0, 8).map((item) => {
          const out: SectionOf<"services">["items"][number] = {
            name: item.name,
            description: item.description,
          };
          const price = priceFor(item.name, facts.prices);
          if (price) out.price = price;
          if (item.detail?.trim()) out.detail = item.detail.trim();
          if (item.group?.trim()) out.group = item.group.trim();
          const query = item.imageQuery?.trim();
          if (serviceQueries && query) out.imageQuery = query.slice(0, 80);
          return out;
        });
        if (items.length === 0) return null;
        const title = titles.services ?? modelSection("services")?.title;
        return { type: "services", ...(title ? { title } : {}), items };
      }
      case "about": {
        if (!fill.about) return null;
        const about: SectionOf<"about"> = { type: "about", body: fill.about.body };
        const title = fill.about.title ?? titles.about ?? modelSection("about")?.title;
        if (title) about.title = title;
        const people = (fill.about.people ?? []).slice(0, 6).map((p) => ({
          name: p.name,
          ...(p.role ? { role: p.role } : {}),
          ...(p.note ? { note: p.note } : {}),
        }));
        if (people.length) about.people = people;
        return about;
      }
      case "testimonials": {
        if (fill.testimonials.length === 0) return null;
        const title = titles.testimonials ?? modelSection("testimonials")?.title;
        return {
          type: "testimonials",
          ...(title ? { title } : {}),
          items: fill.testimonials.slice(0, 6).map((t) => ({ quote: t.quote, author: t.author })),
        };
      }
      case "faq": {
        if (fill.faq.length === 0) return null;
        const title = titles.faq ?? modelSection("faq")?.title;
        return {
          type: "faq",
          ...(title ? { title } : {}),
          items: fill.faq.slice(0, 10).map((item) => ({ q: item.q, a: item.a })),
        };
      }
    }
  };

  // Ordem do meio: a da IA primeiro, depois o que o modelo tinha e ela não citou. Galerias do
  // modelo nunca entram (as fotos não são do cliente).
  const isMiddle = (type: SectionType): type is MiddleSection =>
    (MiddleSection.options as readonly string[]).includes(type);
  // Serviços não estão entre as que podem sair (DroppableSection).
  const dropped = new Set<MiddleSection>(fill.dropSections ?? []);
  const order: MiddleSection[] = [];
  for (const type of [...(fill.sectionOrder ?? []), ...model.sections.map((s) => s.type)]) {
    if (isMiddle(type) && !dropped.has(type) && !order.includes(type)) order.push(type);
  }
  // Serviços sempre (o fill sempre tem de 3 a 8).
  if (!order.includes("services")) order.unshift("services");

  const modelHero = modelSection("hero");
  const hero: SectionOf<"hero"> = {
    type: "hero",
    title: fill.hero.title,
    subtitle: fill.hero.subtitle,
    ctaLabel: fill.hero.ctaLabel,
  };
  // Modelo sem busca de foto (portfólio: só foto da dona) continua sem.
  const heroQuery = fill.hero.imageQuery?.trim();
  if (modelHero?.imageQuery && heroQuery) hero.imageQuery = heroQuery;

  // Contato sempre por último (todo site sai com formulário, ver CLAUDE.md).
  const modelContact = modelSection("contact");
  const contactTitle = titles.contact ?? modelContact?.title;
  const contact: SectionOf<"contact"> = {
    type: "contact",
    ...(contactTitle ? { title: contactTitle } : {}),
    showForm: modelContact?.showForm ?? true,
    showMap: modelContact?.showMap ?? false,
  };

  const sections: Section[] = [
    hero,
    ...order.flatMap((type) => {
      const section = build(type);
      return section ? [section] : [];
    }),
    contact,
  ];

  // Estilo escolhido pelo dono (passo "Colors") vale mais que tudo: são as cores que ele viu.
  const ownerTheme = plan?.signals.style ? STYLE_THEMES[plan.signals.style] : undefined;
  const theme = ownerTheme ? { ...ownerTheme } : pickTheme(fill.theme, model.theme);

  return SiteSpec.parse({
    version: 1,
    template: model.template,
    ...designFor(model, plan, fill.style),
    business: buildBusiness(fill, facts),
    theme,
    sections,
  });
}

/**
 * `design` do site: composição (e ação, respiro, fotos) do plano, ou do modelo sem plano; por
 * cima, o que a IA escolheu em `style`. Só a COMPOSIÇÃO do modelo é considerada pelo plano.
 */
function designFor(
  model: SiteSpec,
  plan: DesignPlan | undefined,
  style: FillStyle | undefined,
): { design?: SiteDesign } {
  const base: SiteDesign | undefined = plan
    ? applyDesignPlan(model.design ? { composition: model.design.composition } : undefined, plan)
    : model.design
      ? { ...model.design }
      : undefined;
  const chosen: Partial<SiteDesign> = {
    ...(style?.buttons ? { buttons: style.buttons } : {}),
    ...(style?.header ? { header: style.header } : {}),
    ...(style?.contact ? { contact: style.contact } : {}),
    ...(style?.density ? { density: style.density } : {}),
    ...(style?.imageTreatment ? { imageTreatment: style.imageTreatment } : {}),
  };
  if (!base && Object.keys(chosen).length === 0) return {};
  const design: SiteDesign = { composition: "service-led", ...base, ...chosen };
  // Comida e salão nunca em preto e branco: a cor é o próprio produto.
  if (
    design.imageTreatment === "monochrome" &&
    (model.template === "restaurant" || model.template === "beauty")
  ) {
    design.imageTreatment =
      base?.imageTreatment && base.imageTreatment !== "monochrome"
        ? base.imageTreatment
        : "natural";
  }
  return { design };
}

/** Resumo do site-modelo que vai para a IA: estrutura e tom, para ela escrever no mesmo nível. */
export function modelCopyForPrompt(model: SiteSpec): string {
  const sections = model.sections.map((section) => {
    switch (section.type) {
      case "hero":
        return {
          type: section.type,
          title: section.title,
          subtitle: section.subtitle,
          ctaLabel: section.ctaLabel,
          hasImageQuery: Boolean(section.imageQuery),
        };
      case "services":
        return {
          type: section.type,
          title: section.title,
          items: section.items.map((i) => ({
            name: i.name,
            description: i.description,
            group: i.group,
            detail: i.detail,
          })),
        };
      case "about":
        return { type: section.type, title: section.title, body: section.body };
      case "faq":
        return { type: section.type, title: section.title, items: section.items };
      case "testimonials":
      case "contact":
      case "gallery":
        return { type: section.type, title: section.title };
    }
  });
  return JSON.stringify({ template: model.template, category: model.business.category, sections });
}
