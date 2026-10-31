import Link from "next/link";
import type { ReactNode } from "react";
import { focusRing, glassButtonClass } from "./glass/styles";

// Peças visuais compartilhadas do painel do cliente (/dashboard, /clients, /social, /billing e
// /sites/[id]) e do /admin. Linguagem "Liquid Glass" (iOS/macOS 26): cartões de vidro claro raio
// 2xl com brilho de 1px no topo e sombra leve, botões em cápsula, hierarquia pelo tamanho e peso do
// texto. Aqui: campos de formulário, cabeçalho de página, link de volta, quadro de número, selos.
// Os componentes de vidro completos (menu "⋯", folha de confirmação, segmentado, aviso <Notice />)
// estão em components/glass. Sem "use client" e sem imports do servidor: servem tanto para server
// quanto para client components.

export { focusRing };

// ---------- campos de formulário (um visual só no app inteiro) ----------

/**
 * Campo de texto sobre o vidro: claro e legível, com contorno visível, 16px no celular (o iOS não
 * dá zoom no campo) e 15px no computador. Os de uma linha (input, select) põem `h-11` (44px de
 * toque); a área de texto põe `py-2.5`.
 */
export const fieldClass =
  "w-full rounded-xl border border-slate-300/80 bg-white/80 px-3 text-base text-ink placeholder:text-slate-500 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/15 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-red-500 sm:text-[15px]";

export const labelClass = "block text-[13px] font-medium text-ink";

/** Dica embaixo do campo (cinza do vidro: contraste AA em cima do fundo azul). */
export const hintClass = "mt-1.5 text-[13px] leading-5 text-(--glass-fg-muted)";

export const fieldErrorClass = "mt-1.5 text-[13px] leading-5 text-red-700";

// Espaço entre palavras dos títulos (`font-display`): vale para o app todo, em app/globals.css.

/** Ação principal (cápsula azul da marca com brilho de vidro). Só uma por tela. */
export const primaryButton = glassButtonClass({ variant: "primary" });

/** Ação secundária: cápsula de vidro claro. */
export const secondaryButton = glassButtonClass({ variant: "secondary" });

/** Ação de texto (terciária). */
export const textButton = `inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-[15px] font-semibold text-slate-600 transition-colors duration-150 hover:text-ink disabled:cursor-not-allowed disabled:text-slate-400 sm:min-h-10 ${focusRing}`;

/** Sombra dos cartões: quase só um contorno, com um pouco de profundidade embaixo. */
export const cardShadow = "shadow-[0_1px_2px_rgb(7_27_51/0.04),0_2px_12px_-4px_rgb(7_27_51/0.06)]";

/** Sombra do cartão em foco/hover (links que são cartões). */
export const cardShadowHover =
  "hover:shadow-[0_1px_2px_rgb(7_27_51/0.05),0_12px_28px_-12px_rgb(7_27_51/0.16)]";

/**
 * Cartão de vidro (raio 2xl, brilho no topo, linha fina, sombra leve), sem padding: listas
 * agrupadas e grades. A borda transparente mantém o tamanho antigo (e aceita hover:border-*).
 */
export const cardClass = "rounded-2xl border border-transparent glass";

/** Painel de configurações: o cartão com padding. */
export const panelClass = `${cardClass} p-5 sm:p-6`;

export const panelTitle =
  "font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] text-ink";

export const panelText = "text-[15px] leading-[1.6] text-slate-600";

/** Título da página (32px no celular, 40px no computador). */
export const pageTitle =
  "font-display text-[2rem] leading-[1.15] font-bold tracking-[-0.022em] text-ink lg:text-[2.5rem]";

/** Linha de apoio embaixo do título da página: texto secundário calmo. */
// Cinza do vidro (`--glass-fg-muted`): o slate-500 fica abaixo de 4.5:1 em cima do fundo azul.
export const pageLead = "text-[15px] leading-[1.6] text-(--glass-fg-muted) lg:text-base";

/** Título de seção dentro da página ("Needs you", "Your office"...). */
export const sectionTitle =
  "font-display text-xl leading-7 font-semibold tracking-[-0.012em] text-ink";

/**
 * Linha fina entre as linhas de uma lista agrupada, recuada até o texto (depois do ícone de 36px),
 * como nas listas do iOS. Vai no <li>; a primeira linha não tem.
 */
export const insetDivider =
  "relative before:absolute before:top-0 before:right-0 before:left-[66px] before:h-px before:bg-slate-200/70 first:before:hidden sm:before:left-[70px]";

/** Cabeçalho de página: título grande, linha de apoio e ações à direita (embaixo no celular). */
export function PageHeader({
  title,
  description,
  actions,
  back,
  badge,
  count,
  titleId,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Link de volta acima do título: um <BackLink /> (ex.: "‹ Clients"). */
  back?: ReactNode;
  /** Selo ao lado do título (ex.: "Live"). */
  badge?: ReactNode;
  /** Contagem pequena e cinza logo depois do título (ex.: "128" contas no admin). */
  count?: ReactNode;
  titleId?: string;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
      <div className="min-w-0">
        {back && <div className="mb-2">{back}</div>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 id={titleId} className={`min-w-0 break-words ${pageTitle}`}>
            {title}
            {count !== undefined && count !== null && (
              <span className="ml-2 align-middle text-[17px] font-semibold tracking-normal text-(--glass-fg-muted) tabular-nums">
                {count}
              </span>
            )}
          </h1>
          {badge}
        </div>
        {description && <p className={`mt-2 max-w-[60ch] ${pageLead}`}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

/**
 * Link de volta (como o "‹ Voltar" do iOS): seta e texto na cor da marca, 44px de toque no
 * celular. Vai no `back` do <PageHeader /> ou sozinho no topo das fichas.
 */
export function BackLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`-ml-1 inline-flex min-h-11 items-center gap-1 rounded-lg px-1 text-[15px] font-semibold text-brand transition-colors duration-150 hover:text-brand-dark sm:min-h-9 ${focusRing} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-4 shrink-0"
      >
        <path d="m15 6-6 6 6 6" />
      </svg>
      {children}
    </Link>
  );
}

export type IconTone = "brand" | "amber" | "sky" | "red" | "emerald" | "slate";

const ICON_TONES: Record<IconTone, string> = {
  brand: "bg-brand/10 text-brand",
  amber: "bg-amber-100 text-amber-700",
  sky: "bg-sky-100 text-sky-700",
  red: "bg-red-100 text-red-600",
  emerald: "bg-emerald-100 text-emerald-700",
  slate: "bg-slate-100 text-slate-500",
};

/** Quadradinho colorido (cor clara + ícone na cor forte) na frente de uma linha ou cartão. */
export function IconTile({
  tone = "brand",
  size = "md",
  children,
}: {
  tone?: IconTone;
  /** "md" = 36px (linhas e cartões), "lg" = 48px (estados vazios). */
  size?: "md" | "lg";
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={`glass-edge grid shrink-0 place-items-center ${
        size === "lg" ? "size-12 rounded-xl" : "size-9 rounded-lg"
      } ${ICON_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Seta "›" das linhas que levam a outra tela. */
export function ChevronRightIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** Cor do número do quadro quando ele pede atenção (`highlight`). */
const STAT_NUMBER: Record<IconTone, string> = {
  brand: "text-brand",
  amber: "text-amber-700",
  sky: "text-sky-700",
  red: "text-red-700",
  emerald: "text-emerald-700",
  slate: "text-ink",
};

/**
 * Quadro de número (como os widgets do iOS), o mesmo no painel, nas listas e no /admin: ícone
 * opcional, número grande, rótulo embaixo dele e uma linha de apoio. Com `href`, o quadro inteiro
 * é um link (com a seta "›"). Vai dentro do <li> da grade de quem usa.
 */
export function StatTile({
  label,
  value,
  hint,
  href,
  icon,
  tone = "slate",
  highlight = false,
}: {
  label: ReactNode;
  /** Número já formatado ("12", "$1,250", "–"); pode trazer um texto só para leitor de tela. */
  value: ReactNode;
  /** Linha de apoio embaixo do rótulo (o que fazer ou de onde vem o número). */
  hint?: ReactNode;
  /** Sem `href` (ou `null`), o quadro é só informativo: sem link nem seta. */
  href?: string | null;
  /** SVG do ícone (vai num <IconTile /> da cor do tom). */
  icon?: ReactNode;
  tone?: IconTone;
  /** Pede atenção: o número fica na cor do tom. */
  highlight?: boolean;
}) {
  const chevron = (offset: string) =>
    href ? (
      <ChevronRightIcon
        className={`${offset} size-4 shrink-0 text-slate-400 transition-colors duration-150 group-hover:text-slate-600`}
      />
    ) : null;
  // Rótulo antes do número para o leitor de tela ("New requests, 3"); na tela, o número fica em
  // cima (ordem visual com `order`).
  const figure = (
    <span className="flex min-w-0 flex-col">
      <span className="order-2 text-[15px] leading-5 font-semibold text-ink">{label}</span>
      <span
        className={`order-1 mb-1 font-display text-[1.75rem] leading-none font-semibold tracking-[-0.02em] break-words tabular-nums sm:text-[2rem] ${
          highlight ? STAT_NUMBER[tone] : "text-ink"
        }`}
      >
        {value}
      </span>
      {hint && (
        <span className="order-3 mt-0.5 text-[13px] leading-5 text-(--glass-fg-muted)">{hint}</span>
      )}
    </span>
  );
  const body = icon ? (
    <>
      <span className="flex items-start justify-between gap-2">
        <IconTile tone={tone}>{icon}</IconTile>
        {chevron("mt-2.5")}
      </span>
      <span className="mt-auto pt-4">{figure}</span>
    </>
  ) : (
    <span className="flex items-start justify-between gap-2">
      {figure}
      {chevron("mt-1.5")}
    </span>
  );
  const tile = `flex h-full flex-col p-4 sm:p-5 ${icon ? "min-h-[8.5rem]" : ""} ${cardClass}`;
  if (!href) return <div className={tile}>{body}</div>;
  return (
    <Link
      href={href}
      className={`group ${tile} glass-interactive motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200 hover:glass-raised ${focusRing}`}
    >
      {body}
    </Link>
  );
}

type BadgeTone = "live" | "draft" | "pending" | "info" | "neutral";

const DOTS: Record<BadgeTone, string> = {
  live: "bg-emerald-500",
  info: "bg-brand",
  draft: "bg-slate-400",
  pending: "bg-amber-500",
  neutral: "",
};

/** Selo em cápsula de vidro com bolinha de status real (estática: nada de pulsar). */
export function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className="glass glass-flat inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] leading-5 font-medium text-ink">
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
    // overflow-wrap:anywhere quebra primeiro nos hífens do endereço (break-all cortava no meio
    // da palavra: "worcester-home-servi / ces").
    <span className={`font-display tracking-[-0.01em] [overflow-wrap:anywhere] ${className}`}>
      <span className="text-(--glass-fg-muted)">{prefix}</span>
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
