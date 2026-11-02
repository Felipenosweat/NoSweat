// Datas e horas do agendamento no fuso da empresa, só com Intl (sem dependência nova). Puro: não
// lê banco nem relógio. "date" = "AAAA-MM-DD" e "time" = "HH:MM", sempre na hora de parede do fuso.
// Horário de verão: a conta é feita em instantes (ms), nunca somando 24 horas a uma data local.

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let format = formatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, format);
  }
  return format;
}

/** A hora de parede do instante, no fuso, lida como se fosse UTC (para achar o deslocamento). */
function wallClockAsUtc(ms: number, timeZone: string): number {
  const values: Record<string, number> = {};
  for (const part of formatter(timeZone).formatToParts(new Date(ms))) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }
  return Date.UTC(
    values.year ?? 1970,
    (values.month ?? 1) - 1,
    values.day ?? 1,
    // Alguns motores ainda escrevem "24" à meia-noite.
    (values.hour ?? 0) % 24,
    values.minute ?? 0,
    values.second ?? 0,
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** O fuso existe no Intl deste servidor? */
export function isKnownTimeZone(timeZone: string): boolean {
  try {
    formatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Soma dias a uma data sem hora (aritmética em UTC: sem surpresa de horário de verão). */
export function addDaysTo(date: string, days: number): string {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Dia da semana de uma data (0 = domingo ... 6 = sábado); não depende do fuso. */
export function weekdayOf(date: string): number {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** "HH:MM" → minutos desde a meia-noite. */
export function minutesOf(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

/** "AAAA-MM-DD" do instante no fuso. */
export function dateKeyOf(ms: number, timeZone: string): string {
  return new Date(wallClockAsUtc(ms, timeZone)).toISOString().slice(0, 10);
}

/**
 * Instante (ms) em que o relógio da parede do fuso marca `date` `time`. `null` se essa hora não
 * existe (o relógio pula da 2h para as 3h no dia em que o horário de verão começa). Hora que
 * existe duas vezes (o relógio volta, no fim do horário de verão) vale a primeira.
 */
export function zonedInstant(date: string, time: string, timeZone: string): number | null {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d, Math.floor(minutesOf(time) / 60), minutesOf(time) % 60);
  let guess = target - (wallClockAsUtc(target, timeZone) - target);
  guess = target - (wallClockAsUtc(guess, timeZone) - guess);
  if (wallClockAsUtc(guess, timeZone) !== target) return null;
  // Na hora repetida, o palpite pode cair na segunda: a primeira ocorrência é uma hora antes.
  const earlier = guess - 3_600_000;
  return wallClockAsUtc(earlier, timeZone) === target ? earlier : guess;
}

/** Meia-noite do dia no fuso (ms). Fuso sem meia-noite (raro): o primeiro instante do dia. */
export function startOfDayMs(date: string, timeZone: string): number {
  const exact = zonedInstant(date, "00:00", timeZone);
  if (exact !== null) return exact;
  const next = zonedInstant(date, "01:00", timeZone);
  return next ?? Date.parse(`${date}T00:00:00Z`);
}

/** ISO com o deslocamento do fuso: "2026-12-03T15:30:00-05:00". */
export function isoInZone(ms: number, timeZone: string): string {
  const wall = wallClockAsUtc(ms, timeZone);
  const offsetMinutes = Math.round((wall - ms) / 60_000);
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  const local = new Date(wall).toISOString().slice(0, 19);
  return `${local}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}
