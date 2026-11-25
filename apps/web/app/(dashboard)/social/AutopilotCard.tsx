"use client";

import {
  SocialSettingsResponse,
  type SocialSettings,
  type SocialStateResponse,
  type UpdateSocialSettingsRequest,
} from "@nosweat/schema";
import Link from "next/link";
import { useId, useState } from "react";
import { focusRing, panelClass, panelText, panelTitle } from "@/components/DashboardUi";
import { ConfirmDialog, GlassBadge, Notice } from "@/components/glass";
import { creditsLabel } from "@/lib/credits-ui";
// Só os preços (arquivo puro, sem código de servidor): a tabela de preços fica num lugar só.
import { creditCost } from "@/server/credits/pricing";
import { ErrorNote, socialApi, toApiError, type SocialApiError } from "./shared";

// Cartão do Piloto automático (Premium). Ligar é o consentimento permanente do dono, então pede
// confirmação explicando exatamente o que acontece; desligar é um toque. Fora do Premium o
// interruptor aparece travado com o atalho para os planos.

const PLAN_COST = creditCost("social_plan");

const HOW_IT_WORKS = [
  "Near the end of each month, we plan next month's posts from your website.",
  "The day before posts go out, we email you the list. Edit or skip anything you don't want.",
  "Posts you didn't touch are approved about 2 hours before their time and go out on Instagram.",
];

export function AutopilotCard({
  state,
  onSaved,
}: {
  state: SocialStateResponse;
  onSaved: (settings: SocialSettings) => void;
}) {
  const ids = useId();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<SocialApiError | null>(null);
  const allowed = state.features?.autopilot ?? false;
  const on = state.settings.autopilot === true;
  const connected =
    state.capability.publishMode === "auto" && state.account?.status === "active";

  async function save(autopilot: boolean) {
    setPending(true);
    setError(null);
    try {
      const body: UpdateSocialSettingsRequest = { autopilot };
      const result = await socialApi("/api/social/settings", SocialSettingsResponse, {
        method: "PATCH",
        body,
      });
      setConfirming(false);
      onSaved(result.settings);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby={`${ids}-title`} className={`${panelClass} mt-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={`${ids}-title`} className={panelTitle}>
              Autopilot
            </h2>
            {allowed ? (
              <GlassBadge tone={on ? "live" : "draft"}>{on ? "On" : "Off"}</GlassBadge>
            ) : (
              <GlassBadge tone="neutral">Premium</GlassBadge>
            )}
          </div>
          <p id={`${ids}-desc`} className={`mt-1 ${panelText}`}>
            Turn it on once and your Instagram keeps posting without you opening the app.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby={`${ids}-title`}
          aria-describedby={`${ids}-desc`}
          disabled={!allowed || pending}
          onClick={() => {
            setError(null);
            if (on) void save(false);
            else setConfirming(true);
          }}
          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full bg-slate-300 transition-colors aria-checked:bg-brand disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${focusRing}`}
        >
          <span
            aria-hidden="true"
            className={`size-6 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${on ? "translate-x-7" : "translate-x-1"}`}
          />
        </button>
      </div>

      <ol className="mt-4 grid gap-2">
        {HOW_IT_WORKS.map((step, index) => (
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
      <p className="mt-3 text-[13px] leading-5 text-(--glass-fg-muted)">
        Only drafts with a photo and a caption go out on their own. Posts you edit or skip, and
        captions that mention reviews, prices or guarantees, wait for you to approve them. Planning
        a month uses {creditsLabel(PLAN_COST)}; if you run out, we tell you in the email.
      </p>

      {!allowed && (
        <p className="mt-3 text-[13px] font-medium text-ink">
          Autopilot is part of the Premium plan ·{" "}
          <Link
            href="/billing#plans"
            className={`rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`}
          >
            See plans
          </Link>
        </p>
      )}
      {allowed && on && !connected && (
        <Notice tone="warning" size="sm" className="mt-3">
          Connect Instagram so Autopilot can post for you. Until then, nothing is approved on its
          own.
        </Notice>
      )}
      {error && !confirming && <ErrorNote error={error} className="mt-3" />}

      <ConfirmDialog
        open={confirming}
        tone="primary"
        title="Turn on Autopilot?"
        confirmLabel="Turn on Autopilot"
        pendingLabel="Turning on…"
        pending={pending}
        error={confirming ? (error?.message ?? null) : null}
        onConfirm={() => void save(true)}
        onCancel={() => setConfirming(false)}
      >
        <p>
          You&rsquo;re letting No Sweat approve your AI-written drafts for you. We email you the day
          before, and anything you edit or skip stays with you. You can turn Autopilot off at any
          time.
        </p>
      </ConfirmDialog>
    </section>
  );
}
