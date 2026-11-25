"use client";

import {
  ApproveAllDraftsResponse,
  type ApproveAllDraftsRequest,
  type SocialPost,
} from "@nosweat/schema";
import Link from "next/link";
import { useState } from "react";
import { focusRing, secondaryButton } from "@/components/DashboardUi";
import { ConfirmDialog } from "@/components/glass";
import { approveBlocker, monthLabel, socialApi, toApiError } from "./shared";

// "Approve all drafts" (Pro e Premium): aprova de uma vez os rascunhos prontos do mês aberto.
// Mostra antes quantos vão e quantos ficam como rascunho (sem foto/legenda/data, hora passada,
// "Skip", legenda com afirmação a conferir). O limite do plano é conferido no servidor: os mais
// cedo entram primeiro e o resto fica como rascunho. Starter vê o botão travado e o atalho de planos.

function LockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

export function ApproveAllButton({
  month,
  posts,
  nowMs,
  allowed,
  auto,
  room,
  onApproved,
}: {
  /** Mês aberto no calendário ("YYYY-MM"). */
  month: string;
  /** Posts do mês aberto (só os rascunhos com data contam). */
  posts: SocialPost[];
  /** Relógio lido uma vez no render do calendário. */
  nowMs: number;
  /** O plano tem "Approve all" (Pro e Premium). */
  allowed: boolean;
  /** Publicação automática ligada: os aprovados entram na fila. */
  auto: boolean;
  /** Vagas do plano neste mês (`null` = sem limite ou mês diferente do atual). */
  room: number | null;
  onApproved: (result: ApproveAllDraftsResponse) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const drafts = posts.filter((post) => post.status === "draft" && post.scheduledAt !== null);
  const blocked = drafts.filter((post) => approveBlocker(post, nowMs) !== null).length;
  const skipped = drafts.filter(
    (post) => approveBlocker(post, nowMs) === null && post.autopilotSkip,
  ).length;
  const flagged = drafts.filter(
    (post) => approveBlocker(post, nowMs) === null && !post.autopilotSkip && post.claimsFlagged,
  ).length;
  const ready = drafts.length - blocked - skipped - flagged;
  const willApprove = room === null ? ready : Math.min(ready, Math.max(0, room));
  const overCap = ready - willApprove;

  if (!allowed) {
    return (
      <div className="flex flex-col items-start gap-1">
        <button type="button" disabled className={secondaryButton}>
          <LockGlyph />
          Approve all drafts
        </button>
        <p className="text-[13px] text-(--glass-fg-muted)">
          Approve a whole month in one click on Pro and Premium ·{" "}
          <Link
            href="/billing#plans"
            className={`rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`}
          >
            See plans
          </Link>
        </p>
      </div>
    );
  }

  async function approveAll() {
    setPending(true);
    setError(null);
    try {
      const body: ApproveAllDraftsRequest = { month };
      const result = await socialApi("/api/social/posts/approve-all", ApproveAllDraftsResponse, {
        method: "POST",
        body,
      });
      setOpen(false);
      onApproved(result);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setPending(false);
    }
  }

  const left: string[] = [];
  if (blocked > 0) {
    left.push(`${plural(blocked, "draft needs", "drafts need")} a photo, a caption or a new time`);
  }
  if (flagged > 0) {
    left.push(
      `${plural(flagged, "caption mentions", "captions mention")} reviews, prices or guarantees (check ${flagged === 1 ? "it" : "them"} in Review)`,
    );
  }
  if (skipped > 0) left.push(`${plural(skipped, "draft is", "drafts are")} marked Skip`);
  if (overCap > 0) left.push(`${plural(overCap, "post goes", "posts go")} over your plan's limit`);

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        disabled={willApprove === 0}
        className={secondaryButton}
      >
        Approve all drafts
      </button>
      <p className="text-[13px] text-(--glass-fg-muted)">
        {ready === 0
          ? `No drafts ready to approve in ${monthLabel(month)}`
          : willApprove === 0
            ? `${plural(ready, "draft", "drafts")} ready, but this month's posts in your plan are used`
            : `${plural(ready, "draft", "drafts")} ready in ${monthLabel(month)}`}
      </p>

      <ConfirmDialog
        open={open}
        tone="primary"
        title={`Approve ${plural(willApprove, "post", "posts")} in ${monthLabel(month)}?`}
        confirmLabel={`Approve ${plural(willApprove, "post", "posts")}`}
        pendingLabel="Approving…"
        pending={pending}
        error={error}
        onConfirm={() => void approveAll()}
        onCancel={() => setOpen(false)}
      >
        <p>
          {auto
            ? "They'll go out on Instagram at the times on your calendar."
            : "They'll show as Ready to post. You share each one in a few taps."}{" "}
          Make sure every caption is true for your business.
        </p>
        {left.length > 0 && (
          <>
            <p className="mt-3">These stay as drafts:</p>
            <ul className="mt-1 list-disc pl-5">
              {left.map((line) => (
                <li key={line}>{line}.</li>
              ))}
            </ul>
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
