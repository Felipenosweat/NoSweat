import { z } from "zod";

// Contrato do módulo de clientes (um CRM simples para o dono do negócio).
// Todo pedido do formulário do site vira (ou se junta a) um cliente sozinho; o dono também pode
// cadastrar à mão. Cada cliente tem um histórico: mensagens do site, notas e serviços feitos.

/**
 * Etapa do cliente no funil do negócio:
 * - new: chegou agora (pedido do site ou cadastro), ninguém respondeu ainda;
 * - contacted: o dono já falou com a pessoa;
 * - quoted: mandou orçamento;
 * - won: virou cliente (fechou serviço);
 * - lost: não fechou.
 */
export const ClientStage = z.enum(["new", "contacted", "quoted", "won", "lost"]);
export type ClientStage = z.infer<typeof ClientStage>;

/** De onde veio o cliente. */
export const ClientSource = z.enum(["website", "manual"]);
export type ClientSource = z.infer<typeof ClientSource>;

/** Data sem hora "AAAA-MM-DD" (no fuso da empresa). */
const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format.");

/** Etiqueta livre do dono ("VIP", "Commercial", "Referral"...). */
export const ClientTag = z
  .string()
  .trim()
  .min(1, "Tags can't be empty.")
  .max(30, "Keep each tag under 30 characters.");
export type ClientTag = z.infer<typeof ClientTag>;

/** Até 10 etiquetas por cliente. */
const ClientTags = z.array(ClientTag).max(10, "Use up to 10 tags.");

export const Client = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  stage: ClientStage,
  source: ClientSource,
  /** Site de onde veio o primeiro pedido (null = cadastro manual ou site apagado). */
  siteId: z.string().nullable(),
  /** Anotação fixa do dono sobre o cliente (portão, cachorro, preferências...). */
  notes: z.string(),
  /** Próximo retorno combinado (null = nenhum). */
  followUpOn: DateOnly.nullable(),
  /** Último contato (mensagem do site, nota ou serviço). */
  lastActivityAt: z.string(),
  /** Soma dos serviços registrados, em centavos (só o que o dono informou). */
  totalJobsCents: z.number().int().nonnegative(),
  jobsCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
  /** Etiquetas do dono (migration 0021). Campo novo: respostas antigas sem ele viram []. */
  tags: z.array(z.string()).default([]),
});
export type Client = z.infer<typeof Client>;

/**
 * Item do histórico:
 * - lead: mensagem enviada pelo formulário do site (texto = a mensagem);
 * - note: anotação do dono;
 * - job: serviço feito (com valor opcional);
 * - stage: mudança de etapa (texto = a etapa nova).
 */
export const ClientActivityKind = z.enum(["lead", "note", "job", "stage"]);
export type ClientActivityKind = z.infer<typeof ClientActivityKind>;

export const ClientActivity = z.object({
  id: z.string(),
  clientId: z.string(),
  kind: ClientActivityKind,
  body: z.string(),
  amountCents: z.number().int().nonnegative().nullable(),
  /** Pedido do site que gerou este item (só em `lead`). */
  leadId: z.string().nullable(),
  siteId: z.string().nullable(),
  occurredAt: z.string(),
  createdAt: z.string(),
});
export type ClientActivity = z.infer<typeof ClientActivity>;

const Name = z.string().trim().min(1, "Please enter a name.").max(120);
const OptionalEmail = z
  .union([z.literal(""), z.email("Please enter a valid email.")])
  .nullable()
  .optional();
const OptionalText = (max: number) => z.string().trim().max(max).nullable().optional();

// ---------- GET /api/clients ----------

export const ClientsResponse = z.object({ clients: z.array(Client) });
export type ClientsResponse = z.infer<typeof ClientsResponse>;

// ---------- POST /api/clients (cadastro manual) ----------

export const CreateClientRequest = z
  .object({
    name: Name,
    email: OptionalEmail,
    phone: OptionalText(40),
    address: OptionalText(300),
    stage: ClientStage.optional(),
    notes: z.string().trim().max(5000).optional(),
    tags: ClientTags.optional(),
    followUpOn: DateOnly.nullable().optional(),
  })
  .refine((c) => Boolean(c.email) || Boolean(c.phone), {
    message: "Add an email or a phone number.",
    path: ["phone"],
  });
export type CreateClientRequest = z.infer<typeof CreateClientRequest>;

export const ClientResponse = z.object({ client: Client });
export type ClientResponse = z.infer<typeof ClientResponse>;

// ---------- GET /api/clients/[id] ----------

export const ClientDetailResponse = z.object({
  client: Client,
  /** Do mais novo para o mais antigo. */
  activities: z.array(ClientActivity),
});
export type ClientDetailResponse = z.infer<typeof ClientDetailResponse>;

// ---------- PATCH /api/clients/[id] ----------

export const UpdateClientRequest = z
  .object({
    name: Name.optional(),
    email: OptionalEmail,
    phone: OptionalText(40),
    address: OptionalText(300),
    stage: ClientStage.optional(),
    notes: z.string().trim().max(5000).optional(),
    followUpOn: DateOnly.nullable().optional(),
    tags: ClientTags.optional(),
  })
  .refine((c) => Object.values(c).some((v) => v !== undefined), {
    message: "Nothing to update.",
  });
export type UpdateClientRequest = z.infer<typeof UpdateClientRequest>;

// ---------- POST /api/clients/[id]/activities ----------

export const CreateClientActivityRequest = z.object({
  kind: z.enum(["note", "job"]),
  body: z.string().trim().min(1, "Write something first.").max(2000),
  /** Só em `job`: valor cobrado, em centavos. */
  amountCents: z.number().int().nonnegative().max(100_000_000).nullable().optional(),
  /** Quando aconteceu (padrão: agora). */
  occurredAt: z.iso.datetime({ offset: true }).optional(),
});
export type CreateClientActivityRequest = z.infer<typeof CreateClientActivityRequest>;

export const ClientActivityResponse = z.object({ activity: ClientActivity, client: Client });
export type ClientActivityResponse = z.infer<typeof ClientActivityResponse>;
