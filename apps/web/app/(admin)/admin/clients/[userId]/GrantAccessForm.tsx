"use client";

import type { PlanId } from "@nosweat/schema";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { ConfirmDialog, GlassButton, GlassSegmented } from "@/components/glass";
import { Notice, fieldClass, labelClass } from "../../AdminUi";
import type { GrantAccessState } from "./actions";

// Formulários do admin para liberar e cortar o acesso manual (Pix/WhatsApp). Componente de
// cliente: mostra "Saving…", trava o botão enquanto salva e mostra o resultado. O campo escondido
// `expected` leva a data final que o admin está vendo: um clique duplo não soma os dias de novo
// (o servidor recusa se a data mudou). Cortar o acesso pede confirmação na folha de vidro.

type AccessAction = (prev: GrantAccessState, formData: FormData) => Promise<GrantAccessState>;

const initialState: GrantAccessState = { ok: true, message: "" };

type Preset = "31" | "365" | "custom";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "31", label: "1 month" },
  { value: "365", label: "1 year" },
  { value: "custom", label: "Custom" },
];

/**
 * Envia sem o reset automático do React (o segmentado é controlado): o formulário só volta ao
 * normal quando a página recarrega com a nova data (a `key` muda e ele é montado de novo).
 */
function submitWith(dispatch: (payload: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };
}

function Result({ state }: { state: GrantAccessState }) {
  if (!state.message) return null;
  return (
    <Notice tone={state.ok ? "success" : "error"} className="mt-4">
      {state.message}
    </Notice>
  );
}

function DaysField({ active }: { active: boolean }) {
  // Anual por padrão: é o que a página de planos sugere primeiro.
  const [preset, setPreset] = useState<Preset>("365");
  return (
    <div className="sm:col-span-2">
      <span className={labelClass}>Days</span>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <GlassSegmented
          aria-label="Days"
          options={PRESETS}
          value={preset}
          onChange={setPreset}
          className="w-full sm:w-auto [&_button]:min-h-10"
        />
        {preset === "custom" ? (
          <input
            name="days"
            type="number"
            inputMode="numeric"
            min={active ? 0 : 1}
            max={3660}
            defaultValue={30}
            required
            aria-label="Number of days"
            className={`${fieldClass} mt-0! w-28`}
          />
        ) : (
          <>
            <input type="hidden" name="days" value={preset} />
            <span className="text-sm text-(--glass-fg-muted) tabular-nums">{preset} days</span>
          </>
        )}
      </div>
    </div>
  );
}

export function GrantAccessForm({
  grantAction,
  revokeAction,
  active,
  grantPlan,
  grantExpiresAt,
  plans,
  enforced,
  emailOn,
}: {
  grantAction: AccessAction;
  revokeAction: AccessAction;
  /** O acesso manual está valendo agora. */
  active: boolean;
  grantPlan: PlanId | null;
  /** Data final salva (mesmo vencida), ou `null` se a conta nunca teve acesso manual. */
  grantExpiresAt: string | null;
  plans: { id: PlanId; name: string }[];
  enforced: boolean;
  /** E-mails ligados (RESEND_API_KEY): o cliente recebe "seu plano está ativo". */
  emailOn: boolean;
}) {
  const [state, dispatch, pending] = useActionState(grantAction, initialState);
  const [revokeState, revokeDispatch, revoking] = useActionState(revokeAction, initialState);
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);
  // Só o resultado da última ação fica à mostra (nada de "removido" velho depois de liberar).
  const [last, setLast] = useState<"grant" | "revoke">("grant");
  const grant = (data: FormData) => {
    setLast("grant");
    dispatch(data);
  };
  const revoke = () => {
    setLast("revoke");
    setConfirmingRevoke(false);
    startTransition(() => revokeDispatch(new FormData()));
  };

  return (
    <>
      <form
        key={grantExpiresAt ?? "none"}
        onSubmit={submitWith(grant)}
        className="mt-5 grid gap-4 border-t border-(--glass-rim) pt-5 sm:grid-cols-3"
      >
        <input type="hidden" name="expected" value={grantExpiresAt ?? "none"} />
        <label className={labelClass}>
          Plan
          <select name="plan" defaultValue={grantPlan ?? "pro"} className={fieldClass}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>
        <DaysField active={active} />
        <label className={`${labelClass} sm:col-span-3`}>
          Note (optional, kept in the history)
          <input
            name="note"
            maxLength={200}
            placeholder="e.g. Pix received Oct 13, $69"
            className={fieldClass}
          />
        </label>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-3">
          <GlassButton type="submit" variant="secondary" loading={pending}>
            {pending ? "Saving…" : active ? "Add days" : "Grant access"}
          </GlassButton>
          {active && (
            <GlassButton
              variant="ghost"
              onClick={() => setConfirmingRevoke(true)}
              loading={revoking}
              className="text-red-700! hover:text-red-800!"
            >
              {revoking ? "Removing…" : "Remove access…"}
            </GlassButton>
          )}
          <p className="basis-full text-[13px] text-(--glass-fg-muted)">
            {active
              ? "Days are added after the current end date. To switch plans without adding time, pick the plan and Custom with 0 days."
              : `Access starts now. They still need to publish their website${
                  emailOn ? " (we email them that the plan is active)" : ""
                }.`}
          </p>
        </div>
      </form>
      {last === "grant" && <Result state={state} />}
      {last === "revoke" && <Result state={revokeState} />}

      <ConfirmDialog
        open={confirmingRevoke}
        title="Remove manual access?"
        confirmLabel="Remove access"
        pendingLabel="Removing…"
        pending={revoking}
        onConfirm={revoke}
        onCancel={() => setConfirmingRevoke(false)}
      >
        <p>
          {enforced
            ? "Their live websites go offline right away."
            : "Plans are off right now, so their websites stay live until plans turn on."}{" "}
          The plan and notes stay in the history.
        </p>
      </ConfirmDialog>
    </>
  );
}
