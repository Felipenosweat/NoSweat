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
import { focusRing, primaryButton, textButton } from "@/components/DashboardUi";
import {
  ErrorNote,
  byDate,
  canApprove,
  currentMonth,
  formatWhen,
  monthLabel,
  monthRange,
  socialApi,
  toApiError,
  type SocialApiError,
} from "../shared";

// Lista de revisão: todos os rascunhos do mês com a legenda inteira. Aprovar exige marcar
// "li todas as legendas" (regra: a IA nunca aprova; o dono confirma o que vai ao ar).

type Loaded = { state: SocialStateResponse; month: string; posts: SocialPost[] };

export function ReviewList({ initialMonth }: { initialMonth: string | null }) {
  const router = useRouter();
  const [data, setData] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<SocialApiError | null>(null);
  /** Posts desmarcados pelo dono (o resto dos aprováveis vai junto). */
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<SocialApiError | null>(null);

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
      const drafts = result.posts
        .filter((post) => post.status === "draft" && post.scheduledAt !== null)
        .sort(byDate);
      if (alive) setData({ state, month, posts: drafts });
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
        <div className="h-48 animate-pulse rounded-xl bg-slate-200/60 motion-reduce:animate-none" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200/60 motion-reduce:animate-none" />
      </div>
    );
  }

  const tz = data.state.settings.timezone;
  const ready = data.posts.filter(canApprove);
  const blocked = data.posts.filter((post) => !canApprove(post));
  const selected = ready.filter((post) => !skipped.has(post.id));
  const { used, cap } = data.state.usage;
  const overCap = cap !== null && used + selected.length > cap;
  const auto =
    data.state.capability.publishMode === "auto" && data.state.account?.status === "active";

  function toggle(id: string) {
    setSkipped((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
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

  if (data.posts.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
        <p className="text-[15px] font-medium text-ink">
          No drafts waiting in {monthLabel(data.month)}.
        </p>
        <Link href={`/social?month=${data.month}`} className={`${textButton} mt-2`}>
          Back to calendar
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <p className="text-[13px] font-semibold text-slate-500">
        {monthLabel(data.month)} · {data.posts.length} draft{data.posts.length === 1 ? "" : "s"}
      </p>

      <ol className="mt-3 grid gap-4">
        {data.posts.map((post, index) => {
          const approvable = canApprove(post);
          const checked = approvable && !skipped.has(post.id);
          const checkboxId = `review-${post.id}`;
          return (
            <li
              key={post.id}
              className={`rounded-xl border bg-white p-4 sm:p-5 ${
                checked ? "border-slate-300" : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <label
                  htmlFor={checkboxId}
                  className={`flex min-h-11 items-center gap-3 ${approvable ? "cursor-pointer" : ""}`}
                >
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={checked}
                    disabled={!approvable || pending}
                    onChange={() => toggle(post.id)}
                    className={`size-5 rounded accent-brand ${focusRing}`}
                  />
                  <span>
                    <span className="block text-[15px] font-semibold text-ink tabular-nums">
                      {post.scheduledAt ? formatWhen(post.scheduledAt, tz) : ""}
                    </span>
                    <span className="block text-[13px] text-slate-500">
                      Post {index + 1} of {data.posts.length}
                    </span>
                  </span>
                </label>
                {!approvable && (
                  <span className="rounded-lg bg-amber-50 px-2 py-1 text-[13px] font-medium text-amber-900">
                    {post.media.length === 0 ? "Needs a photo" : "Needs a caption"}
                  </span>
                )}
              </div>

              {post.media.length > 0 && (
                <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {post.media.map((media) => (
                    <li key={media.path} className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element -- foto no storage (host externo) */}
                      <img
                        src={media.url}
                        alt={media.alt ?? ""}
                        className="size-24 rounded-lg object-cover ring-1 ring-slate-200"
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
                  className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
                >
                  This caption mentions things like reviews, ratings, guarantees or licenses. Keep
                  them only if they&rsquo;re true for your business.
                </p>
              )}
              {!approvable && (
                <p className="mt-3 text-[13px] text-slate-500">
                  Open it from the{" "}
                  <Link
                    href={`/social?month=${data.month}`}
                    className="font-semibold text-brand underline-offset-4 hover:underline"
                  >
                    calendar
                  </Link>{" "}
                  to {post.media.length === 0 ? "add a photo" : "write a caption"} before approving.
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

      <div className="sticky bottom-0 mt-6 -mx-5 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-sm sm:mx-0 sm:rounded-xl sm:border">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            disabled={pending || selected.length === 0}
            required
            className={`mt-0.5 size-5 shrink-0 rounded accent-brand ${focusRing}`}
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
          <button
            type="button"
            onClick={() => void approve()}
            disabled={!confirmed || selected.length === 0 || pending}
            className={primaryButton}
          >
            {pending
              ? "Approving…"
              : `Approve ${selected.length} post${selected.length === 1 ? "" : "s"}`}
          </button>
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
