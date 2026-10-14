import type { PrimaryAction } from "@nosweat/schema";

// Sinais tirados da descrição do dono, sem IA: ramo, tom e o que o visitante deve fazer.
// Servem para escolher a direção de arte ANTES de escrever o site (ver plan.ts).

export const INDUSTRIES = [
  "trades",
  "cleaning",
  "beauty",
  "food",
  "professional",
  "creative",
  "wellness",
  "other",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const TONES = ["warm", "refined", "bold", "calm", "playful", "premium", "minimal"] as const;
export type Tone = (typeof TONES)[number];

export type BriefSignals = {
  industry: Industry;
  tones: Tone[];
  /** Tons que vieram do estilo escolhido pelo dono (valem mais que as palavras da descrição). */
  styleTones: Tone[];
  primaryAction: PrimaryAction;
  /** Estilo escolhido pelo dono no /create ("Style: elegant"), quando houver. */
  style?: string;
  /** O dono falou de horário? (a faixa de informações vale mais) */
  mentionsHours: boolean;
};

/** Sem acento e em minúsculas, para comparar palavras. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

const INDUSTRY_WORDS: [Industry, RegExp][] = [
  [
    "food",
    /\b(restaurant|cafe|coffee|bakery|bakeries|pizza|taco|taqueria|food truck|diner|bistro|bar|brewery|cater|caters|catering|caterer|kitchen|deli|eatery|ice cream|donut)\b/,
  ],
  [
    "beauty",
    /\b(salon|barber|barbershop|hair|nail|lash|brow|makeup|beauty|tattoo|esthetic|aesthetic|waxing)\b/,
  ],
  [
    "wellness",
    /\b(spa|massage|yoga|pilates|wellness|therapy|therapist|chiropract|acupunct|fitness|gym|trainer|dentist|dental|clinic)\b/,
  ],
  ["cleaning", /\b(clean|cleaning|cleaners|maid|janitorial|pressure wash|window washing|organiz)/],
  [
    "trades",
    /\b(plumb|electric|hvac|heating|cooling|roof|landscap|lawn|handyman|contractor|remodel|carpent|paint|pest|mover|moving|garage door|locksmith|auto repair|mechanic|towing|pool|fence|concrete|flooring|tree service|gutter)/,
  ],
  [
    "professional",
    /\b(law|lawyer|attorney|accountant|accounting|cpa|tax|bookkeep|insurance|real estate|realtor|consult|financial|advisor|notary|tutor|architect)/,
  ],
  [
    "creative",
    /\b(photograph|designer|design studio|artist|illustrat|musician|band|videograph|portfolio|studio|florist|wedding planner|event planner)/,
  ],
];

/** Linha "Style: ..." que o /create acrescenta quando o dono escolhe um estilo. */
const STYLE_TONES: Record<string, Tone[]> = {
  "warm & friendly": ["warm", "playful"],
  "clean & professional": ["calm", "refined"],
  "bold & local": ["bold"],
  elegant: ["premium", "refined"],
  simple: ["minimal", "calm"],
};

const TONE_WORDS: [Tone, RegExp][] = [
  ["premium", /\b(luxury|luxurious|upscale|high-end|premium|boutique|exclusive|fine dining)\b/],
  ["refined", /\b(elegant|refined|sophisticated|classic|timeless|discreet|professional)\b/],
  [
    "warm",
    /\b(family|cozy|homestyle|homemade|neighborhood|friendly|welcoming|grandma|abuela|local favorite)\b/,
  ],
  ["bold", /\b(bold|loud|no-nonsense|tough|fast|reliable|straight talk)\b/],
  ["playful", /\b(fun|playful|colorful|kids|pets|dog|cat|party)\b/],
  ["calm", /\b(calm|relax|peaceful|gentle|quiet|serene)\b/],
  ["minimal", /\b(minimal|simple|clean look|modern)\b/],
];

const ACTION_WORDS: [PrimaryAction, RegExp][] = [
  [
    "call",
    /\b(emergency|emergencies|24\/7|24-7|open 24 hours|24 hours a day|same[- ]day|urgent|burst|leak|lockout|towing|call us|call me)\b/,
  ],
  [
    "book",
    /\b(appointment|appointments|book|booking|schedule|consultation|reservation|reservations|reserve|session|sessions)\b/,
  ],
  ["quote", /\b(estimate|estimates|quote|quotes|bid|bids|proposal)\b/],
  [
    "visit",
    /\b(visit us|come visit|stop by|walk-in|walk-ins|walk ins|come in|dine-in|storefront|our shop)\b/,
  ],
  ["browse", /\b(portfolio|my work|our work|gallery|collection)\b/],
];

/** Ação esperada de cada ramo quando a descrição não diz nada. */
const DEFAULT_ACTION: Record<Industry, PrimaryAction> = {
  trades: "call",
  cleaning: "quote",
  beauty: "book",
  food: "visit",
  professional: "book",
  creative: "browse",
  wellness: "book",
  other: "quote",
};

export function readBrief(brief: string): BriefSignals {
  const text = normalize(brief);
  const styleMatch = /(?:^|\n)\s*style:\s*([^\n]+)/.exec(text);
  const style = styleMatch?.[1]?.trim().replace(/\.$/, "");
  // A linha de estilo não conta como descrição do negócio.
  const body = styleMatch ? text.replace(styleMatch[0], " ") : text;

  const industry = INDUSTRY_WORDS.find(([, re]) => re.test(body))?.[0] ?? "other";

  const styleTones = style ? (STYLE_TONES[style] ?? []) : [];
  const tones = new Set<Tone>(styleTones);
  for (const [tone, re] of TONE_WORDS) if (re.test(body)) tones.add(tone);

  // "Ligar" ganha de tudo quando há urgência; depois, o que o dono pediu; senão, o padrão do ramo.
  const action = ACTION_WORDS.find(([, re]) => re.test(body))?.[0] ?? DEFAULT_ACTION[industry];

  return {
    industry,
    tones: [...tones],
    styleTones,
    primaryAction: action,
    style,
    mentionsHours: /\b(\d{1,2}\s?(am|pm)|open|hours|mon|tue|wed|thu|fri|sat|sun)\b/.test(body),
  };
}
