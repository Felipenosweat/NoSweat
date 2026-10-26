"use client";

import { useEffect, type ReactNode } from "react";
import { GlassButton } from "@/components/glass";

// Peças comuns dos editores de orçamento e fatura: a barra "Unsaved changes · Discard · Save"
// (salvar é sempre explícito: nada vai para o cliente sem o dono apertar Save ou Send) e o aviso
// do navegador ao sair com mudanças sem salvar.

const LEAVE_MESSAGE = "You have unsaved changes. Leave without saving?";

/** Link que troca de tela dentro do app (não abre aba nova, não é âncora, tel:, sms:...). */
function inAppLeaveTarget(event: MouseEvent): HTMLAnchorElement | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!(target instanceof HTMLAnchorElement)) return null;
  if (target.target && target.target !== "_self") return null;
  if (target.hasAttribute("download")) return null;
  const url = new URL(target.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  // Mesmo endereço (só muda o #): não sai da tela.
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return null;
  }
  return target;
}

/**
 * Mudanças sem salvar: aviso nativo do navegador ao fechar/recarregar a aba e um `confirm()` ao
 * tocar num link do app (barra lateral, "‹ Estimates", "Open client"...). O clique é pego na fase
 * de captura do `document`, antes do <Link> do Next, que então nem chega a navegar.
 */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Navegadores antigos pedem o returnValue.
      event.returnValue = "";
    }
    function onClick(event: MouseEvent) {
      if (!inAppLeaveTarget(event)) return;
      if (window.confirm(LEAVE_MESSAGE)) return;
      event.preventDefault();
      event.stopPropagation();
    }
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);
}

/**
 * Barra grudada embaixo (acima das abas do celular) enquanto houver algo para salvar. Tem o único
 * botão azul da tela nesse momento.
 */
export function SaveBar({
  show,
  saving,
  onSave,
  onDiscard,
  label = "Save",
  message = "Unsaved changes",
}: {
  show: boolean;
  saving: boolean;
  onSave: () => void;
  /** Sem `onDiscard` (documento novo), não há o que desfazer. */
  onDiscard?: () => void;
  label?: string;
  message?: string;
}) {
  if (!show) return null;
  return (
    <div className="sticky bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] z-20 mt-6 lg:bottom-4 print:hidden">
      <div
        role="region"
        aria-label="Save changes"
        className="glass-strong flex items-center gap-2 rounded-[26px] py-2 pr-2 pl-4"
      >
        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{message}</p>
        {onDiscard && (
          <GlassButton variant="ghost" onClick={onDiscard} disabled={saving}>
            Discard
          </GlassButton>
        )}
        <GlassButton variant="primary" onClick={onSave} loading={saving}>
          {saving ? "Saving…" : label}
        </GlassButton>
      </div>
    </div>
  );
}

/** Título de um cartão do editor. */
export function CardHeading({
  id,
  children,
  aside,
}: {
  id?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-4 flex min-h-8 items-center justify-between gap-3">
      <h2
        id={id}
        className="font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] text-ink"
      >
        {children}
      </h2>
      {aside}
    </div>
  );
}
