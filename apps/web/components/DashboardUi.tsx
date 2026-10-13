import type { ReactNode } from "react";

// Peças visuais compartilhadas do painel do cliente (/dashboard e /sites/[id]).
// Sem "use client" e sem imports do servidor: servem tanto para server quanto para client components.

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const buttonBase = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-[15px] font-semibold whitespace-nowrap transition-colors duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:active:translate-y-0 sm:min-h-10 ${focusRing}`;

/** Ação principal (azul da marca). Só uma por tela. */
export const primaryButton = `${buttonBase} bg-brand text-white hover:bg-brand-dark disabled:bg-slate-100 disabled:text-slate-400`;

/** Ação secundária: contorno neutro. */
export const secondaryButton = `${buttonBase} border border-slate-300 bg-white text-ink hover:border-slate-400 hover:bg-slate-50 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400`;

/** Ação de texto (terciária). */
export const textButton = `inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-[15px] font-semibold text-slate-600 transition-colors duration-150 hover:text-ink disabled:cursor-not-allowed disabled:text-slate-400 sm:min-h-10 ${focusRing}`;

/** Painel de configurações: borda fina, raio xl, título 15px Jakarta. */
export const panelClass = "rounded-xl border border-slate-200 bg-white p-5 sm:p-6";

export const panelTitle = "font-display text-[15px] leading-6 font-semibold text-ink";

export const panelText = "text-[15px] leading-[1.6] text-slate-600";

type BadgeTone = "live" | "draft" | "pending" | "neutral";

const DOTS: Record<BadgeTone, string> = {
  live: "bg-emerald-500",
  draft: "bg-slate-400",
  pending: "bg-amber-500",
  neutral: "",
};

/** Selo neutro com bolinha de status real (estática: nada de pulsar). */
export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2 py-0.5 text-[13px] leading-5 font-medium text-ink ring-1 ring-slate-200">
      {tone !== "neutral" && (
        <span aria-hidden="true" className={`size-1.5 rounded-full ${DOTS[tone]}`} />
      )}
      {children}
    </span>
  );
}

/** Divide um endereço público em "prefixo" (cinza) e "nome" (azul) para a linha de URL. */
export function splitSiteUrl(url: string): { prefix: string; name: string } {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    const match = /^\/s\/([^/]+)$/.exec(path);
    if (match?.[1]) return { prefix: `${parsed.host}/s/`, name: match[1] };
    return { prefix: "", name: `${parsed.host}${path}` };
  } catch {
    return { prefix: "", name: url };
  }
}

/**
 * Linha de URL da marca: "nosweatfd.com/s/" em cinza + nome do site em azul.
 * `caret` mostra o cursor piscando (só com movimento permitido).
 */
export function SiteUrlLine({
  url,
  caret = false,
  className = "",
}: {
  url: string;
  caret?: boolean;
  className?: string;
}) {
  const { prefix, name } = splitSiteUrl(url);
  return (
    <span className={`font-display tracking-[-0.01em] break-all ${className}`}>
      <span className="text-slate-500">{prefix}</span>
      <span className="font-semibold text-brand">{name}</span>
      {caret && (
        <span
          aria-hidden="true"
          className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] bg-ink motion-safe:animate-pulse"
        />
      )}
    </span>
  );
}

/**
 * Chave do localStorage que marca "já compartilhou o link" deste site.
 * PROVISÓRIO: o checklist do painel lê isto até existir um registro no servidor.
 */
export function shareFlagKey(siteId: string): string {
  return `ns-shared:${siteId}`;
}

/** Marca que o dono compartilhou/copiou o link (provisório, ver `shareFlagKey`). */
export function markShared(siteId: string): void {
  try {
    window.localStorage.setItem(shareFlagKey(siteId), "1");
    // O evento "storage" só dispara em outras abas; avisamos a aba atual também.
    window.dispatchEvent(new Event("ns-shared"));
  } catch {
    // Navegação privada sem localStorage: o item só não fica marcado.
  }
}
