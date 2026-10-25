"use client";

import { SocialStateResponse } from "@nosweat/schema";
import { useState } from "react";
import { panelClass, panelText, panelTitle } from "@/components/DashboardUi";
import { ConfirmDialog, GlassBadge, GlassMenu, glassButtonClass } from "@/components/glass";
import { ErrorNote, socialApi, toApiError, type SocialApiError } from "./shared";

// Cartão do Instagram. Quatro estados, cada um com o selo e a próxima ação bem claros:
// - postagem automática ainda não liberada (modo manual): como funciona postar à mão;
// - liberada e sem conta: "Connect Instagram";
// - conta pedindo reconexão: aviso + "Reconnect Instagram";
// - conectada: tudo certo; "Disconnect" fica no menu "⋯" (com confirmação).
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

/** Passos do modo manual (sem postagem automática). */
const MANUAL_STEPS = [
  "Plan and approve your posts here.",
  "On the day, open the post from your calendar.",
  "Copy the caption, save the photo and share it on Instagram.",
];

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

  const badge =
    live?.status === "active" ? (
      <GlassBadge tone="live">Connected</GlassBadge>
    ) : live?.status === "needs_reconnect" ? (
      <GlassBadge tone="pending">Needs reconnect</GlassBadge>
    ) : manual ? (
      <GlassBadge tone="neutral">Auto-posting soon</GlassBadge>
    ) : (
      <GlassBadge tone="draft">Not connected</GlassBadge>
    );

  return (
    <section aria-labelledby="instagram-heading" className={panelClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {live?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- foto de perfil do Instagram (host externo)
            <img
              src={live.avatarUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-full object-cover ring-1 ring-(--glass-rim)"
            />
          ) : (
            <span className="glass-edge flex size-10 shrink-0 items-center justify-center rounded-full bg-white/60 text-ink">
              <InstagramGlyph />
            </span>
          )}
          <div className="min-w-0">
            <h2 id="instagram-heading" className={panelTitle}>
              Instagram
            </h2>
            <p className="truncate text-[13px] leading-5 text-slate-500">
              {live ? `@${live.username}` : manual ? "You post, we plan" : "Not connected"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {badge}
          {live && (
            <GlassMenu
              label={`More actions for @${live.username}`}
              items={[
                {
                  label: "Disconnect Instagram",
                  destructive: true,
                  onSelect: () => {
                    setError(null);
                    setConfirming(true);
                  },
                },
              ]}
            />
          )}
        </div>
      </div>

      {live?.status === "needs_reconnect" ? (
        <>
          <p
            role="status"
            className="glass-edge mt-4 rounded-xl bg-amber-50/85 px-3 py-2 text-sm text-amber-950"
          >
            Instagram stopped letting us post for you, so your scheduled posts are paused.
            Reconnect to pick up where you left off.
          </p>
          <div className="mt-4">
            {/* <a> e não <Link>: a rota da API redireciona para o login do Instagram. */}
            <a href={CONNECT_URL} className={glassButtonClass({ variant: "primary" })}>
              <InstagramGlyph className="size-4" />
              Reconnect Instagram
            </a>
          </div>
        </>
      ) : live?.status === "active" ? (
        <p className={`mt-4 ${panelText}`}>
          Approved posts go out automatically at their scheduled time. You don&rsquo;t need to
          open the app.
        </p>
      ) : manual ? (
        <>
          <p className={`mt-4 ${panelText}`}>
            Automatic posting isn&rsquo;t on for your account yet. Until then, you share each post
            yourself in a few taps:
          </p>
          <ol className="mt-3 grid gap-2">
            {MANUAL_STEPS.map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-[15px] leading-6 text-ink">
                <span
                  aria-hidden="true"
                  className="glass-edge grid size-6 shrink-0 place-items-center rounded-full bg-brand/10 text-[12px] font-semibold text-brand tabular-nums"
                >
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <>
          <p className={`mt-4 ${panelText}`}>
            Connect a Business or Creator account and approved posts go out on time, without you
            opening the app.
          </p>
          <div className="mt-4">
            <a href={CONNECT_URL} className={glassButtonClass({ variant: "secondary" })}>
              <InstagramGlyph className="size-4" />
              Connect Instagram
            </a>
          </div>
        </>
      )}

      {error && !confirming && <ErrorNote error={error} className="mt-3" />}

      {live && (
        <ConfirmDialog
          open={confirming}
          title={`Disconnect @${live.username}?`}
          confirmLabel="Disconnect"
          pendingLabel="Disconnecting…"
          pending={pending}
          error={confirming ? (error?.message ?? null) : null}
          onConfirm={() => void disconnect()}
          onCancel={() => setConfirming(false)}
        >
          Scheduled posts will pause until you connect again. Your drafts and calendar stay as they
          are.
        </ConfirmDialog>
      )}
    </section>
  );
}
