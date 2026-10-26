import { z } from "zod";

// Contrato do "escritório" do dono (gestão da empresa, inspirado no ServiceTitan, bem mais
// simples): tabela de preços, equipe, serviços agendados (jobs), orçamentos (estimates) e faturas
// (invoices) com pagamentos registrados à mão. Tudo é do dono (owner_id); o cliente final só vê o
// orçamento e a fatura pelo link público (token), sem conta.
//
// Dinheiro sempre em centavos (inteiros). Os totais são calculados pelo servidor
// (`computeTotals`), nunca aceitos do navegador.
//
// Rotas (todas exigem conta, menos as públicas):
//   GET/PUT    /api/office/settings
//   GET/POST   /api/office/price-items        PATCH/DELETE /api/office/price-items/[id]
//   GET/POST   /api/office/team               PATCH/DELETE /api/office/team/[id]
//   GET/POST   /api/office/jobs?from=&to=&status=&clientId=
//                                             GET/PATCH/DELETE /api/office/jobs/[id]
//   GET/POST   /api/office/estimates?status=&clientId=
//                                             GET/PATCH/DELETE /api/office/estimates/[id]
//   POST       /api/office/estimates/[id]/send      (rascunho → enviado; devolve o link)
//   POST       /api/office/estimates/[id]/convert   (aprovado → job e/ou fatura)
//   GET/POST   /api/office/invoices?status=&clientId=
//                                             GET/PATCH/DELETE /api/office/invoices/[id]
//   POST       /api/office/invoices/[id]/send
//   POST       /api/office/invoices/[id]/payments   DELETE /api/office/invoices/[id]/payments/[paymentId]
//   GET        /api/office/summary                  (números do painel)
//   Públicas:  GET /api/public/estimates/[token]   POST /api/public/estimates/[token]/respond
//              GET /api/public/invoices/[token]
// Páginas públicas: /q/[token] (orçamento) e /i/[token] (fatura).

/** Data sem hora "AAAA-MM-DD" (no fuso da empresa). */
const DateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format.");
const Money = z.number().int().nonnegative().max(100_000_000);
const OptionalText = (max: number) => z.string().trim().max(max).nullable().optional();
/** Imposto em pontos-base: 825 = 8.25%. Máximo 30%. */
const TaxRateBps = z.number().int().min(0).max(3000);

// ---------- Configurações da empresa ----------

export const OfficeSettings = z.object({
  /** Nome que aparece no orçamento e na fatura (padrão: nome do site). */
  companyName: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  /** Imposto padrão de documentos novos. */
  defaultTaxRateBps: TaxRateBps,
  /** Dias para vencer a fatura (0 = na entrega). */
  invoiceDueDays: z.number().int().min(0).max(120),
  /** Dias de validade do orçamento. */
  estimateValidDays: z.number().int().min(1).max(365),
  /** Texto no rodapé do orçamento (garantia, condições...: escrito pelo dono). */
  estimateTerms: z.string(),
  /** Como pagar (Zelle, cheque nominal a...): escrito pelo dono, aparece na fatura. */
  paymentInstructions: z.string(),
  /** Fuso da agenda (IANA), ex. "America/New_York". */
  timeZone: z.string(),
});
export type OfficeSettings = z.infer<typeof OfficeSettings>;

export const UpdateOfficeSettingsRequest = z.object({
  companyName: z.string().trim().min(1).max(120).optional(),
  phone: OptionalText(40),
  email: z
    .union([z.literal(""), z.email("Please enter a valid email.")])
    .nullable()
    .optional(),
  address: OptionalText(300),
  defaultTaxRateBps: TaxRateBps.optional(),
  invoiceDueDays: z.number().int().min(0).max(120).optional(),
  estimateValidDays: z.number().int().min(1).max(365).optional(),
  estimateTerms: z.string().trim().max(4000).optional(),
  paymentInstructions: z.string().trim().max(2000).optional(),
  timeZone: z.string().trim().min(1).max(64).optional(),
});
export type UpdateOfficeSettingsRequest = z.infer<typeof UpdateOfficeSettingsRequest>;

export const OfficeSettingsResponse = z.object({ settings: OfficeSettings });
export type OfficeSettingsResponse = z.infer<typeof OfficeSettingsResponse>;

// ---------- Tabela de preços (price book) ----------

export const PriceItem = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  unitPriceCents: Money,
  /** "each", "hour", "sq ft"... (texto livre curto). */
  unit: z.string(),
  taxable: z.boolean(),
  /** Inativo = some das sugestões, mas documentos antigos continuam iguais. */
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PriceItem = z.infer<typeof PriceItem>;

export const CreatePriceItemRequest = z.object({
  name: z.string().trim().min(1, "Please enter a name.").max(120),
  description: z.string().trim().max(1000).optional(),
  unitPriceCents: Money,
  unit: z.string().trim().max(20).optional(),
  taxable: z.boolean().optional(),
});
export type CreatePriceItemRequest = z.infer<typeof CreatePriceItemRequest>;

export const UpdatePriceItemRequest = CreatePriceItemRequest.partial().extend({
  active: z.boolean().optional(),
});
export type UpdatePriceItemRequest = z.infer<typeof UpdatePriceItemRequest>;

export const PriceItemsResponse = z.object({ items: z.array(PriceItem) });
export type PriceItemsResponse = z.infer<typeof PriceItemsResponse>;
export const PriceItemResponse = z.object({ item: PriceItem });
export type PriceItemResponse = z.infer<typeof PriceItemResponse>;

// ---------- Equipe (sem login por enquanto: só para agendar e atribuir) ----------

export const TEAM_COLORS = [
  "blue",
  "green",
  "orange",
  "purple",
  "pink",
  "teal",
  "red",
  "gray",
] as const;
export const TeamColor = z.enum(TEAM_COLORS);
export type TeamColor = z.infer<typeof TeamColor>;

export const TeamMember = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  /** "Technician", "Office"... (texto livre curto). */
  role: z.string(),
  color: TeamColor,
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TeamMember = z.infer<typeof TeamMember>;

export const CreateTeamMemberRequest = z.object({
  name: z.string().trim().min(1, "Please enter a name.").max(120),
  phone: OptionalText(40),
  email: z
    .union([z.literal(""), z.email("Please enter a valid email.")])
    .nullable()
    .optional(),
  role: z.string().trim().max(40).optional(),
  color: TeamColor.optional(),
});
export type CreateTeamMemberRequest = z.infer<typeof CreateTeamMemberRequest>;

export const UpdateTeamMemberRequest = CreateTeamMemberRequest.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateTeamMemberRequest = z.infer<typeof UpdateTeamMemberRequest>;

export const TeamResponse = z.object({ members: z.array(TeamMember) });
export type TeamResponse = z.infer<typeof TeamResponse>;
export const TeamMemberResponse = z.object({ member: TeamMember });
export type TeamMemberResponse = z.infer<typeof TeamMemberResponse>;

// ---------- Itens de orçamento e fatura ----------

export const LineItem = z.object({
  /** Item da tabela de preços de onde veio (null = digitado na hora). */
  priceItemId: z.string().nullable(),
  name: z.string().trim().min(1, "Each line needs a name.").max(120),
  description: z.string().trim().max(1000).default(""),
  /** Até 2 casas decimais (1.5 hora). */
  quantity: z.number().positive().max(100_000),
  unitPriceCents: Money,
  taxable: z.boolean().default(true),
});
export type LineItem = z.infer<typeof LineItem>;

const LineItems = z.array(LineItem).max(100, "Use up to 100 lines.");

export const DocumentTotals = z.object({
  subtotalCents: z.number().int().nonnegative(),
  discountCents: z.number().int().nonnegative(),
  taxCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
});
export type DocumentTotals = z.infer<typeof DocumentTotals>;

/**
 * Totais de um documento. Linha = round(quantidade × preço). O desconto sai do subtotal (nunca
 * passa dele) e é dividido proporcionalmente entre linhas tributáveis e não tributáveis; o
 * imposto incide só sobre a parte tributável depois do desconto, arredondado ao centavo.
 */
export function computeTotals(
  items: readonly Pick<LineItem, "quantity" | "unitPriceCents" | "taxable">[],
  taxRateBps: number,
  discountCents = 0,
): DocumentTotals {
  let subtotal = 0;
  let taxable = 0;
  for (const item of items) {
    const line = Math.round(item.quantity * item.unitPriceCents);
    subtotal += line;
    if (item.taxable) taxable += line;
  }
  const discount = Math.min(Math.max(0, Math.round(discountCents)), subtotal);
  const taxableAfterDiscount = subtotal > 0 ? taxable - (discount * taxable) / subtotal : 0;
  const tax = Math.round((taxableAfterDiscount * taxRateBps) / 10_000);
  return {
    subtotalCents: subtotal,
    discountCents: discount,
    taxCents: tax,
    totalCents: subtotal - discount + tax,
  };
}

/** O cliente do documento, como aparece no link público (sem dados internos). */
export const DocumentParty = z.object({
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
});
export type DocumentParty = z.infer<typeof DocumentParty>;

// ---------- Serviços (jobs) e agenda ----------

/**
 * - unscheduled: combinado, sem data;
 * - scheduled: com data e hora;
 * - in_progress: a equipe está no local;
 * - done: terminado (pronto para faturar);
 * - canceled.
 */
export const JobStatus = z.enum(["unscheduled", "scheduled", "in_progress", "done", "canceled"]);
export type JobStatus = z.infer<typeof JobStatus>;

export const Job = z.object({
  id: z.string(),
  /** Número sequencial por dono (#1001...). */
  number: z.number().int().positive(),
  clientId: z.string(),
  /** Nome do cliente no momento da leitura (para listas e agenda). */
  clientName: z.string(),
  title: z.string(),
  description: z.string(),
  status: JobStatus,
  /** Início e fim (ISO com fuso). Null quando ainda sem data. */
  startAt: z.string().nullable(),
  endAt: z.string().nullable(),
  /** Endereço do serviço (padrão: o do cliente). */
  address: z.string().nullable(),
  assigneeIds: z.array(z.string()),
  /** Notas internas da equipe (nunca aparecem para o cliente). */
  notes: z.string(),
  estimateId: z.string().nullable(),
  invoiceId: z.string().nullable(),
  /** Valor previsto (do orçamento ou digitado), em centavos. */
  valueCents: Money.nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Job = z.infer<typeof Job>;

const JobTimes = {
  startAt: z.iso.datetime({ offset: true }).nullable().optional(),
  endAt: z.iso.datetime({ offset: true }).nullable().optional(),
};

export const CreateJobRequest = z
  .object({
    clientId: z.string().min(1, "Choose a client."),
    title: z.string().trim().min(1, "Give the job a title.").max(160),
    description: z.string().trim().max(4000).optional(),
    ...JobTimes,
    address: OptionalText(300),
    assigneeIds: z.array(z.string()).max(20).optional(),
    notes: z.string().trim().max(4000).optional(),
    valueCents: Money.nullable().optional(),
  })
  .refine((j) => !j.startAt || !j.endAt || j.endAt > j.startAt, {
    message: "The end time must be after the start time.",
    path: ["endAt"],
  });
export type CreateJobRequest = z.infer<typeof CreateJobRequest>;

export const UpdateJobRequest = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: z.string().trim().max(4000).optional(),
    status: JobStatus.optional(),
    ...JobTimes,
    address: OptionalText(300),
    assigneeIds: z.array(z.string()).max(20).optional(),
    notes: z.string().trim().max(4000).optional(),
    valueCents: Money.nullable().optional(),
  })
  .refine((j) => Object.values(j).some((v) => v !== undefined), { message: "Nothing to update." });
export type UpdateJobRequest = z.infer<typeof UpdateJobRequest>;

export const JobsResponse = z.object({ jobs: z.array(Job) });
export type JobsResponse = z.infer<typeof JobsResponse>;
export const JobResponse = z.object({ job: Job });
export type JobResponse = z.infer<typeof JobResponse>;

// ---------- Orçamentos (estimates) ----------

/**
 * - draft: só o dono vê;
 * - sent: o link foi gerado/enviado, esperando o cliente;
 * - approved / declined: resposta do cliente pelo link (ou marcada pelo dono);
 * - expired: passou de `validUntil` sem resposta (calculado na leitura).
 */
export const EstimateStatus = z.enum(["draft", "sent", "approved", "declined", "expired"]);
export type EstimateStatus = z.infer<typeof EstimateStatus>;

export const Estimate = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  clientId: z.string(),
  clientName: z.string(),
  jobId: z.string().nullable(),
  title: z.string(),
  status: EstimateStatus,
  items: z.array(LineItem),
  taxRateBps: TaxRateBps,
  ...DocumentTotals.shape,
  /** Mensagem para o cliente (aparece no link). */
  message: z.string(),
  validUntil: DateOnly.nullable(),
  /** Link público: /q/<token>. Existe desde a criação; só funciona depois de enviado. */
  publicToken: z.string(),
  sentAt: z.string().nullable(),
  respondedAt: z.string().nullable(),
  /** Nome que o cliente digitou ao aprovar (assinatura simples). */
  approvedByName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Estimate = z.infer<typeof Estimate>;

const DocumentInput = {
  title: z.string().trim().max(160).optional(),
  items: LineItems.optional(),
  taxRateBps: TaxRateBps.optional(),
  discountCents: Money.optional(),
  message: z.string().trim().max(4000).optional(),
};

export const CreateEstimateRequest = z.object({
  clientId: z.string().min(1, "Choose a client."),
  jobId: z.string().nullable().optional(),
  ...DocumentInput,
  validUntil: DateOnly.nullable().optional(),
});
export type CreateEstimateRequest = z.infer<typeof CreateEstimateRequest>;

/** Só rascunho e enviado podem mudar os itens; `status` permite o dono marcar a resposta. */
export const UpdateEstimateRequest = z
  .object({
    ...DocumentInput,
    validUntil: DateOnly.nullable().optional(),
    status: z.enum(["approved", "declined"]).optional(),
  })
  .refine((e) => Object.values(e).some((v) => v !== undefined), { message: "Nothing to update." });
export type UpdateEstimateRequest = z.infer<typeof UpdateEstimateRequest>;

export const EstimatesResponse = z.object({ estimates: z.array(Estimate) });
export type EstimatesResponse = z.infer<typeof EstimatesResponse>;
export const EstimateResponse = z.object({ estimate: Estimate });
export type EstimateResponse = z.infer<typeof EstimateResponse>;

// ---------- Faturas (invoices) e pagamentos ----------

/**
 * Guardado: draft | sent | paid | void. Na leitura, `sent` com saldo pode virar `partial`
 * (pagou parte) ou `overdue` (passou de `dueOn`).
 */
export const InvoiceStatus = z.enum(["draft", "sent", "partial", "overdue", "paid", "void"]);
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;

export const PaymentMethod = z.enum([
  "cash",
  "check",
  "card",
  "zelle",
  "venmo",
  "cashapp",
  "other",
]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const Payment = z.object({
  id: z.string(),
  invoiceId: z.string(),
  amountCents: z.number().int().positive(),
  method: PaymentMethod,
  /** Nº do cheque, últimos dígitos... */
  reference: z.string(),
  receivedOn: DateOnly,
  createdAt: z.string(),
});
export type Payment = z.infer<typeof Payment>;

export const Invoice = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  clientId: z.string(),
  clientName: z.string(),
  jobId: z.string().nullable(),
  estimateId: z.string().nullable(),
  title: z.string(),
  status: InvoiceStatus,
  items: z.array(LineItem),
  taxRateBps: TaxRateBps,
  ...DocumentTotals.shape,
  amountPaidCents: z.number().int().nonnegative(),
  balanceCents: z.number().int(),
  message: z.string(),
  issuedOn: DateOnly,
  dueOn: DateOnly.nullable(),
  /** Link público: /i/<token>. */
  publicToken: z.string(),
  sentAt: z.string().nullable(),
  paidAt: z.string().nullable(),
  payments: z.array(Payment),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Invoice = z.infer<typeof Invoice>;

export const CreateInvoiceRequest = z.object({
  clientId: z.string().min(1, "Choose a client."),
  jobId: z.string().nullable().optional(),
  ...DocumentInput,
  issuedOn: DateOnly.optional(),
  dueOn: DateOnly.nullable().optional(),
});
export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequest>;

/** Itens só mudam sem pagamento registrado; `status: "void"` anula (só sem pagamento). */
export const UpdateInvoiceRequest = z
  .object({
    ...DocumentInput,
    issuedOn: DateOnly.optional(),
    dueOn: DateOnly.nullable().optional(),
    status: z.literal("void").optional(),
  })
  .refine((i) => Object.values(i).some((v) => v !== undefined), { message: "Nothing to update." });
export type UpdateInvoiceRequest = z.infer<typeof UpdateInvoiceRequest>;

export const RecordPaymentRequest = z.object({
  amountCents: z.number().int().positive().max(100_000_000),
  method: PaymentMethod,
  reference: z.string().trim().max(80).optional(),
  receivedOn: DateOnly.optional(),
});
export type RecordPaymentRequest = z.infer<typeof RecordPaymentRequest>;

export const InvoicesResponse = z.object({ invoices: z.array(Invoice) });
export type InvoicesResponse = z.infer<typeof InvoicesResponse>;
export const InvoiceResponse = z.object({ invoice: Invoice });
export type InvoiceResponse = z.infer<typeof InvoiceResponse>;

/** Resposta de /send: o documento e o link público completo para copiar, SMS ou e-mail. */
export const SendDocumentResponse = z.object({
  url: z.string(),
  estimate: Estimate.optional(),
  invoice: Invoice.optional(),
});
export type SendDocumentResponse = z.infer<typeof SendDocumentResponse>;

export const ConvertEstimateRequest = z
  .object({ createJob: z.boolean().default(true), createInvoice: z.boolean().default(false) })
  .refine((c) => c.createJob || c.createInvoice, { message: "Choose a job or an invoice." });
export type ConvertEstimateRequest = z.infer<typeof ConvertEstimateRequest>;

export const ConvertEstimateResponse = z.object({
  estimate: Estimate,
  job: Job.nullable(),
  invoice: Invoice.nullable(),
});
export type ConvertEstimateResponse = z.infer<typeof ConvertEstimateResponse>;

// ---------- Resumo do painel ----------

export const OfficeSummary = z.object({
  /** Jobs de hoje (no fuso da empresa), em ordem de horário. */
  todayJobs: z.array(Job),
  unscheduledJobs: z.number().int().nonnegative(),
  /** Feitos e sem fatura. */
  jobsToInvoice: z.number().int().nonnegative(),
  estimatesAwaiting: z.number().int().nonnegative(),
  estimatesAwaitingCents: z.number().int().nonnegative(),
  unpaidInvoices: z.number().int().nonnegative(),
  unpaidCents: z.number().int().nonnegative(),
  overdueInvoices: z.number().int().nonnegative(),
  overdueCents: z.number().int().nonnegative(),
  /** Pagamentos recebidos no mês corrente. */
  collectedThisMonthCents: z.number().int().nonnegative(),
});
export type OfficeSummary = z.infer<typeof OfficeSummary>;

// ---------- Links públicos ----------

/** O que o cliente final vê. Sem ids internos nem notas da equipe. */
export const PublicEstimate = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  status: EstimateStatus,
  company: OfficeSettings.pick({ companyName: true, phone: true, email: true, address: true }),
  terms: z.string(),
  client: DocumentParty,
  items: z.array(LineItem.omit({ priceItemId: true })),
  taxRateBps: TaxRateBps,
  ...DocumentTotals.shape,
  message: z.string(),
  validUntil: DateOnly.nullable(),
  sentAt: z.string().nullable(),
  respondedAt: z.string().nullable(),
  approvedByName: z.string().nullable(),
});
export type PublicEstimate = z.infer<typeof PublicEstimate>;

export const PublicEstimateResponse = z.object({ estimate: PublicEstimate });
export type PublicEstimateResponse = z.infer<typeof PublicEstimateResponse>;

export const RespondEstimateRequest = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("approve"),
    name: z.string().trim().min(2, "Type your full name to approve.").max(120),
  }),
  z.object({ decision: z.literal("decline"), reason: z.string().trim().max(1000).optional() }),
]);
export type RespondEstimateRequest = z.infer<typeof RespondEstimateRequest>;

export const PublicInvoice = z.object({
  number: z.number().int().positive(),
  title: z.string(),
  status: InvoiceStatus,
  company: OfficeSettings.pick({ companyName: true, phone: true, email: true, address: true }),
  paymentInstructions: z.string(),
  client: DocumentParty,
  items: z.array(LineItem.omit({ priceItemId: true })),
  taxRateBps: TaxRateBps,
  ...DocumentTotals.shape,
  amountPaidCents: z.number().int().nonnegative(),
  balanceCents: z.number().int(),
  message: z.string(),
  issuedOn: DateOnly,
  dueOn: DateOnly.nullable(),
  paidAt: z.string().nullable(),
});
export type PublicInvoice = z.infer<typeof PublicInvoice>;

export const PublicInvoiceResponse = z.object({ invoice: PublicInvoice });
export type PublicInvoiceResponse = z.infer<typeof PublicInvoiceResponse>;
