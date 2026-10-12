import { z } from "zod";

// ATENÇÃO: este arquivo é o contrato entre front, back e IA.
// Não renomeie nem remova campos sem combinar com o time. Adicionar campo opcional é ok.

const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

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
  font: z.enum(["modern", "classic", "friendly"]),
});
export type Theme = z.infer<typeof Theme>;
export type FontId = Theme["font"];

export const Section = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    title: z.string(),
    subtitle: z.string(),
    ctaLabel: z.string(),
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
]);
export type Section = z.infer<typeof Section>;
export type SectionType = Section["type"];
/** Dados de uma seção específica, ex.: `SectionOf<"hero">`. */
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;

export const SiteSpec = z.object({
  version: z.literal(1),
  template: TemplateId,
  business: z.object({
    name: z.string(),
    phone: z.string().optional(),
    // Zod 4: `z.email()` substitui `z.string().email()` (mesma regra).
    email: z.email().optional(),
    city: z.string().optional(),
    state: z.string().length(2).optional(),
  }),
  theme: Theme,
  sections: z.array(Section).min(2).max(10),
});
export type SiteSpec = z.infer<typeof SiteSpec>;
export type Business = SiteSpec["business"];
