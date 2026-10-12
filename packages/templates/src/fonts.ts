import type { FontId } from "@nosweat/schema";

/**
 * Pares de fontes de cada opção de `theme.font`.
 *
 * O app hospedeiro carrega as fontes (ex.: next/font) e expõe as variáveis CSS
 * listadas em FONT_CSS_VARIABLES. Se alguma não existir, entra o fallback do sistema.
 */
export const FONT_PAIRS: Record<FontId, { heading: string; body: string; label: string }> = {
  modern: {
    label: "Plus Jakarta Sans + Inter",
    heading: "var(--ns-font-modern-heading, ui-sans-serif), ui-sans-serif, system-ui, sans-serif",
    body: "var(--ns-font-modern-body, ui-sans-serif), ui-sans-serif, system-ui, sans-serif",
  },
  classic: {
    label: "Playfair Display + Lora",
    heading: "var(--ns-font-classic-heading, ui-serif), ui-serif, Georgia, serif",
    body: "var(--ns-font-classic-body, ui-serif), ui-serif, Georgia, serif",
  },
  friendly: {
    label: "Fredoka + Nunito",
    heading: "var(--ns-font-friendly-heading, ui-rounded), ui-rounded, system-ui, sans-serif",
    body: "var(--ns-font-friendly-body, ui-sans-serif), ui-sans-serif, system-ui, sans-serif",
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
] as const;
