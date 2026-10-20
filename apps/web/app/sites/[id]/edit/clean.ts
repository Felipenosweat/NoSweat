import { SiteSpec, type Section } from "@nosweat/schema";
import { z } from "zod";

// Funções puras do editor (sem React): limpar o rascunho antes de salvar, montar a prévia,
// traduzir erros do schema para frases e guardar uma cópia local. Ficam aqui para ter teste.

type Business = SiteSpec["business"];
type Links = NonNullable<Business["links"]>;

/** Links do negócio, na ordem em que aparecem no painel "Content". */
export const LINK_KEYS = [
  "booking",
  "order",
  "menu",
  "instagram",
  "facebook",
  "tiktok",
  "google",
  "yelp",
  "linkedin",
] as const satisfies readonly (keyof Links)[];
export type LinkKey = (typeof LINK_KEYS)[number];

/** Campos de texto opcionais do negócio: vazio sai do SiteSpec. */
const OPTIONAL_TEXT = [
  "phone",
  "email",
  "city",
  "state",
  "serviceArea",
  "address",
  "category",
] as const satisfies readonly (keyof Business)[];

/** Mesma regra do schema (ExternalUrl): só https://, sem espaços. */
const EXTERNAL_URL = /^https:\/\/\S+$/;

const blank = (value: string | undefined) => !value?.trim();

/** Itens de lista totalmente vazios (serviço, pergunta, depoimento) não vão para o site. */
function withoutEmptyItems(section: Section): Section {
  switch (section.type) {
    case "services":
      return {
        ...section,
        items: section.items.filter(
          (item) =>
            !(
              blank(item.name) &&
              blank(item.description) &&
              blank(item.price) &&
              blank(item.detail)
            ),
        ),
      };
    case "faq":
      return {
        ...section,
        items: section.items.filter((item) => !(blank(item.q) && blank(item.a))),
      };
    case "testimonials":
      return {
        ...section,
        items: section.items.filter((item) => !(blank(item.quote) && blank(item.author))),
      };
    default:
      return section;
  }
}

/** Só a parte do negócio de `clean` (a prévia também usa). */
function cleanBusiness(source: Business): Business {
  // Parte do que já existe: campos que o painel não mostra (ex.: links novos) nunca se perdem.
  const business: Business = { ...source, name: source.name.trim() };
  for (const key of OPTIONAL_TEXT) {
    const value = source[key]?.trim();
    if (value) business[key] = key === "state" ? value.toUpperCase() : value;
    else delete business[key];
  }

  const hours = (source.hours ?? [])
    .map((row) => ({ days: row.days.trim(), time: row.time.trim() }))
    .filter((row) => row.days || row.time);
  if (hours.length) business.hours = hours;
  else delete business.hours;

  const highlights = (source.highlights ?? []).map((h) => h.trim()).filter(Boolean);
  if (highlights.length) business.highlights = highlights;
  else delete business.highlights;

  const links: Links = {};
  for (const key of LINK_KEYS) {
    const value = source.links?.[key]?.trim();
    if (value) links[key] = value;
  }
  if (Object.keys(links).length > 0) business.links = links;
  else delete business.links;

  return business;
}

/**
 * Rascunho pronto para salvar: campos opcionais vazios saem do SiteSpec (ex.: e-mail "" não é
 * um e-mail válido), itens vazios saem das listas e a galeria sem nenhuma foto também sai
 * (no site ela não aparece mesmo). Nada que o dono preencheu se perde.
 */
export function clean(spec: SiteSpec): SiteSpec {
  const business = cleanBusiness(spec.business);
  const sections = spec.sections
    .filter((s) => s.type !== "gallery" || s.images.length > 0)
    .map(withoutEmptyItems);
  return { ...spec, business, sections };
}

/**
 * Rascunho para a prévia: como `clean`, mas mantém todas as seções e itens (o índice de cada
 * um precisa bater com o painel) e ignora o que ainda está pela metade (e-mail, estado, link
 * sem https://). `null` se mesmo assim não for um SiteSpec válido (a prévia fica no último válido).
 */
export function previewSpec(spec: SiteSpec): SiteSpec | null {
  const business = cleanBusiness(spec.business);
  if (business.email && !z.email().safeParse(business.email).success) delete business.email;
  if (business.state && business.state.length !== 2) delete business.state;
  if (business.links) {
    const links: Links = {};
    for (const key of LINK_KEYS) {
      const value = business.links[key];
      if (value && value.length <= 500 && EXTERNAL_URL.test(value)) links[key] = value;
    }
    if (Object.keys(links).length > 0) business.links = links;
    else delete business.links;
  }
  const parsed = SiteSpec.safeParse({ ...spec, business, sections: spec.sections });
  return parsed.success ? parsed.data : null;
}

/**
 * Completa um link digitado pela metade ao sair do campo: "joesplumbing.com" →
 * "https://joesplumbing.com", "http://" vira "https://" e "@joe" vira o perfil no Instagram
 * ou no TikTok. Vazio continua vazio.
 */
export function withHttps(value: string, key?: LinkKey): string {
  const text = value.trim();
  if (!text) return "";
  const handle = /^@([\w.]{1,30})$/.exec(text)?.[1];
  if (handle && key === "instagram") return `https://www.instagram.com/${handle}`;
  if (handle && key === "tiktok") return `https://www.tiktok.com/@${handle}`;
  // "@algo" em outro campo não vira link sozinho: fica como está e o aviso pede o link inteiro.
  if (handle) return text;
  if (/^https:\/\//i.test(text)) return `https://${text.slice(8)}`;
  if (/^http:\/\//i.test(text)) return `https://${text.slice(7)}`;
  return `https://${text.replace(/^\/+/, "")}`;
}

// ---------- Campos obrigatórios ----------

/** Índice da seção do topo (hero), ou -1. */
export function heroIndex(spec: SiteSpec): number {
  return spec.sections.findIndex((section) => section.type === "hero");
}

/**
 * O que falta para salvar: o nome do negócio e o título do topo (o schema aceita vazio, mas um
 * site sem nome ou sem título não serve). `null` = tudo certo.
 */
export function missingRequired(spec: SiteSpec): "name" | "headline" | null {
  if (!spec.business.name.trim()) return "name";
  const hero = spec.sections[heroIndex(spec)];
  if (hero?.type === "hero" && !hero.title.trim()) return "headline";
  return null;
}

export const REQUIRED_MESSAGES = {
  name: "Add your business name (Content › Business details).",
  headline: "Add a headline to the top of your site (Sections › Hero).",
} as const;

/** A galeria exige descrição (alt) em todas as fotos; o schema aceita vazio, o editor não. */
export function missingGalleryAlt(spec: SiteSpec): string | null {
  for (const [sectionIndex, section] of spec.sections.entries()) {
    if (section.type !== "gallery") continue;
    const photo = section.images.findIndex((image) => !image.alt.trim());
    if (photo >= 0) {
      return `Section ${sectionIndex + 1} (photo gallery): photo ${photo + 1} needs a short description.`;
    }
  }
  return null;
}

// ---------- Erros do schema em frases ----------

const BUSINESS_LABELS: Record<string, string> = {
  name: "Business name",
  phone: "Phone",
  email: "Email",
  city: "City",
  state: "State",
  serviceArea: "Service area",
  address: "Street address",
  category: "What you do",
  hours: "Hours",
  highlights: "Highlights",
};

export const LINK_LABELS: Record<LinkKey, string> = {
  booking: "Online booking link",
  order: "Online ordering link",
  menu: "Menu link",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google: "Google Business Profile",
  yelp: "Yelp",
  linkedin: "LinkedIn",
};

/** Nome curto de cada tipo de seção (avisos e mensagens de erro). */
export const SECTION_NAMES: Record<Section["type"], string> = {
  hero: "Hero",
  services: "Services",
  testimonials: "Reviews",
  faq: "FAQ",
  contact: "Contact",
  gallery: "Photo gallery",
  about: "About",
};

/** Campos das seções com nome legível (os outros ficam só com o nome da seção). */
const SECTION_FIELDS: Record<string, string> = {
  title: "title",
  subtitle: "subtitle",
  ctaLabel: "button text",
  body: "text",
};

/** O mínimo de um erro do Zod que usamos (o tipo completo muda entre versões). */
export type IssueLike = {
  path: PropertyKey[];
  message: string;
  code?: string;
  maximum?: unknown;
  origin?: unknown;
};

function fieldLabel(path: PropertyKey[], spec?: SiteSpec): string | null {
  const [root, second, third, fourth] = path;
  if (root === "business") {
    if (second === "links" && typeof third === "string" && third in LINK_LABELS) {
      return LINK_LABELS[third as LinkKey];
    }
    if (second === "hours" && typeof third === "number") return `Hours, row ${third + 1}`;
    if (second === "highlights" && typeof third === "number") return `Highlight ${third + 1}`;
    return typeof second === "string" ? (BUSINESS_LABELS[second] ?? null) : null;
  }
  if (root === "sections" && typeof second === "number") {
    const type = spec?.sections[second]?.type;
    const section = type ? `${SECTION_NAMES[type]} section` : `Section ${second + 1}`;
    if (third === "items" && typeof fourth === "number") return `${section}, item ${fourth + 1}`;
    const field = typeof third === "string" ? SECTION_FIELDS[third] : undefined;
    return field ? `${section} ${field}` : section;
  }
  if (root === "theme") return "Colors and fonts";
  return null;
}

/**
 * Frase para o dono a partir de um erro do schema: "Service area is too long (max 120
 * characters)." em vez de "business › serviceArea: Too big: …".
 */
export function describeIssue(issue: IssueLike, spec?: SiteSpec): string {
  const label = fieldLabel(issue.path, spec);
  if (!label) return "Please check your changes.";
  const isLink = issue.path[0] === "business" && issue.path[1] === "links";
  if (issue.code === "too_big" && typeof issue.maximum === "number") {
    return issue.origin === "array"
      ? `${label}: too many items (max ${issue.maximum}).`
      : `${label} is too long (max ${issue.maximum} characters).`;
  }
  if (isLink) return `${label} must be a full web address starting with https://.`;
  if (issue.path[1] === "email") return "Email doesn't look right. Check it and try again.";
  if (issue.path[1] === "state") return "State must be the 2-letter code, like TX.";
  return `${label}: ${issue.message}`;
}

// ---------- Cópia local do rascunho (localStorage) ----------

/**
 * Cópia guardada no navegador: aceita o que ainda está pela metade (e-mail, estado, link), que
 * o schema de verdade recusaria. O tipo é o mesmo do SiteSpec (os campos continuam strings).
 */
const LooseLink = z.string().max(500).optional();
const LocalDraftSpec = SiteSpec.extend({
  business: SiteSpec.shape.business.extend({
    email: z.string().max(320).optional(),
    state: z.string().max(2).optional(),
    links: z
      .object({
        booking: LooseLink,
        order: LooseLink,
        menu: LooseLink,
        instagram: LooseLink,
        facebook: LooseLink,
        tiktok: LooseLink,
        google: LooseLink,
        yelp: LooseLink,
        linkedin: LooseLink,
      })
      .optional(),
  }),
});
const LocalDraft = z.object({ spec: LocalDraftSpec, at: z.number() });

/** Cópias com mais de uma semana são ignoradas (o site já deve ter mudado). */
const LOCAL_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const localDraftKey = (siteId: string) => `ns-draft-${siteId}`;

export function serializeLocalDraft(spec: SiteSpec, now = Date.now()): string {
  return JSON.stringify({ spec, at: now });
}

/** Lê a cópia local; `null` se não existe, está estragada ou é velha demais. */
export function parseLocalDraft(raw: string | null, now = Date.now()): SiteSpec | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = LocalDraft.safeParse(data);
  if (!parsed.success || now - parsed.data.at > LOCAL_DRAFT_MAX_AGE_MS) return null;
  const spec: SiteSpec = parsed.data.spec;
  return spec;
}

/** JSON com as chaves em ordem (o banco pode devolver as chaves em outra ordem). */
function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, inner: unknown) =>
    inner && typeof inner === "object" && !Array.isArray(inner)
      ? Object.fromEntries(
          Object.entries(inner as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)),
        )
      : inner,
  );
}

/** Os dois rascunhos têm o mesmo conteúdo (ignorando a ordem das chaves)? */
export function sameSpec(a: SiteSpec, b: SiteSpec): boolean {
  return stableJson(a) === stableJson(b);
}
