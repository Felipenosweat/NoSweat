import { z } from "zod";
import { SiteSpec } from "./site";

// Contrato das rotas em apps/web/app/api. Front e back importam daqui.

// ---------- Erro (formato único para todas as rotas) ----------

/** Códigos conhecidos. `code` continua `string` para permitir novos códigos sem quebrar o front. */
export const ERROR_CODES = [
  "invalid_request",
  "not_found",
  "not_implemented",
  "generation_failed",
  "internal_error",
] as const;
export type KnownErrorCode = (typeof ERROR_CODES)[number];

export const ApiError = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof ApiError>;

// ---------- Tipos compartilhados ----------

export const SiteId = z.string().min(1);
export type SiteId = z.infer<typeof SiteId>;

export const SiteStatus = z.enum(["draft", "published"]);
export type SiteStatus = z.infer<typeof SiteStatus>;

// ---------- POST /api/sites/generate ----------

export const GenerateSiteRequest = z.object({
  brief: z
    .string()
    .trim()
    .min(10, "Tell us a bit more about your business (at least 10 characters).")
    .max(2000, "Please keep the description under 2,000 characters."),
});
export type GenerateSiteRequest = z.infer<typeof GenerateSiteRequest>;

export const GenerateSiteResponse = z.object({
  siteId: SiteId,
  spec: SiteSpec,
});
export type GenerateSiteResponse = z.infer<typeof GenerateSiteResponse>;

// ---------- GET /api/sites/[id] ----------

export const GetSiteResponse = z.object({
  siteId: SiteId,
  spec: SiteSpec,
  status: SiteStatus,
});
export type GetSiteResponse = z.infer<typeof GetSiteResponse>;

// ---------- PATCH /api/sites/[id] ----------

export const UpdateSiteRequest = z.object({
  spec: SiteSpec,
});
export type UpdateSiteRequest = z.infer<typeof UpdateSiteRequest>;

export const UpdateSiteResponse = z.object({
  siteId: SiteId,
  spec: SiteSpec,
});
export type UpdateSiteResponse = z.infer<typeof UpdateSiteResponse>;

// ---------- POST /api/sites/[id]/regenerate-section (501 por enquanto) ----------

export const RegenerateSectionRequest = z.object({
  sectionIndex: z.number().int().min(0),
  instructions: z.string().max(500).optional(),
});
export type RegenerateSectionRequest = z.infer<typeof RegenerateSectionRequest>;

export const RegenerateSectionResponse = z.object({
  siteId: SiteId,
  spec: SiteSpec,
});
export type RegenerateSectionResponse = z.infer<typeof RegenerateSectionResponse>;

// ---------- POST /api/sites/[id]/publish (501 por enquanto) ----------

export const PublishSiteResponse = z.object({
  siteId: SiteId,
  status: SiteStatus,
  url: z.url(),
});
export type PublishSiteResponse = z.infer<typeof PublishSiteResponse>;

// ---------- GET /api/me/credits ----------

export const CreditsResponse = z.object({
  remaining: z.number().int().nonnegative(),
  // Por enquanto só existe o plano de teste; novos planos entram aqui.
  plan: z.enum(["trial"]),
});
export type CreditsResponse = z.infer<typeof CreditsResponse>;
