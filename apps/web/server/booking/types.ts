import { BookingStatus } from "@nosweat/schema";
import { z } from "zod";

// Tipos internos do agendamento online (tabelas da migration 0027). O que sai para o navegador
// são os tipos de @nosweat/schema (booking.ts); aqui só se acrescenta o dono e os ids internos.
// O schema também valida as linhas que voltam do Supabase (já em camelCase).

export const BookingRecord = z.object({
  id: z.string(),
  ownerId: z.string(),
  siteId: z.string(),
  /** Link público do cliente (/booking/<token>). */
  token: z.string(),
  /** O serviço (job) criado na agenda do dono; null enquanto a marcação está sendo feita. */
  jobId: z.string().nullable(),
  clientId: z.string().nullable(),
  serviceId: z.string(),
  serviceName: z.string(),
  /** Quem atende (null = agenda única, sem equipe). */
  staffId: z.string().nullable(),
  /** Instantes (ISO; o banco devolve com "+00:00"). */
  startAt: z.string(),
  endAt: z.string(),
  status: BookingStatus,
  customerName: z.string(),
  customerPhone: z.string(),
  customerEmail: z.string().nullable(),
  notes: z.string(),
  createdAt: z.string(),
  canceledAt: z.string().nullable(),
  // Formulário v2 (migration 0038): nomes separados e prova do aceite. Marcação antiga: tudo vazio.
  customerFirstName: z.string().nullish(),
  customerLastName: z.string().nullish(),
  customerPhoneCountry: z.string().nullish(),
  privacyAcceptedAt: z.string().nullish(),
  cancellationAcceptedAt: z.string().nullish(),
  /** O texto da política que o cliente viu e aceitou (a do dono pode mudar depois). */
  cancellationPolicySnapshot: z.string().nullish(),
  // Consentimento para lembretes por texto (migration 0039): data e o aviso exato que o cliente viu.
  smsConsentAt: z.string().nullish(),
  smsConsentText: z.string().nullish(),
});
export type BookingRecord = z.infer<typeof BookingRecord>;

/** O que `bookSlot` grava (o resto o banco cria). */
export type NewBooking = Omit<
  BookingRecord,
  | "id"
  | "createdAt"
  | "canceledAt"
  | "status"
  | "jobId"
  | "customerFirstName"
  | "customerLastName"
  | "customerPhoneCountry"
  | "privacyAcceptedAt"
  | "cancellationAcceptedAt"
  | "cancellationPolicySnapshot"
  | "smsConsentAt"
  | "smsConsentText"
>;

/** Nomes separados e aceite do formulário v2, gravados logo depois de `bookSlot`. */
export type BookingConsent = {
  customerFirstName: string;
  customerLastName: string | null;
  customerPhoneCountry: string | null;
  privacyAcceptedAt: string;
  cancellationAcceptedAt: string | null;
  cancellationPolicySnapshot: string | null;
};

/** Consentimento (opcional) de lembretes por texto, gravado logo depois de `bookSlot`. */
export type SmsConsent = { smsConsentAt: string; smsConsentText: string };

export type BookSlotResult =
  | { ok: true; booking: BookingRecord }
  | { ok: false; reason: "conflict" };
