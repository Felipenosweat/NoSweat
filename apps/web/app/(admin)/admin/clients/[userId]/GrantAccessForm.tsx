"use client";

import type { PlanId } from "@nosweat/schema";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import type { GrantAccessState } from "./actions";

// Formulários do admin para liberar e cortar o acesso manual (Pix/WhatsApp). Componente de
// cliente: mostra "Saving…", trava o botão enquanto salva e mostra o resultado. O campo escondido
// `expected` leva a data final que o admin está vendo: um clique duplo não soma os dias de novo
// (o servidor recusa se a data mudou). Cortar o acesso pede confirmação.

type AccessAction = (prev: GrantAccessState, formData: FormData) => Promise<GrantAccessState>;

const initialState: GrantAccessState = { ok: true, message: "" };

const field =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";

type Preset = "31" | "365" | "custom";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "31", label: "1 month (31 days)" },
  { value: "365", label: "1 year (365 days)" },
  { value: "custom", label: "Custom" },
];

/**
 * Envia sem o reset automático do React (os rádios são controlados): o formulário só volta ao
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
  return state.ok ? (
    <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      {state.message}
    </p>
  ) : (
    <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {state.message}
    </p>
  );
}

function DaysField({ active }: { active: boolean }) {
  // Anual por padrão: é o que a página de planos sugere primeiro.
  const [preset, setPreset] = useState<Preset>("365");
  return (
    <fieldset className="text-sm text-slate-700 sm:col-span-3">
      <legend className="font-medium">Days</legend>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
        {PRESETS.map((option) => (
          <label key={option.value} className="inline-flex min-h-6 items-center gap-2">
            <input
              type="radio"
              name="preset"
              value={option.value}
              checked={preset === option.value}
              onChange={() => setPreset(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
      {preset === "custom" ? (
        <input
          name="days"
          type="number"
          min={active ? 0 : 1}
          max={3660}
          defaultValue={30}
          required
          aria-label="Number of days"
          className={`${field} max-w-[10rem]`}
        />
      ) : (
        <input type="hidden" name="days" value={preset} />
      )}
    </fieldset>
  );
}

/** Botão de cortar o acesso, com confirmação. O resultado fica no pai (ele some depois de cortar). */
function RevokeAccess({
  dispatch,
  pending,
  enforced,
}: {
  dispatch: (payload: FormData) => void;
  pending: boolean;
  enforced: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      {confirming ? (
        <form
          onSubmit={submitWith(dispatch)}
          className="rounded-lg border border-red-200 bg-red-50 p-3"
        >
          <p className="text-sm font-medium text-red-800">
            {enforced
              ? "Remove access? Their live websites go offline right away."
              : "Remove access? Plans are off right now, so their websites stay live until plans turn on."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {pending ? "Removing…" : "Yes, remove"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirming(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm font-semibold text-red-700 hover:underline"
        >
          Remove manual access…
        </button>
      )}
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
  // Só o resultado da última ação fica à mostra (nada de "removido" velho depois de liberar).
  const [last, setLast] = useState<"grant" | "revoke">("grant");
  const grant = (data: FormData) => {
    setLast("grant");
    dispatch(data);
  };
  const revoke = (data: FormData) => {
    setLast("revoke");
    revokeDispatch(data);
  };

  return (
    <>
      <form
        key={grantExpiresAt ?? "none"}
        onSubmit={submitWith(grant)}
        className="mt-5 grid gap-4 sm:grid-cols-4"
      >
        <input type="hidden" name="expected" value={grantExpiresAt ?? "none"} />
        <label className="text-sm font-medium text-slate-700">
          Plan
          <select name="plan" defaultValue={grantPlan ?? "pro"} className={field}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>
        <DaysField active={active} />
        <label className="text-sm font-medium text-slate-700 sm:col-span-4">
          Note (optional, kept in the history)
          <input
            name="note"
            maxLength={200}
            placeholder="e.g. Pix received Oct 13, $69"
            className={field}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {pending ? "Saving…" : active ? "Add days" : "Grant access"}
          </button>
          <span className="text-xs text-slate-500">
            {active
              ? "Days are added after the current end date. To switch plans without adding time, pick the plan and Custom with 0 days."
              : `Access starts now. They still need to publish their website${
                  emailOn ? " (we email them that the plan is active)" : ""
                }.`}
          </span>
        </div>
      </form>
      {last === "grant" && <Result state={state} />}

      {active && <RevokeAccess dispatch={revoke} pending={revoking} enforced={enforced} />}
      {last === "revoke" && <Result state={revokeState} />}
    </>
  );
}
