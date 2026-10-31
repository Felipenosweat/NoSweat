"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BOARD, BOARD_COLS, BOARD_NOTE, BOARD_ROWS, DAY_NAMES, type Weekday } from "./content";
import { useFlip } from "./flip";
import { BoxDeadline } from "./Live";
import { localTime, useNow } from "./time";

// O quadro da semana: um painel de letras que viram (split-flap), como o quadro de giz de uma
// padaria que troca a cada dia. Sai do servidor com o quadro de boas-vindas (horários) e, quando
// entra na tela, vira para o dia de hoje em Sacramento. Os botões de dia viram o quadro de novo.
// Movimento "playful" (motor em flip.ts): cada letra passa por 2–4 letras de mentira e assenta
// com uma mola leve. Com "reduzir movimento" a troca é instantânea.
// Leitores de tela não leem as letras soltas: há um texto escondido com o dia inteiro.

const INTRO = [
  "SUNRISE BAKERY",
  "2415 J ST",
  "",
  "FIRST LOAVES 7 AM",
  "WED-FRI 7 AM - 2 PM",
  "SAT-SUN 7 AM - 1 PM",
  "CLOSED MON-TUE",
];

const ORDER: Weekday[] = [3, 4, 5, 6, 0, 1, 2];

function pad(lines: readonly string[]): string[] {
  const rows = lines
    .slice(0, BOARD_ROWS)
    .map((line) => line.padEnd(BOARD_COLS).slice(0, BOARD_COLS));
  while (rows.length < BOARD_ROWS) rows.push(" ".repeat(BOARD_COLS));
  return rows;
}

function readable(lines: readonly string[]): string {
  return lines
    .filter((line) => line.trim())
    .map((line) => line.replace(/\s+/g, " ").toLowerCase())
    .join(", ");
}

export function BakeBoard() {
  const now = useNow();
  const today = now === null ? null : localTime(now).weekday;
  const [picked, setPicked] = useState<Weekday | null>(null);
  const [seen, setSeen] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Vira para hoje só quando o quadro aparece na tela (a pessoa vê a virada).
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -25% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const day: Weekday | null = picked ?? (seen && today !== null ? today : null);
  const target = useMemo(() => pad(day === null ? INTRO : BOARD[day]), [day]);
  const { display, animated } = useFlip(target);

  const label = day === null ? "This week" : DAY_NAMES[day];
  const note = day === null ? null : BOARD_NOTE[day];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-8">
        <div
          ref={boardRef}
          className="sb-board"
          data-anim={animated ? "" : undefined}
          aria-hidden="true"
        >
          <div className="sb-board-head">
            <span>{label === "This week" ? "On the board" : `On the board · ${label}`}</span>
            <span className="sb-board-bulb" />
          </div>
          <div className="sb-board-grid">
            {display.map((row, r) => (
              <div key={r} className="sb-board-row">
                {Array.from(row).map((ch, c) => (
                  <span key={c} className="sb-tile">
                    <span
                      key={ch}
                      className={`sb-flap ${ch === target[r]?.[c] ? "sb-flap-settle" : ""}`}
                    >
                      {ch}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          {day === null
            ? `Sunrise Bakery hours: ${readable(INTRO)}.`
            : `${DAY_NAMES[day]}: ${readable(BOARD[day])}.`}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:col-span-4">
        <fieldset>
          <legend className="sb-label text-[var(--sb-ink-2)]">Pick a day</legend>
          <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
            {ORDER.map((d) => {
              const active = day === d;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${DAY_NAMES[d]}${today === d ? " (today)" : ""}`}
                  onClick={() => setPicked(d)}
                  className="sb-day sb-focus"
                >
                  <span>{DAY_NAMES[d].slice(0, 3)}</span>
                  <span
                    aria-hidden="true"
                    className={`sb-day-dot ${today === d ? "opacity-100" : "opacity-0"}`}
                  />
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[14px] text-[var(--sb-ink-2)]">
            The dot marks today in Sacramento.
          </p>
        </fieldset>

        <div className="sb-ticket">
          <p className="sb-label text-[var(--sb-crust)]">Saturday bread box · $28</p>
          <p className="mt-3 text-[17px] leading-snug">
            Two loaves and four pastries. <BoxDeadline />
          </p>
          <a href="#order" className="sb-btn sb-btn-ink sb-focus mt-5">
            Preorder a box
          </a>
        </div>

        <p className="min-h-[3em] text-[16px] leading-relaxed text-[var(--sb-ink-2)]">
          {note ??
            "Seeded rye is on Friday to Sunday, kouign-amann on weekends. Weekend bread usually sells out by noon."}
        </p>
      </div>
    </div>
  );
}
