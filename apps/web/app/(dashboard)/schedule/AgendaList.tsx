"use client";

import type { TeamMember } from "@nosweat/schema";
import Link from "next/link";
import { GlassButton, cx } from "@/components/glass";
import { formatCents } from "@/lib/clients";
import { PlusIcon } from "../clients/ui";
import type { PlacedJob } from "./layout-jobs";
import { formatDateKey, formatTime, relativeDayLabel } from "./time";
import { JobStatusBadge, TEAM_COLOR_STYLES, assigneeNames } from "./ui";

// Lista (agenda) da semana: o padrão no celular. Um grupo por dia, do domingo ao sábado; dia sem
// serviço vira uma linha curta com "Add" (fora do modo "ver como").

export function AgendaList({
  days,
  jobs,
  team,
  timeZone,
  today,
  onAdd,
}: {
  days: string[];
  jobs: PlacedJob[];
  team: ReadonlyMap<string, TeamMember>;
  timeZone: string;
  today: string;
  onAdd?: (date: string) => void;
}) {
  return (
    <ol className="grid gap-4">
      {days.map((day) => {
        const dayJobs = jobs.filter((placed) => placed.dateKey === day);
        const isToday = day === today;
        const heading = relativeDayLabel(day, today);
        const full = formatDateKey(day, { weekday: "short", month: "short", day: "numeric" });
        // "Today", "Tomorrow" e "Yesterday" levam a data ao lado.
        const named = heading === "Today" || heading === "Tomorrow" || heading === "Yesterday";
        return (
          <li key={day} aria-labelledby={`agenda-${day}`}>
            <div className="flex items-center justify-between gap-3 px-1">
              <h3
                id={`agenda-${day}`}
                className={cx(
                  "text-[15px] leading-6 font-semibold",
                  isToday ? "text-brand" : "text-ink",
                )}
              >
                {heading}
                {named && <span className="font-normal text-slate-500"> · {full}</span>}
              </h3>
              {onAdd && (
                <GlassButton
                  variant="ghost"
                  size="sm"
                  icon={<PlusIcon />}
                  onClick={() => onAdd(day)}
                  className="min-h-11 sm:min-h-9"
                  aria-label={`Add a job on ${formatDateKey(day, { weekday: "long", month: "long", day: "numeric" })}`}
                >
                  Add
                </GlassButton>
              )}
            </div>

            {dayJobs.length === 0 ? (
              <p className="mt-1 px-1 text-[13px] text-slate-500">Nothing scheduled</p>
            ) : (
              <ul className="glass mt-2 overflow-hidden rounded-2xl">
                {dayJobs.map(({ job }) => {
                  const first = job.assigneeIds.map((id) => team.get(id)).find(Boolean);
                  const canceled = job.status === "canceled";
                  return (
                    <li key={job.id} className="border-t border-(--glass-rim) first:border-t-0">
                      <Link
                        href={`/schedule/${encodeURIComponent(job.id)}`}
                        className="flex min-h-16 items-stretch gap-3 px-4 py-3 hover:bg-(--glass-ghost-hover) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
                      >
                        <span className="w-[4.25rem] shrink-0 pt-0.5 text-[13px] leading-5 text-slate-600 tabular-nums">
                          {job.startAt && (
                            <span className="block font-semibold text-ink">
                              {formatTime(job.startAt, timeZone)}
                            </span>
                          )}
                          {job.endAt && (
                            <span className="block">{formatTime(job.endAt, timeZone)}</span>
                          )}
                        </span>
                        <span
                          aria-hidden="true"
                          className={cx(
                            "w-1 shrink-0 rounded-full",
                            first ? TEAM_COLOR_STYLES[first.color].dot : "bg-slate-300",
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={cx(
                              "block truncate text-[15px] leading-5 font-semibold text-ink",
                              canceled && "line-through opacity-70",
                            )}
                          >
                            {job.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[13px] leading-5 text-slate-600">
                            {job.clientName}
                            {job.valueCents !== null && job.valueCents > 0 && (
                              <span className="tabular-nums"> · {formatCents(job.valueCents)}</span>
                            )}
                          </span>
                          <span className="block truncate text-[13px] leading-5 text-slate-500">
                            {assigneeNames(job, team)}
                          </span>
                        </span>
                        {job.status !== "scheduled" && (
                          <span className="shrink-0 self-center">
                            <JobStatusBadge status={job.status} size="sm" />
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
