import { useSyncExternalStore } from "react";
import { BUNS_GONE_SAT, DAY_NAMES, EGG_UNTIL, HOURS, ROAST_DAYS, type Weekday } from "./content";

// Relógio do café: tudo na hora de Minneapolis (America/Chicago), não na do visitante.
// Funções puras (recebem dia e minuto) + um hook que só tem valor no navegador: no servidor a
// página sai com o texto fixo dos horários e o estado "agora" aparece depois da hidratação.

const TZ = "America/Chicago";

export type LocalTime = { weekday: Weekday; minutes: number };

const parts = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
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
    minutes: (Number(map.hour) % 24) * 60 + Number(map.minute),
  };
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "2 hr 15 min" / "45 min". */
export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function isOpen(t: LocalTime): boolean {
  const h = HOURS[t.weekday];
  return t.minutes >= h.open && t.minutes < h.close;
}

/** Próxima abertura a partir de t (hoje mais tarde ou nos próximos dias). */
export function nextOpening(t: LocalTime): { day: Weekday; ahead: number; at: number } {
  for (let ahead = 0; ahead < 8; ahead++) {
    const day = ((t.weekday + ahead) % 7) as Weekday;
    const h = HOURS[day];
    if (ahead === 0 && t.minutes >= h.open) continue;
    return { day, ahead, at: h.open };
  }
  return { day: 1, ahead: 1, at: HOURS[1].open };
}

/** "Open · until 3 PM" / "Closed · opens 6:30 AM tomorrow". */
export function statusText(t: LocalTime): { open: boolean; short: string; long: string } {
  if (isOpen(t)) {
    const until = formatClock(HOURS[t.weekday].close);
    return { open: true, short: `Open · until ${until}`, long: `Open now, until ${until}` };
  }
  const n = nextOpening(t);
  const when = n.ahead === 0 ? "today" : n.ahead === 1 ? "tomorrow" : DAY_NAMES[n.day];
  const at = formatClock(n.at);
  return {
    open: false,
    short: `Closed · opens ${at} ${n.ahead === 0 ? "today" : n.ahead === 1 ? "tmrw" : DAY_NAMES[n.day].slice(0, 3)}`,
    long: `Closed now. Opens ${when} at ${at}`,
  };
}

export function isRoastDay(day: Weekday): boolean {
  return ROAST_DAYS.includes(day);
}

/** Próximo dia de torra (segunda ou quinta) depois de `day`, ou o próprio se for hoje. */
export function nextRoastDay(day: Weekday): Weekday {
  for (let ahead = 0; ahead < 7; ahead++) {
    const d = ((day + ahead) % 7) as Weekday;
    if (isRoastDay(d)) return d;
  }
  return 1;
}

export type DayRow = { key: string; label: string; text: string; on: boolean };

/**
 * O que acontece no café num dia e minuto (só fatos do dono): portas, vitrine de doces,
 * cozinha (ovo e cheddar até 13h), torrador (segunda e quinta), mesas e pátio.
 */
export function describeMoment(day: Weekday, minutes: number): DayRow[] {
  const h = HOURS[day];
  const open = minutes >= h.open && minutes < h.close;
  const before = minutes < h.open;
  const rows: DayRow[] = [];

  rows.push({
    key: "doors",
    label: "Doors",
    on: open,
    text: open
      ? `Open until 3 PM (${duration(h.close - minutes)} left). Order ahead and pick up at the end of the bar.`
      : before
        ? `Closed. Doors open at ${formatClock(h.open)}.`
        : "Closed for the day. We close at 3 PM.",
  });

  let pastry =
    "Theo bakes the pastry case every morning: cardamom buns and blueberry corn muffins.";
  if (day === 6) {
    pastry =
      open && minutes >= BUNS_GONE_SAT
        ? "On Saturdays the cardamom buns usually sell out by 10, so they are probably gone."
        : "Saturday: the cardamom buns usually sell out by 10. Come early for one.";
  }
  rows.push({ key: "pastry", label: "Pastry case", on: open, text: pastry });

  rows.push({
    key: "kitchen",
    label: "Kitchen",
    on: open && minutes < EGG_UNTIL,
    text:
      open && minutes < EGG_UNTIL
        ? `Egg & cheddar on an English muffin, served until 1 PM (${duration(EGG_UNTIL - minutes)} left).`
        : open
          ? "Past 1 PM: the egg & cheddar is done for the day."
          : "Egg & cheddar is served until 1 PM.",
  });

  rows.push({
    key: "roaster",
    label: "Roaster",
    on: isRoastDay(day),
    text: isRoastDay(day)
      ? "Roast day. Hannah roasts the beans on the 12-kilo roaster in the back."
      : `No roast today. Next roast: ${DAY_NAMES[nextRoastDay(day)]}.`,
  });

  rows.push({
    key: "tables",
    label: "Tables & patio",
    on: open,
    text: "Free Wi-Fi and outlets at every table. Dogs are welcome on the patio.",
  });

  return rows;
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
