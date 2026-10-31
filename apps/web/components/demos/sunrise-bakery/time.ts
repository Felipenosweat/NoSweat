import { useSyncExternalStore } from "react";
import { DAY_NAMES, HOURS, type Weekday } from "./content";

// Relógio da padaria: tudo na hora de Sacramento (America/Los_Angeles), não na do visitante.
// Funções puras (recebem o instante) + um hook que só tem valor no navegador: no servidor a
// página sai sem "aberto agora" (null) e o estado aparece depois da hidratação, sem desencontro.

const TZ = "America/Los_Angeles";

export type LocalTime = {
  weekday: Weekday;
  /** minutos desde a meia-noite em Sacramento */
  minutes: number;
  year: number;
  month: number;
  day: number;
};

const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const WEEKDAY_INDEX: Record<string, Weekday> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function localTime(now: number): LocalTime {
  const map: Record<string, string> = {};
  for (const part of parts.formatToParts(new Date(now))) map[part.type] = part.value;
  return {
    weekday: WEEKDAY_INDEX[map.weekday ?? "Sun"] ?? 0,
    minutes: Number(map.hour) * 60 + Number(map.minute),
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export type OpenState =
  | { open: true; closesAt: number; minutesLeft: number }
  | { open: false; nextDay: Weekday; daysAhead: number; opensAt: number };

export function openState(t: LocalTime): OpenState {
  const today = HOURS[t.weekday];
  if (today && t.minutes >= today.open && t.minutes < today.close) {
    return { open: true, closesAt: today.close, minutesLeft: today.close - t.minutes };
  }
  for (let ahead = 0; ahead < 8; ahead++) {
    const day = ((t.weekday + ahead) % 7) as Weekday;
    const hours = HOURS[day];
    if (!hours) continue;
    if (ahead === 0 && t.minutes >= hours.open) continue;
    return { open: false, nextDay: day, daysAhead: ahead, opensAt: hours.open };
  }
  return { open: false, nextDay: 3, daysAhead: 1, opensAt: 7 * 60 };
}

/** "Open now · until 2 PM" / "Closed · opens Wednesday 7 AM". */
export function statusText(t: LocalTime): {
  short: string;
  tiny: string;
  long: string;
  open: boolean;
} {
  const s = openState(t);
  if (s.open) {
    const until = formatClock(s.closesAt);
    return {
      open: true,
      short: `Open · until ${until}`,
      tiny: `Open till ${until}`,
      long: `Open now, until ${until}`,
    };
  }
  const when = s.daysAhead === 0 ? "today" : s.daysAhead === 1 ? "tomorrow" : DAY_NAMES[s.nextDay];
  const at = formatClock(s.opensAt);
  return {
    open: false,
    short: `Closed · opens ${s.daysAhead >= 2 ? DAY_NAMES[s.nextDay].slice(0, 3) : when} ${at}`,
    tiny: `Opens ${s.daysAhead >= 2 ? DAY_NAMES[s.nextDay].slice(0, 3) : when} ${at}`,
    long: `Closed now. Opens ${when} at ${at}`,
  };
}

/** Data civil (sem fuso) a partir de ano/mês/dia de Sacramento, para somar dias. */
function civil(t: LocalTime, addDays: number): Date {
  return new Date(Date.UTC(t.year, t.month - 1, t.day + addDays));
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "short",
  month: "short",
  day: "numeric",
});

export function formatDate(d: Date): string {
  return dateFmt.format(d);
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Caixa de sábado: pedidos até quinta ao meio-dia. Devolve o sábado em que a caixa pedida
 * agora seria retirada e quantos minutos faltam para fechar os pedidos dele.
 */
export function breadBox(t: LocalTime): { pickup: Date; minutesLeft: number } {
  // Dias até a próxima quinta (0 se hoje é quinta).
  let toThu = (4 - t.weekday + 7) % 7;
  if (toThu === 0 && t.minutes >= 12 * 60) toThu = 7;
  // Sexta e sábado já passaram do prazo deste sábado: o próximo prazo é a quinta seguinte.
  const minutesLeft = toThu * 24 * 60 + (12 * 60 - t.minutes);
  return { pickup: civil(t, toThu + 2), minutesLeft };
}

export function formatCountdown(minutes: number): string {
  const d = Math.floor(minutes / (24 * 60));
  const h = Math.floor((minutes % (24 * 60)) / 60);
  const m = minutes % 60;
  if (d > 0) return `${d} day${d > 1 ? "s" : ""}, ${h} hr`;
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
}

/** Bolo sob medida: 5 dias de antecedência, e a retirada cai num dia aberto. */
export function earliestCake(t: LocalTime): Date {
  for (let add = 5; add < 14; add++) {
    const d = civil(t, add);
    if (HOURS[d.getUTCDay() as Weekday]) return d;
  }
  return civil(t, 5);
}

export function isOpenDay(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00Z`);
  return Boolean(HOURS[d.getUTCDay() as Weekday]);
}

// Hook do relógio: um "agora" que muda a cada 30 s. Store externo para não chamar setState
// dentro de efeito; o valor é arredondado ao minuto para o React não renderizar à toa.
let cached = 0;
function snapshot(): number {
  const minute = Math.floor(Date.now() / 60000) * 60000;
  if (minute !== cached) cached = minute;
  return cached;
}
function subscribe(callback: () => void): () => void {
  const id = window.setInterval(callback, 30000);
  return () => window.clearInterval(id);
}

/** Instante atual (ms, arredondado ao minuto) no navegador; null no servidor. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}
