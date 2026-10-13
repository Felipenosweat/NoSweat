import type { FontId } from "@nosweat/schema";

const SANS = "ui-sans-serif, system-ui, sans-serif";
const SERIF = "ui-serif, Georgia, serif";
const ROUNDED = "ui-rounded, system-ui, sans-serif";

/** Monta a pilha de fontes: variável do next/font primeiro, depois o fallback do sistema. */
function stack(variable: string, fallback: string): string {
  const first = fallback.split(",")[0] ?? "sans-serif";
  return `var(${variable}, ${first}), ${fallback}`;
}

/**
 * Pares de fontes de cada opção de `theme.font`.
 *
 * O app hospedeiro carrega as fontes (ex.: next/font) e expõe as variáveis CSS
 * listadas em FONT_CSS_VARIABLES. Se alguma não existir, entra o fallback do sistema.
 * O par "bold" reaproveita a Inter do par "modern" (mesma fonte, um download só).
 */
export const FONT_PAIRS: Record<FontId, { heading: string; body: string; label: string }> = {
  modern: {
    label: "Plus Jakarta Sans + Inter",
    heading: stack("--ns-font-modern-heading", SANS),
    body: stack("--ns-font-modern-body", SANS),
  },
  classic: {
    label: "Playfair Display + Lora",
    heading: stack("--ns-font-classic-heading", SERIF),
    body: stack("--ns-font-classic-body", SERIF),
  },
  friendly: {
    label: "Fredoka + Nunito",
    heading: stack("--ns-font-friendly-heading", ROUNDED),
    body: stack("--ns-font-friendly-body", SANS),
  },
  fresh: {
    label: "Fraunces + Hanken Grotesk",
    heading: stack("--ns-font-fresh-heading", SERIF),
    body: stack("--ns-font-fresh-body", SANS),
  },
  editorial: {
    label: "Instrument Serif + Instrument Sans",
    heading: stack("--ns-font-editorial-heading", SERIF),
    body: stack("--ns-font-editorial-body", SANS),
  },
  bold: {
    label: "Bricolage Grotesque + Inter",
    heading: stack("--ns-font-bold-heading", SANS),
    body: stack("--ns-font-modern-body", SANS),
  },
  refined: {
    label: "DM Serif Display + DM Sans",
    heading: stack("--ns-font-refined-heading", SERIF),
    body: stack("--ns-font-refined-body", SANS),
  },
  luxe: {
    label: "Cormorant Garamond + Manrope",
    heading: stack("--ns-font-luxe-heading", SERIF),
    body: stack("--ns-font-luxe-body", SANS),
  },
  technical: {
    label: "Space Grotesk + IBM Plex Sans",
    heading: stack("--ns-font-technical-heading", SANS),
    body: stack("--ns-font-technical-body", SANS),
  },
  gallery: {
    label: "Funnel Display + Funnel Sans",
    heading: stack("--ns-font-gallery-heading", SANS),
    body: stack("--ns-font-gallery-body", SANS),
  },
};

/** Variáveis que o app hospedeiro deve definir com as fontes carregadas. */
export const FONT_CSS_VARIABLES = [
  "--ns-font-modern-heading",
  "--ns-font-modern-body",
  "--ns-font-classic-heading",
  "--ns-font-classic-body",
  "--ns-font-friendly-heading",
  "--ns-font-friendly-body",
  "--ns-font-fresh-heading",
  "--ns-font-fresh-body",
  "--ns-font-editorial-heading",
  "--ns-font-editorial-body",
  "--ns-font-bold-heading",
  "--ns-font-refined-heading",
  "--ns-font-refined-body",
  "--ns-font-luxe-heading",
  "--ns-font-luxe-body",
  "--ns-font-technical-heading",
  "--ns-font-technical-body",
  "--ns-font-gallery-heading",
  "--ns-font-gallery-body",
] as const;
