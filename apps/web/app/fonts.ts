import {
  Bricolage_Grotesque,
  Cormorant_Garamond,
  DM_Sans,
  DM_Serif_Display,
  Fraunces,
  Fredoka,
  Funnel_Display,
  Funnel_Sans,
  Hanken_Grotesk,
  IBM_Plex_Sans,
  Instrument_Sans,
  Instrument_Serif,
  Inter,
  Lora,
  Manrope,
  Nunito,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google";

// Fontes dos 10 pares de `theme.font` (ver FONT_PAIRS em @nosweat/templates).
// O par "modern" também é a fonte da marca No Sweat: é o único com preload.
// Os outros usam `preload: false`; o navegador só baixa o arquivo da fonte que a página usa
// (o @font-face existe, mas sem nenhum elemento usando a família, nada é baixado).
// O next/font exige opções escritas por extenso (sem spread).
// Instrument Serif e DM Serif Display só têm peso 400 (não existem em versão variável).

const modernHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--ns-font-modern-heading",
});
// Inter também é o texto do par "bold".
const modernBody = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--ns-font-modern-body",
});

const classicHeading = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-classic-heading",
});
const classicBody = Lora({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-classic-body",
});
const friendlyHeading = Fredoka({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-friendly-heading",
});
const friendlyBody = Nunito({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-friendly-body",
});
const freshHeading = Fraunces({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-fresh-heading",
});
const freshBody = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-fresh-body",
});
// Instrument Serif (itálico) e Bricolage Grotesque também são as fontes de destaque da landing
// (V5), por isso têm preload e o itálico.
const editorialHeading = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
  variable: "--ns-font-editorial-heading",
});
const editorialBody = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-editorial-body",
});
const boldHeading = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--ns-font-bold-heading",
});
const refinedHeading = DM_Serif_Display({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--ns-font-refined-heading",
});
const refinedBody = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-refined-body",
});
const luxeHeading = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-luxe-heading",
});
const luxeBody = Manrope({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-luxe-body",
});
const technicalHeading = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-technical-heading",
});
const technicalBody = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-technical-body",
});
const galleryHeading = Funnel_Display({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-gallery-heading",
});
const galleryBody = Funnel_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--ns-font-gallery-body",
});

export const fontVariables = [
  modernHeading,
  modernBody,
  classicHeading,
  classicBody,
  friendlyHeading,
  friendlyBody,
  freshHeading,
  freshBody,
  editorialHeading,
  editorialBody,
  boldHeading,
  refinedHeading,
  refinedBody,
  luxeHeading,
  luxeBody,
  technicalHeading,
  technicalBody,
  galleryHeading,
  galleryBody,
]
  .map((font) => font.variable)
  .join(" ");
