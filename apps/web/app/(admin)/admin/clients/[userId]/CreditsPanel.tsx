"use client";

import type { CreditBalance } from "@nosweat/schema";
import { useActionState } from "react";
import { GlassButton, GlassCard, Notice } from "@/components/glass";
import { fieldClass, labelClass, panelText, panelTitle } from "../../AdminUi";
import type { GrantAccessState } from "./actions";

// Créditos da IA da conta: saldo (cota do mês + comprados) e o ajuste manual do admin (bônus,
// cortesia, compra por Pix). Positivo soma créditos comprados; negativo tira (nunca abaixo de 0).

type CreditAction = (prev: GrantAccessState, formData: FormData) => Promise<GrantAccessState>;

const initialState: GrantAccessState = { ok: true, message: "" };

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass glass-flat rounded-xl px-3.5 py-3">
      <dt className={labelClass}>{label}</dt>
      <dd className="mt-1 font-display text-lg leading-6 font-semibold text-(--glass-fg) tabular-nums">
        {value}
      </dd>
    </div>
  );
}

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
    <GlassCard as="section" aria-labelledby="credits-heading">
      <h2 id="credits-heading" className={panelTitle}>
        AI credits
      </h2>
      {balance ? (
        balance.unlimited ? (
          <p className={`mt-1 ${panelText}`}>Unlimited (admin account).</p>
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <Figure label="Total" value={String(balance.total)} />
            <Figure
              label="Monthly left"
              value={`${balance.monthlyLeft} / ${balance.monthlyAllowance}`}
            />
            <Figure label="Purchased" value={String(balance.topup)} />
            <Figure label="Monthly resets" value={dateFormat.format(new Date(balance.resetsAt))} />
          </dl>
        )
      ) : (
        <p className={`mt-1 ${panelText}`}>We couldn&rsquo;t load the credit balance.</p>
      )}

      <form
        action={formAction}
        className="mt-5 grid gap-3 border-t border-(--glass-rim) pt-5 sm:grid-cols-[8rem_minmax(0,1fr)]"
      >
        <label className={labelClass}>
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
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Note (optional)
          <input
            name="note"
            maxLength={200}
            placeholder="e.g. Pix received Oct 25"
            className={fieldClass}
          />
        </label>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-2">
          <GlassButton type="submit" variant="secondary" loading={pending}>
            {pending ? "Saving…" : "Adjust credits"}
          </GlassButton>
          <p className="min-w-0 flex-1 basis-56 text-[13px] text-(--glass-fg-muted)">
            Positive adds purchased credits (they don&rsquo;t expire). Negative removes purchased
            credits, never below zero.
          </p>
        </div>
      </form>
      {state.message && (
        <Notice tone={state.ok ? "success" : "error"} className="mt-4">
          {state.message}
        </Notice>
      )}
    </GlassCard>
  );
}
