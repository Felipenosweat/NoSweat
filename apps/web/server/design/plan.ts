import type { Composition, PrimaryAction, SiteDesign } from "@nosweat/schema";
import { COMPOSITION_GUIDE, DESIGN_LIBRARY, type DesignReference } from "./library";
import { readBrief, type BriefSignals, type Industry, type Tone } from "./signals";

// Passo de direção de arte: roda ANTES de a IA escrever o site. Escolhe a composição, a ação
// principal, o respiro e o tratamento das fotos, e seleciona os resumos de referências
// aprovadas (library.ts) que entram no pedido à IA. Sem IA, sem rede e sem sorteio: a mesma
// descrição dá o mesmo plano (o desempate também é fixo).

export type DesignPlan = {
  composition: Composition;
  /** Composições aceitáveis para este pedido, na ordem de preferência (a IA pode escolher entre elas). */
  allowed: Composition[];
  primaryAction: PrimaryAction;
  density: NonNullable<SiteDesign["density"]>;
  imageTreatment: NonNullable<SiteDesign["imageTreatment"]>;
  /** Referências escolhidas (ids de docs/design/references.json). */
  references: DesignReference[];
  /** Nenhuma referência combinou: o plano usou só as regras gerais. */
  fallback: boolean;
  rationale: string;
  signals: BriefSignals;
};

const COMPOSITIONS: Composition[] = [
  "service-led",
  "editorial",
  "immersive",
  "typographic",
  "modular",
];

/** Ponto de partida por ramo. São preferências, não regras: tom, ação e referências mudam a escolha. */
const BY_INDUSTRY: Record<Industry, Partial<Record<Composition, number>>> = {
  trades: { "service-led": 3, modular: 2, typographic: 1 },
  cleaning: { modular: 3, "service-led": 2, editorial: 1 },
  beauty: { editorial: 3, immersive: 2, modular: 1 },
  food: { immersive: 3, editorial: 2, typographic: 1 },
  professional: { typographic: 3.5, editorial: 2, modular: 1 },
  creative: { editorial: 2, typographic: 2, immersive: 2 },
  wellness: { immersive: 3, editorial: 2, modular: 1 },
  other: { modular: 2, "service-led": 2, typographic: 1 },
};

const BY_TONE: Record<Tone, Partial<Record<Composition, number>>> = {
  warm: { immersive: 1, modular: 1 },
  refined: { editorial: 2, typographic: 1 },
  bold: { typographic: 2, "service-led": 1 },
  calm: { editorial: 1, modular: 1 },
  playful: { modular: 2 },
  premium: { editorial: 2, immersive: 1 },
  minimal: { typographic: 1, modular: 1 },
};

const BY_ACTION: Record<PrimaryAction, Partial<Record<Composition, number>>> = {
  call: { "service-led": 2, typographic: 1 },
  quote: { "service-led": 1, modular: 1 },
  book: { editorial: 1, modular: 1 },
  visit: { immersive: 2 },
  browse: { editorial: 1, immersive: 1 },
};

/** Tom do estilo escolhido pelo dono vale o dobro das palavras da descrição: é a vontade dele. */
const STYLE_WEIGHT = 2;

function add(
  scores: Map<Composition, number>,
  table: Partial<Record<Composition, number>>,
  weight = 1,
) {
  for (const [composition, value] of Object.entries(table) as [Composition, number][]) {
    scores.set(composition, (scores.get(composition) ?? 0) + value * weight);
  }
}

/** Quanto uma referência combina com o pedido (0 = nada). */
export function referenceScore(ref: DesignReference, signals: BriefSignals): number {
  let score = 0;
  if (ref.fits.businesses.includes(signals.industry)) score += 2;
  score += signals.tones.filter((tone) => ref.fits.tones.includes(tone)).length;
  if (ref.fits.goals.includes(signals.primaryAction)) score += 1;
  return score;
}

/** Desempate fixo pela própria descrição (nunca aleatório). */
function stableHash(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
}

export type PlanOptions = {
  library?: DesignReference[];
  /** Composições dos últimos sites desta conta: a mesma pessoa não recebe o mesmo layout de novo. */
  recent?: Composition[];
};

export function planDesign(brief: string, options: PlanOptions = {}): DesignPlan {
  const library = (options.library ?? DESIGN_LIBRARY).filter((ref) => ref.approved);
  const signals = readBrief(brief);
  const scores = new Map<Composition, number>(COMPOSITIONS.map((c) => [c, 0]));

  add(scores, BY_INDUSTRY[signals.industry]);
  for (const tone of signals.tones) {
    add(scores, BY_TONE[tone], signals.styleTones.includes(tone) ? STYLE_WEIGHT : 1);
  }
  add(scores, BY_ACTION[signals.primaryAction]);

  // Referências: as que combinam com o pedido votam nas composições onde funcionam.
  const ranked = library
    .map((ref) => ({ ref, score: referenceScore(ref, signals) }))
    .filter((r) => r.score >= 2)
    .sort((a, b) => b.score - a.score || a.ref.id.localeCompare(b.ref.id));
  for (const { ref, score } of ranked.slice(0, 4)) {
    for (const composition of ref.compositions) {
      scores.set(composition, (scores.get(composition) ?? 0) + Math.min(score, 4) * 0.25);
    }
  }

  // Variedade sem sorteio: o que esta pessoa recebeu nos últimos sites perde um pouco.
  for (const composition of options.recent ?? []) {
    scores.set(composition, (scores.get(composition) ?? 0) - 1.25);
  }

  const tiebreak = stableHash(brief);
  const order = [...COMPOSITIONS].sort((a, b) => {
    const diff = (scores.get(b) ?? 0) - (scores.get(a) ?? 0);
    if (Math.abs(diff) > 1e-9) return diff;
    return ((COMPOSITIONS.indexOf(a) + tiebreak) % 5) - ((COMPOSITIONS.indexOf(b) + tiebreak) % 5);
  });
  const composition = order[0] ?? "service-led";
  const best = scores.get(composition) ?? 0;
  // A IA pode trocar só por uma composição quase tão boa quanto a primeira.
  const allowed = order.filter((c) => best - (scores.get(c) ?? 0) <= 1).slice(0, 2);

  // Referências que valem para a composição escolhida (no máximo 3) vão para o pedido à IA.
  const references = ranked
    .filter(({ ref }) => ref.compositions.includes(composition))
    .slice(0, 3)
    .map(({ ref }) => ref);

  const tones = new Set(signals.tones);
  const density: DesignPlan["density"] =
    tones.has("premium") || tones.has("calm")
      ? "airy"
      : signals.primaryAction === "call"
        ? "compact"
        : "balanced";
  const imageTreatment: DesignPlan["imageTreatment"] =
    (tones.has("refined") || tones.has("minimal")) &&
    (composition === "editorial" || composition === "typographic") &&
    signals.industry !== "food"
      ? "monochrome"
      : "natural";

  const rationale = [
    `Business type: ${signals.industry}`,
    signals.style ? `owner style: ${signals.style}` : null,
    signals.tones.length ? `tone: ${signals.tones.join(", ")}` : null,
    `main action: ${signals.primaryAction}`,
    `composition: ${composition}${allowed.length > 1 ? ` (alternative: ${allowed[1]})` : ""}`,
    references.length
      ? `references: ${references.map((r) => r.id).join(", ")}`
      : "no matching reference, used the general rules",
    options.recent?.length ? `avoided repeating: ${options.recent.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("; ")
    .slice(0, 400);

  return {
    composition,
    allowed,
    primaryAction: signals.primaryAction,
    density,
    imageTreatment,
    references,
    fallback: references.length === 0,
    rationale,
    signals,
  };
}

/**
 * Texto que vai no pedido à IA: o plano e os resumos das referências escolhidas.
 * A IA não lê arquivos do repositório: o que ela precisa saber vai aqui, por escrito.
 */
export function designBriefForPrompt(plan: DesignPlan): string {
  const guide = (c: Composition) => `- "${c}": ${COMPOSITION_GUIDE[c].copy}`;
  const lines = [
    `Composition: "${plan.composition}"${plan.allowed.length > 1 ? ` (you may use "${plan.allowed[1]}" instead if the owner's words clearly fit it better)` : ""}.`,
    `Main visitor action: ${plan.primaryAction}. Write the call to action for this action.`,
    `Section rhythm: ${plan.density}. Photo treatment: ${plan.imageTreatment}.`,
    "",
    "How the copy should fit the composition:",
    ...plan.allowed.map(guide),
  ];
  if (plan.references.length) {
    lines.push(
      "",
      "Principles from approved design references (apply the ideas, never copy names, slogans or text):",
    );
    for (const ref of plan.references) {
      lines.push(`- ${ref.name}: ${ref.principles.join(" ")}`);
    }
  }
  return lines.join("\n");
}

/**
 * Grava o plano no SiteSpec gerado. A composição da IA só vale se estiver entre as permitidas;
 * as referências e o motivo vêm sempre do plano (para depuração, ficam salvos com o site).
 */
export function applyDesignPlan(design: SiteDesign | undefined, plan: DesignPlan): SiteDesign {
  const composition =
    design?.composition && plan.allowed.includes(design.composition)
      ? design.composition
      : plan.composition;
  return {
    composition,
    primaryAction: plan.primaryAction,
    density: plan.density,
    imageTreatment: plan.imageTreatment,
    references: plan.references.map((ref) => ref.id),
    rationale:
      composition === plan.composition
        ? plan.rationale
        : `${plan.rationale}; the AI picked the alternative`.slice(0, 400),
  };
}
