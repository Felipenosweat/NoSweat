"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { GlassButton } from "./GlassButton";
import { cx } from "./styles";

// Folha de vidro centralizada (modal). Usa o <dialog> nativo com showModal(): o resto da página
// fica inerte (o foco não sai da folha), Esc fecha, e o foco volta sozinho para quem abriu.
// O estado `open` é do pai: a folha só pede para fechar via `onClose`.

const WIDTHS = {
  sm: "w-[min(24rem,calc(100%-2rem))]",
  md: "w-[min(30rem,calc(100%-2rem))]",
  lg: "w-[min(40rem,calc(100%-2rem))]",
} as const;

export type GlassSheetProps = {
  open: boolean;
  /** Pedido para fechar (Esc, clique fora). O pai muda `open` para false. */
  onClose: () => void;
  title: ReactNode;
  /** Frase de apoio abaixo do título (vira `aria-describedby`). */
  description?: ReactNode;
  children?: ReactNode;
  /** Botões do rodapé, na ordem [Cancelar, Ação] (no celular empilham com a ação em cima). */
  footer?: ReactNode;
  size?: keyof typeof WIDTHS;
  /** Esc e clique fora fecham (padrão true). Desligue durante uma ação em andamento. */
  dismissible?: boolean;
  /** Elemento que recebe o foco ao abrir (padrão: o primeiro focável). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** "alertdialog" para confirmações que interrompem (ex.: apagar). */
  role?: "dialog" | "alertdialog";
  className?: string;
};

export function GlassSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
  initialFocusRef,
  role = "dialog",
  className,
}: GlassSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  // Marca que fomos nós que fechamos (para o evento "close" não avisar o pai de novo).
  const closingRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      initialFocusRef?.current?.focus();
    } else if (!open && dialog.open) {
      closingRef.current = true;
      dialog.close();
    }
  }, [open, initialFocusRef]);

  return (
    <dialog
      ref={ref}
      role={role === "alertdialog" ? "alertdialog" : undefined}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Esc: quem decide é o pai (e nunca no meio de uma ação).
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClose={(event) => {
        if (closingRef.current) {
          closingRef.current = false;
          return;
        }
        // O navegador fechou sozinho (ex.: Esc repetido no Chrome).
        if (dismissible) onClose();
        else event.currentTarget.showModal();
      }}
      onClick={(event) => {
        // O clique no fundo escurecido chega como clique no próprio <dialog> (o conteúdo fica
        // dentro da <div> interna).
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
      className={cx(
        "glass-sheet glass-strong m-auto max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-[28px] border-0 p-0 text-(--glass-fg) backdrop:bg-ink/30",
        WIDTHS[size],
        className,
      )}
    >
      <div className="p-6 sm:p-7">
        <h2
          id={titleId}
          className="font-display text-[19px] leading-7 font-semibold tracking-[-0.012em] break-words"
        >
          {title}
        </h2>
        {description && (
          <p
            id={descriptionId}
            className="mt-1.5 text-[15px] leading-[1.6] text-(--glass-fg-muted)"
          >
            {description}
          </p>
        )}
        {children && <div className="mt-4 text-[15px] leading-[1.6]">{children}</div>}
        {footer && (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}

export type ConfirmDialogProps = {
  open: boolean;
  title: ReactNode;
  /** O que acontece se confirmar (consequências, "não dá para desfazer"). */
  children?: ReactNode;
  confirmLabel: string;
  /** Texto do botão durante a ação (ex.: "Deleting…"). Padrão: `confirmLabel`. */
  pendingLabel?: string;
  pending?: boolean;
  /** Erro da última tentativa (a caixa fica aberta para tentar de novo). */
  error?: string | null;
  /** "destructive" (padrão, vermelho) ou "primary" (azul da marca) para ações que não apagam. */
  tone?: "destructive" | "primary";
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Confirmação em folha de vidro. O foco começa no "Cancel": um Enter sem querer não apaga nada.
 * Durante `pending` nada fecha a caixa.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pendingLabel,
  pending = false,
  error,
  tone = "destructive",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <GlassSheet
      open={open}
      onClose={onCancel}
      title={title}
      role="alertdialog"
      size="sm"
      dismissible={!pending}
      initialFocusRef={cancelRef}
      footer={
        <>
          <GlassButton ref={cancelRef} variant="secondary" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </GlassButton>
          <GlassButton variant={tone} onClick={onConfirm} loading={pending}>
            {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </GlassButton>
        </>
      }
    >
      {children && <div className="text-(--glass-fg-muted)">{children}</div>}
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-red-50/90 px-3 py-2 text-sm text-red-700 glass-edge"
        >
          {error}
        </p>
      )}
    </GlassSheet>
  );
}
