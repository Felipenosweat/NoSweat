import { z } from "zod";
import { GoogleReviewUrl, SiteImage, SiteSpec } from "./site";

// Contrato das rotas em apps/web/app/api. Front e back importam daqui.

// ---------- Erro (formato único para todas as rotas) ----------

/** Códigos conhecidos. `code` continua `string` para permitir novos códigos sem quebrar o front. */
export const ERROR_CODES = [
  "invalid_request",
  "unauthorized",
  "not_found",
  "not_implemented",
  "domain_taken",
  "quota_exceeded",
  "domain_error",
  "generation_failed",
  "image_error",
  "payment_required",
  "plan_limit",
  "already_subscribed",
  "reconnect_required",
  "social_error",
  "internal_error",
  "conflict",
  "out_of_credits",
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

// ---------- Versões (rascunho x publicado) ----------

/** De onde veio cada versão salva do site. */
export const VersionSource = z.enum(["generate", "edit", "ai_edit", "restore", "initial"]);
export type VersionSource = z.infer<typeof VersionSource>;

export const SiteVersionSummary = z.object({
  id: z.string(),
  source: VersionSource,
  createdAt: z.string(),
});
export type SiteVersionSummary = z.infer<typeof SiteVersionSummary>;

/** GET /api/sites/[id]/versions */
export const VersionsResponse = z.object({ versions: z.array(SiteVersionSummary) });
export type VersionsResponse = z.infer<typeof VersionsResponse>;

// ---------- GET /api/sites/[id] ----------

export const GetSiteResponse = z.object({
  siteId: SiteId,
  /** Rascunho (o que o editor mostra). */
  spec: SiteSpec,
  status: SiteStatus,
  /** O que está no ar (null se nunca foi publicado). */
  publishedSpec: SiteSpec.nullable().optional(),
  /** true quando o rascunho tem mudanças que ainda não foram publicadas. */
  hasUnpublishedChanges: z.boolean().optional(),
});
export type GetSiteResponse = z.infer<typeof GetSiteResponse>;

// ---------- PATCH /api/sites/[id] ----------

export const UpdateSiteRequest = z.object({
  spec: SiteSpec,
  /**
   * `updatedAt` do site quando o editor carregou (ou salvou) pela última vez. Se o site mudou
   * depois disso (outra aba, outro aparelho), a API responde 409 "conflict" em vez de
   * sobrescrever. Sem ele, salva sempre (comportamento antigo).
   */
  baseUpdatedAt: z.string().optional(),
});
export type UpdateSiteRequest = z.infer<typeof UpdateSiteRequest>;

export const UpdateSiteResponse = z.object({
  siteId: SiteId,
  spec: SiteSpec,
  /** Novo `updatedAt` do site (o próximo salvamento manda de volta como `baseUpdatedAt`). */
  updatedAt: z.string().optional(),
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

// ---------- POST /api/sites/[id]/ai-edit ----------

/** Pedido de mudança em linguagem natural, ex.: "Change my hours to Mon–Sat, 8 AM to 6 PM". */
export const AiEditRequest = z.object({
  instruction: z
    .string()
    .trim()
    .min(3, "Tell us what you would like to change.")
    .max(1000, "Please keep your request under 1,000 characters."),
});
export type AiEditRequest = z.infer<typeof AiEditRequest>;

/** O que a IA devolve: o novo rascunho e um resumo curto do que mudou. */
export const AiEditResult = z.object({
  summary: z.string().max(400),
  spec: SiteSpec,
});
export type AiEditResult = z.infer<typeof AiEditResult>;

export const AiEditResponse = z.object({
  siteId: SiteId,
  spec: SiteSpec,
  summary: z.string(),
  /** Novo `updatedAt` do site (ver UpdateSiteRequest.baseUpdatedAt). */
  updatedAt: z.string().optional(),
});
export type AiEditResponse = z.infer<typeof AiEditResponse>;

// ---------- POST /api/sites/[id]/publish ----------

export const PublishSiteResponse = z.object({
  siteId: SiteId,
  status: SiteStatus,
  url: z.url(),
  /** Novo `updatedAt` do site (publicar também muda; ver UpdateSiteRequest.baseUpdatedAt). */
  updatedAt: z.string().optional(),
});
export type PublishSiteResponse = z.infer<typeof PublishSiteResponse>;

// ---------- DELETE /api/sites/[id] ----------

export const DeleteSiteResponse = z.object({
  siteId: SiteId,
  deleted: z.literal(true),
});
export type DeleteSiteResponse = z.infer<typeof DeleteSiteResponse>;

// ---------- PUT /api/sites/[id]/review-link ----------

/** Link de avaliações do Google do dono (página /reviews). `null` tira o botão do site. */
export const UpdateReviewLinkRequest = z.object({ url: GoogleReviewUrl.nullable() });
export type UpdateReviewLinkRequest = z.infer<typeof UpdateReviewLinkRequest>;

export const ReviewLinkResponse = z.object({
  siteId: SiteId,
  googleReviewUrl: GoogleReviewUrl.nullable(),
  /** O site está no ar (o botão já aparece para os visitantes, sem publicar de novo). */
  live: z.boolean(),
  /** Novo `updatedAt` do rascunho (ver UpdateSiteRequest.baseUpdatedAt). */
  updatedAt: z.string(),
});
export type ReviewLinkResponse = z.infer<typeof ReviewLinkResponse>;

// ---------- PUT/GET/DELETE /api/sites/[id]/domain ----------

/**
 * Domínio próprio do cliente. Aceita o que a pessoa costuma colar ("https://www.Joes.com/")
 * e normaliza para o domínio raiz ("joes.com"). O "www" é ligado automaticamente.
 */
export const DomainName = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) =>
    value
      .replace(/^[a-z]+:\/\//, "")
      .replace(/[/?#].*$/, "")
      .replace(/:\d+$/, "")
      .replace(/\.$/, "")
      .replace(/^www\./, ""),
  )
  .pipe(
    z
      .string()
      .regex(
        /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
        "Please enter a valid domain, like yourbusiness.com.",
      ),
  );

export const ConnectDomainRequest = z.object({ domain: DomainName });
export type ConnectDomainRequest = z.infer<typeof ConnectDomainRequest>;

/** Registro de DNS que o cliente cria onde comprou o domínio. */
export const DnsRecord = z.object({
  type: z.enum(["A", "CNAME", "TXT"]),
  name: z.string(),
  value: z.string(),
});
export type DnsRecord = z.infer<typeof DnsRecord>;

/**
 * - unverified: o cliente ainda não provou que é dono (registro TXT); o domínio NÃO foi salvo;
 * - pending: esperando o cliente apontar o DNS;
 * - active: DNS certo, site no ar no domínio (HTTPS automático);
 * - manual: a plataforma ainda não está ligada à Vercel (falta VERCEL_TOKEN); o time liga à mão.
 */
export const DomainStatus = z.enum(["pending", "active", "manual", "unverified"]);
export type DomainStatus = z.infer<typeof DomainStatus>;

/** Onde o DNS do domínio é gerenciado (descoberto pelos nameservers), para o passo a passo certo. */
export const DnsProvider = z.enum([
  "godaddy",
  "namecheap",
  "squarespace",
  "cloudflare",
  "hostinger",
  "porkbun",
  "ionos",
  "wix",
]);
export type DnsProvider = z.infer<typeof DnsProvider>;

export const DomainResponse = z.object({
  siteId: SiteId,
  domain: z.string().nullable(),
  status: DomainStatus.nullable(),
  records: z.array(DnsRecord),
  /** Empresa onde o cliente mexe no DNS, se deu para descobrir (`null` = não sabemos). */
  dnsProvider: DnsProvider.nullable().optional(),
});
export type DomainResponse = z.infer<typeof DomainResponse>;

// ---------- POST /api/sites/[id]/leads (público) e GET (dono) ----------

/** Pedido de contato enviado pelo formulário do site publicado. Precisa de e-mail ou telefone. */
export const LeadRequest = z
  .object({
    name: z.string().trim().min(1, "Please enter your name.").max(120),
    // trim antes de validar: " ana@x.com " (espaço do celular) não pode ser recusado.
    email: z
      .string()
      .trim()
      .pipe(z.union([z.literal(""), z.email("Please enter a valid email.")]))
      .optional(),
    phone: z.string().trim().max(40).optional(),
    message: z.string().trim().min(1, "Please tell us how we can help.").max(2000),
    /**
     * Campo-isca contra robôs: fica escondido e deve vir vazio. Se vier preenchido, a API responde
     * "ok" mas não guarda nada (o robô não descobre que foi barrado).
     */
    company: z.string().max(500).optional(),
  })
  .refine((lead) => Boolean(lead.email) || Boolean(lead.phone), {
    message: "Please leave an email or a phone number so we can reach you.",
    path: ["email"],
  });
export type LeadRequest = z.infer<typeof LeadRequest>;

export const Lead = z.object({
  id: z.string(),
  siteId: SiteId,
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  message: z.string(),
  createdAt: z.string(),
});
export type Lead = z.infer<typeof Lead>;

export const LeadCreatedResponse = z.object({ ok: z.literal(true) });
export type LeadCreatedResponse = z.infer<typeof LeadCreatedResponse>;

export const LeadsResponse = z.object({ leads: z.array(Lead) });
export type LeadsResponse = z.infer<typeof LeadsResponse>;

// ---------- GET /api/me/credits ----------

/**
 * Saldo de créditos da IA de uma conta (apps/web/server/credits). A cota do mês zera em
 * `resetsAt`; os créditos comprados (`topup`) não vencem e são usados depois da cota.
 * `unlimited`: admins (os números aparecem só como referência).
 */
export const CreditBalance = z.object({
  unlimited: z.boolean(),
  monthlyAllowance: z.number().int().nonnegative(),
  monthlyUsed: z.number().int().nonnegative(),
  monthlyLeft: z.number().int().nonnegative(),
  topup: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  resetsAt: z.string(),
});
export type CreditBalance = z.infer<typeof CreditBalance>;

export const CreditsResponse = z.object({
  /** Mudanças por IA que ainda cabem agora (créditos e limite diário; visitante: limite GUEST_*). */
  remaining: z.number().int().nonnegative(),
  /** "trial" = sem plano pago (ou visitante). */
  plan: z.enum(["trial", "starter", "pro", "premium"]),
  /** Saldo de créditos da conta; `null` para visitantes (eles não usam créditos). */
  credits: CreditBalance.nullable().optional(),
});
export type CreditsResponse = z.infer<typeof CreditsResponse>;

// ---------- Login (formulário de /login) ----------

export const Credentials = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});
export type Credentials = z.infer<typeof Credentials>;

// ---------- Fotos ----------

/** GET /api/images/search?q=<busca>&orientation=landscape|portrait|square → fotos de banco (kind "scene"). */
export const ImageSearchQuery = z.object({
  q: z.string().trim().min(2).max(80),
  orientation: z.enum(["landscape", "portrait", "square"]).default("landscape"),
});
export type ImageSearchQuery = z.infer<typeof ImageSearchQuery>;

export const ImageSearchResponse = z.object({ results: z.array(SiteImage) });
export type ImageSearchResponse = z.infer<typeof ImageSearchResponse>;

/**
 * POST /api/sites/[id]/images (multipart, campo "file"; jpg/png/webp até 4 MB, e o editor reduz as
 * fotos maiores no navegador) → foto do dono.
 */
export const UploadImageResponse = z.object({ image: SiteImage });
export type UploadImageResponse = z.infer<typeof UploadImageResponse>;

// ---------- Cobrança (Stripe) ----------

/** Planos pagos. Preços e limites ficam no servidor (apps/web/server/billing/plans.ts). */
export const PlanId = z.enum(["starter", "pro", "premium"]);
export type PlanId = z.infer<typeof PlanId>;

export const BillingInterval = z.enum(["monthly", "annual"]);
export type BillingInterval = z.infer<typeof BillingInterval>;

/** POST /api/billing/checkout: { plan, interval, siteId? } → { url } (página de pagamento do Stripe). */
export const CheckoutRequest = z.object({
  plan: PlanId,
  interval: BillingInterval,
  /** Site que a pessoa quer publicar (para voltar a ele depois de pagar). */
  siteId: z.string().optional(),
});
export type CheckoutRequest = z.infer<typeof CheckoutRequest>;

export const RedirectResponse = z.object({ url: z.url() });
export type RedirectResponse = z.infer<typeof RedirectResponse>;

/** GET /api/me/billing → situação da assinatura da conta. */
export const BillingStatusResponse = z.object({
  /** `false` enquanto o Stripe não está configurado: tudo liberado, nada é cobrado. */
  enabled: z.boolean(),
  /** `true` se dá para pagar com cartão aqui (Stripe ligado); senão o pagamento é combinado à mão. */
  checkoutEnabled: z.boolean().optional(),
  /** De onde vem o plano: assinatura do Stripe ou acesso liberado pelo admin (Pix/WhatsApp). */
  source: z.enum(["stripe", "manual"]).nullable().optional(),
  plan: PlanId.nullable(),
  interval: BillingInterval.nullable(),
  status: z.string().nullable(),
  active: z.boolean(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
});
export type BillingStatusResponse = z.infer<typeof BillingStatusResponse>;

// ---------- GET /api/places e /api/places/nearby (cidades dos EUA no /create) ----------

const StateCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/);

export const PlaceSearchQuery = z.object({
  /** O que a pessoa digitou (pode ser vazio: aí vêm as maiores cidades do estado). */
  q: z.string().trim().max(80).default(""),
  state: StateCode.optional(),
});

export const PlaceSuggestion = z.object({
  name: z.string(),
  state: z.string().length(2),
  population: z.number().int().nonnegative(),
});
export type PlaceSuggestion = z.infer<typeof PlaceSuggestion>;

export const PlaceSearchResponse = z.object({ places: z.array(PlaceSuggestion).max(20) });
export type PlaceSearchResponse = z.infer<typeof PlaceSearchResponse>;

export const NearbyPlacesQuery = z.object({
  city: z.string().trim().min(1).max(80),
  state: StateCode,
});

export const NearbyPlace = PlaceSuggestion.extend({
  /** Distância em milhas da cidade escolhida (arredondada). */
  miles: z.number().int().nonnegative(),
});
export type NearbyPlace = z.infer<typeof NearbyPlace>;

export const NearbyPlacesResponse = z.object({ places: z.array(NearbyPlace).max(20) });
export type NearbyPlacesResponse = z.infer<typeof NearbyPlacesResponse>;
