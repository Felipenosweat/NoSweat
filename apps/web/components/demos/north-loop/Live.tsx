"use client";

import { DAY_NAMES, EGG_UNTIL, HOURS_ROWS, type Weekday } from "./content";
import {
  formatClock,
  isOpen,
  isRoastDay,
  localTime,
  nextRoastDay,
  statusText,
  useNow,
} from "./time";

// Peças "ao vivo": dependem da hora de Minneapolis. No servidor (e antes da hidratação) mostram
// o texto fixo dos horários; depois, o estado de agora. Nada de hora inventada.

/** Pastilha "Open · until 3 PM" do topo. */
export function OpenChip({ className = "" }: { className?: string }) {
  const now = useNow();
  const t = now === null ? null : localTime(now);
  const status = t ? statusText(t) : null;
  return (
    <span className={`nl-mono inline-flex items-center gap-2 text-[11px] ${className}`}>
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${status?.open ? "bg-[var(--nl-open)]" : "border border-current"}`}
      />
      <span aria-live="polite">{status ? status.short : "Mon–Fri 6:30 · Sat–Sun 7:30"}</span>
    </span>
  );
}

/**
 * O bilhete "Today" do herói: o dia em Minneapolis, se está aberto, se é dia de torra, até
 * quando sai o ovo e cheddar e, aos sábados, o aviso dos pães de cardamomo.
 */
export function TodayTicket() {
  const now = useNow();
  const t = now === null ? null : localTime(now);
  const status = t ? statusText(t) : null;
  const rows: [string, string][] = t
    ? [
        ["Doors", status!.long],
        [
          "Roaster",
          isRoastDay(t.weekday)
            ? "Roast day today"
            : `Next roast ${DAY_NAMES[nextRoastDay(t.weekday)]}`,
        ],
        [
          "Kitchen",
          isOpen(t) && t.minutes < EGG_UNTIL
            ? "Egg & cheddar until 1 PM"
            : "Egg & cheddar is served until 1 PM",
        ],
        ...(t.weekday === 6
          ? ([["Pastry", "Cardamom buns usually gone by 10"]] as [string, string][])
          : []),
      ]
    : [
        ["Mon–Fri", "6:30 AM – 3 PM"],
        ["Sat–Sun", "7:30 AM – 3 PM"],
        ["Roaster", "Mondays and Thursdays"],
      ];
  return (
    <div className="nl-ticket">
      <p className="nl-mono flex items-center justify-between gap-4 text-[11px]">
        <span>{t ? `Today · ${DAY_NAMES[t.weekday]}` : "Hours"}</span>
        <span className="tabular-nums">{t ? formatClock(t.minutes) : "Minneapolis"}</span>
      </p>
      <dl className="mt-3 grid gap-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-x-3 text-[14px] leading-snug">
            <dt className="nl-mono pt-[2px] text-[10.5px] text-[var(--nl-ink-2)]">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <a
        href="#day"
        className="nl-mono nl-focus mt-3 inline-flex items-center gap-1.5 text-[11px] underline underline-offset-4"
      >
        See the whole day
      </a>
    </div>
  );
}

/** Tabela de horários com o dia de hoje marcado (em Minneapolis). */
export function HoursTable() {
  const now = useNow();
  const t = now === null ? null : localTime(now);
  const status = t ? statusText(t) : null;
  return (
    <div>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Opening hours</caption>
        <tbody>
          {HOURS_ROWS.map((row) => {
            const today = t ? (row.weekdays as readonly number[]).includes(t.weekday) : false;
            return (
              <tr key={row.days} className="border-t border-[var(--nl-rule-on-blue)]">
                <th scope="row" className="py-3 pr-4 font-normal">
                  <span className="nl-display text-[22px]">{row.days}</span>
                  {today ? (
                    <span className="nl-mono ml-3 align-middle text-[10.5px] text-[var(--nl-crema-light)]">
                      Today
                    </span>
                  ) : null}
                </th>
                <td className="nl-mono py-3 text-right text-[14px] tabular-nums">{row.time}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="nl-mono mt-3 flex items-center gap-2 border-t border-[var(--nl-rule-on-blue)] pt-3 text-[12px]">
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${status?.open ? "bg-[var(--nl-open-light)]" : "border border-current"}`}
        />
        <span>{status ? `${status.long} (Minneapolis time)` : "Minneapolis time"}</span>
      </p>
    </div>
  );
}

export type { Weekday };
