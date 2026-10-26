"use client";

import type { TeamMember } from "@nosweat/schema";
import Link from "next/link";
import type { CSSProperties } from "react";
import { cx, focusRing } from "@/components/glass";
import { layoutDay, type PlacedJob } from "./layout-jobs";
import { scheduleHref } from "./params";
import {
  GRID_END_HOUR,
  GRID_START_HOUR,
  formatDateKey,
  formatTimeRange,
  hourLabel,
  hourValue,
  longDay,
  weekdayShort,
} from "./time";
import { assigneeNames, jobBlockClass } from "./ui";

// Grade de horários (6h às 21h) da semana ou de um dia. Cada serviço é um bloco na cor do primeiro
// responsável; tocar num horário vazio abre "New job" já com o dia e a hora. No modo "ver como"
// (`onSlot` ausente) os horários vazios não são botões.

/** Altura de uma hora na grade (px). 48px = alvo de toque confortável por hora. */
const HOUR_PX = 48;
const HOURS = Array.from(
  { length: GRID_END_HOUR - GRID_START_HOUR },
  (_, i) => GRID_START_HOUR + i,
);
const GRID_HEIGHT = HOURS.length * HOUR_PX;
const minutesToPx = (minutes: number) => (minutes / 60) * HOUR_PX;

export function TimeGrid({
  days,
  jobs,
  team,
  timeZone,
  today,
  nowMinutes,
  teamFilter,
  onSlot,
}: {
  /** Datas das colunas ("AAAA-MM-DD"). */
  days: string[];
  jobs: PlacedJob[];
  team: ReadonlyMap<string, TeamMember>;
  timeZone: string;
  today: string;
  /** Minutos de "agora" no fuso da empresa (linha vermelha na coluna de hoje). */
  nowMinutes: number;
  teamFilter: string | null;
  onSlot?: (date: string, time: string) => void;
}) {
  const single = days.length === 1;
  const columns: CSSProperties = {
    gridTemplateColumns: `3.25rem repeat(${days.length}, minmax(0, 1fr))`,
  };
  const nowTop = minutesToPx(nowMinutes - GRID_START_HOUR * 60);
  const showNow = nowTop >= 0 && nowTop <= GRID_HEIGHT;

  return (
    // No celular a semana inteira não cabe: rola de lado (a coluna das horas fica fixa).
    <div className={cx("glass rounded-2xl", single ? "overflow-hidden" : "overflow-x-auto")}>
      <div className={cx(!single && "min-w-[46rem]")}>
        {/* Cabeçalho dos dias (na semana, cada dia abre a visão "Dia"). */}
        <div
          className="sticky top-0 z-10 grid border-b border-(--glass-rim) bg-white/60"
          style={columns}
        >
          <span aria-hidden="true" />
          {days.map((day) => {
            const isToday = day === today;
            const label = (
              <>
                <span className="text-[12px] font-semibold tracking-wide text-slate-500 uppercase">
                  {weekdayShort(day)}
                </span>
                <span
                  className={cx(
                    "grid size-8 place-items-center rounded-full font-display text-[17px] font-semibold tabular-nums",
                    isToday ? "bg-brand text-white" : "text-ink",
                  )}
                >
                  {formatDateKey(day, { day: "numeric" })}
                </span>
              </>
            );
            return single ? (
              <p key={day} className="flex min-h-14 items-center justify-center gap-2">
                {label}
                <span className="sr-only">{longDay(day)}</span>
              </p>
            ) : (
              <Link
                key={day}
                href={scheduleHref({ view: "day", date: day, team: teamFilter })}
                aria-label={`${longDay(day)}${isToday ? " (today)" : ""}: open day`}
                className={cx(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl py-1 hover:bg-(--glass-ghost-hover)",
                  focusRing,
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="relative grid" style={columns}>
          {/* Coluna das horas. */}
          <div aria-hidden="true" className="relative" style={{ height: GRID_HEIGHT }}>
            {HOURS.map((hour, i) => (
              <span
                key={hour}
                className={cx(
                  "absolute right-2 text-[11px] font-medium whitespace-nowrap text-slate-500 tabular-nums",
                  i > 0 && "-translate-y-1/2",
                )}
                style={{ top: i === 0 ? 4 : i * HOUR_PX }}
              >
                {hourLabel(hour)}
              </span>
            ))}
          </div>

          {days.map((day) => {
            const blocks = layoutDay(jobs.filter((placed) => placed.dateKey === day));
            const isToday = day === today;
            return (
              <div
                key={day}
                role="group"
                aria-label={longDay(day)}
                className={cx(
                  "relative border-l border-(--glass-rim)",
                  isToday && "bg-brand/[0.035]",
                )}
                style={{ height: GRID_HEIGHT }}
              >
                {/* Horários vazios (botões por baixo dos blocos). */}
                {HOURS.map((hour, i) =>
                  onSlot ? (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => onSlot(day, hourValue(hour))}
                      aria-label={`New job ${formatDateKey(day, { weekday: "long", month: "short", day: "numeric" })} at ${hourLabel(hour)}`}
                      className={cx(
                        "group absolute inset-x-0 border-t border-slate-200/70 hover:bg-brand/[0.06] focus-visible:z-[1] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
                        i === 0 && "border-t-0",
                      )}
                      style={{ top: i * HOUR_PX, height: HOUR_PX }}
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1 left-1.5 text-[12px] font-semibold text-brand opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                      >
                        + {hourLabel(hour)}
                      </span>
                    </button>
                  ) : (
                    <span
                      key={hour}
                      aria-hidden="true"
                      className={cx(
                        "absolute inset-x-0 border-t border-slate-200/70",
                        i === 0 && "border-t-0",
                      )}
                      style={{ top: i * HOUR_PX, height: HOUR_PX }}
                    />
                  ),
                )}

                {blocks.map((block) => {
                  const { job } = block;
                  const height = minutesToPx(block.height);
                  const width = 100 / block.lanes;
                  const time = job.startAt ? formatTimeRange(job.startAt, job.endAt, timeZone) : "";
                  const canceled = job.status === "canceled";
                  return (
                    <Link
                      key={job.id}
                      href={`/schedule/${encodeURIComponent(job.id)}`}
                      className={cx(
                        "absolute z-[2] overflow-hidden rounded-lg border border-l-4 px-1.5 py-1 text-left text-[12px] leading-4 shadow-[0_1px_2px_rgb(7_27_51/0.08)] hover:brightness-[0.97]",
                        jobBlockClass(job, team),
                        canceled && "opacity-55",
                        focusRing,
                      )}
                      style={{
                        top: minutesToPx(block.top) + 1,
                        height: Math.max(height - 2, 22),
                        left: `calc(${block.lane * width}% + 2px)`,
                        width: `calc(${width}% - 4px)`,
                      }}
                    >
                      <span className="block truncate font-semibold tabular-nums">
                        {job.status === "done" && (
                          <span aria-hidden="true" className="mr-0.5">
                            ✓
                          </span>
                        )}
                        <span className={cx(canceled && "line-through")}>{job.title}</span>
                      </span>
                      {height >= 34 && (
                        <span className="block truncate opacity-80 tabular-nums">{time}</span>
                      )}
                      {height >= 50 && (
                        <span className="block truncate opacity-80">{job.clientName}</span>
                      )}
                      {single && height >= 66 && (
                        <span className="block truncate opacity-70">
                          {assigneeNames(job, team)}
                        </span>
                      )}
                      <span className="sr-only">
                        {`, ${time}, ${job.clientName}${job.status === "done" ? ", done" : ""}${canceled ? ", canceled" : ""}`}
                      </span>
                    </Link>
                  );
                })}

                {isToday && showNow && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 z-[3] h-0.5 bg-red-500"
                    style={{ top: nowTop }}
                  >
                    <span className="absolute -top-[5px] -left-[5px] size-3 rounded-full bg-red-500" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
