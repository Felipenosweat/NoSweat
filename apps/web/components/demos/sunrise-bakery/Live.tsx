"use client";

import type { ReactNode } from "react";
import { DAY_NAMES, HOURS_ROWS } from "./content";
import { padRow, useFlip } from "./flip";
import {
  breadBox,
  earliestCake,
  formatClock,
  formatCountdown,
  formatDate,
  localTime,
  openState,
  statusText,
  useNow,
} from "./time";

// Pedacinhos "ao vivo" calculados na hora de Sacramento: aberto agora, prazo da caixa de
// sábado, data mínima do bolo e o dia de hoje na tabela de horários. No servidor saem neutros
// (sem hora) e ganham o valor depois da hidratação.

/** Ponto + "Open · until 2 PM" / "Closed · opens Wed 7 AM". */
export function OpenChip({ className = "" }: { className?: string }) {
  const now = useNow();
  const status = now === null ? null : statusText(localTime(now));
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className={`sb-dot ${status?.open ? "sb-dot-open" : ""} ${status ? "" : "opacity-40"}`}
      />
      <span className="hidden sm:inline">{status ? status.short : "Wed–Sun from 7 AM"}</span>
      <span className="sm:hidden">{status ? status.tiny : "Wed–Sun 7 AM"}</span>
    </span>
  );
}

const STRIP_COLS = 16;

/** Tirinha de plaquetas do herói: sai "LOAVES OUT 7 AM" e vira para o estado de agora. */
export function HeroFlap() {
  const now = useNow();
  let text = "LOAVES OUT 7 AM";
  if (now !== null) {
    const s = openState(localTime(now));
    if (s.open) text = `OPEN TILL ${formatClock(s.closesAt)}`;
    else if (s.daysAhead === 0) text = `OPENS AT ${formatClock(s.opensAt)}`;
    else if (s.daysAhead === 1) text = `TOMORROW AT ${formatClock(s.opensAt)}`;
    else
      text = `BACK ${DAY_NAMES[s.nextDay].slice(0, 3).toUpperCase()} AT ${formatClock(s.opensAt)}`;
  }
  const goal = padRow(text.toUpperCase(), STRIP_COLS);
  const { display, animated } = useFlip([goal]);
  return (
    <div className="sb-strip" data-anim={animated ? "" : undefined} aria-hidden="true">
      <div className="sb-board-row">
        {Array.from(display[0] ?? "").map((ch, c) => (
          <span key={c} className="sb-tile">
            <span key={ch} className={`sb-flap ${ch === goal[c] ? "sb-flap-settle" : ""}`}>
              {ch}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Cartão "hoje" do herói: dia, estado e o que fazer. */
export function TodayLine() {
  const now = useNow();
  if (now === null)
    return (
      <>
        <span className="sb-label text-[var(--sb-ink-2)]">Today</span>
        <span className="sb-display mt-2 block text-[1.6rem] leading-tight">
          Open Wed–Sun from 7 AM
        </span>
      </>
    );
  const t = localTime(now);
  const status = statusText(t);
  return (
    <>
      <span className="sb-label text-[var(--sb-ink-2)]">
        Today · {DAY_NAMES[t.weekday]} · {formatClock(t.minutes)} in Sacramento
      </span>
      <span className="sb-display mt-2 block text-[1.6rem] leading-tight">{status.long}.</span>
    </>
  );
}

/** Prazo da caixa de sábado, em contagem regressiva. */
export function BoxDeadline({ compact = false }: { compact?: boolean }) {
  const now = useNow();
  if (now === null) return <span>Order by Thursday noon for Saturday pickup.</span>;
  const box = breadBox(localTime(now));
  if (compact)
    return (
      <span>
        For {formatDate(box.pickup)}: orders close in{" "}
        <strong className="font-semibold tabular-nums">{formatCountdown(box.minutesLeft)}</strong>
      </span>
    );
  return (
    <span>
      Boxes for{" "}
      <strong className="font-semibold">
        Saturday, {formatDate(box.pickup).replace(/^\w+, /, "")}
      </strong>{" "}
      close Thursday at noon — in{" "}
      <strong className="font-semibold tabular-nums">{formatCountdown(box.minutesLeft)}</strong>.
    </span>
  );
}

/** "Ordered today, the earliest pickup is Sat, Nov 1." */
export function CakeEarliest() {
  const now = useNow();
  if (now === null) return <span>Order 5 days ahead.</span>;
  return (
    <span>
      Ordered today, the earliest pickup is{" "}
      <strong className="font-semibold">{formatDate(earliestCake(localTime(now)))}</strong>.
    </span>
  );
}

/** Link para a encomenda que já abre o caminho certo (bolo ou caixa). */
export function OrderLink({
  kind,
  className = "",
  children,
}: {
  kind: "box" | "cake";
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href="#order"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent("sunrise:order", { detail: kind }))}
    >
      {children}
    </a>
  );
}

/** Tabela de horários com o dia de hoje marcado. */
export function HoursTable() {
  const now = useNow();
  const weekday = now === null ? null : localTime(now).weekday;
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">Opening hours</caption>
      <tbody>
        {HOURS_ROWS.map((row) => {
          const today = weekday !== null && (row.match as readonly number[]).includes(weekday);
          return (
            <tr key={row.days} className="border-t border-[var(--sb-rule)] last:border-b">
              <th scope="row" className="py-4 pr-4 font-medium">
                {row.days}
                {today ? (
                  <span className="sb-label ml-3 rounded-full bg-[var(--sb-apricot)] px-2 py-1 text-[var(--sb-ink)]">
                    Today
                  </span>
                ) : null}
              </th>
              <td className="sb-display py-4 text-right text-[1.35rem] tabular-nums">{row.time}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
