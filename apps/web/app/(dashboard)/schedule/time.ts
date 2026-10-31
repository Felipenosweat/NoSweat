// Datas e horas da agenda no fuso da empresa (settings.timeZone), só com Intl (sem dependência
// nova). Puro: serve para server e client components.
//
// Convenções:
// - "dateKey" = "AAAA-MM-DD" no fuso da empresa (compara como texto);
// - "time" = "HH:MM" (24h), o valor do <input type="time">;
// - instantes sempre em ISO (o que a API guarda em startAt/endAt).

/** Fuso usado quando o da empresa falta ou é inválido. */
export const FALLBACK_TIME_ZONE = "America/New_York";

/** Primeira e última hora da grade da agenda (6h às 21h). */
export const GRID_START_HOUR = 6;
export const GRID_END_HOUR = 21;

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

/** O fuso existe no Intl deste navegador/servidor? (fuso inválido faz o Intl lançar erro). */
export function safeTimeZone(timeZone: string | null | undefined): string {
  if (!timeZone) return FALLBACK_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
}

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let format = partsFormatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    partsFormatters.set(timeZone, format);
  }
  return format;
}

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** "AAAA-MM-DD" no fuso. */
  dateKey: string;
  /** Minutos desde a meia-noite no fuso (0–1439). */
  minutes: number;
};

/** Ano, mês, dia, hora e minuto de um instante no fuso pedido. */
export function zonedParts(at: Date, timeZone: string): ZonedParts {
  const values: Record<string, number> = {};
  for (const part of partsFormatter(timeZone).formatToParts(at)) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  const year = values.year ?? 1970;
  const month = values.month ?? 1;
  const day = values.day ?? 1;
  // Alguns motores ainda escrevem "24" à meia-noite.
  const hour = (values.hour ?? 0) % 24;
  const minute = values.minute ?? 0;
  return {
    year,
    month,
    day,
    hour,
    minute,
    dateKey: `${year}-${pad(month)}-${pad(day)}`,
    minutes: hour * 60 + minute,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Diferença (ms) entre o relógio do fuso e o UTC naquele instante. */
function offsetMs(timeZone: string, utcMs: number): number {
  const p = zonedParts(new Date(utcMs), timeZone);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return wall - Math.floor(utcMs / 60_000) * 60_000;
}

/**
 * Hora de parede no fuso ("2026-10-26" + "09:30") → instante. Duas passadas acertam a troca de
 * horário de verão (na hora que não existe, cai uma hora depois).
 */
export function zonedToUtc(dateKey: string, time: string, timeZone: string): Date {
  const [y = 1970, m = 1, d = 1] = dateKey.split("-").map(Number);
  const [h = 0, mi = 0] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, h, mi);
  let utc = wall - offsetMs(timeZone, wall);
  utc = wall - offsetMs(timeZone, utc);
  return new Date(utc);
}

/** "AAAA-MM-DD" de um instante no fuso. */
export function dateKeyOf(at: Date, timeZone: string): string {
  return zonedParts(at, timeZone).dateKey;
}

/** "HH:MM" (24h) de um instante no fuso, para o <input type="time">. */
export function timeValueOf(at: Date, timeZone: string): string {
  const p = zonedParts(at, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** "HH:MM" + minutos (sem passar da meia-noite: para em 23:59). */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, Math.max(0, h * 60 + m + minutes));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

// ---------- datas sem hora ----------

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** A string é uma data "AAAA-MM-DD" que existe? */
export function isDateKey(value: string): boolean {
  if (!DATE_KEY.test(value)) return false;
  const [y = 0, m = 0, d = 0] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function keyToUtcDate(key: string): Date {
  const [y = 1970, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Data + n dias (n pode ser negativo). */
export function addDays(key: string, days: number): string {
  const date = keyToUtcDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Domingo da semana da data (semana começa no domingo, como nos calendários dos EUA). */
export function startOfWeek(key: string): string {
  return addDays(key, -keyToUtcDate(key).getUTCDay());
}

/** As 7 datas da semana que começa em `start`. */
export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Formata uma data sem hora (o dia não muda com o fuso: a data já é da empresa). */
const dateKeyFormatters = new Map<string, Intl.DateTimeFormat>();

export function formatDateKey(key: string, options: Intl.DateTimeFormatOptions): string {
  // Um formatador por combinação de opções: criar um Intl.DateTimeFormat é caro, e a grade da
  // semana formata centenas de rótulos por render.
  const cacheKey = JSON.stringify(options);
  let format = dateKeyFormatters.get(cacheKey);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    dateKeyFormatters.set(cacheKey, format);
  }
  return format.format(keyToUtcDate(key));
}

/** "Mon" */
export const weekdayShort = (key: string) => formatDateKey(key, { weekday: "short" });

/** "Monday, October 26" */
export const longDay = (key: string) =>
  formatDateKey(key, { weekday: "long", month: "long", day: "numeric" });

/** "Oct 25 – 31, 2026" / "Oct 28 – Nov 3, 2026" / "Dec 28, 2026 – Jan 3, 2027". */
export function weekRangeLabel(start: string): string {
  const end = addDays(start, 6);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const sameMonth = sameYear && start.slice(5, 7) === end.slice(5, 7);
  const year = end.slice(0, 4);
  if (sameMonth) {
    return `${formatDateKey(start, { month: "short", day: "numeric" })} – ${Number(end.slice(8))}, ${year}`;
  }
  if (sameYear) {
    return `${formatDateKey(start, { month: "short", day: "numeric" })} – ${formatDateKey(end, { month: "short", day: "numeric" })}, ${year}`;
  }
  return `${formatDateKey(start, { month: "short", day: "numeric", year: "numeric" })} – ${formatDateKey(end, { month: "short", day: "numeric", year: "numeric" })}`;
}

/** "Today", "Tomorrow", "Yesterday" ou "Wed, Oct 28" (com o ano se for outro). */
export function relativeDayLabel(key: string, today: string): string {
  if (key === today) return "Today";
  if (key === addDays(today, 1)) return "Tomorrow";
  if (key === addDays(today, -1)) return "Yesterday";
  return formatDateKey(key, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(key.slice(0, 4) === today.slice(0, 4) ? {} : { year: "numeric" }),
  });
}

// ---------- horas ----------

const timeFormatters = new Map<string, Intl.DateTimeFormat>();

/** "9:30 AM" de um instante, no fuso da empresa. */
export function formatTime(iso: string, timeZone: string): string {
  let format = timeFormatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
    timeFormatters.set(timeZone, format);
  }
  return format.format(new Date(iso));
}

/** "9:30 – 11:00 AM" (ou só o início sem fim). */
export function formatTimeRange(startIso: string, endIso: string | null, timeZone: string): string {
  const start = formatTime(startIso, timeZone);
  if (!endIso) return start;
  const end = formatTime(endIso, timeZone);
  // Mesmo período (AM/PM): escreve uma vez só.
  const startPeriod = start.slice(-2);
  if (startPeriod === end.slice(-2) && (startPeriod === "AM" || startPeriod === "PM")) {
    return `${start.slice(0, -3)} – ${end}`;
  }
  return `${start} – ${end}`;
}

/** Rótulo de uma hora cheia da grade: 6 → "6 AM", 12 → "12 PM". */
export function hourLabel(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${period}`;
}

/** "HH:MM" de uma hora cheia. */
export function hourValue(hour: number): string {
  return `${pad(hour)}:00`;
}
