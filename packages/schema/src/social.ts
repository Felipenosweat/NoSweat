import { z } from "zod";

// Contrato do módulo de redes sociais (calendário de posts + Instagram).
// Fluxo: rascunho (dono ou IA) → o dono aprova → o cron publica na hora marcada.
// A IA nunca aprova nem publica sozinha (política da Meta e princípio do produto).

/** Redes que dá para conectar. Novas redes entram aqui (só adicionar). */
export const SocialProvider = z.enum(["instagram"]);
export type SocialProvider = z.infer<typeof SocialProvider>;

/**
 * - active: pode publicar;
 * - needs_reconnect: o acesso venceu ou foi recusado pelo Instagram; os posts ficam pausados;
 * - revoked: o dono desconectou (ou tirou o acesso no Instagram); o token foi apagado.
 */
export const SocialAccountStatus = z.enum(["active", "needs_reconnect", "revoked"]);
export type SocialAccountStatus = z.infer<typeof SocialAccountStatus>;

/** Conta conectada como o navegador vê: NUNCA tem o token de acesso. */
export const SocialAccount = z.object({
  id: z.string(),
  provider: SocialProvider,
  username: z.string(),
  avatarUrl: z.string().nullable(),
  accountType: z.string().nullable(),
  status: SocialAccountStatus,
  tokenExpiresAt: z.string().nullable(),
  connectedAt: z.string(),
});
export type SocialAccount = z.infer<typeof SocialAccount>;

/** Hora no formato 24h "HH:MM" (no fuso da empresa). */
const TimeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use the HH:MM format.");

/** Preferências do dono para o calendário (fuso, dias e hora padrão dos posts). */
export const SocialSettings = z.object({
  /** Fuso da empresa (IANA), ex.: "America/New_York". */
  timezone: z.string().min(1).max(64),
  /** Site usado como base para a IA criar os posts. */
  defaultSiteId: z.string().nullable(),
  /** Dias da semana dos posts sugeridos (0 = domingo ... 6 = sábado). */
  postDays: z.array(z.number().int().min(0).max(6)).max(7),
  postTime: TimeOfDay,
});
export type SocialSettings = z.infer<typeof SocialSettings>;

/** Foto de um post: JPEG público (o Instagram baixa a imagem por esta URL). */
export const SocialMedia = z.object({
  path: z.string().min(1).max(300),
  url: z.url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  mime: z.literal("image/jpeg"),
  /** Texto alternativo (acessibilidade) e contexto para a IA. */
  alt: z.string().max(300).optional(),
});
export type SocialMedia = z.infer<typeof SocialMedia>;

/** Instagram aceita até 10 fotos por carrossel. */
export const MAX_SOCIAL_MEDIA = 10;
/** Limite de texto da legenda no Instagram. */
export const MAX_CAPTION_LENGTH = 2200;

/**
 * - draft: rascunho (do dono ou da IA), ainda não aprovado;
 * - approved: aprovado, mas sem publicação automática (o dono posta à mão: "Post manually");
 * - scheduled: aprovado e na fila do publicador;
 * - publishing: o publicador está publicando agora;
 * - needs_check: a publicação foi interrompida; o publicador confere no Instagram antes de tentar
 *   de novo (nunca publica duas vezes);
 * - published: no ar no Instagram; manual_published: o dono postou à mão e marcou;
 * - failed: deu erro e parou de tentar; paused: conta desconectada ou plano vencido;
 * - missed: passou muito da hora (ex.: a conta ficou desconectada); o dono escolhe nova data;
 * - canceled: cancelado pelo dono.
 */
export const SocialPostStatus = z.enum([
  "draft",
  "approved",
  "scheduled",
  "publishing",
  "needs_check",
  "published",
  "manual_published",
  "failed",
  "paused",
  "missed",
  "canceled",
]);
export type SocialPostStatus = z.infer<typeof SocialPostStatus>;

/** Quem escreveu o rascunho. */
export const SocialPostSource = z.enum(["manual", "ai"]);
export type SocialPostSource = z.infer<typeof SocialPostSource>;

export const SocialPost = z.object({
  id: z.string(),
  status: SocialPostStatus,
  source: SocialPostSource,
  caption: z.string().max(MAX_CAPTION_LENGTH),
  /** Explicação curta em português, só para o dono (nunca é publicada). */
  ownerNotePt: z.string().nullable(),
  media: z.array(SocialMedia).max(MAX_SOCIAL_MEDIA),
  /** Data e hora marcadas (ISO, UTC). `null` = rascunho sem data. */
  scheduledAt: z.string().nullable(),
  /** O texto tem afirmação que precisa vir do dono (avaliações, garantias...): mostrar aviso. */
  claimsFlagged: z.boolean(),
  approvedAt: z.string().nullable(),
  publishedAt: z.string().nullable(),
  /** Link do post no Instagram, depois de publicado. */
  permalink: z.string().nullable(),
  /** Último erro, em inglês simples, para mostrar ao dono. */
  lastError: z.string().nullable(),
  siteId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SocialPost = z.infer<typeof SocialPost>;

// ---------- GET /api/social/state ----------

/** O que o dono consegue fazer agora. */
export const SocialCapability = z.object({
  /** O app da Meta está configurado (com ou sem aprovação). */
  configured: z.boolean(),
  /** "auto" = a No Sweat publica; "manual" = o dono copia a legenda e posta (antes da aprovação). */
  publishMode: z.enum(["auto", "manual"]),
  /** Só testadores podem conectar (app da Meta ainda em modo de desenvolvimento). */
  testerOnly: z.boolean(),
});
export type SocialCapability = z.infer<typeof SocialCapability>;

export const SocialStateResponse = z.object({
  account: SocialAccount.nullable(),
  settings: SocialSettings,
  capability: SocialCapability,
  /** Posts aprovados no mês atual e o limite do plano (`null` = sem limite). */
  usage: z.object({ used: z.number().int().min(0), cap: z.number().int().min(0).nullable() }),
  /** Usos de IA que restam hoje (`null` = sem limite). */
  aiRemaining: z.object({
    plans: z.number().int().min(0).nullable(),
    captions: z.number().int().min(0).nullable(),
  }),
});
export type SocialStateResponse = z.infer<typeof SocialStateResponse>;

// ---------- PATCH /api/social/settings ----------

export const UpdateSocialSettingsRequest = SocialSettings.partial();
export type UpdateSocialSettingsRequest = z.infer<typeof UpdateSocialSettingsRequest>;

export const SocialSettingsResponse = z.object({ settings: SocialSettings });
export type SocialSettingsResponse = z.infer<typeof SocialSettingsResponse>;

// ---------- GET/POST /api/social/posts, GET/PATCH/DELETE /api/social/posts/[id] ----------

export const CreateSocialPostRequest = z.object({
  caption: z.string().max(MAX_CAPTION_LENGTH).default(""),
  media: z.array(SocialMedia).max(MAX_SOCIAL_MEDIA).default([]),
  scheduledAt: z.iso.datetime({ offset: true }).nullable().optional(),
  siteId: z.string().optional(),
});
export type CreateSocialPostRequest = z.infer<typeof CreateSocialPostRequest>;

export const UpdateSocialPostRequest = z.object({
  caption: z.string().max(MAX_CAPTION_LENGTH).optional(),
  media: z.array(SocialMedia).max(MAX_SOCIAL_MEDIA).optional(),
  scheduledAt: z.iso.datetime({ offset: true }).nullable().optional(),
});
export type UpdateSocialPostRequest = z.infer<typeof UpdateSocialPostRequest>;

export const SocialPostResponse = z.object({ post: SocialPost });
export type SocialPostResponse = z.infer<typeof SocialPostResponse>;

export const SocialPostsResponse = z.object({ posts: z.array(SocialPost) });
export type SocialPostsResponse = z.infer<typeof SocialPostsResponse>;

// ---------- POST /api/social/posts/approve ----------

export const ApproveSocialPostsRequest = z.object({
  ids: z.array(z.string().min(1)).min(1).max(60),
});
export type ApproveSocialPostsRequest = z.infer<typeof ApproveSocialPostsRequest>;

// ---------- POST /api/social/plan (IA monta o mês) ----------

export const PlanMonthRequest = z.object({
  siteId: z.string().optional(),
  /** Mês no formato "YYYY-MM". */
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use the YYYY-MM format."),
  postsPerWeek: z.union([z.literal(2), z.literal(3), z.literal(5)]),
});
export type PlanMonthRequest = z.infer<typeof PlanMonthRequest>;

/** Tema de cada post sugerido pela IA (vai alternando ao longo do mês). */
export const SocialPillar = z.enum([
  "tip",
  "service",
  "area",
  "behind_the_scenes",
  "seasonal",
  "cta",
]);
export type SocialPillar = z.infer<typeof SocialPillar>;

/** Um post sugerido pela IA (saída estruturada, validada antes de virar rascunho). */
export const SocialPlanItem = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: TimeOfDay,
  pillar: SocialPillar,
  caption: z.string().min(1).max(MAX_CAPTION_LENGTH),
  hashtags: z.array(z.string().max(60)).max(30),
  ownerNotePt: z.string().max(300),
  /** Índice da foto (na lista de fotos enviada à IA) ou `null` sem foto. */
  photoIndex: z.number().int().min(0).nullable(),
});
export type SocialPlanItem = z.infer<typeof SocialPlanItem>;

export const SocialPlan = z.object({ posts: z.array(SocialPlanItem).max(31) });
export type SocialPlan = z.infer<typeof SocialPlan>;

export const PlanMonthResponse = z.object({ posts: z.array(SocialPost) });
export type PlanMonthResponse = z.infer<typeof PlanMonthResponse>;

// ---------- POST /api/social/caption (IA escreve ou reescreve a legenda) ----------

export const CaptionAction = z.enum(["write", "shorter", "friendlier", "cta"]);
export type CaptionAction = z.infer<typeof CaptionAction>;

export const CaptionRequest = z.object({
  action: CaptionAction,
  /** Ideia do dono (em português ou inglês) para "write". */
  idea: z.string().max(1000).optional(),
  currentCaption: z.string().max(MAX_CAPTION_LENGTH).optional(),
  siteId: z.string().optional(),
});
export type CaptionRequest = z.infer<typeof CaptionRequest>;

/** Saída da IA para uma legenda (também é a resposta da rota). */
export const CaptionResponse = z.object({
  caption: z.string().min(1).max(MAX_CAPTION_LENGTH),
  ownerNotePt: z.string().max(300),
});
export type CaptionResponse = z.infer<typeof CaptionResponse>;

// ---------- POST /api/social/media (multipart, campo "file": JPEG até 4 MB) ----------

export const UploadSocialMediaResponse = z.object({ media: SocialMedia });
export type UploadSocialMediaResponse = z.infer<typeof UploadSocialMediaResponse>;
