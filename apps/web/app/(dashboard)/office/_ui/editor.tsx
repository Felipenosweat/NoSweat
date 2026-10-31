"use client";

import { useEffect, type ReactNode } from "react";
import { GlassButton, GlassCard, cx, focusRing } from "@/components/glass";
import { SendIcon } from "./ui";

// Peças comuns dos editores de orçamento e fatura: a barra "Unsaved changes · Discard · Save"
// (salvar é sempre explícito: nada vai para o cliente sem o dono apertar Save ou Send), a barra
// do rascunho (Send é a ação principal), a seção "More options" e o aviso do navegador ao sair
// com mudanças sem salvar.

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

/**
 * Barra grudada embaixo de um rascunho (documento novo ou ainda não enviado). "Send" é o único
 * botão azul da tela; "Save draft" fica ao lado, secundário. No celular a frase ocupa a primeira
 * linha e os botões a segunda (Send esticado, ao alcance do polegar).
 */
export function DraftBar({
  sendLabel,
  onSend,
  sending,
  onSave,
  saving,
  saveLabel = "Save draft",
  onDiscard,
  busy,
  message = "Only you see this until you send it.",
  warning,
}: {
  sendLabel: string;
  onSend: () => void;
  sending: boolean;
  /** Sem `onSave`, não há o que salvar (rascunho já salvo e sem mudanças). */
  onSave?: () => void;
  saving: boolean;
  saveLabel?: string;
  /** Sem `onDiscard` (documento novo ou sem mudanças), não há o que desfazer. */
  onDiscard?: () => void;
  /** Algum pedido em andamento: trava os outros botões. */
  busy: boolean;
  message?: string;
  /** Aviso no lugar da frase (ex.: linha sem preço). */
  warning?: string | null;
}) {
  return (
    <div className="sticky bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] z-20 mt-6 lg:bottom-4 print:hidden">
      <div
        role="region"
        aria-label="Send"
        className="glass-strong flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[26px] py-2 pr-2 pl-4"
      >
        <div className="flex min-h-11 min-w-0 basis-full items-center gap-2 sm:flex-1 sm:basis-auto">
          <p
            className={cx(
              "min-w-0 flex-1 text-[13px] leading-5 sm:text-[15px]",
              warning ? "font-semibold text-amber-800" : "text-slate-600",
            )}
          >
            {warning ?? message}
          </p>
          {onDiscard && (
            <GlassButton variant="ghost" onClick={onDiscard} disabled={busy}>
              Discard
            </GlassButton>
          )}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          {onSave && (
            <GlassButton
              variant="secondary"
              onClick={onSave}
              loading={saving}
              disabled={busy && !saving}
            >
              {saving ? "Saving…" : saveLabel}
            </GlassButton>
          )}
          <GlassButton
            variant="primary"
            icon={<SendIcon />}
            onClick={onSend}
            loading={sending}
            disabled={busy && !sending}
            className="max-sm:flex-1"
          >
            {sendLabel}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

/** Dias de `today` até `date` (datas "AAAA-MM-DD", contadas em UTC). Negativo = já passou. */
export function daysUntil(date: string, today: string): number {
  const toUtc = (value: string) => {
    const [y = 2000, m = 1, d = 1] = value.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(date) - toUtc(today)) / 86_400_000);
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/**
 * Resumo da seção "More options" fechada: "Good for 30 days · No message" (orçamento) ou
 * "Due in 14 days · No message" (fatura). Com título, ele vem antes.
 */
export function optionsSummary({
  kind,
  title,
  message,
  date,
  today,
}: {
  kind: "estimate" | "invoice";
  title: string;
  message: string;
  date: string;
  today: string;
}): string {
  let when: string;
  if (!date) {
    when = kind === "estimate" ? "No end date" : "Due on receipt";
  } else {
    const days = daysUntil(date, today);
    if (kind === "estimate") {
      when =
        days > 0
          ? `Good for ${plural(days, "day")}`
          : days === 0
            ? "Good through today"
            : "Already expired";
    } else {
      when = days > 0 ? `Due in ${plural(days, "day")}` : days === 0 ? "Due today" : "Past due";
    }
  }
  const parts = [when, message.trim() ? "Message added" : "No message"];
  const cleanTitle = title.trim();
  if (cleanTitle) parts.unshift(`“${cleanTitle}”`);
  return parts.join(" · ");
}

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <path d="m6 9.5 6 6 6-6" />
  </svg>
);

/**
 * Cartão "More options" (título, mensagem, data): fechado mostra só o resumo. O editor abre
 * sozinho quando um desses campos tem erro (ao salvar).
 */
export function MoreOptions({
  id,
  open,
  onToggle,
  summary,
  children,
}: {
  id: string;
  open: boolean;
  onToggle: () => void;
  summary: string;
  children: ReactNode;
}) {
  return (
    <GlassCard as="section" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={open ? `${id}-panel` : undefined}
          className={`-m-2 flex min-h-11 w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-xl p-2 text-left ${focusRing}`}
        >
          <span className="min-w-0">
            <span className="block font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] text-ink">
              More options
            </span>
            <span className="block truncate text-[13px] leading-5 font-normal text-(--glass-fg-muted)">
              {summary}
            </span>
          </span>
          <ChevronIcon
            className={cx(
              "size-5 shrink-0 text-(--glass-fg-muted) motion-safe:transition-transform motion-safe:duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </h2>
      {open && (
        <div id={`${id}-panel`} className="mt-5 grid gap-5">
          {children}
        </div>
      )}
    </GlassCard>
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
