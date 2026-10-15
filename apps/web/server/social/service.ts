import type { SocialPost } from "@nosweat/schema";
import type { SocialPostRecord } from "./types";

// Funções puras do módulo de redes sociais usadas pelas rotas: conversão para o DTO público e
// datas no fuso da empresa (o dono marca "terça às 10h" no horário dele; o banco guarda UTC).

/** Post como o navegador vê (sem ids internos do Instagram nem trava do publicador). */
export function toPublicPost(record: SocialPostRecord): SocialPost {
  return {
    id: record.id,
    status: record.status,
    source: record.source,
    caption: record.caption,
    ownerNotePt: record.ownerNotePt,
    media: record.media,
    scheduledAt: record.scheduledAt,
    claimsFlagged: record.claimsFlagged,
    approvedAt: record.approvedAt,
    publishedAt: record.publishedAt,
    permalink: record.permalink,
    lastError: record.lastError,
    siteId: record.siteId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/** `true` se o fuso existe (ex.: "America/New_York"). */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Data e hora "de parede" daquele instante no fuso, como se fosse UTC (para calcular o offset). */
function wallClockAsUtc(ms: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
}

/**
 * "2026-11-03" + "10:00" no fuso → instante em UTC (ISO). Corrige o horário de verão: calcula o
 * offset duas vezes. Num horário que não existe (o relógio pulou), cai na hora seguinte.
 */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const target = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0);
  let guess = target - (wallClockAsUtc(target, timeZone) - target);
  guess = target - (wallClockAsUtc(guess, timeZone) - guess);
  return new Date(guess).toISOString();
}

/** Primeiro instante do mês "YYYY-MM" e do mês seguinte, no fuso, em UTC. */
export function monthRangeUtc(month: string, timeZone: string): { fromIso: string; toIso: string } {
  const [y, m] = month.split("-").map(Number);
  const year = y ?? 1970;
  const index = (m ?? 1) - 1;
  const next = new Date(Date.UTC(year, index + 1, 1));
  const nextMonth = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
  return {
    fromIso: zonedTimeToUtc(`${month}-01`, "00:00", timeZone),
    toIso: zonedTimeToUtc(`${nextMonth}-01`, "00:00", timeZone),
  };
}

/** Mês atual ("YYYY-MM") no fuso. */
export function currentMonth(timeZone: string, now = new Date()): string {
  const wall = new Date(wallClockAsUtc(now.getTime(), timeZone));
  return `${wall.getUTCFullYear()}-${String(wall.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Mês ("YYYY-MM") de um instante no fuso. */
export function monthOf(iso: string, timeZone: string): string {
  return currentMonth(timeZone, new Date(iso));
}
