"use client";

import {
  SocialPostsResponse,
  SocialSettingsResponse,
  SocialStateResponse,
  type SocialPost,
  type UpdateSocialSettingsRequest,
} from "@nosweat/schema";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  cardClass,
  focusRing,
  panelClass,
  panelText,
  panelTitle,
  secondaryButton,
} from "@/components/DashboardUi";
import {
  CloseIcon,
  EmptyState,
  GlassBadge,
  GlassButton,
  GlassIconButton,
  GlassSegmented,
  GlassSheet,
  GlassToolbar,
  cx,
  type GlassSegmentOption,
} from "@/components/glass";
import { ConnectCard } from "./ConnectCard";
import { PlanMonthButton } from "./PlanMonthButton";
import { PostComposer } from "./PostComposer";
import {
  CHIP_TONE,
  ErrorNote,
  StatusChip,
  byDate,
  canApprove,
  currentMonth,
  formatTime,
  monthLabel,
  monthRange,
  shiftMonth,
  socialApi,
  statusDot,
  statusInfo,
  toApiError,
  zonedDateKey,
  type SocialApiError,
  type StatusTone,
} from "./shared";

// Tela principal do /social: conta do Instagram, "preencher o mês com IA" e o calendário do mês,
// tudo no fuso da empresa. Calendário: barra de vidro grudada (mês, "Today", revisar, novo post)
// + filtro segmentado; no computador, grade do mês com "pílulas" de post; no celular, um mini
// calendário com bolinhas + a lista do mês. Tocar num dia abre a folha do dia (GlassSheet), com os
// posts dele e "New post". Tocar numa pílula abre a gaveta de edição (PostComposer).

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Pílulas por dia na grade; o resto vira "+N more" (abre a folha do dia). */
const MAX_CHIPS = 3;

const US_TIME_ZONES: { value: string; label: string }[] = [
  { value: "America/New_York", label: "Eastern" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
];

type ComposerState = { post: SocialPost | null; date: string | null };

/** Filtro do calendário (por grupo de status). */
type Filter = "all" | "todo" | "scheduled" | "issues";

const FILTER_TONES: Record<Exclude<Filter, "all">, StatusTone[]> = {
  todo: ["attention", "neutral"],
  scheduled: ["queued", "done"],
  issues: ["problem"],
};

function matches(post: SocialPost, filter: Filter): boolean {
  if (filter === "all") return true;
  return FILTER_TONES[filter].includes(statusInfo(post).tone);
}

/** Dias do mês com espaços antes do dia 1 (a semana começa no domingo). */
function monthCells(month: string): (string | null)[] {
  const [y = 2000, m = 1] = month.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const cells: (string | null)[] = Array.from({ length: first }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function dayHeading(dateKey: string): string {
  const [y = 2000, m = 1, d = 1] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

function shortCaption(post: SocialPost): string {
  const text = post.caption.trim().replace(/\s+/g, " ");
  return text || "No caption yet";
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6"} />
    </svg>
  );
}

function PlusIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function SocialCalendar({ initialMonth }: { initialMonth: string | null }) {
  const [state, setState] = useState<SocialStateResponse | null>(null);
  const [stateError, setStateError] = useState<SocialApiError | null>(null);
  const [month, setMonth] = useState<string | null>(initialMonth);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<SocialApiError | null>(null);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  // Folha do dia: o dia fica guardado enquanto ela fecha (o conteúdo não some na animação).
  const [sheet, setSheet] = useState<{ day: string; open: boolean }>({ day: "", open: false });

  const loadState = useCallback(async () => {
    try {
      const next = await socialApi("/api/social/state", SocialStateResponse);
      setState(next);
      setStateError(null);
      setMonth((m) => m ?? currentMonth(next.settings.timezone));
    } catch (err) {
      setStateError(toApiError(err));
    }
  }, []);

  // Primeira carga: o setState só roda na volta da promessa (regra react-hooks/set-state-in-effect).
  useEffect(() => {
    let alive = true;
    socialApi("/api/social/state", SocialStateResponse)
      .then((next) => {
        if (!alive) return;
        setState(next);
        setStateError(null);
        setMonth((m) => m ?? currentMonth(next.settings.timezone));
      })
      .catch((err: unknown) => {
        if (alive) setStateError(toApiError(err));
      });
    return () => {
      alive = false;
    };
  }, []);

  const tz = state?.settings.timezone ?? null;
  const postsKey = month && tz ? `${month}|${tz}` : null;

  useEffect(() => {
    if (!month || !tz || !postsKey) return;
    let alive = true;
    const { from, to } = monthRange(month, tz);
    const url = `/api/social/posts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    socialApi(url, SocialPostsResponse)
      .then((result) => {
        if (!alive) return;
        setPosts(result.posts);
        setPostsError(null);
        setLoadedKey(postsKey);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setPostsError(toApiError(err));
        setLoadedKey(postsKey);
      });
    return () => {
      alive = false;
    };
  }, [month, tz, postsKey]);

  const upsertPost = useCallback((post: SocialPost) => {
    setPosts((list) => [...list.filter((p) => p.id !== post.id), post]);
  }, []);

  if (stateError && !state) {
    return (
      <div className="mt-8">
        <ErrorNote error={stateError} />
        <GlassButton variant="secondary" onClick={() => void loadState()} className="mt-3">
          Try again
        </GlassButton>
      </div>
    );
  }

  if (!state || !month || !tz) {
    return (
      <div className="mt-6 grid gap-4" aria-busy="true" aria-label="Loading your calendar">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass h-44 rounded-2xl motion-safe:animate-pulse" />
          <div className="glass h-44 rounded-2xl motion-safe:animate-pulse" />
        </div>
        <div className="glass h-14 rounded-[26px] motion-safe:animate-pulse" />
        <div className="glass h-96 rounded-2xl motion-safe:animate-pulse" />
      </div>
    );
  }

  const loading = loadedKey !== postsKey;
  // Um relógio só por render: "hoje" na grade e "já passou?" para aprovar.
  const nowDate = new Date();
  const nowMs = nowDate.getTime();
  const thisMonth = currentMonth(tz, nowDate);
  const todayKey = zonedDateKey(nowDate, tz);
  const sorted = [...posts].sort(byDate);
  const dated = sorted.filter(
    (post) => post.scheduledAt && zonedDateKey(new Date(post.scheduledAt), tz).startsWith(month),
  );
  const undated = sorted.filter((post) => !post.scheduledAt && post.status === "draft");
  const shown = dated.filter((post) => matches(post, filter));
  const byDay = new Map<string, SocialPost[]>();
  for (const post of shown) {
    if (!post.scheduledAt) continue;
    const key = zonedDateKey(new Date(post.scheduledAt), tz);
    byDay.set(key, [...(byDay.get(key) ?? []), post]);
  }
  // A folha do dia mostra todos os posts do dia (sem filtro).
  const sheetPosts = sheet.day
    ? dated.filter(
        (post) => post.scheduledAt && zonedDateKey(new Date(post.scheduledAt), tz) === sheet.day,
      )
    : [];
  const sheetPast = sheet.day !== "" && sheet.day < todayKey;
  const reviewable = dated.filter((post) => post.status === "draft" && canApprove(post, nowMs));
  const { used, cap } = state.usage;
  const counts: Record<Filter, number> = {
    all: dated.length,
    todo: dated.filter((post) => matches(post, "todo")).length,
    scheduled: dated.filter((post) => matches(post, "scheduled")).length,
    issues: dated.filter((post) => matches(post, "issues")).length,
  };
  const filterOptions: GlassSegmentOption<Filter>[] = (
    [
      ["all", "All"],
      ["todo", "To do"],
      ["scheduled", "Scheduled"],
      ["issues", "Issues"],
    ] as const
  ).map(([value, label]) => ({
    value,
    label: (
      <>
        {label}
        {counts[value] > 0 && (
          <span className="ml-1 font-medium text-(--glass-fg-muted) tabular-nums">
            {counts[value]}
          </span>
        )}
      </>
    ),
    ariaLabel: `${label}, ${counts[value]} ${plural(counts[value], "post", "posts")}`,
  }));

  const openPost = (post: SocialPost) => {
    setSheet((s) => ({ ...s, open: false }));
    setComposer({ post, date: null });
  };
  const openNew = (date: string | null) => {
    setSheet((s) => ({ ...s, open: false }));
    setComposer({ post: null, date });
  };
  const openDay = (day: string) => setSheet({ day, open: true });

  const emptyText =
    filter === "all"
      ? `Nothing planned for ${monthLabel(month)} yet.`
      : filter === "todo"
        ? "Nothing waiting for you this month."
        : filter === "scheduled"
          ? "No scheduled or posted posts this month."
          : "No problems this month.";

  return (
    <div>
      <div aria-live="polite" className="sr-only">
        {message}
      </div>
      {message && (
        <p className="glass-edge mt-6 flex items-start justify-between gap-3 rounded-2xl bg-emerald-50/85 py-2 pr-2 pl-4 text-[15px] text-emerald-950">
          <span className="py-1.5">{message}</span>
          <GlassIconButton
            label="Dismiss message"
            variant="ghost"
            size="sm"
            onClick={() => setMessage("")}
            className="max-sm:size-11"
          >
            <CloseIcon />
          </GlassIconButton>
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ConnectCard state={state} onChange={setState} />

        <section aria-labelledby="month-plan-heading" className={panelClass}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="month-plan-heading" className={panelTitle}>
              Your posting plan
            </h2>
            {cap === 0 ? (
              // Sem plano (cobrança ligada): "0 of 0" não diz nada; mostra onde liberar.
              <p className="text-[13px] font-medium text-slate-500">
                Posting is included in every plan ·{" "}
                <Link
                  href="/billing?from=social"
                  className={`rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`}
                >
                  See plans
                </Link>
              </p>
            ) : (
              <p className="text-[13px] font-medium text-slate-500 tabular-nums">
                {cap === null
                  ? `${used} approved this month`
                  : `${used} of ${cap} posts used this month`}
              </p>
            )}
          </div>
          {cap !== null && cap > 0 && (
            <div
              role="progressbar"
              aria-label="Posts used this month"
              aria-valuemin={0}
              aria-valuemax={cap}
              aria-valuenow={Math.min(used, cap)}
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-900/[0.08]"
            >
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.min(100, Math.round((used / cap) * 100))}%` }}
              />
            </div>
          )}
          <p className={`mt-3 ${panelText}`}>
            Let AI draft a month of posts from your website. You read, edit and approve each one.
          </p>
          <div className="mt-4">
            <PlanMonthButton
              thisMonth={thisMonth}
              shownMonth={month}
              remaining={state.aiRemaining.plans}
              onPlanned={(created, plannedMonth) => {
                setState((s) =>
                  s && s.aiRemaining.plans !== null
                    ? {
                        ...s,
                        aiRemaining: {
                          ...s.aiRemaining,
                          plans: Math.max(0, s.aiRemaining.plans - 1),
                        },
                      }
                    : s,
                );
                if (plannedMonth === month) {
                  setPosts((list) => [
                    ...list.filter((p) => !created.some((c) => c.id === p.id)),
                    ...created,
                  ]);
                } else {
                  setMonth(plannedMonth);
                }
                setFilter("all");
                setMessage(
                  `${created.length} draft${created.length === 1 ? "" : "s"} added to ${monthLabel(plannedMonth)}. Read each one, add photos where needed, then approve.`,
                );
              }}
            />
            {cap === 0 && (
              <p className="mt-2 text-[13px] text-slate-500">
                You can try drafting now; approving needs a plan.
              </p>
            )}
          </div>
          <SettingsForm
            settings={state.settings}
            onSaved={(settings) => {
              setState((s) => (s ? { ...s, settings } : s));
              setMessage("Posting settings saved.");
            }}
          />
        </section>
      </div>

      <section aria-labelledby="calendar-heading" className="mt-10">
        {/* Barra de vidro grudada: no celular, logo abaixo da barra de cima (3.5rem). */}
        <GlassToolbar
          sticky={false}
          className="sticky top-[4.25rem] z-20 lg:top-3"
          actions={
            <>
              {reviewable.length > 0 && (
                <GlassButton
                  href={`/social/review?month=${month}`}
                  variant="secondary"
                  trailingIcon={
                    <span className="rounded-full bg-amber-500 px-1.5 text-[12px] leading-5 font-bold text-white tabular-nums">
                      {reviewable.length}
                    </span>
                  }
                >
                  Review
                  <span className="sr-only">
                    {" "}
                    {reviewable.length} {plural(reviewable.length, "draft", "drafts")}
                  </span>
                </GlassButton>
              )}
              <GlassButton
                variant="secondary"
                icon={<PlusIcon />}
                onClick={() => openNew(null)}
                className="max-sm:px-3.5"
              >
                <span className="max-sm:sr-only">New post</span>
                <span className="sm:hidden" aria-hidden="true">
                  New
                </span>
              </GlassButton>
            </>
          }
        >
          <GlassIconButton
            label="Previous month"
            variant="ghost"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <ChevronIcon direction="left" />
          </GlassIconButton>
          <h2
            id="calendar-heading"
            className="min-w-0 text-center font-display text-[17px] font-semibold tracking-[-0.012em] whitespace-nowrap text-(--glass-fg) tabular-nums sm:min-w-[9.5rem] sm:text-lg"
          >
            {monthLabel(month)}
          </h2>
          <GlassIconButton
            label="Next month"
            variant="ghost"
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronIcon direction="right" />
          </GlassIconButton>
          {month !== thisMonth && (
            <GlassButton variant="ghost" size="sm" onClick={() => setMonth(thisMonth)}>
              Today
            </GlassButton>
          )}
        </GlassToolbar>

        <div className="mt-4 overflow-x-auto pb-1">
          <GlassSegmented
            aria-label="Show posts"
            options={filterOptions}
            value={filter}
            onChange={setFilter}
            size="sm"
            className="min-w-full sm:min-w-0"
          />
        </div>

        {postsError && <ErrorNote error={postsError} className="mt-4" />}

        <div
          aria-busy={loading}
          className={loading ? "opacity-60 motion-safe:transition-opacity" : undefined}
        >
          {/* ---------- grade do mês (md+) ---------- */}
          <div className={`mt-4 hidden overflow-hidden md:block ${cardClass}`}>
            <div className="grid grid-cols-7 border-b border-(--glass-rim)" aria-hidden="true">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="px-3 py-2.5 text-[12px] font-semibold tracking-wide text-slate-500 uppercase"
                >
                  {day}
                </div>
              ))}
            </div>
            <ol className="grid grid-cols-7">
              {monthCells(month).map((dateKey, index) => {
                if (!dateKey) {
                  return (
                    <li
                      key={`blank-${index}`}
                      aria-hidden="true"
                      className="min-h-32 border-r border-b border-(--glass-rim) bg-slate-900/[0.02] [&:nth-child(7n)]:border-r-0"
                    />
                  );
                }
                const dayPosts = byDay.get(dateKey) ?? [];
                const past = dateKey < todayKey;
                const isToday = dateKey === todayKey;
                const day = Number(dateKey.slice(8));
                const extra = dayPosts.length - MAX_CHIPS;
                return (
                  <li
                    key={dateKey}
                    className={cx(
                      "group flex min-h-32 flex-col gap-1 border-r border-b border-(--glass-rim) p-1.5 [&:nth-child(7n)]:border-r-0",
                      past && "bg-slate-900/[0.02]",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => openDay(dateKey)}
                        aria-label={`${dayHeading(dateKey)}${isToday ? ", today" : ""}: ${dayPosts.length} ${plural(dayPosts.length, "post", "posts")}. Open day`}
                        className={cx(
                          "inline-flex size-8 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums transition-colors duration-150",
                          isToday
                            ? "bg-brand text-white hover:bg-brand-dark"
                            : past
                              ? "text-slate-500 hover:bg-(--glass-ghost-hover)"
                              : "text-ink hover:bg-(--glass-ghost-hover)",
                          focusRing,
                        )}
                      >
                        {day}
                      </button>
                      {!past && (
                        <button
                          type="button"
                          onClick={() => openNew(dateKey)}
                          aria-label={`New post on ${dayHeading(dateKey)}`}
                          className={`inline-flex size-8 items-center justify-center rounded-full text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-(--glass-ghost-hover) hover:text-ink focus-visible:opacity-100 ${focusRing}`}
                        >
                          <PlusIcon />
                        </button>
                      )}
                    </div>
                    <ul className="flex flex-col gap-1">
                      {dayPosts.slice(0, MAX_CHIPS).map((post) => {
                        const info = statusInfo(post);
                        return (
                          <li key={post.id}>
                            <button
                              type="button"
                              onClick={() => openPost(post)}
                              className={cx(
                                "glass-edge flex w-full items-start gap-1.5 rounded-lg px-1.5 py-1 text-left transition-[filter] duration-150 hover:brightness-[0.97]",
                                CHIP_TONE[info.tone],
                                focusRing,
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${statusDot(post)}`}
                              />
                              <span className="min-w-0">
                                <span className="block text-[12px] leading-4 font-semibold tabular-nums">
                                  {post.scheduledAt ? formatTime(post.scheduledAt, tz) : ""}
                                  <span className="sr-only">, {info.label}: </span>
                                </span>
                                <span className="line-clamp-2 text-[12px] leading-4 opacity-90">
                                  {shortCaption(post)}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {extra > 0 && (
                      <button
                        type="button"
                        onClick={() => openDay(dateKey)}
                        className={`self-start rounded-md px-1.5 text-[12px] leading-5 font-semibold text-slate-600 hover:bg-(--glass-ghost-hover) hover:text-ink ${focusRing}`}
                      >
                        +{extra} more
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ---------- mini calendário (celular) ---------- */}
          <div className={`mt-4 p-2 md:hidden ${cardClass}`}>
            <div className="grid grid-cols-7" aria-hidden="true">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-1.5 text-center text-[11px] font-semibold tracking-wide text-slate-500 uppercase"
                >
                  {day.charAt(0)}
                </div>
              ))}
            </div>
            <ol className="grid grid-cols-7">
              {monthCells(month).map((dateKey, index) => {
                if (!dateKey) return <li key={`blank-${index}`} aria-hidden="true" />;
                const dayPosts = byDay.get(dateKey) ?? [];
                const past = dateKey < todayKey;
                const isToday = dateKey === todayKey;
                return (
                  <li key={dateKey}>
                    <button
                      type="button"
                      onClick={() => openDay(dateKey)}
                      aria-label={`${dayHeading(dateKey)}${isToday ? ", today" : ""}: ${dayPosts.length} ${plural(dayPosts.length, "post", "posts")}`}
                      className={cx(
                        "flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-xl transition-colors duration-150 hover:bg-(--glass-ghost-hover)",
                        focusRing,
                      )}
                    >
                      <span
                        className={cx(
                          "inline-flex size-7 items-center justify-center rounded-full text-[15px] tabular-nums",
                          isToday
                            ? "bg-brand font-semibold text-white"
                            : past
                              ? "text-slate-500"
                              : "font-medium text-ink",
                        )}
                      >
                        {Number(dateKey.slice(8))}
                      </span>
                      <span aria-hidden="true" className="flex h-1.5 gap-0.5">
                        {dayPosts.slice(0, 3).map((post) => (
                          <span key={post.id} className={`size-1.5 rounded-full ${statusDot(post)}`} />
                        ))}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ---------- lista do mês (celular) ---------- */}
          <div className="mt-6 md:hidden">
            {shown.length === 0 ? (
              <EmptyState
                icon={<CalendarIcon />}
                title={emptyText}
                description={
                  filter === "all" ? "Fill the month with AI or add a post yourself." : undefined
                }
                actions={
                  filter === "all" ? (
                    <GlassButton variant="secondary" icon={<PlusIcon />} onClick={() => openNew(null)}>
                      New post
                    </GlassButton>
                  ) : (
                    <GlassButton variant="ghost" onClick={() => setFilter("all")}>
                      Show all posts
                    </GlassButton>
                  )
                }
              />
            ) : (
              <ol className="grid gap-5">
                {[...byDay.entries()].map(([dateKey, dayPosts]) => (
                  <li key={dateKey}>
                    <h3
                      className={`text-[13px] font-semibold ${dateKey === todayKey ? "text-brand" : "text-slate-500"}`}
                    >
                      {dateKey === todayKey
                        ? `Today · ${dayHeading(dateKey)}`
                        : dayHeading(dateKey)}
                    </h3>
                    <ul className="mt-2 grid gap-2">
                      {dayPosts.map((post) => (
                        <li key={post.id}>
                          <AgendaRow post={post} tz={tz} onOpen={openPost} />
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Mês vazio no computador: a grade fica, com uma linha de apoio embaixo. */}
          {shown.length === 0 && (
            <p className="mt-4 hidden text-center text-[15px] text-slate-600 md:block">
              {emptyText}{" "}
              {filter === "all" ? (
                <button
                  type="button"
                  onClick={() => openNew(null)}
                  className={`rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`}
                >
                  Add a post
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`}
                >
                  Show all posts
                </button>
              )}
            </p>
          )}

          {/* ---------- rascunhos sem data ---------- */}
          {undated.length > 0 && (filter === "all" || filter === "todo") && (
            <div className="mt-8">
              <h3 className="text-[13px] font-semibold text-slate-500">Drafts without a date</h3>
              <ul className="mt-2 grid gap-2 md:grid-cols-2">
                {undated.map((post) => (
                  <li key={post.id}>
                    <AgendaRow post={post} tz={tz} onOpen={openPost} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ---------- folha do dia ---------- */}
      <GlassSheet
        open={sheet.open}
        onClose={() => setSheet((s) => ({ ...s, open: false }))}
        title={sheet.day ? dayHeading(sheet.day) : "Day"}
        description={
          sheetPosts.length === 0
            ? sheetPast
              ? "Nothing was planned for this day."
              : "Nothing planned yet."
            : `${sheetPosts.length} ${plural(sheetPosts.length, "post", "posts")}`
        }
        footer={
          <>
            <GlassButton variant="secondary" onClick={() => setSheet((s) => ({ ...s, open: false }))}>
              Close
            </GlassButton>
            {!sheetPast && sheet.day && (
              <GlassButton variant="primary" icon={<PlusIcon />} onClick={() => openNew(sheet.day)}>
                New post on this day
              </GlassButton>
            )}
          </>
        }
      >
        {sheetPosts.length > 0 && (
          <ul className="grid gap-2">
            {sheetPosts.map((post) => (
              <li key={post.id}>
                <AgendaRow post={post} tz={tz} onOpen={openPost} />
              </li>
            ))}
          </ul>
        )}
      </GlassSheet>

      {composer && (
        <PostComposer
          key={composer.post?.id ?? `new-${composer.date ?? ""}`}
          post={composer.post}
          defaultDate={composer.date}
          state={state}
          onClose={() => setComposer(null)}
          onSynced={upsertPost}
          onDone={(post, text) => {
            upsertPost(post);
            setMessage(text);
            // O uso do plano muda ao aprovar/publicar.
            void loadState();
          }}
          onDeleted={(id) => {
            setPosts((list) => list.filter((p) => p.id !== id));
            setMessage("Post deleted.");
            void loadState();
          }}
          onAiUsed={() =>
            setState((s) =>
              s && s.aiRemaining.captions !== null
                ? {
                    ...s,
                    aiRemaining: {
                      ...s.aiRemaining,
                      captions: Math.max(0, s.aiRemaining.captions - 1),
                    },
                  }
                : s,
            )
          }
        />
      )}
    </div>
  );
}

/** Linha de um post (lista do celular, folha do dia, rascunhos sem data): foto, hora, selo, texto. */
function AgendaRow({
  post,
  tz,
  onOpen,
}: {
  post: SocialPost;
  tz: string;
  onOpen: (post: SocialPost) => void;
}) {
  const photo = post.media[0];
  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      className={`flex w-full items-start gap-3 p-2.5 text-left glass-interactive motion-safe:transition-[background-color,box-shadow] motion-safe:duration-150 ${cardClass} ${focusRing}`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- foto no storage (host externo)
        <img
          src={photo.url}
          alt=""
          className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-(--glass-rim)"
        />
      ) : (
        <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-slate-900/[0.04] text-center text-[11px] leading-4 text-slate-500 ring-1 ring-(--glass-rim)">
          No photo
        </span>
      )}
      <span className="min-w-0 flex-1 py-0.5">
        <span className="flex flex-wrap items-center gap-2">
          {post.scheduledAt && (
            <span className="text-[13px] font-semibold text-ink tabular-nums">
              {formatTime(post.scheduledAt, tz)}
            </span>
          )}
          <StatusChip post={post} size="sm" />
        </span>
        <span className="mt-1 line-clamp-2 block text-[14px] leading-5 text-slate-600">
          {shortCaption(post)}
        </span>
      </span>
    </button>
  );
}

/** Fuso e hora padrão dos posts (PATCH /api/social/settings). */
function SettingsForm({
  settings,
  onSaved,
}: {
  settings: SocialStateResponse["settings"];
  onSaved: (settings: SocialStateResponse["settings"]) => void;
}) {
  const [timezone, setTimezone] = useState(settings.timezone);
  const [postTime, setPostTime] = useState(settings.postTime);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<SocialApiError | null>(null);
  const zones = US_TIME_ZONES.some((z) => z.value === settings.timezone)
    ? US_TIME_ZONES
    : [...US_TIME_ZONES, { value: settings.timezone, label: settings.timezone }];
  const changed = timezone !== settings.timezone || postTime !== settings.postTime;
  const zoneLabel = zones.find((z) => z.value === settings.timezone)?.label ?? settings.timezone;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const body: UpdateSocialSettingsRequest = { timezone, postTime };
      const result = await socialApi("/api/social/settings", SocialSettingsResponse, {
        method: "PATCH",
        body,
      });
      onSaved(result.settings);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setPending(false);
    }
  }

  const field =
    "mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white/80 px-3 text-[15px] text-ink focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none";

  return (
    <details className="group mt-5 border-t border-(--glass-rim) pt-3">
      <summary
        className={`inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-full pr-2 text-sm font-semibold text-slate-600 hover:text-ink sm:min-h-10 [&::-webkit-details-marker]:hidden ${focusRing}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4 motion-safe:transition-transform group-open:rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Time zone and posting time
        <GlassBadge tone="neutral" size="sm" className="ml-1 font-normal">
          {zoneLabel} · {settings.postTime}
        </GlassBadge>
      </summary>
      <form
        onSubmit={(event) => void save(event)}
        className="mt-3 grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end"
      >
        <label className="block text-[13px] font-medium text-ink">
          Business time zone
          <select
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className={field}
          >
            {zones.map((zone) => (
              <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[13px] font-medium text-ink">
          Usual time
          <input
            type="time"
            value={postTime}
            step={300}
            onChange={(event) => setPostTime(event.target.value)}
            className={field}
          />
        </label>
        <button type="submit" disabled={pending || !changed} className={secondaryButton}>
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      {error && <ErrorNote error={error} className="mt-3" />}
    </details>
  );
}
