import type {
  AvailabilityResponse,
  BookingSlot,
  PublicBooking,
  PublicBookingInfo,
} from "@nosweat/schema";

// Funções puras do agendamento do site: datas e horas SEMPRE no fuso da empresa (nunca o do
// visitante), agrupamento dos horários e conferência leve das respostas da API (sem trazer o Zod
// para o navegador dos sites publicados).

const FALLBACK_ZONE = "UTC";

/** Fuso válido (IANA); um nome desconhecido não pode derrubar a página. */
export function safeTimeZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return FALLBACK_ZONE;
  }
}

function parts(date: Date, options: Intl.DateTimeFormatOptions, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: safeTimeZone(timeZone),
  });
  const result: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) result[part.type] = part.value;
  return result;
}

/** "AAAA-MM-DD" de um instante, no fuso da empresa. */
export function dateKeyInZone(date: Date, timeZone: string): string {
  const p = parts(date, { year: "numeric", month: "2-digit", day: "2-digit" }, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

/** "AAAA-MM-DD" do começo de um horário ISO, no fuso da empresa. */
export function slotDateKey(iso: string, timeZone: string): string {
  return dateKeyInZone(new Date(iso), timeZone);
}

function keyToUtc(key: string): number {
  const [year, month, day] = key.split("-").map(Number);
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12);
}

/** Soma dias a uma data "AAAA-MM-DD" (calendário puro, sem fuso). */
export function addDaysToKey(key: string, days: number): string {
  return new Date(keyToUtc(key) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Dias entre duas datas "AAAA-MM-DD". */
export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((keyToUtc(toKey) - keyToUtc(fromKey)) / 86_400_000);
}

function calendarFormat(key: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(
    new Date(keyToUtc(key)),
  );
}

/** Rótulo curto do dia na faixa de dias: "Today", "Tomorrow", "Wed 4". */
export function dayLabel(key: string, todayKey: string): string {
  const diff = daysBetween(todayKey, key);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `${calendarFormat(key, { weekday: "short" })} ${Number(key.slice(8, 10))}`;
}

/** "Wednesday, Nov 4" (título do dia escolhido). */
export function dayLabelLong(key: string): string {
  return calendarFormat(key, { weekday: "long", month: "short", day: "numeric" });
}

/** "3:30 PM" no fuso da empresa. */
export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: safeTimeZone(timeZone),
  }).format(new Date(iso));
}

/** "Tue, Nov 3 at 3:30 PM EST": data, hora e abreviação do fuso da empresa. */
export function formatDateTime(iso: string, timeZone: string): string {
  const zone = safeTimeZone(timeZone);
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: zone,
  }).format(new Date(iso));
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
    timeZone: zone,
  }).format(new Date(iso));
  return `${date} at ${time}`;
}

/** Abreviação do fuso da empresa naquele dia ("EST", "PDT"). */
export function zoneAbbreviation(iso: string, timeZone: string): string {
  return parts(new Date(iso), { timeZoneName: "short" }, timeZone).timeZoneName ?? timeZone;
}

/** "Tomorrow 9:00 AM", "Tue 3:30 PM" (em até uma semana) ou "Tue, Nov 10, 3:30 PM". */
export function formatNextOpening(iso: string, timeZone: string, todayKey: string): string {
  const key = slotDateKey(iso, timeZone);
  const diff = daysBetween(todayKey, key);
  const time = formatTime(iso, timeZone);
  if (diff <= 0) return `Today ${time}`;
  if (diff === 1) return `Tomorrow ${time}`;
  if (diff < 7) return `${calendarFormat(key, { weekday: "short" })} ${time}`;
  return `${calendarFormat(key, { weekday: "short", month: "short", day: "numeric" })}, ${time}`;
}

export type PartOfDay = "morning" | "afternoon" | "evening";

/** Manhã até 11:59, tarde até 16:59, noite depois (hora do fuso da empresa). */
export function partOfDay(iso: string, timeZone: string): PartOfDay {
  const hour = Number(
    parts(new Date(iso), { hour: "numeric", hourCycle: "h23" }, timeZone).hour ?? "0",
  );
  const normalized = hour % 24;
  if (normalized < 12) return "morning";
  if (normalized < 17) return "afternoon";
  return "evening";
}

export type SlotGroup = { part: PartOfDay; label: string; slots: BookingSlot[] };

const PART_LABELS: Record<PartOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

/**
 * Junta os horários de um dia em Manhã/Tarde/Noite (só os grupos que têm horário), em ordem. Com
 * "qualquer pessoa", dois profissionais livres no mesmo horário viram um botão só.
 */
export function groupSlots(slots: readonly BookingSlot[], timeZone: string): SlotGroup[] {
  const sorted = [...slots].sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  const seen = new Set<string>();
  const groups = new Map<PartOfDay, BookingSlot[]>();
  for (const slot of sorted) {
    if (seen.has(slot.startAt)) continue;
    seen.add(slot.startAt);
    const part = partOfDay(slot.startAt, timeZone);
    groups.set(part, [...(groups.get(part) ?? []), slot]);
  }
  return (["morning", "afternoon", "evening"] as const).flatMap((part) => {
    const list = groups.get(part);
    return list ? [{ part, label: PART_LABELS[part], slots: list }] : [];
  });
}

/** Horários de cada dia da resposta, por data ("AAAA-MM-DD"). */
export function slotsByDate(availability: AvailabilityResponse): Map<string, BookingSlot[]> {
  return new Map(availability.days.map((day) => [day.date, day.slots]));
}

/** "30 min", "1 h", "1 h 30 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Preço em dólares a partir de centavos: "$45", "$45.50". */
export function formatPrice(cents: number): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

const PLATFORM_HOST = /(^|\.)nosweatfd\.com$|^localhost$|\.vercel\.app$/;

/**
 * Link "Cancel or change" da confirmação. No domínio do cliente o `proxy.ts` mostra o site em
 * qualquer caminho, então o link precisa apontar para o endereço da plataforma.
 */
export function manageBookingUrl(token: string, hostname: string): string {
  const path = `/booking/${encodeURIComponent(token)}`;
  return PLATFORM_HOST.test(hostname) ? path : `https://www.nosweatfd.com${path}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Confere o essencial da resposta de `GET /api/public/booking/[siteId]`. */
export function isPublicBookingInfo(value: unknown): value is PublicBookingInfo {
  return (
    isRecord(value) &&
    typeof value.businessName === "string" &&
    typeof value.timeZone === "string" &&
    typeof value.maxDaysAhead === "number" &&
    Array.isArray(value.services) &&
    Array.isArray(value.staff)
  );
}

/** Confere o essencial da resposta de `.../availability`. */
export function isAvailabilityResponse(value: unknown): value is AvailabilityResponse {
  return isRecord(value) && Array.isArray(value.days);
}

/** Confere o essencial da resposta de `POST .../book` ({ booking }). */
export function isPublicBookingResponse(value: unknown): value is { booking: PublicBooking } {
  if (!isRecord(value) || !isRecord(value.booking)) return false;
  const booking = value.booking;
  return (
    typeof booking.token === "string" &&
    typeof booking.serviceName === "string" &&
    typeof booking.startAt === "string" &&
    typeof booking.timeZone === "string"
  );
}
