import { z } from "zod";

// ATENÇÃO: este arquivo é o contrato entre front, back e IA.
// Não renomeie nem remova campos sem combinar com o time. Adicionar campo opcional é ok.

const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
// https:// ou uma foto hospedada pela própria No Sweat (/photos/..., usada nos exemplos).
const HttpsUrl = z
  .string()
  .max(1000)
  .regex(/^(https:\/\/\S+|\/photos\/[\w./-]+)$/);

/**
 * Foto do site. Quem preenche é a PLATAFORMA (busca em banco de imagens ou upload do dono),
 * nunca a IA: a IA só escreve `imageQuery`.
 * - kind "scene": foto genérica de banco de imagens (cozinha limpa, ferramentas, um prato).
 *   Nunca pode aparecer como "nossa equipe", "nosso trabalho" ou "antes e depois".
 * - kind "owner": foto enviada pelo dono (a única aceita na galeria).
 */
export const SiteImage = z.object({
  url: HttpsUrl,
  alt: z.string().max(160),
  source: z.enum(["pexels", "unsplash", "upload"]),
  kind: z.enum(["scene", "owner"]),
  /** Crédito do fotógrafo (bancos de imagens pedem). */
  credit: z.object({ name: z.string().max(80), url: HttpsUrl }).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  /**
   * Ponto de interesse da foto ("x% y%", como o object-position do CSS), para os cortes de
   * cada composição não cortarem o que importa. Sem ele, o centro.
   */
  focus: z
    .string()
    .regex(/^\d{1,3}% \d{1,3}%$/)
    .optional(),
});
export type SiteImage = z.infer<typeof SiteImage>;

/** Pares de fontes (título + texto). Ver FONT_PAIRS em @nosweat/templates. */
export const FontId = z.enum([
  "modern",
  "classic",
  "friendly",
  "fresh",
  "editorial",
  "bold",
  "refined",
  "luxe",
  "technical",
  "gallery",
]);

export const TemplateId = z.enum([
  "home-services",
  "beauty",
  "restaurant",
  "professional",
  "portfolio",
]);
export type TemplateId = z.infer<typeof TemplateId>;

export const Theme = z.object({
  primary: Hex,
  secondary: Hex,
  background: Hex,
  text: Hex,
  font: FontId,
});
export type Theme = z.infer<typeof Theme>;
export type FontId = z.infer<typeof FontId>;

export const Section = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    title: z.string(),
    subtitle: z.string(),
    ctaLabel: z.string(),
    /** 2 a 5 palavras em inglês descrevendo uma foto genérica para o topo (escrito pela IA). */
    imageQuery: z.string().max(80).optional(),
    /** Foto do topo (preenchida pela plataforma, não pela IA). */
    image: SiteImage.optional(),
  }),
  z.object({
    type: z.literal("services"),
    items: z.array(z.object({ name: z.string(), description: z.string() })).max(8),
  }),
  z.object({
    type: z.literal("testimonials"),
    items: z.array(z.object({ quote: z.string(), author: z.string() })).max(6),
  }),
  z.object({
    type: z.literal("faq"),
    items: z.array(z.object({ q: z.string(), a: z.string() })).max(10),
  }),
  z.object({ type: z.literal("contact"), showForm: z.boolean(), showMap: z.boolean() }),
  /** Galeria de fotos DO DONO (só kind "owner"). A IA nunca cria esta seção. */
  z.object({
    type: z.literal("gallery"),
    title: z.string().max(80).optional(),
    images: z.array(SiteImage).max(12),
  }),
]);
export type Section = z.infer<typeof Section>;
export type SectionType = Section["type"];
/** Dados de uma seção específica, ex.: `SectionOf<"hero">`. */
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;

/**
 * Composição da página: a ARQUITETURA do site (topo, ritmo das seções, navegação), separada do
 * ramo do negócio (`template`). Dois negócios do mesmo ramo podem ter composições diferentes.
 * - "service-led": telefone sempre à vista, topo em duas colunas com foto, cards de serviço.
 * - "editorial": título enorme de revista, foto larga com legenda, serviços numerados em lista.
 * - "immersive": foto de ponta a ponta no topo, texto sobre a foto, faixa de informações.
 * - "typographic": tipografia como imagem principal, bloco de cor, índice de serviços.
 * - "modular": grade de blocos (bento) com título, foto, horário e contato lado a lado.
 */
export const Composition = z.enum([
  "service-led",
  "editorial",
  "immersive",
  "typographic",
  "modular",
]);
export type Composition = z.infer<typeof Composition>;

/** Ação principal que o site quer do visitante. */
export const PrimaryAction = z.enum(["call", "quote", "book", "visit", "browse"]);
export type PrimaryAction = z.infer<typeof PrimaryAction>;

/**
 * Direção de arte do site, escolhida ANTES de escrever o texto (ver apps/web/server/design).
 * Sem `design` (sites antigos), o site usa a composição "service-led", como sempre foi.
 */
export const SiteDesign = z.object({
  composition: Composition,
  primaryAction: PrimaryAction.optional(),
  /** Respiro entre as seções. */
  density: z.enum(["airy", "balanced", "compact"]).optional(),
  /** Tratamento das fotos: natural, com um véu da cor da marca ou em preto e branco. */
  imageTreatment: z.enum(["natural", "tinted", "monochrome"]).optional(),
  /** Ids das referências de design usadas no plano (docs/design/references.json), para depuração. */
  references: z.array(z.string().max(60)).max(4).optional(),
  /** Por que esta direção foi escolhida (curto, para depuração). */
  rationale: z.string().max(400).optional(),
});
export type SiteDesign = z.infer<typeof SiteDesign>;

export const SiteSpec = z.object({
  version: z.literal(1),
  template: TemplateId,
  /** Direção de arte (opcional). Ver SiteDesign. */
  design: SiteDesign.optional(),
  business: z.object({
    name: z.string(),
    phone: z.string().optional(),
    // Zod 4: `z.email()` substitui `z.string().email()` (mesma regra).
    email: z.email().optional(),
    city: z.string().optional(),
    state: z.string().length(2).optional(),
    /** Área atendida, ex.: "Austin and nearby cities". */
    serviceArea: z.string().max(120).optional(),
    /** Horário de funcionamento, ex.: { days: "Mon–Fri", time: "8 AM – 6 PM" }. */
    hours: z
      .array(z.object({ days: z.string().max(40), time: z.string().max(40) }))
      .max(7)
      .optional(),
    /**
     * Fatos que O DONO confirmou (ex.: "Licensed & insured", "Free estimates").
     * Viram os selos do site. Nunca inventar: sem confirmação, fica vazio.
     */
    highlights: z.array(z.string().max(40)).max(4).optional(),
  }),
  theme: Theme,
  sections: z.array(Section).min(2).max(10),
});
export type SiteSpec = z.infer<typeof SiteSpec>;
export type Business = SiteSpec["business"];
