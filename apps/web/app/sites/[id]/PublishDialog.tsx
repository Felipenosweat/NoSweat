"use client";

import { create as createQr } from "qrcode";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactNode,
} from "react";
import { markShared, splitSiteUrl } from "@/components/DashboardUi";

// Modal "Publish website": status, endereço grátis (copiar/abrir), domínio próprio e o botão
// de publicar. Usado na página do site (PublishButton) e no editor (SiteEditor). Quem chama
// faz o POST /api/sites/[id]/publish (com o desvio 402 → /billing) e passa o estado aqui.

/**
 * - "draft": nunca publicado.
 * - "outdated": no ar, mas o rascunho tem mudanças que ainda não foram publicadas.
 * - "current": no ar e em dia (o botão vira "Latest version published", desabilitado).
 */
export type PublishState = "draft" | "outdated" | "current";

// Classes locais (o visual do painel muda em outro trabalho; este modal não depende dele).
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const smallAction = `inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[13px] font-medium text-slate-600 transition-colors duration-150 hover:bg-white hover:text-ink motion-reduce:transition-none sm:min-h-9 ${focusRing}`;
const shareLink = `inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-ink transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 motion-reduce:transition-none sm:min-h-9 ${focusRing}`;

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

function Svg({ children, className = "size-4" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

const CopyIcon = () => (
  <Svg>
    <path d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
  </Svg>
);

const OpenIcon = () => (
  <Svg>
    <path d="M7 17 17 7m0 0H8.5M17 7v8.5" />
  </Svg>
);

const GlobeIcon = () => (
  <Svg>
    <path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
  </Svg>
);

const CheckIcon = () => (
  <Svg className="size-4">
    <path d="m4.5 12.75 6 6 9-13.5" strokeWidth={2} />
  </Svg>
);

export function PublishDialog({
  open,
  onClose,
  siteId,
  siteName,
  state,
  address,
  onPublish,
  pending = false,
  error = null,
  domain,
  returnFocusTo,
}: {
  open: boolean;
  onClose: () => void;
  siteId: string;
  siteName: string;
  state: PublishState;
  /** Endereço grátis completo (https://…/s/<slug>); antes de publicar, o que o site vai ter. */
  address: string;
  onPublish: () => void;
  pending?: boolean;
  error?: string | null;
  /**
   * Onde conectar o domínio: `samePage` = a seção #domain está nesta página (rola até ela);
   * senão é um link para a página do site. `connected` troca o texto para "Manage domain".
   */
  domain: { href: string; samePage: boolean; connected: boolean };
  /** Plano B para o foco ao fechar, se o botão que abriu sumiu. */
  returnFocusTo?: () => HTMLElement | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  // "Connect domain" leva o foco para o campo de domínio; aí não devolvemos ao botão.
  const skipReturnFocus = useRef(false);
  const [copied, setCopied] = useState(false);
  const canShare = useCanWebShare();
  const live = state !== "draft";
  const { prefix, name } = splitSiteUrl(address);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      openerRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
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
      await navigator.clipboard.writeText(address);
      setCopied(true);
      markShared(siteId);
    } catch {
      // Sem permissão de área de transferência: o link continua visível para copiar na mão.
    }
  }

  async function webShare() {
    try {
      await navigator.share({
        title: siteName,
        text: `${siteName}: our new website`,
        url: address,
      });
      markShared(siteId);
    } catch {
      // Cancelado pela pessoa: nada a fazer.
    }
  }

  function goToDomain(event: MouseEvent<HTMLAnchorElement>) {
    if (!domain.samePage) return;
    event.preventDefault();
    skipReturnFocus.current = true;
    dialogRef.current?.close();
    const input = document.getElementById("domain-input");
    const section = document.getElementById("domain");
    section?.scrollIntoView({ block: "start" });
    (input ?? section)?.focus({ preventScroll: true });
  }

  const message = `Our new website is live: ${address}`;
  const shares = [
    { label: "Text", href: `sms:?&body=${encodeURIComponent(message)}`, external: false },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(address)}`,
      external: true,
    },
    {
      label: "Nextdoor",
      href: `https://nextdoor.com/sharekit/?source=nosweatfd.com&body=${encodeURIComponent(message)}`,
      external: true,
    },
  ];

  const status =
    state === "draft"
      ? { dot: "bg-slate-400", label: "Not published", text: "Publish to share your site." }
      : state === "outdated"
        ? {
            dot: "bg-amber-500",
            label: "Published",
            text: "Your site is live. Your latest changes aren’t yet.",
          }
        : { dot: "bg-emerald-500", label: "Published", text: "Your site is live." };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="publish-dialog-title"
      aria-describedby="publish-dialog-status"
      onClose={handleClose}
      onClick={(event) => {
        // Clique no fundo escuro (fora da caixa) fecha.
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white p-0 text-ink shadow-[0_1px_2px_rgb(7_27_51/.06),0_24px_48px_-12px_rgb(7_27_51/.25)] backdrop:bg-ink/30 open:flex sm:m-auto sm:w-[calc(100%-3rem)] sm:max-w-[30rem] sm:rounded-2xl motion-safe:transition-[opacity,translate] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(.2,.8,.2,1)] motion-safe:starting:open:translate-y-3 motion-safe:starting:open:opacity-0"
    >
      {open && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-6 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  id="publish-dialog-title"
                  className="font-display text-[1.375rem] leading-tight font-bold tracking-[-0.025em]"
                >
                  Publish website
                </h2>
                <p className="mt-0.5 truncate text-[13px] text-slate-500">{siteName}</p>
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className={`-mt-2 -mr-3 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors duration-150 hover:bg-slate-50 hover:text-ink ${focusRing}`}
              >
                <Svg className="size-5">
                  <path d="M6 18 18 6M6 6l12 12" />
                </Svg>
              </button>
            </div>

            <div id="publish-dialog-status" className="mt-5">
              <p className="flex items-center gap-2 text-[15px] font-semibold">
                <span aria-hidden="true" className={`size-2 rounded-full ${status.dot}`} />
                {status.label}
              </p>
              <p className="mt-0.5 text-[13px] text-slate-500">{status.text}</p>
            </div>

            {/* ---------- Endereço grátis ---------- */}
            <section
              aria-labelledby="free-address-title"
              className="mt-4 rounded-2xl border border-slate-200 bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 id="free-address-title" className="text-[13px] font-semibold text-ink">
                  Free address
                </h3>
                <span className="text-[12px] text-slate-500">Free</span>
              </div>
              <p className="mt-2 font-mono text-[14px] leading-6 break-all">
                <span className="text-slate-500">{prefix}</span>
                <span className="font-semibold text-ink">{name}</span>
              </p>
              {live ? (
                <div className="mt-2 -ml-2 flex flex-wrap items-center gap-1">
                  <button type="button" onClick={copy} className={smallAction}>
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <a href={address} target="_blank" rel="noreferrer" className={smallAction}>
                    <OpenIcon />
                    Open site
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              ) : (
                <p className="mt-2 text-[13px] text-slate-500">
                  Your site goes live at this address when you publish.
                </p>
              )}
              <p aria-live="polite" className="sr-only">
                {copied ? "Link copied" : ""}
              </p>
            </section>

            {live && (
              <details className="group/share mt-3">
                <summary
                  className={`inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-xl text-[13px] font-medium text-slate-600 hover:text-ink [&::-webkit-details-marker]:hidden ${focusRing}`}
                >
                  <Svg className="size-4 -rotate-90 transition-transform duration-150 group-open/share:rotate-0 motion-reduce:transition-none">
                    <path d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </Svg>
                  Share and QR code
                </summary>
                <div className="mt-2 flex items-start gap-4">
                  <QrCode
                    value={address}
                    className="size-24 shrink-0 rounded-xl ring-1 ring-slate-200"
                  />
                  <ul className="flex flex-wrap gap-2">
                    {shares.map((share) => (
                      <li key={share.label}>
                        <a
                          href={share.href}
                          onClick={() => markShared(siteId)}
                          {...(share.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className={shareLink}
                        >
                          {share.label}
                          {share.external && <span className="sr-only"> (opens in a new tab)</span>}
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
              </details>
            )}

            {/* ---------- Domínio próprio ---------- */}
            <section aria-labelledby="own-domain-title" className="mt-5">
              <h3 id="own-domain-title" className="text-[13px] font-semibold text-ink">
                Your own domain
              </h3>
              <p className="mt-0.5 text-[13px] leading-snug text-slate-500">
                Use your own address. We walk you through DNS and set up HTTPS for you.
              </p>
              <a
                href={domain.href}
                onClick={goToDomain}
                className={`mt-1 -ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-1 text-[13px] font-semibold text-brand hover:text-brand-dark ${focusRing}`}
              >
                <GlobeIcon />
                {domain.connected ? "Manage domain" : "Connect domain"}
              </a>
            </section>

            <p className="mt-4 border-t border-slate-200 pt-4 text-[13px] text-slate-500">
              Once published, anyone with the link can see your site.
            </p>
          </div>

          <div className="shrink-0 border-t border-slate-200 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
            {error && (
              <p
                role="alert"
                className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700"
              >
                {error}
              </p>
            )}
            <p className="text-[13px] text-slate-500">
              {state === "current"
                ? "Your site already has the latest version."
                : "Check the preview before publishing."}
            </p>
            {state === "current" ? (
              <button
                type="button"
                disabled
                className="mt-2 inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 text-[15px] font-semibold text-slate-500"
              >
                <CheckIcon />
                Latest version published
              </button>
            ) : (
              <button
                type="button"
                onClick={onPublish}
                disabled={pending}
                aria-busy={pending}
                className={`mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px disabled:cursor-wait disabled:opacity-80 motion-reduce:transition-none ${focusRing}`}
              >
                <Svg className="size-4">
                  <path d="M4.5 12h15m0 0-6.75-6.75M19.5 12l-6.75 6.75" strokeWidth={2} />
                </Svg>
                {pending
                  ? "Publishing…"
                  : state === "outdated"
                    ? "Publish changes"
                    : "Publish website"}
              </button>
            )}
          </div>
        </>
      )}
    </dialog>
  );
}
