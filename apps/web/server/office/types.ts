import {
  Estimate,
  Invoice,
  Job,
  OfficeSettings,
  Payment,
  PriceItem,
  TeamMember,
} from "@nosweat/schema";
import { z } from "zod";

// Tipos internos do escritório (tabelas da migration 0022). O que sai para o navegador são os
// tipos de @nosweat/schema (office.ts); aqui só se acrescenta o dono e o que fica guardado
// diferente do que é mostrado (status calculados na leitura, nome do cliente, pagamentos).
// Os schemas abaixo também validam as linhas que voltam do Supabase (já em camelCase).

const OwnerId = { ownerId: z.string() };

export const OfficeSettingsRecord = OfficeSettings.extend(OwnerId);
export type OfficeSettingsRecord = z.infer<typeof OfficeSettingsRecord>;

export const PriceItemRecord = PriceItem.extend(OwnerId);
export type PriceItemRecord = z.infer<typeof PriceItemRecord>;

export const TeamMemberRecord = TeamMember.extend(OwnerId);
export type TeamMemberRecord = z.infer<typeof TeamMemberRecord>;

/** O job guardado: sem o nome do cliente (preenchido na leitura). */
export const JobRecord = Job.omit({ clientName: true }).extend(OwnerId);
export type JobRecord = z.infer<typeof JobRecord>;

/** Status guardado do orçamento: `expired` é calculado na leitura. */
export const StoredEstimateStatus = z.enum(["draft", "sent", "approved", "declined"]);
export type StoredEstimateStatus = z.infer<typeof StoredEstimateStatus>;

export const EstimateRecord = Estimate.omit({ clientName: true, status: true }).extend({
  ...OwnerId,
  status: StoredEstimateStatus,
  /** Motivo que o cliente escreveu ao recusar (o dono vê em `Estimate.declineReason`). */
  declineReason: z.string().nullable(),
});
export type EstimateRecord = z.infer<typeof EstimateRecord>;

/** Status guardado da fatura: `partial` e `overdue` são calculados na leitura. */
export const StoredInvoiceStatus = z.enum(["draft", "sent", "paid", "void"]);
export type StoredInvoiceStatus = z.infer<typeof StoredInvoiceStatus>;

/**
 * A fatura guardada: sem nome do cliente, saldo e pagamentos (lidos da tabela de pagamentos).
 * `amountPaidCents` é uma cópia da soma dos pagamentos, atualizada pelo service a cada mudança.
 */
export const InvoiceRecord = Invoice.omit({
  clientName: true,
  status: true,
  balanceCents: true,
  payments: true,
}).extend({ ...OwnerId, status: StoredInvoiceStatus });
export type InvoiceRecord = z.infer<typeof InvoiceRecord>;

export const PaymentRecord = Payment.extend(OwnerId);
export type PaymentRecord = z.infer<typeof PaymentRecord>;

/** Campos que o banco cria sozinho. */
type Generated = "id" | "createdAt" | "updatedAt";

export type NewPriceItem = Omit<PriceItemRecord, Generated>;
export type NewTeamMember = Omit<TeamMemberRecord, Generated>;
export type NewJob = Omit<JobRecord, Generated>;
export type NewEstimate = Omit<EstimateRecord, Generated>;
export type NewInvoice = Omit<InvoiceRecord, Generated>;
export type NewPayment = Omit<PaymentRecord, "id" | "createdAt">;

/** O que nunca muda depois de criado (dono, número, link público). */
type Fixed = Generated | "ownerId" | "number" | "publicToken";

/** Mudanças (`undefined` = não mexe). */
export type SettingsPatch = Partial<Omit<OfficeSettingsRecord, "ownerId">>;
export type PriceItemPatch = Partial<Omit<PriceItemRecord, Fixed>>;
export type TeamMemberPatch = Partial<Omit<TeamMemberRecord, Fixed>>;
export type JobPatch = Partial<Omit<JobRecord, Fixed>>;
export type EstimatePatch = Partial<Omit<EstimateRecord, Fixed>>;
export type InvoicePatch = Partial<Omit<InvoiceRecord, Fixed>>;

/**
 * Condições de `updateEstimate` (a mudança só acontece se TODAS valerem; senão `null`):
 * - status: o status guardado ainda é este (resposta do cliente / do dono sem corrida);
 * - updatedAt: ninguém mudou o orçamento desde esta versão (o cliente aprova o preço que viu);
 * - jobId: o job ligado ainda é este (`null` = ainda sem job: dois "converter" ao mesmo tempo).
 */
export type EstimateGuard = {
  status?: StoredEstimateStatus;
  updatedAt?: string;
  jobId?: string | null;
};

/** Resultado de registrar um pagamento (atômico: confere o saldo e grava de uma vez). */
export type RecordPaymentResult =
  | { ok: true; payment: PaymentRecord; invoice: InvoiceRecord }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "void" }
  | { ok: false; reason: "over_balance"; balanceCents: number };

/** Tipos de documento com número sequencial (`office_next_number`). */
export type NumberKind = "job" | "estimate" | "invoice";

/** Erro de regra do escritório: as rotas devolvem `{ error: { code, message } }` com o status. */
export class OfficeError extends Error {
  constructor(
    readonly status: number,
    readonly code: "invalid_request" | "not_found" | "conflict",
    message: string,
  ) {
    super(message);
    this.name = "OfficeError";
  }
}
