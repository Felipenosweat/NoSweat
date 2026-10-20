import type { Composition, PrimaryAction } from "@nosweat/schema";

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
  /** Layout escolhido pelo dono no /create ("Preferred layout: editorial."), quando houver. */
  preferredComposition?: Composition;
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

/** Comida "forte": estas palavras sozinhas já dizem que é restaurante, café, bar etc. */
const FOOD_WORDS =
  /\b(restaurant|cafe|coffee|bakery|bakeries|pizza|taco|taqueria|food truck|diner|bistro|brewery|cater|caters|catering|caterer|deli|eatery|ice cream|donut|cocktail|cocktails|tavern|pub|wine bar|sports bar|rooftop bar|juice bar)\b/;
/**
 * "kitchen" e "bar" sozinhos são fracos: reforma de cozinha, pia da cozinha, limpeza da
 * cozinha e barra de apoio ("grab bar") são serviços de casa. Só contam como comida quando
 * nenhuma palavra de serviço de casa (reparo ou limpeza) aparece e o texto não fala de um
 * trabalho na casa (consertar, instalar, trocar...).
 */
const WEAK_FOOD_WORDS = /\b(kitchen|kitchens|bar)\b/;
const HOME_JOB_WORDS =
  /\b(repair|install|fix|replac|remodel|renovat|sink|faucet|cabinet|countertop|appliance)/;
const CLEANING_WORDS =
  /\b(clean|cleaning|cleaners|maid|janitorial|pressure wash|window washing|organiz)/;
const TRADES_WORDS =
  /\b(plumb|electric|hvac|heating|cooling|roof|landscap|lawn|handyman|contractor|remodel|carpent|paint|pest|mover|moving|garage door|locksmith|auto repair|mechanic|towing|pool|fence|concrete|flooring|tree service|gutter|drain|sewer|water heater|clog|leak|faucet|grab bar)/;

const has = (re: RegExp) => (body: string) => re.test(body);

// A primeira que casar vence. Reparo vem antes de limpeza ("drain cleaning" de um encanador é
// conserto, não faxina) e a comida "fraca" vem depois dos dois.
const INDUSTRY_TESTS: [Industry, (body: string) => boolean][] = [
  ["food", has(FOOD_WORDS)],
  [
    "beauty",
    has(
      /\b(salon|barber|barbershop|hair|nail|lash|brow|makeup|beauty|tattoo|esthetic|aesthetic|waxing)\b/,
    ),
  ],
  [
    "wellness",
    has(
      /\b(spa|massage|yoga|pilates|wellness|therapy|therapist|chiropract|acupunct|fitness|gym|trainer|dentist|dental|clinic)\b/,
    ),
  ],
  ["trades", has(TRADES_WORDS)],
  ["cleaning", has(CLEANING_WORDS)],
  ["food", (body) => WEAK_FOOD_WORDS.test(body) && !HOME_JOB_WORDS.test(body)],
  [
    "professional",
    has(
      /\b(law|lawyer|attorney|accountant|accounting|cpa|tax|bookkeep|insurance|real estate|realtor|consult|financial|advisor|notary|tutor|architect)/,
    ),
  ],
  [
    "creative",
    has(
      /\b(photograph|designer|design studio|artist|illustrat|musician|band|videograph|portfolio|studio|florist|wedding planner|event planner)/,
    ),
  ],
];

/** Frase "Type of business: …." que o /create acrescenta quando o dono escolhe o tipo. */
const KIND_HINT_RE = /type of business:\s*([^.\n]+)\./;
/** Frase "Preferred layout: …." que o /create acrescenta quando o dono escolhe o layout. */
const LAYOUT_HINT_RE =
  /preferred layout:\s*(service-led|editorial|immersive|typographic|modular)\.?/;

/**
 * Ramo pelo tipo escolhido no assistente (a vontade do dono vale mais que as palavras).
 * "Home services" cobre reparos e limpeza: limpeza só quando a descrição fala de limpeza e
 * não fala de reparo.
 */
function industryFromKind(kind: string, body: string): Industry | null {
  if (kind.startsWith("home services")) {
    return CLEANING_WORDS.test(body) && !TRADES_WORDS.test(body) ? "cleaning" : "trades";
  }
  if (kind.startsWith("beauty")) return "beauty";
  if (kind.startsWith("restaurant")) return "food";
  if (kind.startsWith("professional")) return "professional";
  if (kind.startsWith("creative")) return "creative";
  return null;
}

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
  const kindMatch = KIND_HINT_RE.exec(text);
  const layoutMatch = LAYOUT_HINT_RE.exec(text);
  // As linhas de estilo, tipo e layout do assistente não contam como descrição do negócio.
  let body = text;
  for (const match of [styleMatch, kindMatch, layoutMatch]) {
    if (match) body = body.replace(match[0], " ");
  }

  const kind = kindMatch?.[1]?.trim();
  const industry =
    (kind ? industryFromKind(kind, body) : null) ??
    INDUSTRY_TESTS.find(([, test]) => test(body))?.[0] ??
    "other";

  const styleTones = style ? (STYLE_TONES[style] ?? []) : [];
  const tones = new Set<Tone>(styleTones);
  for (const [tone, re] of TONE_WORDS) if (re.test(body)) tones.add(tone);

  // "Ligar" ganha de tudo quando há urgência; depois, o que o dono pediu; senão, o padrão do ramo.
  const action = ACTION_WORDS.find(([, re]) => re.test(body))?.[0] ?? DEFAULT_ACTION[industry];

  const preferredComposition = layoutMatch?.[1] as Composition | undefined;

  return {
    industry,
    tones: [...tones],
    styleTones,
    primaryAction: action,
    style,
    ...(preferredComposition ? { preferredComposition } : {}),
    mentionsHours: /\b(\d{1,2}\s?(am|pm)|open|hours|mon|tue|wed|thu|fri|sat|sun)\b/.test(body),
  };
}
