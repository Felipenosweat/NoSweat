import { z } from "zod";
import { SiteSpec } from "./site";

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
});
export type AiEditResponse = z.infer<typeof AiEditResponse>;

// ---------- POST /api/sites/[id]/publish ----------

export const PublishSiteResponse = z.object({
  siteId: SiteId,
  status: SiteStatus,
  url: z.url(),
});
export type PublishSiteResponse = z.infer<typeof PublishSiteResponse>;

// ---------- DELETE /api/sites/[id] ----------

export const DeleteSiteResponse = z.object({
  siteId: SiteId,
  deleted: z.literal(true),
});
export type DeleteSiteResponse = z.infer<typeof DeleteSiteResponse>;

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

export const DomainResponse = z.object({
  siteId: SiteId,
  domain: z.string().nullable(),
  status: DomainStatus.nullable(),
  records: z.array(DnsRecord),
});
export type DomainResponse = z.infer<typeof DomainResponse>;

// ---------- POST /api/sites/[id]/leads (público) e GET (dono) ----------

/** Pedido de contato enviado pelo formulário do site publicado. Precisa de e-mail ou telefone. */
export const LeadRequest = z
  .object({
    name: z.string().trim().min(1, "Please enter your name.").max(120),
    email: z.union([z.literal(""), z.email("Please enter a valid email.")]).optional(),
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

export const CreditsResponse = z.object({
  remaining: z.number().int().nonnegative(),
  // Por enquanto só existe o plano de teste; novos planos entram aqui.
  plan: z.enum(["trial"]),
});
export type CreditsResponse = z.infer<typeof CreditsResponse>;

// ---------- Login (formulário de /login) ----------

export const Credentials = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});
export type Credentials = z.infer<typeof Credentials>;
