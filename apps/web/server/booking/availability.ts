import type { AvailabilityResponse, BookingSettings, BookingSlot } from "@nosweat/schema";
import {
  addDaysTo,
  dateKeyOf,
  isoInZone,
  minutesOf,
  startOfDayMs,
  weekdayOf,
  zonedInstant,
} from "./time";

// Motor de horários livres do agendamento online. Puro: recebe as regras, a equipe e os
// intervalos ocupados já lidos e devolve os horários; não lê banco nem relógio (o "agora" vem
// de fora). A mesma regra de choque está no SQL `book_slot` (migration 0027) e na memória.
//
// Regras:
// - Os horários da semana são na hora de parede do fuso da empresa; o horário de verão é tratado
//   em instantes (hora que não existe no dia da mudança é pulada).
// - Um horário só sai se o atendimento INTEIRO cabe num intervalo de funcionamento.
// - Folga (`bufferMinutes`): sempre sobra esse tempo entre dois atendimentos.
// - Antecedência mínima (`minNoticeHours`) e limite à frente (`maxDaysAhead`, contado de hoje).
// - Ocupado = serviços (jobs) não cancelados e marcações confirmadas. Com equipe, o que é de outra
//   pessoa não atrapalha; serviço sem ninguém atribuído bloqueia todos. Sem equipe, tudo bloqueia.

const MINUTE = 60_000;
/** Quanto dura um serviço (job) com início e sem fim, para efeito de bloqueio. */
export const DEFAULT_JOB_MINUTES = 60;
/** Teto de dias olhados na busca da próxima vaga (um ano). */
const MAX_SEARCH_DAYS = 400;

/** Intervalo ocupado. `staffIds` vazio = bloqueia todo mundo. */
export type BusyInterval = {
  startMs: number;
  endMs: number;
  staffIds: readonly string[];
};

type Span = { startMs: number; endMs: number };

/**
 * O horário `candidate` bate com `busy`? O atendimento novo ocupa mais `bufferMs` depois do fim, e
 * o ocupado também: dois atendimentos ficam sempre a pelo menos `bufferMs` um do outro.
 */
export function conflicts(candidate: Span, busy: Span, bufferMs: number): boolean {
  return candidate.startMs < busy.endMs + bufferMs && candidate.endMs + bufferMs > busy.startMs;
}

/** O ocupado vale para esta pessoa? (`null` = agenda única: tudo vale.) */
export function appliesTo(busy: BusyInterval, staffId: string | null): boolean {
  return staffId === null || busy.staffIds.length === 0 || busy.staffIds.includes(staffId);
}

/** Serviço (job) da agenda do dono → intervalo ocupado (cancelado ou sem horário: `null`). */
export function jobBusy(job: {
  status: string;
  startAt: string | null;
  endAt: string | null;
  assigneeIds: readonly string[];
}): BusyInterval | null {
  if (job.status === "canceled" || !job.startAt) return null;
  const startMs = Date.parse(job.startAt);
  if (!Number.isFinite(startMs)) return null;
  const parsedEnd = job.endAt ? Date.parse(job.endAt) : Number.NaN;
  const endMs =
    Number.isFinite(parsedEnd) && parsedEnd > startMs
      ? parsedEnd
      : startMs + DEFAULT_JOB_MINUTES * MINUTE;
  return { startMs, endMs, staffIds: job.assigneeIds };
}

/** Marcação confirmada → intervalo ocupado (sem pessoa = agenda única: bloqueia todos). */
export function bookingBusy(booking: {
  startAt: string;
  endAt: string;
  staffId: string | null;
}): BusyInterval {
  return {
    startMs: Date.parse(booking.startAt),
    endMs: Date.parse(booking.endAt),
    staffIds: booking.staffId ? [booking.staffId] : [],
  };
}

export type AvailabilityInput = {
  settings: BookingSettings;
  /** Fuso da empresa (IANA). */
  timeZone: string;
  durationMinutes: number;
  /** Equipe ativa, em ordem estável. Vazia = agenda única. */
  staff: readonly { id: string }[];
  /** Pessoa pedida; `null`/ausente = qualquer pessoa livre. Sem equipe é ignorada. */
  staffId?: string | null;
  busy: readonly BusyInterval[];
  now: Date;
};

const clockText = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Instante do relógio `minutes`, ou o primeiro minuto depois dele que existe (salto do verão). */
function instantFrom(date: string, minutes: number, timeZone: string): number | null {
  for (let extra = 0; extra <= 60; extra += 1) {
    const at = minutes + extra;
    if (at >= 24 * 60) return null;
    const found = zonedInstant(date, clockText(at), timeZone);
    if (found !== null) return found;
  }
  return null;
}

/** Quem pode atender: a pessoa pedida (se existe na equipe), ou toda a equipe; sem equipe, `[null]`. */
function candidateStaff(input: AvailabilityInput): (string | null)[] {
  if (input.staff.length === 0) return [null];
  const ids = input.staff.map((member) => member.id);
  return input.staffId ? ids.filter((id) => id === input.staffId) : ids;
}

/** Horários livres de um dia (`date` no fuso da empresa), do mais cedo para o mais tarde. */
function daySlots(input: AvailabilityInput, date: string): BookingSlot[] {
  const { settings, timeZone } = input;
  const nowMs = input.now.getTime();
  const today = dateKeyOf(nowMs, timeZone);
  if (date < today || date > addDaysTo(today, settings.maxDaysAhead)) return [];
  if (settings.closedDates.includes(date)) return [];
  const ranges = settings.weekly[weekdayOf(date)] ?? [];
  if (ranges.length === 0) return [];

  const earliestMs = nowMs + settings.minNoticeHours * 60 * MINUTE;
  const bufferMs = settings.bufferMinutes * MINUTE;
  const durationMs = input.durationMinutes * MINUTE;
  const staffIds = candidateStaff(input);
  if (staffIds.length === 0) return [];

  // Carga do dia por pessoa: com "qualquer pessoa", quem tem menos atendimentos sai primeiro.
  const dayStart = startOfDayMs(date, timeZone);
  const dayEnd = startOfDayMs(addDaysTo(date, 1), timeZone);
  const load = new Map<string | null, number>(
    staffIds.map((id): [string | null, number] => [
      id,
      id === null
        ? 0
        : input.busy.filter(
            (b) => b.startMs >= dayStart && b.startMs < dayEnd && b.staffIds.includes(id),
          ).length,
    ]),
  );
  const ordered = [...staffIds].sort((a, b) => (load.get(a) ?? 0) - (load.get(b) ?? 0));

  const seen = new Set<number>();
  const slots: { startMs: number; slot: BookingSlot }[] = [];
  for (const range of ranges) {
    const rangeStart = minutesOf(range.start);
    const rangeEnd = minutesOf(range.end);
    const rangeEndMs = instantFrom(date, rangeEnd, timeZone);
    if (rangeEndMs === null) continue;
    for (let at = rangeStart; at < rangeEnd; at += settings.slotStepMinutes) {
      const startMs = zonedInstant(date, clockText(at), timeZone);
      if (startMs === null || seen.has(startMs)) continue;
      const endMs = startMs + durationMs;
      if (endMs > rangeEndMs || startMs < earliestMs) continue;
      const free = ordered.find(
        (id) =>
          !input.busy.some((b) => appliesTo(b, id) && conflicts({ startMs, endMs }, b, bufferMs)),
      );
      if (free === undefined) continue;
      seen.add(startMs);
      slots.push({
        startMs,
        slot: {
          startAt: isoInZone(startMs, timeZone),
          endAt: isoInZone(endMs, timeZone),
          staffId: free,
        },
      });
    }
  }
  return slots.sort((a, b) => a.startMs - b.startMs).map((entry) => entry.slot);
}

/**
 * Horários livres de `days` dias a partir de `from` (todos os dias aparecem, mesmo sem horário) e o
 * primeiro horário livre depois do período, até o limite de `maxDaysAhead`.
 */
export function computeAvailability(
  input: AvailabilityInput,
  from: string,
  days: number,
): AvailabilityResponse {
  const result = Array.from({ length: days }, (_, i) => {
    const date = addDaysTo(from, i);
    return { date, slots: daySlots(input, date) };
  });

  const last = addDaysTo(
    dateKeyOf(input.now.getTime(), input.timeZone),
    input.settings.maxDaysAhead,
  );
  let nextAvailableAt: string | null = null;
  for (let i = days; i < days + MAX_SEARCH_DAYS; i += 1) {
    const date = addDaysTo(from, i);
    if (date > last) break;
    const first = daySlots(input, date)[0];
    if (first) {
      nextAvailableAt = first.startAt;
      break;
    }
  }
  return { timeZone: input.timeZone, days: result, nextAvailableAt };
}

/**
 * O horário que o cliente escolheu (`startMs`) ainda é oferecido? Devolve o horário (já com a
 * pessoa que atenderia) ou `null` se não existe, está ocupado ou fora das regras.
 */
export function findOfferedSlot(input: AvailabilityInput, startMs: number): BookingSlot | null {
  const date = dateKeyOf(startMs, input.timeZone);
  return daySlots(input, date).find((slot) => Date.parse(slot.startAt) === startMs) ?? null;
}
