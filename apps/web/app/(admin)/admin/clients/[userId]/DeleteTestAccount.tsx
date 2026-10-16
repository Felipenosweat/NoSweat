"use client";

import { useActionState, useState } from "react";
import { focusRing, panelText } from "@/components/DashboardUi";
import { deleteTestAccountAction, type DeleteTestAccountState } from "../../actions";

// "Danger zone" da conta de teste: só aparece para contas de teste (o servidor confere de novo).
// Apagar exige digitar DELETE; vai embora tudo: sites (com os domínios liberados), clientes,
// posts, plano e a conta.

const initialState: DeleteTestAccountState = { error: null };

export function DeleteTestAccount({ userId, sites }: { userId: string; sites: number }) {
  const [confirm, setConfirm] = useState("");
  const [state, formAction, pending] = useActionState(deleteTestAccountAction, initialState);
  const ready = confirm.trim() === "DELETE";

  return (
    <section
      aria-labelledby="danger-zone"
      className="rounded-xl border border-red-200 bg-white p-5 sm:p-6"
    >
      <h2
        id="danger-zone"
        className="font-display text-[15px] leading-6 font-semibold text-red-800"
      >
        Delete this test account
      </h2>
      <p className={`mt-1 ${panelText}`}>
        Deletes the account for good, with its {sites} {sites === 1 ? "website" : "websites"} (taken
        offline, domains released), clients, posts and plan. This can&rsquo;t be undone.
      </p>
      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="userId" value={userId} />
        <label className="text-sm font-medium text-slate-700">
          Type DELETE to confirm
          <input
            name="confirm"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className={`mt-1.5 block h-11 w-48 rounded-lg border border-slate-300 bg-white px-3 font-mono text-[15px] text-ink sm:h-10 ${focusRing}`}
          />
        </label>
        <button
          type="submit"
          disabled={!ready || pending}
          className={`inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:min-h-10 ${focusRing}`}
        >
          {pending ? "Deleting…" : "Delete test account"}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </section>
  );
}
