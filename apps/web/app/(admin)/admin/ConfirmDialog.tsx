"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { focusRing, secondaryButton } from "@/components/DashboardUi";

// Caixa de confirmação do painel do admin (<dialog> nativo: prende o foco, Esc fecha). Usada antes
// de tirar um site do ar, apagar sites e fazer a faxina dos rascunhos de visitantes.

const solidButton = `inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-[15px] font-semibold whitespace-nowrap text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 sm:min-h-10 ${focusRing}`;

/** Botão vermelho das ações que apagam. */
export const dangerButton = `${solidButton} bg-red-700 hover:bg-red-800`;

/** Botão escuro das ações que não apagam (tirar do ar). */
export const darkButton = `${solidButton} bg-ink hover:bg-slate-800`;

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pendingLabel,
  pending,
  error,
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  /** Erro da última tentativa (a caixa fica aberta para tentar de novo). */
  error?: string | null;
  /** Botão vermelho (apagar); `false` = botão escuro (tirar do ar). */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="admin-confirm-title"
      onCancel={(event) => {
        // Esc: fecha pelo estado do pai (e nunca no meio da ação).
        event.preventDefault();
        if (!pending) onCancel();
      }}
      className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-2xl border border-slate-200 bg-white p-6 text-ink shadow-xl backdrop:bg-slate-900/40"
    >
      {open && (
        <>
          <h2
            id="admin-confirm-title"
            className="font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] break-words"
          >
            {title}
          </h2>
          {children && (
            <div className="mt-2 text-[15px] leading-[1.6] text-slate-600">{children}</div>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            {/* Foco inicial no Cancelar: Enter sem querer não apaga nada. */}
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              autoFocus
              className={secondaryButton}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className={danger ? dangerButton : darkButton}
            >
              {pending ? pendingLabel : confirmLabel}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
