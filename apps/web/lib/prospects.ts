import { z } from "zod";

// Contrato da prospecção (/admin/prospects e /api/admin/prospects/*). Sem nada do servidor:
// serve para as rotas e para os componentes de cliente.

export const WebsiteStatus = z.enum(["none", "weak", "ok", "unknown"]);
export type WebsiteStatus = z.infer<typeof WebsiteStatus>;

export const ProspectStatus = z.enum([
  "new",
  "preview_ready",
  "contacted",
  "replied",
  "won",
  "lost",
  "do_not_contact",
]);
export type ProspectStatus = z.infer<typeof ProspectStatus>;

export const WEBSITE_STATUS_LABELS: Record<WebsiteStatus, string> = {
  none: "No website",
  weak: "Weak site",
  ok: "OK",
  unknown: "Unknown",
};

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  new: "New",
  preview_ready: "Preview ready",
  contacted: "Contacted",
  replied: "Replied",
  won: "Won",
  lost: "Lost",
  do_not_contact: "Do not contact",
};

/** Sugestões do campo "Trade" (texto livre continua valendo). */
export const TRADE_SUGGESTIONS = [
  "plumber",
  "electrician",
  "house cleaning",
  "landscaping",
  "roofer",
  "painter",
  "HVAC",
  "handyman",
  "auto repair",
  "barber",
  "nail salon",
  "restaurant",
] as const;

/** Prévias por clique: cada uma gasta uma geração da IA (controle de custo). */
export const MAX_PREVIEWS_PER_RUN = 10;

const US_STATE = /^[A-Za-z]{2}$/;

/** Id de prospect (uuid, sem exigir a versão: o teste e o banco geram formatos diferentes). */
export const PROSPECT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** POST /api/admin/prospects/search */
// Tudo opcional: vazio = "Find leads" (qualquer ramo, cidade dos EUA sorteada). Cidade só vale
// com o estado junto.
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((value) => value || undefined);

export const ProspectSearchRequest = z
  .object({
    trade: optionalText(60, "Keep the trade under 60 characters."),
    city: optionalText(60, "Keep the city under 60 characters."),
    state: z
      .string()
      .trim()
      .optional()
      .transform((value) => value?.toUpperCase() || undefined)
      .refine(
        (value) => value === undefined || US_STATE.test(value),
        "Use the two-letter state, like TX.",
      ),
  })
  .refine((v) => Boolean(v.city) === Boolean(v.state), {
    message: "Type the city and the state together, or leave both empty.",
    path: ["city"],
  });
export type ProspectSearchRequest = z.infer<typeof ProspectSearchRequest>;

export const ProspectSearchResponse = z.object({
  query: z.string(),
  found: z.number().int(),
  added: z.number().int(),
  updated: z.number().int(),
  /** De onde vieram: Google Places (com chave), OpenStreetMap (grátis) ou de mentira (testes). */
  source: z.enum(["google", "osm", "mock"]),
  /** `true` quando os resultados são de mentira (testes e dev offline). */
  mock: z.boolean(),
});
export type ProspectSearchResponse = z.infer<typeof ProspectSearchResponse>;

/** POST /api/admin/prospects/status */
export const ProspectStatusRequest = z.object({
  ids: z
    .array(z.string().regex(PROSPECT_ID, "Invalid prospect id."))
    .min(1, "Select at least one prospect.")
    .max(500),
  status: ProspectStatus,
});
export type ProspectStatusRequest = z.infer<typeof ProspectStatusRequest>;

export const ProspectStatusResponse = z.object({ updated: z.number().int() });

/** O que a tela precisa de cada prospect (sem os campos internos). */
export const ProspectView = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  websiteStatus: WebsiteStatus,
  websiteNotes: z.string().nullable(),
  email: z.string().nullable(),
  rating: z.number().nullable(),
  reviewCount: z.number().nullable(),
  status: ProspectStatus,
  siteId: z.string().nullable(),
  /** Caminho da prévia pública (`/p/<token>`), ou `null` antes de criar. */
  previewPath: z.string().nullable(),
});
export type ProspectView = z.infer<typeof ProspectView>;

/** POST /api/admin/prospects/[id]/preview */
export const ProspectPreviewResponse = z.object({ prospect: ProspectView });
