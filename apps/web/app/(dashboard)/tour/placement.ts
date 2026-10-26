// Contas do tour guiado: onde fica o anel de destaque e onde o cartão de texto cabe ao lado do
// alvo sem sair da tela. Só funções puras (coordenadas da janela, em px), testadas à parte.

export type Rect = { top: number; left: number; width: number; height: number };
export type Size = { width: number; height: number };
export type Side = "right" | "bottom" | "top" | "left";

/** Ordem de preferência do lado do cartão (direita primeiro: o menu fica à esquerda). */
export const SIDE_ORDER: readonly Side[] = ["right", "bottom", "top", "left"];

/** Folga entre o alvo e o anel. */
export const RING_PADDING = 6;
/** Distância entre o anel e o cartão (espaço da seta). */
export const POPOVER_GAP = 16;
/** Margem mínima até a borda da tela. */
export const VIEWPORT_MARGIN = 12;
/** A seta nunca encosta no canto arredondado do cartão. */
export const ARROW_INSET = 22;

function clamp(value: number, min: number, max: number): number {
  // Tela menor que o cartão: encosta na margem de cima/esquerda.
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export function inflate(rect: Rect, by: number): Rect {
  return {
    top: rect.top - by,
    left: rect.left - by,
    width: rect.width + by * 2,
    height: rect.height + by * 2,
  };
}

/** Corta o retângulo para caber na tela (alvo maior que a tela: o anel fica visível). */
export function clampToViewport(rect: Rect, viewport: Size, margin = 4): Rect {
  const top = Math.max(rect.top, margin);
  const left = Math.max(rect.left, margin);
  const bottom = Math.min(rect.top + rect.height, viewport.height - margin);
  const right = Math.min(rect.left + rect.width, viewport.width - margin);
  return { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

/** Anel em volta do alvo: um pouco maior que ele e sempre dentro da tela. */
export function ringRect(target: Rect, viewport: Size): Rect {
  return clampToViewport(inflate(target, RING_PADDING), viewport);
}

/** Raio do anel: arredondado como os cartões, sem virar uma pílula torta em alvos baixos. */
export function ringRadius(ring: Rect): number {
  return Math.round(Math.min(20, ring.height / 2, ring.width / 2));
}

/**
 * De onde o anel parte no efeito de "zoom": um retângulo bem maior, centrado no alvo (e dentro
 * da tela). Ele encolhe até o anel em ~300 ms.
 */
export function zoomStartRect(ring: Rect, viewport: Size): Rect {
  const width = Math.min(viewport.width, ring.width * 1.6 + 160);
  const height = Math.min(viewport.height, ring.height * 1.6 + 160);
  const centerX = ring.left + ring.width / 2;
  const centerY = ring.top + ring.height / 2;
  return {
    top: clamp(centerY - height / 2, 0, viewport.height - height),
    left: clamp(centerX - width / 2, 0, viewport.width - width),
    width,
    height,
  };
}

export type Placement = {
  side: Side;
  top: number;
  left: number;
  /** Posição da seta ao longo da borda do cartão que aponta para o alvo (px a partir do início). */
  arrow: number;
};

/** Espaço livre de cada lado do anel, já sem a distância e a margem. */
function freeSpace(ring: Rect, viewport: Size, gap: number, margin: number): Record<Side, number> {
  return {
    right: viewport.width - (ring.left + ring.width) - gap - margin,
    left: ring.left - gap - margin,
    bottom: viewport.height - (ring.top + ring.height) - gap - margin,
    top: ring.top - gap - margin,
  };
}

const horizontal = (side: Side) => side === "right" || side === "left";

/**
 * Lado e posição do cartão: o primeiro lado (direita, embaixo, em cima, à esquerda) onde ele
 * cabe inteiro; se nenhum couber, o lado com mais espaço proporcional, preso dentro da tela.
 */
export function placePopover({
  ring,
  popover,
  viewport,
  gap = POPOVER_GAP,
  margin = VIEWPORT_MARGIN,
}: {
  ring: Rect;
  popover: Size;
  viewport: Size;
  gap?: number;
  margin?: number;
}): Placement {
  const space = freeSpace(ring, viewport, gap, margin);
  const need = (side: Side) => (horizontal(side) ? popover.width : popover.height);
  const side =
    SIDE_ORDER.find((s) => space[s] >= need(s)) ??
    SIDE_ORDER.reduce((best, s) => (space[s] / need(s) > space[best] / need(best) ? s : best));

  const centerX = ring.left + ring.width / 2;
  const centerY = ring.top + ring.height / 2;
  const maxTop = viewport.height - popover.height - margin;
  const maxLeft = viewport.width - popover.width - margin;

  let top: number;
  let left: number;
  if (side === "right" || side === "left") {
    left = side === "right" ? ring.left + ring.width + gap : ring.left - gap - popover.width;
    top = centerY - popover.height / 2;
  } else {
    top = side === "bottom" ? ring.top + ring.height + gap : ring.top - gap - popover.height;
    left = centerX - popover.width / 2;
  }
  top = clamp(top, margin, maxTop);
  left = clamp(left, margin, maxLeft);

  const along = horizontal(side) ? centerY - top : centerX - left;
  const length = horizontal(side) ? popover.height : popover.width;
  const arrow = clamp(along, ARROW_INSET, length - ARROW_INSET);

  return { side, top: Math.round(top), left: Math.round(left), arrow: Math.round(arrow) };
}

/** Abaixo disto o cartão fica preso na borda da tela (celular), sem seta. */
export const PHONE_MAX_WIDTH = 640;

export function isPhone(viewport: Size): boolean {
  return viewport.width < PHONE_MAX_WIDTH;
}

/**
 * Celular: o cartão fica preso embaixo (acima da barra de abas). Se ali ele cobriria o alvo, vai
 * para cima. `bottomOffset` = da borda de baixo da tela até a base do cartão.
 */
export function phoneDock({
  ring,
  popoverHeight,
  viewport,
  bottomOffset,
  margin = VIEWPORT_MARGIN,
}: {
  ring: Rect;
  popoverHeight: number;
  viewport: Size;
  bottomOffset: number;
  margin?: number;
}): "bottom" | "top" {
  const dockBottom = viewport.height - bottomOffset;
  const dockTop = dockBottom - popoverHeight;
  const ringBottom = ring.top + ring.height;
  const overlaps = ring.top < dockBottom && ringBottom > dockTop - margin;
  if (!overlaps) return "bottom";
  // Em cima só se lá ele não cobrir também (senão embaixo continua o melhor).
  const fitsAbove = ring.top >= popoverHeight + margin * 2;
  return fitsAbove ? "top" : "bottom";
}

/** O alvo está bem dentro da tela (não precisa rolar)? */
export function isComfortablyVisible(rect: Rect, viewport: Size, margin = 24): boolean {
  return (
    rect.top >= margin &&
    rect.left >= 0 &&
    rect.top + rect.height <= viewport.height - margin &&
    rect.left + rect.width <= viewport.width
  );
}

/** Dois retângulos iguais (arredondando a meio px): usado para saber se a rolagem parou. */
export function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (!a || !b) return false;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}
