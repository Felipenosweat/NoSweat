"use client";

import type { CreditBalance } from "@nosweat/schema";
import { useActionState } from "react";
import {
  focusRing,
  panelClass,
  panelText,
  panelTitle,
  secondaryButton,
} from "@/components/DashboardUi";
import type { GrantAccessState } from "./actions";

// Créditos da IA da conta: saldo (cota do mês + comprados) e o ajuste manual do admin (bônus,
// cortesia, compra por Pix). Positivo soma créditos comprados; negativo tira (nunca abaixo de 0).

type CreditAction = (prev: GrantAccessState, formData: FormData) => Promise<GrantAccessState>;

const initialState: GrantAccessState = { ok: true, message: "" };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

const field = `mt-1.5 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-ink sm:h-10 ${focusRing}`;

export function CreditsPanel({
  balance,
  action,
}: {
  /** `null` = não deu para ler o saldo. */
  balance: CreditBalance | null;
  action: CreditAction;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section aria-labelledby="credits-heading" className={panelClass}>
      <h2 id="credits-heading" className={panelTitle}>
        AI credits
      </h2>
      {balance ? (
        balance.unlimited ? (
          <p className={`mt-1 ${panelText}`}>Unlimited (admin account).</p>
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Total</dt>
              <dd className="font-semibold text-ink tabular-nums">{balance.total}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Monthly left</dt>
              <dd className="font-semibold text-ink tabular-nums">
                {balance.monthlyLeft} / {balance.monthlyAllowance}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Purchased</dt>
              <dd className="font-semibold text-ink tabular-nums">{balance.topup}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Monthly resets</dt>
              <dd className="font-semibold text-ink">
                {dateFormat.format(new Date(balance.resetsAt))}
              </dd>
            </div>
          </dl>
        )
      ) : (
        <p className={`mt-1 ${panelText}`}>We couldn&rsquo;t load the credit balance.</p>
      )}

      <form
        action={formAction}
        className="mt-5 grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-end"
      >
        <label className="text-sm font-medium text-slate-700">
          Credits (+/−)
          <input
            name="delta"
            type="number"
            inputMode="numeric"
            step={1}
            min={-100000}
            max={100000}
            required
            placeholder="e.g. 50"
            className={field}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Note (optional)
          <input
            name="note"
            maxLength={200}
            placeholder="e.g. Pix received Oct 25"
            className={field}
          />
        </label>
        <button type="submit" disabled={pending} className={secondaryButton}>
          {pending ? "Saving…" : "Adjust credits"}
        </button>
      </form>
      <p className="mt-2 text-[13px] text-slate-500">
        Positive adds purchased credits (they don&rsquo;t expire). Negative removes purchased
        credits, never below zero.
      </p>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${
            state.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}
    </section>
  );
}
