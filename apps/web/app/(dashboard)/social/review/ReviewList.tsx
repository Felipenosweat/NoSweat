"use client";

import {
  SocialPostsResponse,
  SocialStateResponse,
  type ApproveSocialPostsRequest,
  type SocialPost,
} from "@nosweat/schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { focusRing, textButton } from "@/components/DashboardUi";
import {
  ConfirmDialog,
  EmptyState,
  GlassBadge,
  GlassButton,
  GlassIconButton,
  cx,
} from "@/components/glass";
import {
  ErrorNote,
  approveBlocker,
  byDate,
  canApprove,
  currentMonth,
  formatWhen,
  monthLabel,
  monthRange,
  shiftMonth,
  socialApi,
  toApiError,
  zonedDateKey,
  type ApproveBlocker,
  type SocialApiError,
} from "../shared";

// Lista de revisão: todos os rascunhos do mês com a legenda inteira. Cada post tem "Approve" e
// "Skip" (botões de vidro com estado ligado/desligado); a barra de vidro embaixo aprova os
// escolhidos de uma vez e exige marcar "li todas as legendas" (regra: a IA nunca aprova; o dono
// confirma o que vai ao ar).

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

function SkipGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function TrashGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-5"
    >
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  );
}

const DeleteResponse = z.object({ ok: z.literal(true) });

function InboxGlyph() {
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
      <path d="M4 13.5 6.5 5h11l2.5 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M4 13.5h4.5l1 2h5l1-2H20" />
    </svg>
  );
}

type Loaded = {
  state: SocialStateResponse;
  month: string;
  posts: SocialPost[];
  /** Relógio lido ao carregar (para "já passou?" sem chamar Date.now() no render). */
  nowMs: number;
  /** Primeiro dos 2 meses seguintes com rascunhos ainda no futuro (a IA planeja até 2 à frente). */
  later: { month: string; count: number } | null;
};

/** Selo curto do que falta para aprovar. */
const BLOCKER_BADGE: Record<ApproveBlocker, string> = {
  date: "Needs a date",
  photo: "Needs a photo",
  caption: "Needs a caption",
  past: "Time passed",
};

/** O que fazer no calendário antes de aprovar ("Open it from the calendar to …"). */
const BLOCKER_HINT: Record<ApproveBlocker, string> = {
  date: "pick a date",
  photo: "add a photo",
  caption: "write a caption",
  past: "pick a new date",
};

/** Rascunhos com data, do mais cedo para o mais tarde. */
function datedDrafts(posts: SocialPost[]): SocialPost[] {
  return posts.filter((post) => post.status === "draft" && post.scheduledAt !== null).sort(byDate);
}

/**
 * Procura rascunhos futuros nos 2 meses depois de `month` (bem dentro da janela de 95 dias da
 * API) e devolve o primeiro mês que tiver algum. Erro aqui não derruba a tela: só não mostra o atalho.
 */
async function findLaterDrafts(
  month: string,
  timeZone: string,
  nowMs: number,
): Promise<Loaded["later"]> {
  try {
    const from = monthRange(month, timeZone).to;
    const to = monthRange(shiftMonth(month, 2), timeZone).to;
    const result = await socialApi(
      `/api/social/posts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      SocialPostsResponse,
    );
    const counts = new Map<string, number>();
    for (const post of datedDrafts(result.posts)) {
      if (!post.scheduledAt || Date.parse(post.scheduledAt) <= nowMs) continue;
      const key = zonedDateKey(new Date(post.scheduledAt), timeZone).slice(0, 7);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const first = [...counts.keys()].sort()[0];
    return first ? { month: first, count: counts.get(first) ?? 0 } : null;
  } catch {
    return null;
  }
}

export function ReviewList({ initialMonth }: { initialMonth: string | null }) {
  const router = useRouter();
  const [data, setData] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<SocialApiError | null>(null);
  /** Posts desmarcados pelo dono (o resto dos aprováveis vai junto). */
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());
  /** Mês em que o dono marcou "li todas as legendas" (trocar de mês pede a confirmação de novo). */
  const [confirmedFor, setConfirmedFor] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<SocialApiError | null>(null);
  /** Post que o dono pediu para apagar (abre a confirmação). */
  const [toDelete, setToDelete] = useState<SocialPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const state = await socialApi("/api/social/state", SocialStateResponse);
      const month = initialMonth ?? currentMonth(state.settings.timezone);
      const { from, to } = monthRange(month, state.settings.timezone);
      const result = await socialApi(
        `/api/social/posts?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        SocialPostsResponse,
      );
      const nowMs = Date.now();
      const drafts = datedDrafts(result.posts);
      // Nada para aprovar neste mês: talvez a IA tenha planejado um dos próximos.
      const later = drafts.some((post) => canApprove(post, nowMs))
        ? null
        : await findLaterDrafts(month, state.settings.timezone, nowMs);
      if (alive) setData({ state, month, posts: drafts, nowMs, later });
    })().catch((err: unknown) => {
      if (alive) setLoadError(toApiError(err));
    });
    return () => {
      alive = false;
    };
  }, [initialMonth]);

  if (loadError) return <ErrorNote error={loadError} className="mt-8" />;
  if (!data) {
    return (
      <div className="mt-8 grid gap-4" aria-busy="true" aria-label="Loading your drafts">
        <div className="glass h-48 rounded-2xl motion-safe:animate-pulse" />
        <div className="glass h-48 rounded-2xl motion-safe:animate-pulse" />
      </div>
    );
  }

  const tz = data.state.settings.timezone;
  const { nowMs, later } = data;
  const confirmed = confirmedFor === data.month;
  const ready = data.posts.filter((post) => canApprove(post, nowMs));
  const blocked = data.posts.filter((post) => !canApprove(post, nowMs));
  const selected = ready.filter((post) => !skipped.has(post.id));
  const { used, cap } = data.state.usage;
  const overCap = cap !== null && used + selected.length > cap;
  const auto =
    data.state.capability.publishMode === "auto" && data.state.account?.status === "active";

  /** Liga/desliga um post da aprovação em lote. */
  function choose(id: string, include: boolean) {
    setSkipped((current) => {
      const next = new Set(current);
      if (include) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function approve() {
    if (!data || selected.length === 0 || !confirmed) return;
    setPending(true);
    setError(null);
    try {
      const body: ApproveSocialPostsRequest = { ids: selected.map((post) => post.id) };
      const result = await socialApi("/api/social/posts/approve", SocialPostsResponse, {
        method: "POST",
        body,
      });
      router.push(`/social?approved=${result.posts.length}&month=${data.month}`);
    } catch (err) {
      setError(toApiError(err));
      setPending(false);
    }
  }

  /** Apaga a sugestão da IA de vez (some do calendário; nada vai ao Instagram). */
  async function removePost() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await socialApi(`/api/social/posts/${encodeURIComponent(toDelete.id)}`, DeleteResponse, {
        method: "DELETE",
      });
      const id = toDelete.id;
      setData((current) =>
        current ? { ...current, posts: current.posts.filter((post) => post.id !== id) } : current,
      );
      setToDelete(null);
    } catch (err) {
      setDeleteError(toApiError(err).message);
    } finally {
      setDeleting(false);
    }
  }

  const deleteDialog = (
    <ConfirmDialog
      open={toDelete !== null}
      title="Delete this post?"
      confirmLabel="Delete post"
      pendingLabel="Deleting…"
      pending={deleting}
      error={deleteError}
      onConfirm={() => void removePost()}
      onCancel={() => {
        setToDelete(null);
        setDeleteError(null);
      }}
    >
      It will be removed from your calendar and won&rsquo;t be posted. You can always ask AI for
      more posts later.
    </ConfirmDialog>
  );

  const laterLink = later ? (
    <Link href={`/social/review?month=${later.month}`} className={textButton}>
      You have {later.count} draft{later.count === 1 ? "" : "s"} in {monthLabel(later.month)}
      <span aria-hidden="true"> &rarr;</span>
    </Link>
  ) : null;

  if (data.posts.length === 0) {
    return (
      <EmptyState
        className="mt-8"
        icon={<InboxGlyph />}
        title={`No drafts waiting in ${monthLabel(data.month)}`}
        description="When AI drafts your posts, they show up here for you to read and approve."
        actions={
          <>
            {later && (
              <GlassButton href={`/social/review?month=${later.month}`} variant="primary">
                Review {later.count} in {monthLabel(later.month)}
              </GlassButton>
            )}
            <GlassButton href={`/social?month=${data.month}`} variant="secondary">
              Back to calendar
            </GlassButton>
          </>
        }
      />
    );
  }

  return (
    <div className="mt-8">
      {deleteDialog}
      <p className="text-[13px] font-semibold text-slate-500 tabular-nums">
        {monthLabel(data.month)} · {data.posts.length} draft{data.posts.length === 1 ? "" : "s"}
        {ready.length > 0 && ` · ${selected.length} of ${ready.length} selected`}
      </p>
      {laterLink && <p className="mt-1">{laterLink}</p>}

      <ol className="mt-3 grid gap-4">
        {data.posts.map((post, index) => {
          const blocker = approveBlocker(post, nowMs);
          const approvable = blocker === null;
          const checked = approvable && !skipped.has(post.id);
          const headingId = `review-${post.id}`;
          return (
            <li
              key={post.id}
              aria-labelledby={headingId}
              className={cx(
                "glass rounded-2xl p-4 motion-safe:transition-[box-shadow,opacity] motion-safe:duration-200 sm:p-5",
                checked && "ring-2 ring-emerald-500/60",
                approvable && !checked && "opacity-75",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-h-11">
                  <h2
                    id={headingId}
                    className="text-[15px] leading-6 font-semibold text-ink tabular-nums"
                  >
                    {post.scheduledAt ? formatWhen(post.scheduledAt, tz) : ""}
                  </h2>
                  <p className="text-[13px] text-slate-500">
                    Post {index + 1} of {data.posts.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {blocker ? (
                    <GlassBadge tone="pending">{BLOCKER_BADGE[blocker]}</GlassBadge>
                  ) : (
                    // Aprovar / pular: dois botões de vidro com estado (aria-pressed).
                    <div
                      role="group"
                      aria-label={`Post ${index + 1}`}
                      className="flex items-center gap-2"
                    >
                      <GlassButton
                        variant="secondary"
                        icon={<CheckGlyph />}
                        aria-pressed={checked}
                        disabled={pending}
                        onClick={() => choose(post.id, true)}
                        className={
                          checked
                            ? "bg-emerald-700! text-white! [--glass-specular:rgb(255_255_255/0.35)] hover:bg-emerald-800!"
                            : undefined
                        }
                      >
                        Approve
                      </GlassButton>
                      <GlassButton
                        variant={checked ? "ghost" : "secondary"}
                        icon={<SkipGlyph />}
                        aria-pressed={!checked}
                        disabled={pending}
                        onClick={() => choose(post.id, false)}
                      >
                        Skip
                      </GlassButton>
                    </div>
                  )}
                  <GlassIconButton
                    variant="ghost"
                    label={`Delete post ${index + 1}`}
                    disabled={pending}
                    onClick={() => setToDelete(post)}
                  >
                    <TrashGlyph />
                  </GlassIconButton>
                </div>
              </div>

              {post.media.length > 0 && (
                <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {post.media.map((media) => (
                    <li key={media.path} className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- foto no storage (host externo) */}
                      <img
                        src={media.url}
                        alt={media.alt ?? ""}
                        className="size-24 rounded-xl object-cover ring-1 ring-(--glass-rim)"
                      />
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-3 text-[15px] leading-[1.6] break-words whitespace-pre-wrap text-ink">
                {post.caption}
              </p>
              {post.ownerNotePt && (
                <p className="mt-2 text-[13px] leading-5 text-slate-500">
                  <span className="font-medium text-slate-600">Note (Portuguese): </span>
                  <span lang="pt-BR">{post.ownerNotePt}</span>
                </p>
              )}
              {post.claimsFlagged && (
                <p
                  role="note"
                  className="glass-edge mt-3 rounded-xl bg-amber-50/85 px-3 py-2 text-sm text-amber-950"
                >
                  This caption mentions things like reviews, ratings, guarantees or licenses. Keep
                  them only if they&rsquo;re true for your business.
                </p>
              )}
              {blocker && (
                <p className="mt-3 text-[13px] text-slate-500">
                  Open it from the{" "}
                  <Link
                    href={`/social?month=${data.month}`}
                    className="font-semibold text-brand underline-offset-4 hover:underline"
                  >
                    calendar
                  </Link>{" "}
                  to {BLOCKER_HINT[blocker]} before approving.
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {blocked.length > 0 && ready.length > 0 && (
        <p className="mt-4 text-[13px] text-slate-500">
          {blocked.length} draft{blocked.length === 1 ? "" : "s"} can&rsquo;t be approved yet.
        </p>
      )}

      {/* Barra de vidro grudada embaixo; no celular, logo acima da barra de abas flutuante. */}
      <div className="glass-strong sticky bottom-3 z-20 mt-6 rounded-[26px] px-4 py-4 max-lg:bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] sm:px-5">
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmedFor(event.target.checked ? data.month : null)}
            disabled={pending || selected.length === 0}
            required
            className={`size-5 shrink-0 rounded accent-brand ${focusRing}`}
          />
          <span className="text-[15px] leading-6 text-ink">
            I read every caption and these posts are true for my business
          </span>
        </label>
        {overCap && cap !== null && (
          <p className="mt-3 text-[13px] text-amber-900">
            Your plan includes {cap} posts a month and {used} are already approved. Approve fewer
            posts or{" "}
            <Link
              href="/billing?from=social"
              className="font-semibold underline underline-offset-4"
            >
              upgrade your plan
            </Link>
            .
          </p>
        )}
        {error && <ErrorNote error={error} className="mt-3" />}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <GlassButton
            variant="primary"
            onClick={() => void approve()}
            disabled={!confirmed || selected.length === 0}
            loading={pending}
            icon={<CheckGlyph />}
          >
            {pending
              ? "Approving…"
              : `Approve ${selected.length} post${selected.length === 1 ? "" : "s"}`}
          </GlassButton>
          <span aria-live="polite" className="text-[13px] text-slate-500">
            {auto
              ? "They'll go out on Instagram at the times shown."
              : "They'll show as Ready to post. You share each one in a few taps."}
          </span>
        </div>
      </div>
    </div>
  );
}
