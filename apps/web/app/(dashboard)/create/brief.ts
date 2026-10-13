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

/** Siglas aceitas no campo de estado (50 estados, DC e territórios). */
export const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
  "VA", "WA", "WV", "WI", "WY", "DC", "PR", "VI", "GU", "AS", "MP",
]); // prettier-ignore

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
export function composeBrief(fields: CreateFields): string {
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
    const step = draft.step === 1 || draft.step === 2 ? draft.step : 0;
    return { source: draft.source, step, fields };
  } catch {
    return null;
  }
}
