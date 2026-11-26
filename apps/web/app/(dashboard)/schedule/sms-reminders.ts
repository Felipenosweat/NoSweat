import { smsHref } from "@/lib/office";
import { addDays, formatTime, zonedParts } from "./time";

// Lembretes por texto, SEM provedor: o dono manda do próprio celular (link `sms:` com o texto
// pronto). Regras puras (sem React e sem servidor): quem entra na lista de amanhã, horário de
// silêncio (8h às 21h no fuso da empresa), a mensagem e o link. Serve server e client components.
// Quando houver envio automático (provedor + registro A2P 10DLC), estas mesmas regras valem.

/** Só se manda entre 8:00 AM e 9:00 PM (hora da empresa). Minutos desde a meia-noite. */
export const SEND_FROM_MINUTES = 8 * 60;
export const SEND_UNTIL_MINUTES = 21 * 60;

/** Horário de silêncio: antes das 8:00 AM ou a partir das 9:00 PM no fuso da empresa. */
export function isQuietHours(now: Date, timeZone: string): boolean {
  const { minutes } = zonedParts(now, timeZone);
  return minutes < SEND_FROM_MINUTES || minutes >= SEND_UNTIL_MINUTES;
}

/** "AAAA-MM-DD" de amanhã no fuso da empresa. */
export function tomorrowKey(now: Date, timeZone: string): string {
  return addDays(zonedParts(now, timeZone).dateKey, 1);
}

/** Intervalo (instantes) que cobre amanhã em qualquer fuso, para ler do banco; o filtro fino é por data. */
export function readWindow(now: Date): { fromIso: string; toIso: string } {
  const day = 24 * 60 * 60 * 1000;
  return {
    fromIso: new Date(now.getTime() - day).toISOString(),
    toIso: new Date(now.getTime() + 3 * day).toISOString(),
  };
}

/** Só o que a lista precisa de uma marcação (a `BookingRecord` do servidor serve). */
export type ReminderBooking = {
  id: string;
  clientId: string | null;
  status: "confirmed" | "canceled";
  customerName: string;
  customerFirstName?: string | null;
  customerPhone: string;
  serviceName: string;
  startAt: string;
  /** Preenchido só quando o cliente marcou a caixa de lembretes por texto. */
  smsConsentAt?: string | null;
};

/** Só o que a lista precisa de um cliente do CRM. */
export type ReminderClient = {
  id: string;
  phone: string | null;
  smsOptOut?: boolean;
};

/** Telefone para comparar: só dígitos, sem o "1" do país nos EUA. */
export function phoneKey(phone: string | null | undefined): string | null {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits || null;
}

/**
 * Marcações de AMANHÃ (fuso da empresa) que podem receber lembrete: confirmadas, com o
 * consentimento marcado, com telefone e cujo cliente NÃO respondeu STOP (pelo cadastro ou por um
 * cliente com o mesmo telefone). Ordem do horário.
 */
export function eligibleReminders(input: {
  now: Date;
  timeZone: string;
  bookings: readonly ReminderBooking[];
  clients: readonly ReminderClient[];
}): ReminderBooking[] {
  const tomorrow = tomorrowKey(input.now, input.timeZone);
  const stoppedIds = new Set<string>();
  const stoppedPhones = new Set<string>();
  for (const client of input.clients) {
    if (!client.smsOptOut) continue;
    stoppedIds.add(client.id);
    const key = phoneKey(client.phone);
    if (key) stoppedPhones.add(key);
  }
  return input.bookings
    .filter((booking) => {
      if (booking.status !== "confirmed" || !booking.smsConsentAt) return false;
      // Sem cliente no cadastro não dá para registrar um STOP depois: fica fora da lista.
      if (!booking.clientId || stoppedIds.has(booking.clientId)) return false;
      const key = phoneKey(booking.customerPhone);
      if (!key || stoppedPhones.has(key)) return false;
      return zonedParts(new Date(booking.startAt), input.timeZone).dateKey === tomorrow;
    })
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
}

/** Primeiro nome do cliente ("Ana Lima" → "Ana"; sem nome, "there"). */
export function firstNameOf(booking: Pick<ReminderBooking, "customerName" | "customerFirstName">) {
  const first = booking.customerFirstName?.trim() || booking.customerName.trim().split(/\s+/)[0];
  return first || "there";
}

/**
 * O texto do lembrete. Termina com o aviso de saída (STOP). `time` já vem no fuso da empresa
 * ("10:30 AM"). Fala só de amanhã: a lista é sempre a de amanhã.
 */
export function reminderMessage(input: {
  firstName: string;
  businessName: string;
  serviceName: string;
  time: string;
}): string {
  const business = input.businessName.trim() || "your service provider";
  const service = input.serviceName.trim() || "appointment";
  const what = /appointment$/i.test(service) ? service : `${service} appointment`;
  return (
    `Hi ${input.firstName}, this is ${business} reminding you of your ${what} ` +
    `tomorrow at ${input.time}. Reply STOP to opt out.`
  );
}

/**
 * Link `sms:` com o texto pronto. O helper do app usa "?&body=", que abre o app de mensagens com o
 * texto no iPhone (iOS) e no Android; o link de telefone mantém só dígitos e "+".
 */
export function reminderHref(phone: string, body: string): string {
  return smsHref(phone, body);
}

/** Uma linha da lista "Text reminders" da agenda. */
export type ReminderRow = {
  bookingId: string;
  clientId: string;
  name: string;
  serviceName: string;
  /** "10:30 AM" no fuso da empresa. */
  timeLabel: string;
  message: string;
  href: string;
};

export function buildReminderRows(input: {
  now: Date;
  timeZone: string;
  businessName: string;
  bookings: readonly ReminderBooking[];
  clients: readonly ReminderClient[];
}): ReminderRow[] {
  return eligibleReminders(input).flatMap((booking) => {
    if (!booking.clientId) return [];
    // O Intl novo põe um espaço estreito (U+202F) antes de AM/PM: no SMS vai um espaço comum.
    const timeLabel = formatTime(booking.startAt, input.timeZone).replace(/\s/g, " ");
    const message = reminderMessage({
      firstName: firstNameOf(booking),
      businessName: input.businessName,
      serviceName: booking.serviceName,
      time: timeLabel,
    });
    return [
      {
        bookingId: booking.id,
        clientId: booking.clientId,
        name: booking.customerName,
        serviceName: booking.serviceName,
        timeLabel,
        message,
        href: reminderHref(booking.customerPhone, message),
      },
    ];
  });
}
