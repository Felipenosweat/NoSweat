"use client";

import { useSyncExternalStore } from "react";
import { WEEK, type ServiceDay } from "./content";
import { Flap } from "./ui";

// Quadro de horários da semana, como numa estação: uma linha por dia, o pit ou o truck, onde e
// a que horas. Depois de carregar, a linha de HOJE (no fuso de Kansas City) ganha a marca de
// brasa e o quadro diz para onde ir a seguir. Sem JS, o quadro inteiro continua lá.

function kansasCityDay(): number {
  const name = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "America/Chicago",
  }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

const noop = () => () => {};

/** Próximo dia com serviço a partir de hoje (inclusive). */
function nextService(today: number): ServiceDay | undefined {
  for (let offset = 0; offset < 7; offset++) {
    const day = WEEK.find((entry) => entry.day === (today + offset) % 7);
    if (day?.where) return day;
  }
  return undefined;
}

export function Timetable() {
  // No servidor (e na primeira pintura) não há "hoje"; no navegador, o dia de Kansas City.
  const today = useSyncExternalStore<number | null>(noop, kansasCityDay, () => null);

  const next = today === null ? undefined : nextService(today);
  const isToday = next !== undefined && next.day === today;

  return (
    <div>
      <p
        role="status"
        className="sr-label min-h-[1.5em] text-[12px] text-[var(--sr-ember)]"
        aria-live="polite"
      >
        {next
          ? isToday
            ? `Today: ${next.where?.toLowerCase()} at ${next.place}, ${next.time}`
            : `Next: ${next.long}, ${next.where?.toLowerCase()} at ${next.place}`
          : null}
      </p>
      <table className="sr-timetable mt-4 w-full">
        <caption className="sr-only">Where the pit and the truck are each day of the week</caption>
        <thead>
          <tr className="sr-label text-[11px] text-[var(--sr-ash)]">
            <th scope="col">Day</th>
            <th scope="col">Where</th>
            <th scope="col" className="hidden sm:table-cell">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {WEEK.map((entry) => (
            <tr
              key={entry.day}
              data-today={entry.day === today || undefined}
              data-off={!entry.where || undefined}
            >
              <th scope="row" className="sr-display text-[clamp(1.6rem,2.6vw,2.2rem)]">
                <Flap text={entry.short.toUpperCase()} className="sr-flap-day text-[17px]" />
                {entry.day === today ? (
                  <span className="sr-label sr-today ml-2 align-middle text-[10px]">Today</span>
                ) : null}
              </th>
              <td>
                {entry.where ? (
                  <>
                    <span className="sr-display block text-[clamp(1.5rem,2.4vw,2rem)] leading-none">
                      {entry.place}
                    </span>
                    <span className="mt-1 block text-[14px] text-[var(--sr-ash)]">
                      {entry.where}
                      {entry.note ? ` · ${entry.note}` : ""}
                      <span className="sm:hidden"> · {entry.time}</span>
                    </span>
                  </>
                ) : (
                  <span className="text-[15px] text-[var(--sr-ash)]">
                    No pit or truck on the schedule
                  </span>
                )}
              </td>
              <td className="hidden text-[15px] tabular-nums sm:table-cell">{entry.time ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
