import type { BookingSettings, TimeRange } from "@nosweat/schema";

// Regras puras da tela de agendamento do dono (horários da semana e dias fechados).

/** Ordem de exibição: segunda a domingo (os dados são 0 = domingo ... 6 = sábado). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/** Soma minutos a "HH:MM", sem passar de 00:00 a 23:59. */
export function shiftTime(time: string, minutes: number): string {
  const total = Math.min(23 * 60 + 59, Math.max(0, toMinutes(time) + minutes));
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Segundo bloco do dia (depois do almoço): começa 1 h depois do primeiro e dura até 3 h. */
export function secondRangeAfter(first: TimeRange): TimeRange | null {
  const start = shiftTime(first.end, 60);
  if (start <= first.end || start >= "23:00") return null;
  return { start, end: shiftTime(start, 180) };
}

/**
 * Confere os horários da semana: cada bloco termina depois de começar e os blocos do mesmo dia
 * não se sobrepõem. Devolve a mensagem do primeiro problema (ou null).
 */
export function weeklyProblem(weekly: BookingSettings["weekly"]): string | null {
  for (const [day, ranges] of weekly.entries()) {
    const name = DAY_NAMES[day] ?? "That day";
    for (const range of ranges) {
      if (!range.start || !range.end) return `${name}: fill in both times.`;
      if (range.start >= range.end) return `${name}: the closing time must be after the opening.`;
    }
    const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < sorted.length; i++) {
      if ((sorted[i]?.start ?? "") < (sorted[i - 1]?.end ?? "")) {
        return `${name}: the two blocks overlap.`;
      }
    }
  }
  return null;
}

/** Copia a segunda-feira para todos os outros dias. */
export function copyMondayToAll(weekly: BookingSettings["weekly"]): BookingSettings["weekly"] {
  const monday = weekly[1] ?? [];
  return weekly.map(() => monday.map((range) => ({ ...range })));
}

/** Opções de um seletor com o valor atual incluído (valores antigos continuam aparecendo). */
export function withCurrent(options: readonly number[], current: number): number[] {
  return options.includes(current) ? [...options] : [...options, current].sort((a, b) => a - b);
}

/** Datas "AAAA-MM-DD" sem repetição, em ordem. */
export function addClosedDate(dates: readonly string[], date: string): string[] {
  return [...new Set([...dates, date])].sort();
}

/** "Fri, Dec 25, 2026" (calendário puro, sem fuso). */
export function formatClosedDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)));
}

/** "30 min", "1 hour", "2 hours". */
export function formatHours(hours: number): string {
  if (hours === 0) return "No minimum";
  return hours === 1 ? "1 hour" : hours < 48 ? `${hours} hours` : `${Math.round(hours / 24)} days`;
}
