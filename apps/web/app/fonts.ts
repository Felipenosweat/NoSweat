import {
  Fredoka,
  Inter,
  Lora,
  Nunito,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from "next/font/google";

// Fontes dos 3 pares de `theme.font` (ver FONT_PAIRS em @nosweat/templates).
// O par "modern" também é a fonte da marca No Sweat.
const modernHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--ns-font-modern-heading",
});
const modernBody = Inter({ subsets: ["latin"], variable: "--ns-font-modern-body" });
const classicHeading = Playfair_Display({
  subsets: ["latin"],
  variable: "--ns-font-classic-heading",
  preload: false,
});
const classicBody = Lora({
  subsets: ["latin"],
  variable: "--ns-font-classic-body",
  preload: false,
});
const friendlyHeading = Fredoka({
  subsets: ["latin"],
  variable: "--ns-font-friendly-heading",
  preload: false,
});
const friendlyBody = Nunito({
  subsets: ["latin"],
  variable: "--ns-font-friendly-body",
  preload: false,
});

export const fontVariables = [
  modernHeading,
  modernBody,
  classicHeading,
  classicBody,
  friendlyHeading,
  friendlyBody,
]
  .map((font) => font.variable)
  .join(" ");
