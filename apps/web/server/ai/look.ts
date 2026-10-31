import { SiteDesign, Theme, type FontId, type TemplateId } from "@nosweat/schema";
import { z } from "zod";

// Aparência de cada site gerado: paleta, fonte, botões, cabeçalho, contato e ordem das seções.
// O site-modelo é a BASE de qualidade, não um molde: cada negócio sai com o próprio visual.
// - A IA escolhe (campos opcionais do ModelFill) e o código confere: cores em hex e contraste
//   AA (4,5:1); paleta reprovada → a do modelo (ou a do estilo escolhido pelo dono).
// - Sem IA (mock do dev e modo modelo), variedLook sorteia pelo nome do negócio (sempre o mesmo
//   resultado para o mesmo nome), só entre paletas já conferidas.

/** Visual escolhido pela IA no ModelFill (o resto do `design` vem do plano). */
export const FillStyle = SiteDesign.pick({
  buttons: true,
  header: true,
  contact: true,
  density: true,
  imageTreatment: true,
});
export type FillStyle = z.infer<typeof FillStyle>;

/** Seções entre o topo e o contato que a IA pode reordenar. */
export const MiddleSection = z.enum(["services", "about", "testimonials", "faq"]);
export type MiddleSection = z.infer<typeof MiddleSection>;
export const SectionOrder = z.array(MiddleSection).max(4);

/** Seções que a IA pode tirar (serviços, topo e contato ficam sempre). */
export const DroppableSection = z.enum(["about", "testimonials", "faq"]);
export const DropSections = z.array(DroppableSection).max(3);

// ---------------------------------------------------------------------------------------------
// Contraste (WCAG 2.x)

/** Contraste mínimo de texto normal (AA). */
export const MIN_CONTRAST = 4.5;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminância relativa (WCAG) de uma cor #RRGGBB. Mesma conta de readableTextOn (templates). */
export function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channelToLinear((value >> 16) & 0xff) +
    0.7152 * channelToLinear((value >> 8) & 0xff) +
    0.0722 * channelToLinear(value & 0xff)
  );
}

/** Razão de contraste entre duas cores #RRGGBB (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Texto dos botões: o template usa branco ou quase preto, o que contrastar mais. */
const LABEL_LIGHT = "#FFFFFF";
const LABEL_DARK = "#0B0F19";
const labelContrast = (hex: string) =>
  Math.max(contrastRatio(hex, LABEL_LIGHT), contrastRatio(hex, LABEL_DARK));

/**
 * Problemas de uma paleta (lista vazia = pode usar). Regras: todas as cores em #RRGGBB; texto
 * sobre o fundo (e sobre `surface`), cor principal sobre o fundo (links e destaques), texto
 * dos botões sobre a principal e a secundária, e `muted` sobre o fundo (e `surface`): AA.
 */
export function paletteProblems(theme: Theme): string[] {
  const colors: [string, string | undefined][] = [
    ["primary", theme.primary],
    ["secondary", theme.secondary],
    ["background", theme.background],
    ["surface", theme.surface],
    ["text", theme.text],
    ["muted", theme.muted],
  ];
  const invalid = colors.filter(([, value]) => value !== undefined && !HEX_RE.test(value));
  if (invalid.length > 0) return invalid.map(([name]) => `${name}: not a #RRGGBB color`);

  const problems: string[] = [];
  const check = (label: string, ratio: number) => {
    if (ratio < MIN_CONTRAST) {
      problems.push(`${label}: contrast ${ratio.toFixed(2)}:1, needs ${MIN_CONTRAST}:1`);
    }
  };
  check("text on background", contrastRatio(theme.text, theme.background));
  check("primary on background", contrastRatio(theme.primary, theme.background));
  check("button label on primary", labelContrast(theme.primary));
  check("button label on secondary", labelContrast(theme.secondary));
  if (theme.surface) check("text on surface", contrastRatio(theme.text, theme.surface));
  if (theme.muted) {
    check("muted on background", contrastRatio(theme.muted, theme.background));
    if (theme.surface) check("muted on surface", contrastRatio(theme.muted, theme.surface));
  }
  return problems;
}

/**
 * Tema final: o da IA se a paleta passar no contraste; senão as cores de `base` (o modelo) com
 * a fonte que a IA escolheu. Sem tema da IA, `base` inteiro.
 */
export function pickTheme(chosen: Theme | undefined, base: Theme): Theme {
  if (!chosen) return { ...base };
  if (paletteProblems(chosen).length > 0) return { ...base, font: chosen.font };
  return { ...chosen };
}

/**
 * Tira da resposta crua da IA as partes de aparência inválidas (cor fora do formato, opção que
 * não existe, null), em vez de reprovar a resposta inteira: sem elas valem as do modelo.
 * `imageQuery` longo demais dos serviços é cortado; vazio ou inválido sai.
 */
export function dropInvalidLook(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const out: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
  const parts: [string, z.ZodType][] = [
    ["theme", Theme],
    ["style", FillStyle],
    ["sectionOrder", SectionOrder],
    ["dropSections", DropSections],
  ];
  for (const [key, schema] of parts) {
    if (key in out && (out[key] == null || !schema.safeParse(out[key]).success)) delete out[key];
  }
  if (Array.isArray(out.services)) {
    out.services = out.services.map((item: unknown) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return item;
      const copy: Record<string, unknown> = { ...(item as Record<string, unknown>) };
      const query = typeof copy.imageQuery === "string" ? copy.imageQuery.trim() : "";
      if (query) copy.imageQuery = query.slice(0, 80);
      else delete copy.imageQuery;
      return copy;
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Visual sorteado pelo nome (sem IA)

type Palette = { name: string; colors: Omit<Theme, "font"> };

const palette = (
  name: string,
  [primary, secondary, background, surface, text, muted]: [
    string,
    string,
    string,
    string,
    string,
    string,
  ],
): Palette => ({ name, colors: { primary, secondary, background, surface, text, muted } });

/**
 * Paletas conferidas (todas passam em paletteProblems; há teste). Quatro por ramo, com cores
 * que combinam com o ramo. Ordem: principal, secundária, fundo, superfície, texto, texto fraco.
 */
export const PALETTES: Record<TemplateId, Palette[]> = {
  "home-services": [
    palette("deep teal with safety orange", [
      "#0F5257",
      "#F28C28",
      "#F7F5F0",
      "#ECE8DF",
      "#13201F",
      "#4F5B5A",
    ]),
    palette("navy with brass", ["#1F3A5F", "#C9A227", "#FAFAF7", "#EEF1F5", "#101826", "#4A5568"]),
    palette("forest green with lime", [
      "#2F5D3A",
      "#A3C93A",
      "#F6F8F3",
      "#E8EEE4",
      "#172119",
      "#4D5A4F",
    ]),
    palette("signal red with charcoal", [
      "#B3261E",
      "#2B2B2B",
      "#FFFFFF",
      "#F2F2F0",
      "#161616",
      "#555555",
    ]),
  ],
  beauty: [
    palette("plum with blush", ["#6B2D5C", "#E8B4BC", "#FBF6F4", "#F3E9EA", "#2A1626", "#6A5562"]),
    palette("sage with clay", ["#4F6B58", "#C98B6B", "#F7F5EF", "#ECEBE2", "#1F2620", "#5A6259"]),
    palette("ink with rose gold", [
      "#1E1E24",
      "#B76E79",
      "#FFFFFF",
      "#F5F0EE",
      "#1E1E24",
      "#5E5A60",
    ]),
    palette("terracotta with cream", [
      "#A0472E",
      "#E9C46A",
      "#FDF8F1",
      "#F5ECDF",
      "#2D1E17",
      "#6B5547",
    ]),
  ],
  restaurant: [
    palette("tomato with mustard", [
      "#B23A2E",
      "#E0A526",
      "#FFF9F0",
      "#F7EBDD",
      "#2A1A14",
      "#6A5246",
    ]),
    palette("olive with terracotta", [
      "#5C6B2E",
      "#C2603D",
      "#FAF7EE",
      "#EFEBDD",
      "#23261A",
      "#5B5E4D",
    ]),
    palette("espresso with caramel", [
      "#4A2C21",
      "#D9A05B",
      "#FBF5EC",
      "#F2E7D8",
      "#22150F",
      "#6B5649",
    ]),
    palette("green chile with corn yellow", [
      "#2E6B4F",
      "#F2C14E",
      "#FFFDF7",
      "#F1EEDF",
      "#17241D",
      "#55625A",
    ]),
  ],
  professional: [
    palette("navy with slate blue", [
      "#1B365D",
      "#6C8EAD",
      "#F7F9FB",
      "#EAEFF4",
      "#0E1A2B",
      "#4B5A6B",
    ]),
    palette("deep green with gold", [
      "#1F4D3A",
      "#B8963E",
      "#FBFAF6",
      "#EFEEE6",
      "#142019",
      "#4F5A53",
    ]),
    palette("burgundy with stone", [
      "#6E1F2B",
      "#A89F91",
      "#FAF8F5",
      "#F0ECE6",
      "#1F1416",
      "#5E5456",
    ]),
    palette("graphite with teal", [
      "#263238",
      "#00796B",
      "#FFFFFF",
      "#EEF2F3",
      "#1A2226",
      "#52616A",
    ]),
  ],
  portfolio: [
    palette("black and white with red", [
      "#111111",
      "#D7263D",
      "#FFFFFF",
      "#F3F3F3",
      "#111111",
      "#555555",
    ]),
    palette("warm gray with ochre", [
      "#3D3A36",
      "#C68B2F",
      "#F5F2EC",
      "#EAE5DC",
      "#1E1C1A",
      "#5F5A52",
    ]),
    palette("ink blue with peach", [
      "#22305A",
      "#F4A582",
      "#FBF8F4",
      "#F0EBE4",
      "#141A2E",
      "#545A6B",
    ]),
    palette("moss with sand", ["#3F5136", "#D8C3A5", "#F8F6F1", "#ECE8DE", "#1C2318", "#5A6152"]),
  ],
};

/** Fontes que combinam com cada ramo (ver a lista do prompt de geração). */
const FONTS: Record<TemplateId, FontId[]> = {
  "home-services": ["bold", "technical", "fresh", "modern"],
  beauty: ["editorial", "luxe", "fresh", "refined"],
  restaurant: ["classic", "friendly", "bold", "editorial"],
  professional: ["refined", "modern", "classic", "technical"],
  portfolio: ["gallery", "editorial", "modern", "luxe"],
};

const BUTTONS: NonNullable<SiteDesign["buttons"]>[] = ["pill", "sharp", "caps", "line"];
const HEADERS: NonNullable<SiteDesign["header"]>[] = ["classic", "centered", "bar", "minimal"];
const CONTACTS: NonNullable<SiteDesign["contact"]>[] = ["split", "stacked", "letter"];

/** Ordens das seções do meio (todas com algo útil antes do contato). */
const ORDERS: MiddleSection[][] = [
  ["services", "about", "testimonials", "faq"],
  ["about", "services", "faq", "testimonials"],
  ["services", "testimonials", "faq", "about"],
  ["services", "faq", "about", "testimonials"],
];

/**
 * Hash FNV-1a de 32 bits com a mistura final do MurmurHash3 (sem ela, os bits baixos quase só
 * dependem da última letra). Estável entre servidores; nada de Math.random.
 */
export function lookSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (const char of text.trim().toLowerCase()) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) >>> 0;
  hash ^= hash >>> 16;
  return hash >>> 0;
}

const pick = <T>(list: readonly T[], seed: number, step: number): T =>
  list[Math.floor(seed / step) % list.length] as T;

export type VariedLook = {
  paletteName: string;
  theme: Theme;
  style: Required<Pick<FillStyle, "buttons" | "header" | "contact">>;
  sectionOrder: MiddleSection[];
};

/**
 * Visual sorteado pelo `seedText` (o nome do negócio ou o pedido) dentro das opções do ramo.
 * Mesmo texto, mesmo visual. Cada parte usa um pedaço diferente do hash.
 */
export function variedLook(seedText: string, template: TemplateId): VariedLook {
  const seed = lookSeed(seedText);
  const chosen = pick(PALETTES[template], seed, 1);
  return {
    paletteName: chosen.name,
    theme: { ...chosen.colors, font: pick(FONTS[template], seed, 5) },
    style: {
      buttons: pick(BUTTONS, seed, 23),
      header: pick(HEADERS, seed, 97),
      contact: pick(CONTACTS, seed, 401),
    },
    sectionOrder: pick(ORDERS, seed, 1601),
  };
}

/**
 * Sugestão de visual que vai no pedido à IA (o Haiku tende a repetir as mesmas escolhas para
 * pedidos parecidos). É um ponto de partida sorteado pelo pedido, que a IA pode mudar. Com
 * estilo escolhido pelo dono, sem paleta nem fonte (valem as do estilo).
 */
export function lookHint(brief: string, template: TemplateId, ownerStyle: boolean): string {
  const look = variedLook(brief, template);
  const lines = [
    "Suggested starting point for the look, so this site does not look like the others. Keep it, adjust it, or replace it when something else clearly fits this business better:",
  ];
  if (!ownerStyle) {
    const { font, ...colors } = look.theme;
    lines.push(`- palette "${look.paletteName}": ${JSON.stringify(colors)}`, `- font: "${font}"`);
  }
  lines.push(
    `- style: buttons "${look.style.buttons}", header "${look.style.header}", contact "${look.style.contact}"`,
    `- sectionOrder: ${JSON.stringify(look.sectionOrder)}`,
  );
  return `<look_suggestion>\n${lines.join("\n")}\n</look_suggestion>`;
}
