"use client";

import { useActionState, useState } from "react";
import { focusRing, panelText } from "@/components/DashboardUi";
import { deleteAccountAction, type DeleteAccountState } from "../../actions";

// "Danger zone" da conta: aparece para toda conta que não é admin nem a própria (o servidor
// confere de novo). Conta de teste: digitar DELETE. Conta de verdade (pedido de exclusão do
// cliente): digitar o e-mail dela. Vai embora tudo: sites (com os domínios liberados), clientes,
// posts, plano e a conta.

const initialState: DeleteAccountState = { error: null };

export function DeleteTestAccount({
  userId,
  sites,
  testAccount,
  email,
}: {
  userId: string;
  sites: number;
  testAccount: boolean;
  /** E-mail da conta (para a confirmação de conta de verdade); sem e-mail, digita o id. */
  email: string | null;
}) {
  const [confirm, setConfirm] = useState("");
  const [state, formAction, pending] = useActionState(deleteAccountAction, initialState);
  const expected = testAccount ? "DELETE" : (email ?? userId);
  const ready = testAccount
    ? confirm.trim() === "DELETE"
    : confirm.trim().toLowerCase() === expected.trim().toLowerCase();
  const websites = `${sites} ${sites === 1 ? "website" : "websites"}`;

  return (
    <section
      aria-labelledby="danger-zone"
      className="rounded-xl border border-red-200 bg-white p-5 sm:p-6"
    >
      <h2
        id="danger-zone"
        className="font-display text-[15px] leading-6 font-semibold text-red-800"
      >
        {testAccount ? "Delete this test account" : "Delete this account"}
      </h2>
      <p className={`mt-1 ${panelText}`}>
        {testAccount
          ? `Deletes the account for good, with its ${websites} (taken offline, domains released), clients, posts and plan. This can’t be undone.`
          : `Only when the customer asked to delete their data. Deletes the account for good, with its ${websites} (taken offline, domains released), clients, posts and plan. This can’t be undone. A card subscription must be canceled in Stripe first.`}
      </p>
      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="kind" value={testAccount ? "test" : "customer"} />
        <label className="min-w-0 text-sm font-medium text-slate-700">
          {testAccount
            ? "Type DELETE to confirm"
            : email
              ? "Type the account’s email to confirm"
              : "Type the account id to confirm"}
          <input
            name={testAccount ? "confirm" : "confirmEmail"}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={testAccount ? undefined : expected}
            className={`mt-1.5 block h-11 rounded-lg border border-slate-300 bg-white px-3 font-mono text-[15px] text-ink sm:h-10 ${
              testAccount ? "w-48" : "w-full max-w-sm sm:w-80"
            } ${focusRing}`}
          />
        </label>
        <button
          type="submit"
          disabled={!ready || pending}
          className={`inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:min-h-10 ${focusRing}`}
        >
          {pending ? "Deleting…" : testAccount ? "Delete test account" : "Delete account"}
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
