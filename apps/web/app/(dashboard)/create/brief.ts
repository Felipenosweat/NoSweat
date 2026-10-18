import type { Composition, TemplateId } from "@nosweat/schema";

// Lógica pura do fluxo /create: estilos, montagem do texto único (brief) enviado para
// POST /api/sites/generate e leitura do texto que vem da landing (?brief= ou sessionStorage).
// Sem React aqui, para poder testar com o Vitest em ambiente node.

/** Limites por campo: somados (com as frases de ligação) ficam abaixo dos 2.000 do schema. */
export const LIMITS = {
  name: 80,
  what: 300,
  city: 60,
  serviceArea: 160,
  details: 1200,
} as const;

export type CreateFields = {
  name: string;
  what: string;
  city: string;
  state: string;
  serviceArea: string;
  details: string;
  style: StyleId;
};

export const EMPTY_FIELDS: CreateFields = {
  name: "",
  what: "",
  city: "",
  state: "",
  serviceArea: "",
  details: "",
  style: "auto",
};

export type StyleId = "auto" | "warm" | "professional" | "bold" | "elegant" | "simple";

export type StyleOption = {
  id: Exclude<StyleId, "auto">;
  label: string;
  /** Texto da linha "Style: …" (o prompt do gerador reconhece exatamente estes nomes). */
  briefName: string;
  note: string;
  headingFont: { name: string; variable: string };
  bodyFont: { name: string; variable: string };
  /**
   * Amostra do clima de cores do site do cliente (não é cor da marca No Sweat).
   * Os valores reais são escolhidos pela IA; isto só ilustra a direção.
   */
  swatch: { background: string; text: string; dots: [string, string, string] };
};

// Cada personalidade aponta para um par de `theme.font` (ver FONT_PAIRS em @nosweat/templates)
// e para o mesmo mapeamento descrito em server/ai/prompt.ts.
export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "warm",
    label: "Warm & friendly",
    briefName: "warm & friendly",
    note: "Warm and neighborly.",
    headingFont: { name: "Fraunces", variable: "--ns-font-fresh-heading" },
    bodyFont: { name: "Hanken Grotesk", variable: "--ns-font-fresh-body" },
    swatch: {
      background: "#FBF6EE",
      text: "#2B211B",
      dots: ["#B4532A", "#E3B448", "#7C8B6F"],
    },
  },
  {
    id: "professional",
    label: "Clean & professional",
    briefName: "clean & professional",
    note: "Calm and precise.",
    headingFont: { name: "DM Serif Display", variable: "--ns-font-refined-heading" },
    bodyFont: { name: "DM Sans", variable: "--ns-font-refined-body" },
    swatch: {
      background: "#F4F7FA",
      text: "#0F1B2D",
      dots: ["#1E3A5F", "#5B7A99", "#C9D6E3"],
    },
  },
  {
    id: "bold",
    label: "Bold & local",
    briefName: "bold & local",
    note: "Short and punchy.",
    headingFont: { name: "Bricolage Grotesque", variable: "--ns-font-bold-heading" },
    bodyFont: { name: "Inter", variable: "--ns-font-modern-body" },
    swatch: {
      background: "#FFFFFF",
      text: "#111111",
      dots: ["#C8102E", "#FFB703", "#111111"],
    },
  },
  {
    id: "elegant",
    label: "Elegant",
    briefName: "elegant",
    note: "Quiet and polished.",
    headingFont: { name: "Cormorant Garamond", variable: "--ns-font-luxe-heading" },
    bodyFont: { name: "Manrope", variable: "--ns-font-luxe-body" },
    swatch: {
      background: "#FAF7F2",
      text: "#241A24",
      dots: ["#3D2B3D", "#C9A96E", "#E8DFD3"],
    },
  },
  {
    id: "simple",
    label: "Simple",
    briefName: "simple",
    note: "Plain words only.",
    headingFont: { name: "Plus Jakarta Sans", variable: "--ns-font-modern-heading" },
    bodyFont: { name: "Inter", variable: "--ns-font-modern-body" },
    swatch: {
      background: "#FFFFFF",
      text: "#111827",
      dots: ["#111827", "#2563EB", "#E5E7EB"],
    },
  },
];

/** Tamanho máximo do pedido único do /create (cabe nos 2.000 do schema com o resto). */
export const PROMPT_LIMIT = 1500;

/** Tipos de negócio do passo 1 (um por `TemplateId`), com a frase que vai no brief. */
export const BUSINESS_KINDS = [
  {
    id: "home-services",
    label: "Home services & trades",
    briefName: "home services (repairs and contractor work)",
  },
  { id: "beauty", label: "Beauty & personal care", briefName: "beauty and personal care" },
  { id: "restaurant", label: "Restaurant & food", briefName: "restaurant or food business" },
  {
    id: "professional",
    label: "Professional services",
    briefName: "professional services (consulting, legal, financial)",
  },
  { id: "portfolio", label: "Creative & portfolio", briefName: "creative work and portfolio" },
] as const satisfies readonly { id: TemplateId; label: string; briefName: string }[];

export type BusinessKind = TemplateId | "auto";

/**
 * Layouts do passo 2 (um por `Composition` do renderer). A captura é o topo de um site de
 * exemplo feito com aquela composição (ver packages/fixtures).
 */
export const LAYOUT_OPTIONS = [
  {
    id: "service-led",
    label: "Classic",
    note: "Phone up top, photo beside the headline, service cards.",
    image: "/landing/wall/joes-plumbing-top.webp",
  },
  {
    id: "editorial",
    label: "Editorial",
    note: "Magazine headline, a wide photo, numbered services.",
    image: "/landing/wall/glow-salon-top.webp",
  },
  {
    id: "immersive",
    label: "Immersive",
    note: "Full-width photo with the headline on top of it.",
    image: "/landing/wall/rosas-kitchen-top.webp",
  },
  {
    id: "typographic",
    label: "Typographic",
    note: "Big type as the main image, a bold block of color.",
    image: "/landing/wall/hale-ortiz-top.webp",
  },
  {
    id: "modular",
    label: "Modular",
    note: "A grid of blocks: headline, photo, hours and contact.",
    image: "/landing/wall/sparkle-cleaning-top.webp",
  },
] as const satisfies readonly { id: Composition; label: string; note: string; image: string }[];

export type LayoutChoice = Composition | "auto";

/** Escolhas do assistente que não são campos de texto ("auto" = a No Sweat decide). */
export type CreateChoices = { kind: BusinessKind; layout: LayoutChoice };

export const EMPTY_CHOICES: CreateChoices = { kind: "auto", layout: "auto" };

/** Escolhas guardadas na aba (junto do rascunho). */
export const CHOICES_KEY = "ns-create-choices";

export function parseChoices(raw: string | null): CreateChoices {
  if (!raw) return { ...EMPTY_CHOICES };
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return { ...EMPTY_CHOICES };
    const { kind, layout } = value as Record<string, unknown>;
    return {
      kind: BUSINESS_KINDS.find((option) => option.id === kind)?.id ?? "auto",
      layout: LAYOUT_OPTIONS.find((option) => option.id === layout)?.id ?? "auto",
    };
  } catch {
    return { ...EMPTY_CHOICES };
  }
}

/** Siglas aceitas no campo de estado (50 estados, DC e territórios). */
export const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
  "VA", "WA", "WV", "WI", "WY", "DC", "PR", "VI", "GU", "AS", "MP",
]); // prettier-ignore

/** Nome de cada sigla, para a lista do campo de estado. */
export const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana",
  IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin",
  WY: "Wyoming", PR: "Puerto Rico", VI: "U.S. Virgin Islands", GU: "Guam",
  AS: "American Samoa", MP: "Northern Mariana Islands",
}; // prettier-ignore

/**
 * Sigla para o que a pessoa digitou no campo de estado: a sigla ("ma") ou o nome inteiro
 * ("massachusetts"). `null` se não der para saber.
 */
export function stateCodeFor(text: string): string | null {
  const clean = text.trim().toLowerCase();
  if (!clean) return null;
  const upper = clean.toUpperCase();
  if (US_STATES.has(upper)) return upper;
  const byName = Object.entries(US_STATE_NAMES).find(([, name]) => name.toLowerCase() === clean);
  return byName?.[0] ?? null;
}

/** Estados que combinam com o que foi digitado (sigla ou começo de uma palavra do nome). */
export function matchStates(text: string): string[] {
  const clean = text.trim().toLowerCase();
  const codes = Object.keys(US_STATE_NAMES);
  if (!clean) return codes.sort((a, b) => US_STATE_NAMES[a]!.localeCompare(US_STATE_NAMES[b]!));
  return codes
    .filter((code) => {
      const name = US_STATE_NAMES[code]!.toLowerCase();
      return (
        code.toLowerCase().startsWith(clean) ||
        name.split(" ").some((w) => w.startsWith(clean)) ||
        name.startsWith(clean)
      );
    })
    .sort((a, b) => {
      // Sigla exata primeiro ("ma" → MA), depois em ordem alfabética do nome.
      const exact = Number(b.toLowerCase() === clean) - Number(a.toLowerCase() === clean);
      return exact || US_STATE_NAMES[a]!.localeCompare(US_STATE_NAMES[b]!);
    });
}

/** "Shrewsbury, Auburn and Holden" → ["Shrewsbury", "Auburn", "Holden"]. */
export function splitArea(text: string): string[] {
  return text
    .split(/,|\band\b|&/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** ["A"] → "A"; ["A", "B"] → "A and B"; ["A", "B", "C"] → "A, B and C". */
export function joinArea(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * Liga/desliga uma cidade na área atendida (botões de cidades vizinhas). Respeita o limite do
 * campo: se não couber, devolve o texto como estava.
 */
export function toggleArea(text: string, name: string, max: number = LIMITS.serviceArea): string {
  const names = splitArea(text);
  const index = names.findIndex((n) => n.toLowerCase() === name.toLowerCase());
  if (index >= 0) names.splice(index, 1);
  else names.push(name);
  const next = joinArea(names);
  return next.length <= max ? next : text;
}

/** Normaliza espaços e garante pontuação final, para o brief ler como frases. */
function sentence(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "";
  return /[.!?…]["”’)]?$/.test(clean) ? clean : `${clean}.`;
}

/** "Austin, TX", "Austin" ou "TX". */
export function formatLocation(city: string, state: string): string {
  return [city.trim(), state.trim().toUpperCase()].filter(Boolean).join(", ");
}

/**
 * Monta UM texto em frases naturais a partir dos três passos. A linha "Style: …" fica
 * sozinha no fim (o prompt do gerador procura por ela).
 */
export function composeBrief(fields: CreateFields, choices: CreateChoices = EMPTY_CHOICES): string {
  const location = formatLocation(fields.city, fields.state);
  const intro = [
    fields.name.trim() ? sentence(`The business is called ${fields.name.trim()}`) : "",
    sentence(fields.what),
    location ? sentence(`Based in ${location}`) : "",
    fields.serviceArea.trim() ? sentence(`Service area: ${fields.serviceArea.trim()}`) : "",
  ]
    .filter(Boolean)
    .join(" ");

  const paragraphs = [intro, fields.details.trim()];
  // Escolhas do assistente (tipo de negócio e layout): frases de dica para o gerador. A API
  // só recebe o texto; quem decide de verdade é server/design + a IA.
  const kind = BUSINESS_KINDS.find((option) => option.id === choices.kind);
  const layout = LAYOUT_OPTIONS.find((option) => option.id === choices.layout);
  const hints = [
    kind ? `Type of business: ${kind.briefName}.` : "",
    layout ? `Preferred layout: ${layout.id}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
  paragraphs.push(hints);
  const style = STYLE_OPTIONS.find((option) => option.id === fields.style);
  if (style) paragraphs.push(`Style: ${style.briefName}.`);
  return paragraphs.filter(Boolean).join("\n\n");
}

/** Corta no último espaço antes do limite, para não quebrar uma palavra no meio. */
function cutAtWord(text: string, max: number): [string, string] {
  if (text.length <= max) return [text, ""];
  const space = text.lastIndexOf(" ", max);
  const at = space > max * 0.6 ? space : max;
  return [text.slice(0, at).trim(), text.slice(at).trim()];
}

/**
 * Distribui o texto da landing nos campos: a primeira frase vai para "What do you do?" e o
 * resto para os detalhes. "… in Austin, TX" também preenche cidade e estado.
 */
export function fieldsFromBrief(brief: string): CreateFields {
  const text = brief
    .trim()
    .replace(/[ \t]+/g, " ")
    .slice(0, 2000);
  if (!text) return { ...EMPTY_FIELDS };

  let what = text;
  let details = "";
  if (text.length > LIMITS.what) {
    const first = /^[\s\S]+?[.!?](?=\s|$)/.exec(text)?.[0] ?? "";
    if (first && first.length <= LIMITS.what) {
      what = first.trim();
      details = text.slice(first.length).trim();
    } else {
      [what, details] = cutAtWord(text, LIMITS.what);
    }
  }

  const fields: CreateFields = {
    ...EMPTY_FIELDS,
    what: what.replace(/\s*\n+\s*/g, " "),
    details: details.slice(0, LIMITS.details),
  };

  const place = /\bin ([A-Z][\w.'’-]*(?: [A-Z][\w.'’-]*){0,3}),? ([A-Z]{2})\b/.exec(text);
  if (place?.[1] && place[2] && US_STATES.has(place[2])) {
    fields.city = place[1].slice(0, LIMITS.city);
    fields.state = place[2];
  }
  return fields;
}

/** Mesmo algoritmo de `makeSlug` (server/domains), sem o pedaço do id. */
export function slugBase(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/**
 * O endereço grátis que o site recebe ao publicar: espelha `makeSlug(name, id)` de
 * server/domains (o cliente não pode importar código do servidor).
 */
export function publishedSlug(name: string, id: string): string {
  return `${slugBase(name) || "site"}-${id.replace(/-/g, "").slice(0, 6).toLowerCase()}`;
}

/** Rascunho do formulário guardado na aba (sobrevive a um login no meio do caminho). */
export const DRAFT_KEY = "ns-create-draft";
/** Texto que a landing deixa para o /create. */
export const LANDING_BRIEF_KEY = "ns-brief";

export type StoredDraft = { source: string; step: number; fields: CreateFields };

export function parseDraft(raw: string | null): StoredDraft | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const draft = value as Partial<StoredDraft>;
    if (typeof draft.source !== "string" || typeof draft.fields !== "object" || !draft.fields) {
      return null;
    }
    const fields = { ...EMPTY_FIELDS };
    for (const key of Object.keys(EMPTY_FIELDS) as (keyof CreateFields)[]) {
      const field: unknown = (draft.fields as Record<string, unknown>)[key];
      if (typeof field === "string") (fields as Record<string, string>)[key] = field;
    }
    if (!["auto", ...STYLE_OPTIONS.map((option) => option.id)].includes(fields.style)) {
      fields.style = "auto";
    }
    const step = draft.step === 1 || draft.step === 2 || draft.step === 3 ? draft.step : 0;
    return { source: draft.source, step, fields };
  } catch {
    return null;
  }
}
