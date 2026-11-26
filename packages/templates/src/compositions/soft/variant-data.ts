import type { TemplateId, Theme } from "@nosweat/schema";
import { luminance, readableTextOn } from "../../theme";
import type { SoftCtx } from "./context";

// Funções puras dos quatro ramos que usam a composição "soft" além da beleza (serviços para casa,
// restaurante, profissional e portfólio): variante, cor da ação, ícones por palavra-chave, botão
// principal e o desenho da galeria do portfólio. Sem React: fácil de testar.

export type SoftVariant = "beauty" | "trade" | "food" | "pro" | "work";

export const VARIANT_OF: Record<TemplateId, SoftVariant> = {
  beauty: "beauty",
  "home-services": "trade",
  restaurant: "food",
  professional: "pro",
  portfolio: "work",
};

function contrast(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * Cor do botão de ação. Serviços para casa e portfólio usam a cor secundária (o laranja de ligar,
 * o cobre do convite) se ela se destaca da página (3:1) e o texto do botão fica legível (4,5:1);
 * senão, e nos outros ramos, a cor principal. Assim qualquer paleta do dono funciona.
 */
export function actionColors(variant: SoftVariant, theme: Theme): { action: string; on: string } {
  const own = { action: theme.primary, on: readableTextOn(theme.primary) };
  if (variant !== "trade" && variant !== "work") return own;
  const accent = theme.secondary;
  const on = readableTextOn(accent);
  const accentL = luminance(accent);
  const visible = contrast(accentL, luminance(theme.background)) >= 3;
  const legible = contrast(accentL, luminance(on)) >= 4.5;
  return visible && legible ? { action: accent, on } : own;
}

export type TradeIconKey =
  | "heater"
  | "drain"
  | "pipe"
  | "bolt"
  | "roller"
  | "broom"
  | "leaf"
  | "roof"
  | "truck"
  | "wrench";

// A ordem importa: a primeira regra que bate vence ("Drain cleaning" = ralo, não vassoura).
const TRADE_RULES: [TradeIconKey, RegExp][] = [
  ["heater", /heater|boiler|furnace|hvac|heating|\bac\b|air condition/],
  ["drain", /drain|clog|sewer|leak|slab|flood|water damage|camera/],
  ["pipe", /repip|pipe|gas line|main line/],
  ["bolt", /electri|wiring|panel|outlet|generator|lighting|charger/],
  ["roller", /paint|stain|drywall/],
  ["broom", /clean|maid|janitor|scrub|wash|move-in|move-out|post-renovation|tidy|dust/],
  ["leaf", /lawn|landscap|garden|mow|tree|yard|irrigation|sod|mulch|shrub|hedge/],
  ["roof", /roof|gutter|siding|window|door|floor|remodel|deck|fence|kitchen|bath/],
  ["truck", /haul|junk|moving|mover|delivery|towing/],
];

/** Ícone do serviço de casa pelo nome; sem palavra-chave, a chave inglesa. Nunca por posição. */
export function tradeIconKey(name: string): TradeIconKey {
  const text = name.toLowerCase();
  for (const [key, pattern] of TRADE_RULES) if (pattern.test(text)) return key;
  return "wrench";
}

export type FoodIconKey = "utensils" | "cup" | "flame" | "cake";

const FOOD_RULES: [FoodIconKey, RegExp][] = [
  [
    "cup",
    /coffee|espresso|latte|cappuccino|\btea\b|drink|juice|smoothie|beer|wine|cocktail|margarita|soda|lemonade|horchata|brew/,
  ],
  [
    "cake",
    /dessert|cake|pastry|pastries|bread|cookie|donut|croissant|\bpie\b|bake|muffin|flan|churro/,
  ],
  ["flame", /bbq|barbecue|brisket|\bribs?\b|smoked|grill|wings|steak|carne|pizza/],
];

/** Ícone do prato pelo nome; sem palavra-chave, talher. */
export function foodIconKey(name: string): FoodIconKey {
  const text = name.toLowerCase();
  for (const [key, pattern] of FOOD_RULES) if (pattern.test(text)) return key;
  return "utensils";
}

/** Link de mensagem de texto para o telefone do dono ("sms:5125550142"). */
export function smsHref(phone: string): string {
  return `sms:${phone.replace(/[^\d+]/g, "")}`;
}

export type Cta = {
  label: string;
  href: string;
  external: boolean;
  /** "book" abre o seletor de agendamento do próprio site (#book). */
  kind: "call" | "link" | "book";
};

const isHttp = (href: string) => /^https?:\/\//.test(href);

/** Botão "Get an estimate": o contato da página, senão ligar. */
export function estimateCta(ctx: SoftCtx): Cta | undefined {
  const { model } = ctx;
  if (ctx.hasContact)
    return { label: "Get an estimate", href: "#contact", external: false, kind: "link" };
  if (model.phoneHref)
    return { label: "Get an estimate", href: model.phoneHref, external: false, kind: "link" };
  return undefined;
}

/**
 * Ação principal de cada ramo (só links do dono, nunca inventados).
 * - casa: ligar; sem telefone, o orçamento.
 * - restaurante: pedido online, depois reserva, depois ligar.
 * - profissional e portfólio: o botão do topo (agendamento do site, link do dono ou #contact).
 */
export function primaryCta(ctx: SoftCtx): Cta {
  const { model, variant } = ctx;
  const { business, phoneHref } = model;
  const call: Cta | undefined =
    phoneHref && business.phone
      ? { label: `Call ${business.phone}`, href: phoneHref, external: false, kind: "call" }
      : undefined;
  if (variant === "trade") {
    return call ?? estimateCta(ctx) ?? fallbackCta(ctx);
  }
  if (variant === "food") {
    const order = business.links?.order;
    if (order) return { label: "Order online", href: order, external: isHttp(order), kind: "link" };
    const booking = business.links?.booking;
    if (booking) {
      return { label: "Reserve a table", href: booking, external: isHttp(booking), kind: "link" };
    }
    return call ?? fallbackCta(ctx);
  }
  if (ctx.hasBooking)
    return { label: model.ctaLabel, href: "#book", external: false, kind: "book" };
  return fallbackCta(ctx);
}

function fallbackCta(ctx: SoftCtx): Cta {
  const { model } = ctx;
  return { label: model.ctaLabel, href: model.ctaHref, external: model.ctaExternal, kind: "link" };
}

/** Quantas fotos de uma galeria de portfólio ocupam cada quadro (ver `workShapes`). */
export type WorkShape = {
  /** Celular (2 colunas): "full" ocupa a linha toda. */
  m: "full" | "half";
  /** Computador (grade de 6 colunas): quantas colunas o quadro ocupa. */
  d: 2 | 3 | 6;
};

/** Desenho da galeria do portfólio que sempre fecha a grade, sem quadro vazio. */
export function workShapes(count: number): WorkShape[] {
  const shapes: WorkShape[] = [];
  const rem = count % 3;
  for (let i = 0; i < count; i++) {
    const last = i === count - 1;
    let m: WorkShape["m"] = "half";
    if (i === 0 || (last && (count - 1) % 2 === 1)) m = "full";

    let d: WorkShape["d"] = 2;
    if (count === 1) d = 6;
    else if (count === 2 || count === 4) d = 3;
    else if (rem === 1 && last) d = 6;
    else if (rem === 2 && i >= count - 2) d = 3;
    shapes.push({ m, d });
  }
  return shapes;
}
