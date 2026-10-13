"use client";

import { create as createQr } from "qrcode";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  SiteUrlLine,
  focusRing,
  markShared,
  primaryButton,
  secondaryButton,
  textButton,
} from "@/components/DashboardUi";

/** QR code desenhado como SVG (um <path> só), na cor do texto: nada de canvas nem imagem. */
function QrCode({ value, className = "" }: { value: string; className?: string }) {
  const { size, path } = useMemo(() => {
    const { modules } = createQr(value, { errorCorrectionLevel: "M" });
    let d = "";
    for (let row = 0; row < modules.size; row++) {
      for (let col = 0; col < modules.size; col++) {
        if (modules.get(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { size: modules.size, path: d };
  }, [value]);

  return (
    <svg
      viewBox={`-2 -2 ${size + 4} ${size + 4}`}
      role="img"
      aria-label={`QR code for ${value}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect x={-2} y={-2} width={size + 4} height={size + 4} className="fill-white" />
      <path d={path} className="fill-ink" />
    </svg>
  );
}

function subscribeNothing() {
  return () => {};
}

/** O navegador tem a folha de compartilhamento nativa (celulares, Safari)? */
function useCanWebShare(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );
}

const shareLink = `inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-ink transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 ${focusRing}`;

/**
 * "You're live." depois de publicar: link, copiar, QR code e atalhos de compartilhamento.
 * <dialog> nativo com showModal(): prende o foco, Esc fecha e o foco volta para quem abriu.
 */
export function PublishDialog({
  open,
  onClose,
  url,
  siteId,
  siteName,
  returnFocusTo,
  showDomainAction = true,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  siteId: string;
  siteName: string;
  /** Plano B para o foco ao fechar, se o botão que abriu sumiu (ex.: "Publish" virou "Share"). */
  returnFocusTo?: () => HTMLElement | null;
  /** Mostra "Connect your domain" (some quando o site já tem domínio próprio). */
  showDomainAction?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const copyRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  // "Connect your domain" leva o foco para o campo de domínio; aí não devolvemos ao botão.
  const skipReturnFocus = useRef(false);
  const [copied, setCopied] = useState(false);
  const canShare = useCanWebShare();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      openerRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      // Foco inicial na ação principal (copiar), não no primeiro link.
      copyRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  function handleClose() {
    onClose();
    if (skipReturnFocus.current) {
      skipReturnFocus.current = false;
      return;
    }
    // Devolve o foco: para quem abriu, ou para o plano B se ele não está mais na página.
    const opener = openerRef.current;
    const target = opener?.isConnected ? opener : returnFocusTo?.();
    target?.focus();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      markShared(siteId);
    } catch {
      // Sem permissão de área de transferência: o link continua visível para copiar na mão.
    }
  }

  async function webShare() {
    try {
      await navigator.share({ title: siteName, text: `${siteName}: our new website`, url });
      markShared(siteId);
    } catch {
      // Cancelado pela pessoa: nada a fazer.
    }
  }

  function goToDomain() {
    skipReturnFocus.current = true;
    dialogRef.current?.close();
    const input = document.getElementById("domain-input");
    const section = document.getElementById("domain");
    section?.scrollIntoView({ block: "start" });
    (input ?? section)?.focus({ preventScroll: true });
  }

  const message = `Our new website is live: ${url}`;
  const shares = [
    { label: "Text", href: `sms:?&body=${encodeURIComponent(message)}`, external: false },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      external: true,
    },
    {
      label: "Nextdoor",
      href: `https://nextdoor.com/sharekit/?source=nosweatfd.com&body=${encodeURIComponent(message)}`,
      external: true,
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="publish-dialog-title"
      onClose={handleClose}
      onClick={(event) => {
        // Clique no fundo escuro (fora da caixa) fecha.
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      className="m-auto w-[calc(100%-2.5rem)] max-w-[580px] rounded-xl border border-slate-200 bg-white p-0 text-ink shadow-[0_1px_2px_rgb(7_27_51/.06),0_24px_48px_-12px_rgb(7_27_51/.25)] backdrop:bg-ink/40 open:scale-100 open:opacity-100 motion-safe:transition-[opacity,scale] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(.2,.8,.2,1)] motion-safe:starting:open:scale-[0.98] motion-safe:starting:open:opacity-0"
    >
      {open && (
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2
              id="publish-dialog-title"
              className="font-display text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.03em]"
            >
              You&rsquo;re live.
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className={`-mt-1 -mr-2 inline-flex size-11 items-center justify-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-slate-50 hover:text-ink ${focusRing}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-[15px] leading-[1.6] text-slate-600">
            Anyone with this link can see {siteName}. Send it to a few customers first.
          </p>

          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-surface p-3 sm:flex-row sm:items-center sm:pl-4">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className={`min-w-0 flex-1 rounded-lg text-[17px] leading-7 hover:underline hover:decoration-slate-300 hover:underline-offset-4 ${focusRing}`}
            >
              <SiteUrlLine url={url} caret />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <button
              ref={copyRef}
              type="button"
              onClick={copy}
              className={`${primaryButton} sm:w-28`}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p aria-live="polite" className="sr-only">
            {copied ? "Link copied" : ""}
          </p>

          <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
            <figure className="flex items-center gap-4 sm:block">
              <QrCode
                value={url}
                className="size-28 shrink-0 rounded-xl ring-1 ring-slate-200 sm:size-32"
              />
              <figcaption className="text-[13px] text-slate-500 sm:mt-2 sm:text-center">
                Open on your phone
              </figcaption>
            </figure>

            <div>
              <p className="text-[13px] font-medium text-slate-500">Share it</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {shares.map((share) => (
                  <li key={share.label}>
                    <a
                      href={share.href}
                      onClick={() => markShared(siteId)}
                      {...(share.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={shareLink}
                    >
                      {share.label}
                      {share.external && (
                        <>
                          <span className="sr-only"> (opens in a new tab)</span>
                          <span aria-hidden="true" className="text-slate-400">
                            ↗
                          </span>
                        </>
                      )}
                    </a>
                  </li>
                ))}
                {canShare && (
                  <li>
                    <button type="button" onClick={webShare} className={shareLink}>
                      More options
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className={`${textButton} justify-center`}
            >
              Done
            </button>
            {showDomainAction && (
              <button type="button" onClick={goToDomain} className={secondaryButton}>
                Connect your domain
              </button>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
