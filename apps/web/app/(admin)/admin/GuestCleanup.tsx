"use client";

import { useState, useTransition } from "react";
import { focusRing, panelClass, panelText, panelTitle, secondaryButton } from "@/components/DashboardUi";
import { deleteGuestDraftsAction, type AdminActionResult } from "./actions";
import { ConfirmDialog } from "./ConfirmDialog";

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
    <section aria-labelledby="guest-cleanup" className={panelClass}>
      <h2 id="guest-cleanup" className={panelTitle}>
        Guest drafts
      </h2>
      <p className={`mt-1 ${panelText}`}>
        Websites made without an account that never moved to one: {guestCreatedAt.length} right
        now. They are never live. The daily cleanup already deletes the ones older than 30 days.
      </p>
      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          setDialogError(null);
          setResult(null);
          setConfirming(true);
        }}
      >
        <label className="text-sm font-medium text-slate-700">
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
            className={`mt-1.5 block h-11 w-28 rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-ink sm:h-10 ${focusRing}`}
          />
        </label>
        <button type="submit" disabled={!valid || matching === 0} className={secondaryButton}>
          {valid
            ? `Delete ${matching} guest ${matching === 1 ? "draft" : "drafts"}`
            : "Delete guest drafts"}
        </button>
      </form>
      {!valid && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          Use a whole number from 1 to 365.
        </p>
      )}
      {result && (
        <p
          role={result.ok ? "status" : "alert"}
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-700"
          }`}
        >
          {result.message}
        </p>
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
    </section>
  );
}
