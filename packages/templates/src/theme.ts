import type { Theme } from "@nosweat/schema";
import type { CSSProperties } from "react";
import { FONT_PAIRS } from "./fonts";

type NsCssVars = Record<`--ns-${string}`, string>;

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminância relativa (WCAG) de uma cor #RRGGBB. */
export function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = channelToLinear((value >> 16) & 0xff);
  const g = channelToLinear((value >> 8) & 0xff);
  const b = channelToLinear(value & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const LIGHT = "#FFFFFF";
const DARK = "#0B0F19";

/** Cor de texto (clara ou escura) com melhor contraste sobre `hex`. */
export function readableTextOn(hex: string): string {
  const l = luminance(hex);
  const contrastWithLight = 1.05 / (l + 0.05);
  const contrastWithDark = (l + 0.05) / (luminance(DARK) + 0.05);
  return contrastWithLight >= contrastWithDark ? LIGHT : DARK;
}

/** Converte spec.theme nas variáveis CSS --ns-* usadas pelos componentes. */
export function themeToCssVars(theme: Theme): CSSProperties & NsCssVars {
  const fonts = FONT_PAIRS[theme.font];
  return {
    "--ns-primary": theme.primary,
    "--ns-on-primary": readableTextOn(theme.primary),
    "--ns-secondary": theme.secondary,
    "--ns-on-secondary": readableTextOn(theme.secondary),
    "--ns-background": theme.background,
    "--ns-text": theme.text,
    "--ns-font-heading": fonts.heading,
    "--ns-font-body": fonts.body,
  };
}
