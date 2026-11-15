import { contrastRatio, MIN_CONTRAST } from "./ai/look";

// Painel com a cara do site do cliente: a cor principal e o nome da empresa entram no lugar da
// marca No Sweat (barra lateral, botões, fundo). Só para quem está com o plano em dia
// (ver AccountShell); sem plano, o painel volta ao visual padrão da No Sweat.

export type WorkspaceBrand = {
  /** Nome da empresa (business.name do site). */
  name: string;
  /** Letra do selo redondo (primeira letra ou número do nome). */
  initial: string;
  /** Cor principal ajustada para texto branco em cima e para texto sobre fundo claro (AA). */
  primary: string;
  /** Tom mais escuro da principal (hover dos botões). */
  primaryDark: string;
  /** Segunda cor do site: só decoração (manchas do fundo). */
  accent: string;
};

const WHITE = "#ffffff";
const BLACK: Rgb = [0, 0, 0];

type Rgb = [number, number, number];

function toRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

/** Mistura `hex` com `target` (0 = a cor, 1 = o alvo). */
function mix(hex: string, target: Rgb, amount: number): string {
  const rgb = toRgb(hex);
  return toHex(rgb.map((c, i) => c + (target[i]! - c) * amount) as Rgb);
}

/**
 * Escurece a cor aos poucos até o branco ter contraste AA sobre ela (e ela sobre o branco). Cores
 * que já passam ficam iguais.
 */
export function readableOnWhite(hex: string): string {
  let color = hex.toLowerCase();
  for (let step = 0; step < 30 && contrastRatio(color, WHITE) < MIN_CONTRAST; step++) {
    color = mix(color, BLACK, 0.08);
  }
  return color;
}

/** Primeira letra ou número do nome, em maiúscula (selo do painel). */
function initialOf(name: string): string {
  const match = name.match(/[\p{L}\p{N}]/u);
  return match ? match[0].toUpperCase() : "•";
}

/** Marca do painel a partir do site (o que está no ar, ou o rascunho). Sem nome = sem marca. */
export function brandFromSpec(spec: {
  business: { name: string };
  theme: { primary: string; secondary: string };
}): WorkspaceBrand | null {
  const name = spec.business.name.trim();
  if (!name) return null;
  const primary = readableOnWhite(spec.theme.primary);
  return {
    name,
    initial: initialOf(name),
    primary,
    primaryDark: mix(primary, BLACK, 0.18),
    accent: spec.theme.secondary.toLowerCase(),
  };
}
