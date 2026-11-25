"use client";

import { AutoReviewResponse } from "@nosweat/schema";
import Link from "next/link";
import { useId, useState } from "react";
import { GlassBadge, GlassCard, cx, focusRing, glassButtonClass } from "@/components/glass";
import { ErrorNote, clientsApi, toClientsError, type ClientsApiError } from "../clients/api";
import { hintClass, sectionTitle } from "../clients/ui";

// Pedido de avaliação automático (Pro e Premium): quando um job vira "done" na agenda, o cliente
// recebe o pedido por e-mail. Sem o recurso no plano, o mesmo cartão aparece trancado, com o
// atalho para os planos. `readOnly` = modo "ver como" do admin (mostra, não salva).

const TITLE = "Ask for a Google review automatically when a job is done";

function LockIcon() {
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
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function AutoReviewSetting({
  available,
  initialEnabled,
  sentThisMonth,
  hasLink,
  readOnly,
}: {
  available: boolean;
  initialEnabled: boolean;
  sentThisMonth: number;
  hasLink: boolean;
  readOnly: boolean;
}) {
  const labelId = useId();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [sent, setSent] = useState(sentThisMonth);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ClientsApiError | null>(null);

  if (!available) {
    return (
      <GlassCard as="section" aria-labelledby={labelId}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-(--glass-fg-muted)">
            <LockIcon />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={labelId} className={sectionTitle}>
                Automatic review requests
              </h2>
              <GlassBadge tone="info" dot={false} size="sm">
                Pro
              </GlassBadge>
            </div>
            <p className="mt-1 max-w-[60ch] text-[15px] leading-[1.6] text-slate-600">
              Mark a job done and we email your client your Google review link for you. Included
              in the Pro and Premium plans.
            </p>
            <Link
              href="/billing#plans"
              className={cx(glassButtonClass({ variant: "secondary", size: "sm" }), "mt-3")}
            >
              See plans
            </Link>
          </div>
        </div>
      </GlassCard>
    );
  }

  async function toggle(next: boolean) {
    if (readOnly || saving) return;
    setSaving(true);
    setError(null);
    setEnabled(next);
    try {
      const result = await clientsApi("/api/reviews/auto", AutoReviewResponse, {
        method: "PUT",
        body: { enabled: next },
      });
      setEnabled(result.enabled);
      setSent(result.sentThisMonth);
    } catch (err) {
      setEnabled(!next);
      setError(toClientsError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard as="section" aria-labelledby={labelId}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={labelId} className={sectionTitle}>
            {TITLE}
          </h2>
          <p className="mt-1 max-w-[60ch] text-[15px] leading-[1.6] text-slate-600">
            When you mark a job Done in your schedule, we email that client your review link. Once
            per job, and never more than once every 30 days to the same client.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby={labelId}
          disabled={readOnly || saving}
          onClick={() => void toggle(!enabled)}
          className={cx(
            "relative mt-1 inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full bg-slate-300 transition-colors aria-checked:bg-brand disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
            focusRing,
          )}
        >
          <span
            aria-hidden="true"
            className={cx(
              "size-6 rounded-full bg-white shadow transition-transform motion-reduce:transition-none",
              enabled ? "translate-x-7" : "translate-x-1",
            )}
          />
        </button>
      </div>

      <p className={cx(hintClass, "mt-3")}>
        Automatic requests sent this month: <span className="font-semibold">{sent}</span>
      </p>
      {enabled && !hasLink && (
        <p className={hintClass}>Add your Google review link above so the requests can go out.</p>
      )}
      {enabled && (
        <p className={hintClass}>Only clients with an email address get the request.</p>
      )}
      {error && <ErrorNote error={error} className="mt-3" />}
    </GlassCard>
  );
}
