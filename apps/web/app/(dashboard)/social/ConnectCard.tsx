"use client";

import { SocialStateResponse } from "@nosweat/schema";
import { useState } from "react";
import {
  StatusBadge,
  panelClass,
  panelText,
  panelTitle,
  primaryButton,
  secondaryButton,
  textButton,
} from "@/components/DashboardUi";
import { ErrorNote, socialApi, toApiError, type SocialApiError } from "./shared";

// Cartão do Instagram: conectar, conta conectada, reconectar ou desconectar.
// "Connect" é navegação de página inteira (a rota manda para o login do Instagram).

const CONNECT_URL = "/api/social/instagram/connect";

function InstagramGlyph({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ConnectCard({
  state,
  onChange,
}: {
  state: SocialStateResponse;
  onChange: (state: SocialStateResponse) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<SocialApiError | null>(null);
  const { account, capability } = state;
  const live = account && account.status !== "revoked" ? account : null;
  const manual = capability.publishMode === "manual";

  async function disconnect() {
    if (!live) return;
    setPending(true);
    setError(null);
    try {
      const next = await socialApi(
        `/api/social/accounts/${encodeURIComponent(live.id)}`,
        SocialStateResponse,
        { method: "DELETE" },
      );
      setConfirming(false);
      onChange(next);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="instagram-heading" className={panelClass}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {live?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- foto de perfil do Instagram (host externo)
            <img
              src={live.avatarUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
            />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-ink ring-1 ring-slate-200">
              <InstagramGlyph />
            </span>
          )}
          <div className="min-w-0">
            <h2 id="instagram-heading" className={panelTitle}>
              Instagram
            </h2>
            <p className="truncate text-[13px] leading-5 text-slate-500">
              {live ? `@${live.username}` : "Not connected"}
            </p>
          </div>
        </div>
        {live?.status === "active" && <StatusBadge tone="live">Connected</StatusBadge>}
        {live?.status === "needs_reconnect" && (
          <StatusBadge tone="pending">Needs reconnect</StatusBadge>
        )}
      </div>

      {live?.status === "needs_reconnect" && (
        <div role="status" className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Instagram stopped letting us post for you, so your scheduled posts are paused. Reconnect
          to pick up where you left off.
        </div>
      )}

      {manual ? (
        <p className={`mt-4 ${panelText}`}>
          Auto-posting opens soon — for now we&rsquo;ll remind you and you post in one tap. Plan and
          approve your posts here; when it&rsquo;s time, copy the caption, save the photo and share
          it on Instagram.
        </p>
      ) : !live ? (
        <p className={`mt-4 ${panelText}`}>
          Connect a Business or Creator account and approved posts go out on time, without you
          opening the app.
        </p>
      ) : live.status === "active" ? (
        <p className={`mt-4 ${panelText}`}>
          Approved posts go out automatically at their scheduled time.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!manual && !live && (
          <a href={CONNECT_URL} className={primaryButton}>
            <InstagramGlyph className="size-4" />
            Connect Instagram
          </a>
        )}
        {live?.status === "needs_reconnect" && (
          <a href={CONNECT_URL} className={primaryButton}>
            Reconnect Instagram
          </a>
        )}
        {live && !confirming && (
          <button type="button" onClick={() => setConfirming(true)} className={textButton}>
            Disconnect
          </button>
        )}
        {live && confirming && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600">
              Disconnect @{live.username}? Scheduled posts will pause.
            </span>
            <button
              type="button"
              onClick={() => void disconnect()}
              disabled={pending}
              className={secondaryButton}
            >
              {pending ? "Disconnecting…" : "Yes, disconnect"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className={textButton}
            >
              Keep it
            </button>
          </div>
        )}
      </div>
      {error && <ErrorNote error={error} className="mt-3" />}
    </section>
  );
}
