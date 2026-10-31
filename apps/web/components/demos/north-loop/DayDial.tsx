"use client";

import { useState } from "react";
import { BUNS_GONE_SAT, DAY_NAMES, EGG_UNTIL, HOURS, type Weekday } from "./content";
import { describeMoment, formatClock, isRoastDay, localTime, useNow } from "./time";

// "O dia no café": escolha o dia e arraste a hora (6 AM – 3:30 PM, de 15 em 15 min). A régua
// mostra as faixas que o dono informou (portas abertas, ovo e cheddar até 1 PM, pães de
// cardamomo até ~10 aos sábados) e o painel diz o que acontece naquele momento. Começa no
// "agora" de Minneapolis; antes da hidratação, sábado 9:30 (texto estável no servidor).

const START = 6 * 60;
const END = 15 * 60 + 30;
const SPAN = END - START;
const pct = (m: number) =>
  `${(((Math.min(Math.max(m, START), END) - START) / SPAN) * 100).toFixed(3)}%`;
const ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
const TICKS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export function DayDial() {
  const now = useNow();
  const [pick, setPick] = useState<{ day: Weekday; minutes: number } | null>(null);
  const live = now === null ? null : localTime(now);
  const day: Weekday = pick?.day ?? live?.weekday ?? 6;
  const minutes =
    pick?.minutes ??
    (live ? Math.min(Math.max(Math.round(live.minutes / 15) * 15, START), END) : 9 * 60 + 30);
  const isNow = pick === null && live !== null;
  const hours = HOURS[day];
  const rows = describeMoment(day, minutes);

  const events = [
    { at: hours.open, text: `Doors open${day === 0 || day === 6 ? " (weekends)" : ""}` },
    ...(day === 6 ? [{ at: BUNS_GONE_SAT, text: "Cardamom buns usually gone" }] : []),
    { at: EGG_UNTIL, text: "Last egg & cheddar" },
    { at: hours.close, text: "Doors close" },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5">
        <fieldset>
          <legend className="nl-mono text-[11px] text-[var(--nl-frost)]">Pick a day</legend>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {ORDER.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={d === day}
                aria-label={DAY_NAMES[d]}
                onClick={() => setPick({ day: d, minutes })}
                className={`nl-day nl-focus ${d === day ? "is-on" : ""}`}
              >
                <span aria-hidden="true">{DAY_NAMES[d].slice(0, 2)}</span>
                {isRoastDay(d) ? <span aria-hidden="true" className="nl-day-dot" /> : null}
              </button>
            ))}
          </div>
          <p className="nl-mono mt-2 flex items-center gap-2 text-[10.5px] text-[var(--nl-frost)]">
            <span aria-hidden="true" className="nl-day-dot static" /> Roast day
          </p>
        </fieldset>

        <ol className="mt-8 border-t border-[var(--nl-rule-on-blue)]">
          {events.map((e) => {
            const passed = minutes >= e.at;
            return (
              <li
                key={e.text}
                className="grid grid-cols-[5.5rem_1fr] items-baseline gap-3 border-b border-[var(--nl-rule-on-blue)] py-3"
              >
                <span className="nl-mono text-[13px] tabular-nums text-[var(--nl-crema-light)]">
                  {formatClock(e.at)}
                </span>
                <span className="flex items-center gap-3 text-[18px]">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 shrink-0 rounded-full border border-[var(--nl-paper)] ${passed ? "bg-[var(--nl-paper)]" : ""}`}
                  />
                  {e.text}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="lg:col-span-7">
        {/* Régua do dia */}
        <div className="nl-ruler" aria-hidden="true">
          <span
            className="nl-band nl-band-open"
            style={{ left: pct(hours.open), right: `calc(100% - ${pct(hours.close)})` }}
          >
            <span className="nl-band-label">Open</span>
          </span>
          <span
            className="nl-band nl-band-egg"
            style={{ left: pct(hours.open), right: `calc(100% - ${pct(EGG_UNTIL)})` }}
          >
            <span className="nl-band-label">Egg & cheddar</span>
          </span>
          {day === 6 ? (
            <span
              className="nl-band nl-band-bun"
              style={{ left: pct(hours.open), right: `calc(100% - ${pct(BUNS_GONE_SAT)})` }}
            >
              <span className="nl-band-label">Buns</span>
            </span>
          ) : null}
          {TICKS.map((h) => (
            <span key={h} className="nl-tick" style={{ left: pct(h * 60) }}>
              <span>{h > 12 ? h - 12 : h}</span>
            </span>
          ))}
          <span className="nl-cursor-track" style={{ transform: `translateX(${pct(minutes)})` }}>
            <span className="nl-cursor" />
          </span>
        </div>
        <label htmlFor="nl-time" className="sr-only">
          Time of day
        </label>
        <input
          id="nl-time"
          type="range"
          min={START}
          max={END}
          step={15}
          value={minutes}
          onChange={(e) => setPick({ day, minutes: Number(e.target.value) })}
          aria-valuetext={`${DAY_NAMES[day]}, ${formatClock(minutes)}`}
          className="nl-range nl-focus mt-2 w-full"
        />

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p className="nl-display text-[clamp(2rem,4vw,3.2rem)] leading-none">
            {DAY_NAMES[day]}, <em className="italic">{formatClock(minutes)}</em>
          </p>
          <p className="nl-mono text-[11px] text-[var(--nl-frost)]">
            {isNow ? "Now in Minneapolis" : "Minneapolis time"}
          </p>
        </div>

        <dl className="mt-6 border-t border-[var(--nl-rule-on-blue)]" aria-live="polite">
          {rows.map((r) => (
            <div
              key={r.key}
              className="grid grid-cols-1 gap-1 border-b border-[var(--nl-rule-on-blue)] py-4 sm:grid-cols-[9rem_1fr] sm:gap-4"
            >
              <dt className="nl-mono flex items-center gap-2 text-[11px] text-[var(--nl-frost)]">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${r.on ? "bg-[var(--nl-crema-light)]" : "border border-[var(--nl-frost)]"}`}
                />
                {r.label}
              </dt>
              <dd className="text-[18px] leading-snug">{r.text}</dd>
            </div>
          ))}
        </dl>
        {!isNow && live ? (
          <button
            type="button"
            onClick={() => setPick(null)}
            className="nl-mono nl-focus mt-4 min-h-11 text-[11px] underline underline-offset-4"
          >
            Back to now
          </button>
        ) : null}
      </div>
    </div>
  );
}
