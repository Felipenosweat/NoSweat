"use client";

import type { Job, TeamMember } from "@nosweat/schema";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/DashboardUi";
import {
  GlassButton,
  GlassIconButton,
  GlassSegmentedLinks,
  cx,
  focusRing,
  type GlassSegmentLink,
} from "@/components/glass";
import { formatCents } from "@/lib/clients";
import { ListIcon, PlusIcon } from "../clients/ui";
import { AgendaList } from "./AgendaList";
import type { NewJobDefaults } from "./JobForm";
import { placeJobs } from "./layout-jobs";
import {
  UNASSIGNED,
  scheduleHref,
  stepDate,
  type ScheduleParams,
  type ScheduleView,
} from "./params";
import { TimeGrid } from "./TimeGrid";
import { dateKeyOf, longDay, weekDays, weekRangeLabel } from "./time";
import { ChevronLeftIcon, ChevronRightIcon, DayIcon, TeamDot, WeekIcon, assigneeNames } from "./ui";

// O formulário "New job" (o maior pedaço da tela) baixa depois da primeira pintura, num pedaço
// próprio: fora do JS que o navegador precisa ler antes de a agenda responder.
const NewJobSheet = dynamic(() => import("./JobForm").then((m) => m.NewJobSheet), {
  ssr: false,
});

// Agenda (/schedule): barra (hoje, anterior/próximo, visão, filtro de equipe), bandeja dos
// serviços sem data e a semana/dia/lista. Os dados vêm da página (server component); aqui só a
// folha "New job" e a navegação pela URL. Depois de salvar, `router.refresh()` relê tudo.

export function ScheduleBoard({
  view,
  date,
  rangeStart,
  today,
  nowMinutes,
  timeZone,
  team,
  teamFilter,
  jobs,
  unscheduled,
  readOnly,
  openNew,
}: {
  /** `null` = automático (semana no computador, lista no celular). */
  view: ScheduleView | null;
  /** Dia de referência ("AAAA-MM-DD"). */
  date: string;
  /** Primeiro dia mostrado (domingo da semana, ou o próprio dia na visão "Dia"). */
  rangeStart: string;
  today: string;
  nowMinutes: number;
  timeZone: string;
  /** Todos os membros (os inativos só para dar cor e nome a serviços antigos). */
  team: TeamMember[];
  teamFilter: string | null;
  /** Serviços com data no período mostrado. */
  jobs: Job[];
  unscheduled: Job[];
  readOnly: boolean;
  openNew: boolean;
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState<NewJobDefaults | null>(
    openNew && !readOnly ? { date: null, time: null } : null,
  );
  // Guarda os padrões da última abertura enquanto a folha fecha (sem pular para vazio).
  const [lastDefaults, setLastDefaults] = useState<NewJobDefaults>({ date: null, time: null });

  const teamMap = useMemo(() => new Map(team.map((member) => [member.id, member])), [team]);
  const activeTeam = useMemo(() => team.filter((member) => member.active), [team]);

  const params: Omit<ScheduleParams, "openNew"> = { view, date, team: teamFilter };
  // Estáveis entre renders (a grade é `memo`): abrir a folha não redesenha a semana.
  const days = useMemo(
    () => (view === "day" ? [date] : weekDays(rangeStart)),
    [view, date, rangeStart],
  );

  const filtered = useMemo(() => {
    const byTeam = (job: Job) =>
      teamFilter === null
        ? true
        : teamFilter === UNASSIGNED
          ? job.assigneeIds.length === 0
          : job.assigneeIds.includes(teamFilter);
    return {
      placed: placeJobs(jobs.filter(byTeam), timeZone),
      unscheduled: unscheduled.filter(byTeam),
    };
  }, [jobs, unscheduled, teamFilter, timeZone]);

  function openSheet(defaults: NewJobDefaults) {
    if (readOnly) return;
    setLastDefaults(defaults);
    setSheet(defaults);
  }

  function closeSheet() {
    setSheet(null);
    // Chegou pelo atalho "New job" da página inicial: tira o ?new=1 da URL.
    if (openNew) router.replace(scheduleHref(params), { scroll: false });
  }

  function onCreated(job: Job) {
    setSheet(null);
    // Serviço fora do período mostrado: vai até o dia dele.
    const day = job.startAt ? dateKeyOf(new Date(job.startAt), timeZone) : null;
    if (day && !days.includes(day)) {
      router.push(scheduleHref({ ...params, date: day }));
    } else if (openNew) {
      router.replace(scheduleHref(params), { scroll: false });
      router.refresh();
    } else {
      router.refresh();
    }
  }

  const onSlot = useMemo(
    () =>
      readOnly
        ? undefined
        : (day: string, time: string) => {
            const defaults = { date: day, time };
            setLastDefaults(defaults);
            setSheet(defaults);
          },
    [readOnly],
  );
  const onAdd = readOnly ? undefined : (day: string) => openSheet({ date: day, time: null });

  const title = view === "day" ? longDay(date) : weekRangeLabel(rangeStart);
  const showingToday = days.includes(today);
  // "New job" começa no dia que está na tela: o dia aberto, hoje (se a semana mostrada tem hoje)
  // ou o dia de referência da semana vista.
  const newJobDate =
    view === "day" ? date : showingToday ? today : days.includes(date) ? date : (days[0] ?? null);

  const viewLinks = (current: ScheduleView): GlassSegmentLink[] => [
    {
      href: scheduleHref({ ...params, view: "week" }),
      label: "Week",
      icon: <WeekIcon />,
      current: current === "week",
    },
    {
      href: scheduleHref({ ...params, view: "day", date: view === "day" ? date : today }),
      label: "Day",
      icon: <DayIcon />,
      current: current === "day",
    },
    {
      href: scheduleHref({ ...params, view: "list" }),
      label: "List",
      icon: <ListIcon />,
      current: current === "list",
    },
  ];

  const grid = (
    <TimeGrid
      days={days}
      jobs={filtered.placed}
      team={teamMap}
      timeZone={timeZone}
      today={today}
      nowMinutes={nowMinutes}
      teamFilter={teamFilter}
      onSlot={onSlot}
    />
  );
  const list = (
    <AgendaList
      days={days}
      jobs={filtered.placed}
      team={teamMap}
      timeZone={timeZone}
      today={today}
      onAdd={onAdd}
    />
  );

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Every job on one calendar. Tap an open time to book it."
        actions={
          readOnly ? undefined : (
            <GlassButton
              variant="primary"
              icon={<PlusIcon />}
              onClick={() => openSheet({ date: newJobDate, time: null })}
            >
              New job
            </GlassButton>
          )
        }
      />

      {/* ---------- barra: período, visão e equipe ----------
          scroll-mt: no celular a barra de cima é fixa (h-14); ao voltar a rolagem para a barra
          (foco, troca de filtro) ela não fica escondida embaixo. */}
      <div className="mt-6 grid scroll-mt-20 gap-3 lg:scroll-mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <GlassIconButton
              href={scheduleHref({ ...params, date: stepDate(view, date, -1) })}
              label={view === "day" ? "Previous day" : "Previous week"}
              variant="secondary"
              scroll={false}
            >
              <ChevronLeftIcon />
            </GlassIconButton>
            <GlassButton
              href={scheduleHref({ ...params, date: null })}
              variant="secondary"
              scroll={false}
              aria-current={showingToday ? "date" : undefined}
            >
              Today
            </GlassButton>
            <GlassIconButton
              href={scheduleHref({ ...params, date: stepDate(view, date, 1) })}
              label={view === "day" ? "Next day" : "Next week"}
              variant="secondary"
              scroll={false}
            >
              <ChevronRightIcon />
            </GlassIconButton>
          </div>
          <h2
            aria-live="polite"
            className="min-w-0 flex-1 basis-40 px-1 font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] text-ink tabular-nums sm:text-lg"
          >
            {title}
          </h2>
          {view === null ? (
            <>
              {/* Automático: lista no celular, semana no computador (sem piscar: só CSS). */}
              <GlassSegmentedLinks
                aria-label="Show as"
                items={viewLinks("list")}
                className="w-full sm:w-auto lg:hidden"
                fullWidth
              />
              <div className="hidden lg:block">
                <GlassSegmentedLinks aria-label="Show as" items={viewLinks("week")} />
              </div>
            </>
          ) : (
            <GlassSegmentedLinks
              aria-label="Show as"
              items={viewLinks(view)}
              className="w-full sm:w-auto"
              fullWidth
            />
          )}
        </div>

        {activeTeam.length > 0 && <TeamChips team={activeTeam} params={params} hasUnassigned />}
      </div>

      {/* ---------- serviços sem data ---------- */}
      {filtered.unscheduled.length > 0 && (
        <UnscheduledTray jobs={filtered.unscheduled} team={teamMap} />
      )}

      {/* ---------- calendário ---------- */}
      <section aria-label={title} className="mt-4">
        {view === "week" || view === "day" ? (
          grid
        ) : view === "list" ? (
          list
        ) : (
          <>
            <div className="lg:hidden">{list}</div>
            <div className="hidden lg:block">{grid}</div>
          </>
        )}
        {jobs.length === 0 && (
          <p className="mt-3 px-1 text-[13px] text-slate-500">
            {readOnly
              ? "No jobs in this period."
              : "No jobs in this period yet. Tap an open time or “New job” to book one."}
          </p>
        )}
      </section>

      {!readOnly && (
        <NewJobSheet
          open={sheet !== null}
          onClose={closeSheet}
          onCreated={onCreated}
          defaults={sheet ?? lastDefaults}
          team={activeTeam}
          timeZone={timeZone}
          today={today}
        />
      )}
    </div>
  );
}

/** Filtro por pessoa (cápsulas de link; rola de lado no celular). */
function TeamChips({
  team,
  params,
  hasUnassigned,
}: {
  team: TeamMember[];
  params: Omit<ScheduleParams, "openNew">;
  hasUnassigned: boolean;
}) {
  const chip = (current: boolean) =>
    cx(
      "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap sm:min-h-9",
      current ? "bg-ink text-white" : "glass glass-flat glass-interactive text-(--glass-fg)",
      focusRing,
    );
  const items: {
    key: string;
    label: string;
    team: string | null;
    dot?: TeamMember["color"] | null;
  }[] = [
    { key: "all", label: "Everyone", team: null },
    ...team.map((member) => ({
      key: member.id,
      label: member.name,
      team: member.id,
      dot: member.color,
    })),
    ...(hasUnassigned
      ? [{ key: UNASSIGNED, label: "Unassigned", team: UNASSIGNED, dot: null }]
      : []),
  ];
  return (
    <nav
      aria-label="Filter by team member"
      className="-mx-4 scroll-mt-20 overflow-x-auto px-4 lg:scroll-mt-6 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex min-w-max gap-1.5 py-0.5">
        {items.map((item) => {
          const current = params.team === item.team;
          return (
            <li key={item.key}>
              <Link
                href={scheduleHref({ ...params, team: item.team })}
                aria-current={current ? "true" : undefined}
                scroll={false}
                className={chip(current)}
              >
                {item.dot !== undefined && <TeamDot color={item.dot} />}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Bandeja "Unscheduled": fechada por padrão para não empurrar o calendário. */
function UnscheduledTray({ jobs, team }: { jobs: Job[]; team: ReadonlyMap<string, TeamMember> }) {
  return (
    <details className="group mt-4">
      <summary
        className={cx(
          "glass glass-interactive inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-(--glass-fg) sm:min-h-10 [&::-webkit-details-marker]:hidden",
          focusRing,
        )}
      >
        <span className="grid size-6 place-items-center rounded-full bg-amber-500/15 text-[13px] text-amber-800 tabular-nums">
          {jobs.length}
        </span>
        Unscheduled
        <ChevronRightIcon className="size-4 text-(--glass-fg-muted) transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-3">
        <p className="px-1 text-[13px] text-slate-500">
          Jobs without a date wait here. Open one to pick a time.
        </p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/schedule/${encodeURIComponent(job.id)}`}
                className={cx(
                  "glass glass-interactive flex h-full min-h-16 flex-col justify-center rounded-2xl px-4 py-3 hover:glass-raised",
                  focusRing,
                )}
              >
                <span className="truncate text-[15px] leading-5 font-semibold text-ink">
                  {job.title}
                </span>
                <span className="mt-0.5 truncate text-[13px] leading-5 text-slate-600">
                  {job.clientName}
                  {job.valueCents !== null && job.valueCents > 0 && (
                    <span className="tabular-nums"> · {formatCents(job.valueCents)}</span>
                  )}
                </span>
                <span className="truncate text-[13px] leading-5 text-slate-500">
                  {assigneeNames(job, team)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
