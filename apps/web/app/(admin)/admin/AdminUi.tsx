import Link from "next/link";
import type { ReactNode } from "react";
import { cx, focusRing } from "@/components/glass";

// Peças visuais do painel do admin (vidro). Sem "use client" e sem imports do servidor: servem
// para server e client components. Os componentes de vidro em si vêm de components/glass.

/** Campo de formulário em vidro (16px no celular: o iOS não dá zoom). */
export const fieldClass = cx(
  "glass mt-1.5 block h-11 w-full rounded-xl px-3.5 text-base text-(--glass-fg) placeholder:text-(--glass-fg-muted) disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:text-[15px]",
  focusRing,
);

/** Área de texto em vidro. */
export const textareaClass = cx(
  "glass mt-1.5 block w-full rounded-xl px-3.5 py-2.5 text-base text-(--glass-fg) placeholder:text-(--glass-fg-muted) sm:text-[15px]",
  focusRing,
);

export const labelClass = "block text-[13px] font-semibold text-(--glass-fg-muted)";

export const panelTitle =
  "font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] text-(--glass-fg)";

export const panelText = "text-[15px] leading-[1.6] text-(--glass-fg-muted)";

export const linkClass = cx(
  "rounded-sm font-semibold text-brand underline-offset-4 hover:underline",
  focusRing,
);

/** Cabeçalho das colunas das tabelas de vidro. */
export const th =
  "px-4 py-3 text-[13px] font-semibold whitespace-nowrap text-(--glass-fg-muted) first:pl-5 last:pr-5";
export const td = "px-4 py-3 align-middle first:pl-5 last:pr-5";
export const rowClass =
  "border-t border-(--glass-rim) motion-safe:transition-colors hover:bg-white/45";

/** Cartão de linha no celular (sem desfoque: listas longas pesam no celular). */
export const mobileCard = "glass-edge rounded-2xl bg-white/80 p-4";

/** Aviso em linha (resultado de uma ação, alerta de configuração). */
export function Notice({
  tone,
  children,
  onDismiss,
  className,
}: {
  tone: "success" | "error" | "warning";
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const tones = {
    success: "bg-emerald-50/90 text-emerald-900",
    error: "bg-red-50/90 text-red-700",
    warning: "bg-amber-50/90 text-amber-900",
  } as const;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "glass-edge flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-[15px] leading-[1.5]",
        tones[tone],
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={cx(
            "-my-1.5 -mr-2 grid size-9 shrink-0 place-items-center rounded-full text-current opacity-70 hover:bg-black/5 hover:opacity-100",
            focusRing,
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
            className="size-4"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Ladrilho de número do painel: rótulo, valor grande e uma nota. Com `href`, o ladrilho inteiro
 * leva à lista correspondente.
 */
export function StatTile({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: string;
  note?: ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-[13px] font-semibold text-(--glass-fg-muted)">{label}</p>
      <p className="mt-2 font-display text-[1.75rem] leading-none font-bold tracking-[-0.02em] break-words text-(--glass-fg) tabular-nums sm:text-[2rem]">
        {value}
      </p>
      {note && <p className="mt-2 text-[13px] leading-5 text-(--glass-fg-muted)">{note}</p>}
    </>
  );
  const tile = "glass flex h-full flex-col rounded-2xl p-4 sm:p-5";
  if (!href) return <div className={tile}>{body}</div>;
  return (
    <Link
      href={href}
      className={cx(
        tile,
        "glass-interactive hover:glass-raised motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200",
        focusRing,
      )}
    >
      {body}
    </Link>
  );
}

/** Cabeçalho de página do admin: título, contagem opcional, apoio e ações à direita. */
export function AdminPageHeader({
  title,
  count,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  count?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {back && <div className="mb-2">{back}</div>}
        <h1 className="font-display text-[2rem] leading-[1.15] font-bold tracking-[-0.022em] break-words text-(--glass-fg)">
          {title}
          {count !== undefined && (
            <span className="ml-2 align-middle text-[17px] font-semibold tracking-normal text-(--glass-fg-muted) tabular-nums">
              {count}
            </span>
          )}
        </h1>
        {description && <p className={cx("mt-2 max-w-[62ch]", panelText)}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Seta "‹" dos links de volta. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cx(
        "-ml-1 inline-flex min-h-11 items-center gap-1 rounded-lg px-1 text-[15px] font-semibold text-brand sm:min-h-9",
        focusRing,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-4"
      >
        <path d="m15 6-6 6 6 6" />
      </svg>
      {children}
    </Link>
  );
}
