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
  focusRing,
  panelClass,
  panelText,
  panelTitle,
  secondaryButton,
  textButton,
} from "@/components/DashboardUi";
import { ConnectCard } from "./ConnectCard";
import { PlanMonthButton } from "./PlanMonthButton";
import { PostComposer } from "./PostComposer";
import {
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
} from "./shared";

// Tela principal do /social: conta do Instagram, "preencher o mês com IA", calendário do mês
// (grade a partir de md, lista no celular) e a gaveta de edição. Tudo no fuso da empresa.

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

export function SocialCalendar({ initialMonth }: { initialMonth: string | null }) {
  const [state, setState] = useState<SocialStateResponse | null>(null);
  const [stateError, setStateError] = useState<SocialApiError | null>(null);
  const [month, setMonth] = useState<string | null>(initialMonth);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<SocialApiError | null>(null);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [message, setMessage] = useState("");

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

  useEffect(() => {
    void loadState();
  }, [loadState]);

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
        <button type="button" onClick={() => void loadState()} className={`${textButton} mt-3`}>
          Try again
        </button>
      </div>
    );
  }

  if (!state || !month || !tz) {
    return (
      <div className="mt-8 grid gap-4" aria-busy="true" aria-label="Loading your calendar">
        <div className="h-36 animate-pulse rounded-xl bg-slate-200/60 motion-reduce:animate-none" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200/60 motion-reduce:animate-none" />
      </div>
    );
  }

  const loading = loadedKey !== postsKey;
  const thisMonth = currentMonth(tz);
  const todayKey = zonedDateKey(new Date(), tz);
  const sorted = [...posts].sort(byDate);
  const dated = sorted.filter(
    (post) => post.scheduledAt && zonedDateKey(new Date(post.scheduledAt), tz).startsWith(month),
  );
  const undated = sorted.filter((post) => !post.scheduledAt && post.status === "draft");
  const byDay = new Map<string, SocialPost[]>();
  for (const post of dated) {
    if (!post.scheduledAt) continue;
    const key = zonedDateKey(new Date(post.scheduledAt), tz);
    byDay.set(key, [...(byDay.get(key) ?? []), post]);
  }
  const reviewable = dated.filter((post) => post.status === "draft" && canApprove(post));
  const { used, cap } = state.usage;

  const openPost = (post: SocialPost) => setComposer({ post, date: null });
  const openNew = (date: string | null) => setComposer({ post: null, date });

  return (
    <div>
      <div aria-live="polite" className="sr-only">
        {message}
      </div>
      {message && (
        <p className="mt-6 flex items-start justify-between gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-[15px] text-emerald-900">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            className={`shrink-0 text-sm font-semibold underline-offset-4 hover:underline ${focusRing}`}
          >
            Dismiss
          </button>
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ConnectCard state={state} onChange={setState} />

        <section aria-labelledby="month-plan-heading" className={panelClass}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="month-plan-heading" className={panelTitle}>
              Your posting plan
            </h2>
            <p className="text-[13px] font-medium text-slate-500 tabular-nums">
              {cap === null
                ? `${used} approved this month`
                : `${used} of ${cap} posts used this month`}
            </p>
          </div>
          <p className={`mt-2 ${panelText}`}>
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
                setMessage(
                  `${created.length} draft${created.length === 1 ? "" : "s"} added to ${monthLabel(plannedMonth)}. Read each one, add photos where needed, then approve.`,
                );
              }}
            />
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

      <section aria-labelledby="calendar-heading" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, -1))}
              aria-label="Previous month"
              className={`inline-flex size-11 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-ink sm:size-10 ${focusRing}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2
              id="calendar-heading"
              className="min-w-[11ch] text-center font-display text-xl font-semibold tracking-[-0.02em] text-ink tabular-nums"
            >
              {monthLabel(month)}
            </h2>
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, 1))}
              aria-label="Next month"
              className={`inline-flex size-11 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-ink sm:size-10 ${focusRing}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {month !== thisMonth && (
              <button
                type="button"
                onClick={() => setMonth(thisMonth)}
                className={`${textButton} ml-2 text-sm`}
              >
                Today
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {reviewable.length > 0 && (
              <Link href={`/social/review?month=${month}`} className={secondaryButton}>
                Review {reviewable.length} draft{reviewable.length === 1 ? "" : "s"}
              </Link>
            )}
            <button type="button" onClick={() => openNew(null)} className={secondaryButton}>
              New post
            </button>
          </div>
        </div>

        {postsError && <ErrorNote error={postsError} className="mt-4" />}

        <div aria-busy={loading} className={loading ? "opacity-60 transition-opacity" : undefined}>
          {/* ---------- grade do mês (md+) ---------- */}
          <div className="mt-4 hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
            <div
              className="grid grid-cols-7 border-b border-slate-200 bg-surface"
              aria-hidden="true"
            >
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="px-3 py-2 text-[12px] font-semibold tracking-wide text-slate-500 uppercase"
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
                      className="min-h-32 border-r border-b border-slate-100 bg-surface/60 [&:nth-child(7n)]:border-r-0"
                    />
                  );
                }
                const dayPosts = byDay.get(dateKey) ?? [];
                const past = dateKey < todayKey;
                const isToday = dateKey === todayKey;
                const day = Number(dateKey.slice(8));
                return (
                  <li
                    key={dateKey}
                    className={`group flex min-h-32 flex-col gap-1 border-r border-b border-slate-100 p-1.5 [&:nth-child(7n)]:border-r-0 ${past ? "bg-surface/60" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex size-7 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums ${
                          isToday ? "bg-ink text-white" : past ? "text-slate-400" : "text-ink"
                        }`}
                      >
                        <span className="sr-only">{dayHeading(dateKey)}</span>
                        <span aria-hidden="true">{day}</span>
                      </span>
                      {!past && (
                        <button
                          type="button"
                          onClick={() => openNew(dateKey)}
                          aria-label={`New post on ${dayHeading(dateKey)}`}
                          className={`inline-flex size-7 items-center justify-center rounded-md text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 hover:text-ink focus-visible:opacity-100 ${focusRing}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="size-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden="true"
                          >
                            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <ul className="flex flex-col gap-1">
                      {dayPosts.map((post) => (
                        <li key={post.id}>
                          <button
                            type="button"
                            onClick={() => openPost(post)}
                            className={`flex w-full items-start gap-1.5 rounded-md bg-surface px-1.5 py-1 text-left ring-1 ring-slate-200 transition-colors duration-150 hover:bg-white hover:ring-slate-300 ${focusRing}`}
                          >
                            <span
                              aria-hidden="true"
                              className={`mt-1.5 size-1.5 shrink-0 rounded-full ${statusDot(post)}`}
                            />
                            <span className="min-w-0">
                              <span className="block text-[12px] leading-4 font-semibold text-ink tabular-nums">
                                {post.scheduledAt ? formatTime(post.scheduledAt, tz) : ""}
                                <span className="sr-only">, {statusInfo(post).label}: </span>
                              </span>
                              <span className="line-clamp-2 text-[12px] leading-4 text-slate-600">
                                {shortCaption(post)}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* ---------- lista (celular) ---------- */}
          <div className="mt-4 md:hidden">
            {dated.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                <p className="text-[15px] font-medium text-ink">
                  Nothing planned for {monthLabel(month)}.
                </p>
                <p className="mt-1 text-[13px] text-slate-500">
                  Fill the month with AI or add a post.
                </p>
              </div>
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

          {/* ---------- rascunhos sem data ---------- */}
          {undated.length > 0 && (
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
      className={`flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition-colors duration-150 hover:border-slate-300 ${focusRing}`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- foto no storage (host externo)
        <img
          src={photo.url}
          alt=""
          className="size-16 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
        />
      ) : (
        <span className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-surface text-center text-[11px] leading-4 text-slate-500 ring-1 ring-slate-200">
          No photo
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          {post.scheduledAt && (
            <span className="text-[13px] font-semibold text-ink tabular-nums">
              {formatTime(post.scheduledAt, tz)}
            </span>
          )}
          <StatusChip post={post} />
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
    "mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-ink focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none";

  return (
    <details className="group mt-5 border-t border-slate-200 pt-4">
      <summary
        className={`inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-ink sm:min-h-10 [&::-webkit-details-marker]:hidden ${focusRing}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4 transition-transform group-open:rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Time zone and posting time
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
