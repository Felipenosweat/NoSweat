"use client";

import { SocialPostResponse, type SocialPost } from "@nosweat/schema";
import { useEffect, useState } from "react";
import { primaryButton, secondaryButton } from "@/components/DashboardUi";
import { ErrorNote, socialApi, toApiError, type SocialApiError } from "./shared";

// Postar à mão (antes da publicação automática): copia a legenda, abre as fotos e o Instagram,
// e o dono marca "I posted it" (vira manual_published).

/** Número do passo num círculo (decorativo: a ordem da lista já diz o passo). */
function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="glass-edge grid size-6 shrink-0 place-items-center rounded-full bg-brand/10 text-[12px] font-semibold text-brand tabular-nums"
    >
      {n}
    </span>
  );
}

export function ManualPostButton({
  post,
  onPosted,
}: {
  post: SocialPost;
  onPosted: (post: SocialPost) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<SocialApiError | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(post.caption);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      // Sem permissão: a legenda está visível para copiar na mão.
      setCopyFailed(true);
    }
  }

  async function markPosted() {
    setPending(true);
    setError(null);
    try {
      const result = await socialApi(
        `/api/social/posts/${encodeURIComponent(post.id)}/mark-posted`,
        SocialPostResponse,
        { method: "POST" },
      );
      onPosted(result.post);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="glass-inset rounded-xl p-4">
      <p className="text-[15px] font-semibold text-ink">Post it yourself in three taps</p>
      <ol className="mt-3 grid gap-3">
        <li className="flex flex-wrap items-center gap-3">
          <StepNumber n={1} />
          <button type="button" onClick={() => void copy()} className={secondaryButton}>
            {copied ? "Caption copied" : "Copy caption"}
          </button>
          <span aria-live="polite" className="sr-only">
            {copied ? "Caption copied to the clipboard." : ""}
          </span>
          {copyFailed && (
            <span className="text-[13px] text-slate-500">
              Your browser blocked copying. Select the caption and copy it.
            </span>
          )}
        </li>
        <li className="flex flex-wrap items-center gap-3">
          <StepNumber n={2} />
          {post.media.length === 0 ? (
            <span className="text-[13px] text-slate-500">This post has no photo yet.</span>
          ) : (
            post.media.map((media, index) => (
              <a
                key={media.path}
                href={media.url}
                download={`post-photo-${index + 1}.jpg`}
                target="_blank"
                rel="noreferrer"
                className={secondaryButton}
              >
                {post.media.length === 1 ? "Save photo" : `Save photo ${index + 1}`}
              </a>
            ))
          )}
        </li>
        <li className="flex flex-wrap items-center gap-3">
          <StepNumber n={3} />
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            className={secondaryButton}
          >
            Open Instagram
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      </ol>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-(--glass-rim) pt-4">
        <button
          type="button"
          onClick={() => void markPosted()}
          disabled={pending}
          className={primaryButton}
        >
          {pending ? "Saving…" : "I posted it"}
        </button>
        <span className="text-[13px] text-slate-500">We&rsquo;ll mark it as posted manually.</span>
      </div>
      {error && <ErrorNote error={error} className="mt-3" />}
    </div>
  );
}
