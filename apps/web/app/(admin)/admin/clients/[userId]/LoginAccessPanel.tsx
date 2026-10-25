"use client";

import { startTransition, useActionState, useState } from "react";
import { panelClass, panelText, panelTitle, secondaryButton } from "@/components/DashboardUi";
import { ConfirmDialog } from "../../ConfirmDialog";
import type { GrantAccessState } from "./actions";

// Desligar / religar o login da conta (ban do Supabase Auth). Para contas de verdade é o jeito
// de bloquear sem apagar nada (proteção de dados). Não aparece para admins nem para a própria conta
// (o servidor confere de novo).

type LoginAction = (prev: GrantAccessState, formData: FormData) => Promise<GrantAccessState>;

const initialState: GrantAccessState = { ok: true, message: "" };

export function LoginAccessPanel({
  action,
  disabled,
  email,
  enabled,
}: {
  action: LoginAction;
  /** O login está desligado agora. */
  disabled: boolean;
  email: string | null;
  /** `false` sem Supabase (dev local): não dá para mudar. */
  enabled: boolean;
}) {
  const [state, dispatch, pending] = useActionState(action, initialState);
  const [confirming, setConfirming] = useState(false);

  const submit = () => {
    const data = new FormData();
    data.set("disabled", disabled ? "false" : "true");
    startTransition(() => dispatch(data));
    setConfirming(false);
  };

  return (
    <section aria-labelledby="login-heading" className={panelClass}>
      <h2 id="login-heading" className={panelTitle}>
        Login
      </h2>
      <p className={`mt-1 ${panelText}`}>
        {disabled
          ? "Login is disabled: this account can't log in. Their websites, clients and plan are untouched."
          : "This account can log in. Disabling the login blocks it without deleting anything; you can re-enable it anytime."}
      </p>
      {!enabled && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Needs Supabase: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then reload.
        </p>
      )}
      <div className="mt-4">
        <button
          type="button"
          disabled={!enabled || pending}
          onClick={() => (disabled ? submit() : setConfirming(true))}
          className={secondaryButton}
        >
          {pending ? "Saving…" : disabled ? "Re-enable login" : "Disable login"}
        </button>
      </div>
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

      <ConfirmDialog
        open={confirming}
        title={`Disable login for ${email ?? "this account"}?`}
        confirmLabel="Disable login"
        pendingLabel="Saving…"
        pending={pending}
        danger={false}
        onConfirm={submit}
        onCancel={() => setConfirming(false)}
      >
        <p>
          They can&rsquo;t log in or refresh their session anymore (an open session ends within an
          hour). Nothing is deleted and their live websites stay live.
        </p>
      </ConfirmDialog>
    </section>
  );
}
