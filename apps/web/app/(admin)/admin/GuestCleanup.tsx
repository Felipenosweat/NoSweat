"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog, GlassButton, GlassCard, Notice } from "@/components/glass";
import { fieldClass, labelClass, panelText, panelTitle } from "./AdminUi";
import { deleteGuestDraftsAction, type AdminActionResult } from "./actions";

// Faxina dos rascunhos de visitantes (sites criados sem conta que nunca foram para uma conta).
// O cron diário já apaga os de mais de 30 dias; aqui o admin escolhe o número de dias.

const DAY_MS = 24 * 60 * 60 * 1000;

export function GuestCleanup({
  guestCreatedAt,
  now,
}: {
  /** Data de criação (ms) de cada rascunho de visitante. */
  guestCreatedAt: number[];
  /** Relógio do servidor na hora da página (a contagem não muda entre servidor e navegador). */
  now: number;
}) {
  const [days, setDays] = useState("7");
  const [confirming, setConfirming] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const n = Number(days);
  const valid = Number.isInteger(n) && n >= 1 && n <= 365;
  const matching = valid
    ? guestCreatedAt.filter((created) => created < now - n * DAY_MS).length
    : 0;
  const dayWord = n === 1 ? "day" : "days";

  const run = () => {
    startTransition(async () => {
      let response: AdminActionResult;
      try {
        response = await deleteGuestDraftsAction({ days: n });
      } catch {
        response = { ok: false, message: "We couldn't reach our servers. Try again." };
      }
      if (!response.ok) {
        setDialogError(response.message);
        return;
      }
      setConfirming(false);
      setResult(response);
    });
  };

  return (
    <GlassCard as="section" aria-labelledby="guest-cleanup">
      <h2 id="guest-cleanup" className={panelTitle}>
        Guest drafts{" "}
        <span className="font-medium text-(--glass-fg-muted) tabular-nums">
          · {guestCreatedAt.length}
        </span>
      </h2>
      <p className={`mt-1 ${panelText}`}>
        Websites made without an account that never moved to one. They are never live. The daily
        cleanup already deletes the ones older than 30 days.
      </p>
      <form
        className="mt-5 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          setDialogError(null);
          setResult(null);
          setConfirming(true);
        }}
      >
        <label className={labelClass}>
          Older than (days)
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={365}
            step={1}
            required
            value={days}
            onChange={(event) => setDays(event.target.value)}
            className={`${fieldClass} w-28`}
          />
        </label>
        <GlassButton type="submit" variant="secondary" disabled={!valid || matching === 0}>
          {valid
            ? `Delete ${matching} guest ${matching === 1 ? "draft" : "drafts"}…`
            : "Delete guest drafts…"}
        </GlassButton>
      </form>
      {!valid && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          Use a whole number from 1 to 365.
        </p>
      )}
      {result && (
        <Notice
          tone={result.ok ? "success" : "error"}
          onDismiss={() => setResult(null)}
          className="mt-4"
        >
          {result.message}
        </Notice>
      )}

      <ConfirmDialog
        open={confirming}
        title={`Delete guest drafts older than ${n} ${dayWord}?`}
        confirmLabel="Delete forever"
        pendingLabel="Deleting…"
        pending={pending}
        error={dialogError}
        onConfirm={run}
        onCancel={() => {
          if (!pending) setConfirming(false);
        }}
      >
        <p>
          About {matching} {matching === 1 ? "website" : "websites"} made by visitors without an
          account. Visitors who come back won&rsquo;t find them. This can&rsquo;t be undone.
        </p>
      </ConfirmDialog>
    </GlassCard>
  );
}
