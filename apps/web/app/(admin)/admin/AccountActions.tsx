"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  ConfirmDialog,
  GlassButton,
  GlassMenu,
  GlassSheet,
  type GlassMenuItem,
} from "@/components/glass";
import { Notice, fieldClass, labelClass } from "./AdminUi";
import { deleteAccountAction, type DeleteAccountState } from "./actions";
import {
  setLoginDisabledAction,
  startViewAs,
  type GrantAccessState,
} from "./clients/[userId]/actions";

// Ações de uma conta no admin, num menu "⋯" (lista de contas e ficha da conta): ver como,
// gerenciar, desligar/religar o login e apagar. As folhas de confirmação ficam UMA vez por lista
// (não uma por linha). Conta de teste: confirmar na folha basta. Conta de verdade (pedido de
// exclusão do cliente): digitar o e-mail dela. O servidor confere tudo de novo.

export type AccountTarget = {
  id: string;
  email: string | null;
  /** Nome para mostrar (nome, e-mail ou id). */
  label: string;
  testAccount: boolean;
  loginDisabled: boolean;
  /** Não é admin nem a própria conta: pode desligar o login e apagar. */
  canModify: boolean;
  /** É a conta de quem está logado (sem "ver como"). */
  self: boolean;
  websites: number;
};

type Dialog =
  | { kind: "login-off"; target: AccountTarget }
  | { kind: "delete-test"; target: AccountTarget }
  | { kind: "delete-customer"; target: AccountTarget };

type Result = { ok: boolean; message: string };

const OFFLINE = "We couldn't reach our servers. Try again.";

function websitesLabel(count: number): string {
  return `${count} ${count === 1 ? "website" : "websites"}`;
}

/**
 * Estado e folhas das ações de conta. `manageEnabled = false` sem Supabase (dev local): login e
 * exclusão precisam da API de administração do Supabase Auth.
 */
export function useAccountActions({ manageEnabled }: { manageEnabled: boolean }) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();

  const openDialog = (next: Dialog) => {
    setDialogError(null);
    setConfirmText("");
    setDialog(next);
  };
  const closeDialog = () => {
    if (pending) return;
    setDialog(null);
    setDialogError(null);
  };

  const viewAs = (target: AccountTarget) => {
    setResult(null);
    startTransition(async () => {
      try {
        // Grava o cookie e redireciona para o /dashboard da conta vista.
        await startViewAs(target.id);
      } catch {
        setResult({ ok: false, message: OFFLINE });
      }
    });
  };

  const setLogin = (target: AccountTarget, disabled: boolean) => {
    const data = new FormData();
    data.set("disabled", disabled ? "true" : "false");
    startTransition(async () => {
      let response: GrantAccessState;
      try {
        response = await setLoginDisabledAction(target.id, { ok: true, message: "" }, data);
      } catch {
        response = { ok: false, message: OFFLINE };
      }
      if (!response.ok && dialog) {
        setDialogError(response.message);
        return;
      }
      setDialog(null);
      setResult(response);
    });
  };

  const deleteAccount = (target: AccountTarget, test: boolean) => {
    const data = new FormData();
    data.set("userId", target.id);
    data.set("kind", test ? "test" : "customer");
    if (test) data.set("confirm", "DELETE");
    else data.set("confirmEmail", confirmText);
    startTransition(async () => {
      // Deu certo: a ação redireciona para a lista de contas (não volta resposta).
      let response: DeleteAccountState | undefined;
      try {
        response = await deleteAccountAction({ error: null }, data);
      } catch {
        response = { error: OFFLINE };
      }
      if (response?.error) setDialogError(response.error);
    });
  };

  /** Itens do menu "⋯" da conta. */
  const itemsFor = (
    target: AccountTarget,
    opts: { viewAs?: boolean; manageLink?: boolean; customerDelete?: boolean } = {},
  ): GlassMenuItem[] => {
    const items: GlassMenuItem[] = [];
    if (opts.viewAs !== false && !target.self) {
      items.push({ label: "View as", onSelect: () => viewAs(target), key: "view-as" });
    }
    if (opts.manageLink !== false) {
      items.push({
        type: "link",
        label: "Manage",
        href: `/admin/clients/${target.id}`,
        key: "manage",
      });
    }
    if (!target.canModify) return items;
    if (items.length > 0) items.push({ type: "separator", key: "sep" });
    items.push(
      target.loginDisabled
        ? {
            label: "Re-enable login",
            onSelect: () => setLogin(target, false),
            disabled: !manageEnabled || pending,
            key: "login",
          }
        : {
            label: "Disable login…",
            onSelect: () => openDialog({ kind: "login-off", target }),
            disabled: !manageEnabled || pending,
            key: "login",
          },
    );
    if (target.testAccount) {
      items.push({
        label: "Delete test account…",
        destructive: true,
        disabled: !manageEnabled,
        onSelect: () => openDialog({ kind: "delete-test", target }),
        key: "delete",
      });
    } else if (opts.customerDelete) {
      items.push({
        label: "Delete account…",
        destructive: true,
        disabled: !manageEnabled,
        onSelect: () => openDialog({ kind: "delete-customer", target }),
        key: "delete",
      });
    }
    return items;
  };

  const target = dialog?.target ?? null;
  const expected = target ? (target.email ?? target.id) : "";
  const typedOk = confirmText.trim().toLowerCase() === expected.trim().toLowerCase();

  const dialogs: ReactNode = (
    <>
      <ConfirmDialog
        open={dialog?.kind === "login-off"}
        title={`Disable login for ${target?.email ?? target?.label ?? "this account"}?`}
        confirmLabel="Disable login"
        pendingLabel="Saving…"
        tone="primary"
        pending={pending}
        error={dialogError}
        onConfirm={() => {
          if (target) setLogin(target, true);
        }}
        onCancel={closeDialog}
      >
        <p>
          They can&rsquo;t log in or refresh their session anymore (an open session ends within an
          hour). Nothing is deleted and their live websites stay live. You can re-enable it
          anytime.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog?.kind === "delete-test"}
        title={`Delete the test account ${target?.label ?? ""}?`}
        confirmLabel="Delete forever"
        pendingLabel="Deleting…"
        pending={pending}
        error={dialogError}
        onConfirm={() => {
          if (target) deleteAccount(target, true);
        }}
        onCancel={closeDialog}
      >
        <p>
          Deletes the account for good, with its {websitesLabel(target?.websites ?? 0)} (taken
          offline, domains released), clients, posts and plan. This can&rsquo;t be undone.
        </p>
      </ConfirmDialog>

      <GlassSheet
        open={dialog?.kind === "delete-customer"}
        onClose={closeDialog}
        role="alertdialog"
        size="sm"
        dismissible={!pending}
        title={`Delete ${target?.label ?? "this account"}?`}
        description="Only when the customer asked to delete their data."
        footer={
          <>
            <GlassButton variant="secondary" onClick={closeDialog} disabled={pending}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="destructive"
              disabled={!typedOk}
              loading={pending}
              onClick={() => {
                if (target && typedOk) deleteAccount(target, false);
              }}
            >
              {pending ? "Deleting…" : "Delete account"}
            </GlassButton>
          </>
        }
      >
        <p className="text-(--glass-fg-muted)">
          Deletes the account for good, with its {websitesLabel(target?.websites ?? 0)} (taken
          offline, domains released), clients, posts and plan. This can&rsquo;t be undone. A card
          subscription must be canceled in Stripe first.
        </p>
        <label className={`mt-4 ${labelClass}`}>
          {target?.email ? "Type the account’s email to confirm" : "Type the account id to confirm"}
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={expected}
            className={`${fieldClass} font-mono`}
          />
        </label>
        {dialogError && (
          <p
            role="alert"
            className="glass-edge mt-3 rounded-xl bg-red-50/90 px-3 py-2 text-sm text-red-700"
          >
            {dialogError}
          </p>
        )}
      </GlassSheet>
    </>
  );

  const notice: ReactNode = result ? (
    <Notice tone={result.ok ? "success" : "error"} onDismiss={() => setResult(null)}>
      {result.message}
    </Notice>
  ) : null;

  return { itemsFor, dialogs, notice, pending };
}

/** Menu "⋯" de uma conta só (ficha da conta), com as folhas e o aviso do resultado. */
export function AccountMenu({
  target,
  manageEnabled,
}: {
  target: AccountTarget;
  manageEnabled: boolean;
}) {
  const { itemsFor, dialogs, notice } = useAccountActions({ manageEnabled });
  const items = itemsFor(target, { viewAs: false, manageLink: false, customerDelete: true });
  return (
    <>
      {items.length > 0 && (
        <GlassMenu
          items={items}
          label={`More actions for ${target.label}`}
          triggerVariant="secondary"
        />
      )}
      {notice && <div className="basis-full">{notice}</div>}
      {dialogs}
    </>
  );
}
