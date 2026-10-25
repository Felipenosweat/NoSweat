"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { signOut } from "@/app/(auth)/login/actions";
import { focusRing } from "@/components/DashboardUi";
import { GlassBackdrop, glassButtonClass } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { LIVE_MODULES, SOON_MODULES } from "@/lib/modules";
import {
  AccountIcon,
  AdminIcon,
  BillingIcon,
  HelpIcon,
  HomeIcon,
  LogOutIcon,
  MODULE_ICONS,
  MessagesIcon,
  MoreIcon,
  PlusIcon,
} from "./NavIcons";

// Moldura do painel para quem tem conta (ou o DEV_USER): barra lateral de vidro flutuante no
// computador; barra de cima de vidro + barra de abas flutuante (como a do iOS 26) no celular, com o
// conteúdo passando por baixo. Componente de cliente só para saber a rota atual (aria-current e
// esconder a navegação no /create). Visitantes não passam por aqui (ver layout.tsx).
// O vidro vem das utilidades `glass*` de app/globals.css: com "reduzir transparência", "aumentar
// contraste" ou navegador sem backdrop-filter, tudo vira fundo sólido sozinho.

type ChromeProps = {
  admin: boolean;
  /** Conta logada (com login ligado). `null` no dev sem Supabase: sem e-mail e sem "Log out". */
  account: { email: string | null } | null;
  /** Site mais recente, para o atalho "Messages". `null` = conta sem sites (atalho escondido). */
  latestSiteId: string | null;
  /**
   * Link "Help" (WhatsApp ou e-mail da equipe, montado no AccountShell). Sem ele, o item some.
   * Links do WhatsApp abrem em outra aba; e-mail abre o app de e-mail.
   */
  supportHref?: string;
  /** Faixa no topo do conteúdo (ex.: modo "ver como" do admin). */
  banner?: ReactNode;
  children: ReactNode;
};

// Item da barra lateral: texto cinza AA sobre o vidro; ativo = cápsula clara de vidro (glass-pill)
// com o ícone na cor da marca.
const sideItem = `group flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-[15px] font-medium text-(--glass-fg-muted) transition-colors duration-150 hover:bg-(--glass-ghost-hover) hover:text-(--glass-fg) aria-[current=page]:glass-pill aria-[current=page]:text-(--glass-fg) lg:min-h-10 ${focusRing}`;

/** Ícone do item da barra lateral: cinza; azul da marca no item ativo. */
const sideIcon =
  "size-[22px] shrink-0 text-slate-500 transition-colors duration-150 group-hover:text-(--glass-fg) group-aria-[current=page]:text-brand";

const soonItem =
  "flex min-h-10 items-center gap-3 rounded-2xl px-3 text-[15px] text-(--glass-fg-muted)";

// Aba do celular: ícone sobre o rótulo; ativa = azul da marca numa cápsula clara.
const tabItem = `mx-0.5 my-1.5 flex h-[calc(100%-0.75rem)] flex-col items-center justify-center gap-0.5 rounded-[22px] text-[11px] leading-4 font-semibold text-(--glass-fg-muted) transition-colors duration-150 hover:text-(--glass-fg) aria-[current=page]:bg-brand/10 aria-[current=page]:text-brand focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand`;

// Colunas da barra de abas: Home + módulos ativos + More (classes inteiras para o Tailwind achar).
const TAB_COLUMNS: Record<number, string> = {
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

const sheetItem = `flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-[15px] font-medium text-(--glass-fg) transition-colors duration-150 hover:bg-(--glass-ghost-hover) aria-[current=page]:glass-pill ${focusRing}`;

/**
 * Onde a barra de abas flutua (acima da área segura do iPhone). Quem gruda embaixo da tela no
 * celular (ex.: a barra de aprovar posts) soma a altura da barra (4rem) + um respiro.
 */
const TAB_BAR_BOTTOM = "bottom-[max(0.75rem,env(safe-area-inset-bottom))]";

function useCurrent() {
  const pathname = usePathname();
  const current = (href: string): "page" | undefined =>
    pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined;
  const isCreate = current("/create") === "page";
  return { pathname, current, isCreate };
}

/** Letra do avatar: primeira letra do e-mail (ou "?" sem e-mail). */
function initial(email: string | null): string {
  return email?.trim().charAt(0).toUpperCase() || "?";
}

/** Atributos do link "Help": o WhatsApp abre em outra aba; o mailto, não. */
function supportLinkProps(href: string): { target?: "_blank"; rel?: string } {
  return href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noreferrer" };
}

function SidebarNav({
  admin,
  account,
  latestSiteId,
  supportHref,
}: Omit<ChromeProps, "children" | "banner">) {
  const { current } = useCurrent();
  return (
    // Cartão de vidro flutuante (como a barra lateral do iPadOS 26): o fundo da marca aparece por
    // trás, desfocado.
    <aside className="glass-strong fixed inset-y-3 left-3 z-30 hidden w-60 flex-col overflow-y-auto overscroll-contain rounded-[28px] px-3 pt-5 pb-3 lg:flex">
      <div className="px-3 pb-5">
        <Logo />
      </div>
      <div className="pb-5">
        <Link
          href="/create"
          className={glassButtonClass({ variant: "secondary", fullWidth: true })}
        >
          <PlusIcon className="size-4" />
          New site
        </Link>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col">
        <ul className="grid gap-0.5">
          <li>
            <Link href="/dashboard" aria-current={current("/dashboard")} className={sideItem}>
              <HomeIcon className={sideIcon} />
              Home
            </Link>
          </li>
          {LIVE_MODULES.map((hub) => {
            const ModuleIcon = MODULE_ICONS[hub.key];
            return (
              <Fragment key={hub.key}>
                <li>
                  <Link
                    href={hub.href}
                    aria-current={hub.key === "website" ? current("/sites") : current(hub.href)}
                    className={sideItem}
                  >
                    <ModuleIcon className={sideIcon} />
                    {hub.label}
                  </Link>
                </li>
                {/* "Messages" vem logo depois de "Website": mensagens do site mais recente. */}
                {hub.key === "website" && latestSiteId && (
                  <li>
                    <Link href={`/sites/${latestSiteId}#messages`} className={sideItem}>
                      <MessagesIcon className={sideIcon} />
                      Messages
                    </Link>
                  </li>
                )}
              </Fragment>
            );
          })}
        </ul>

        <p
          id="sidebar-soon"
          className="px-3 pt-6 pb-1.5 text-[13px] font-semibold text-(--glass-fg-muted)"
        >
          Coming soon
        </p>
        <ul aria-labelledby="sidebar-soon" className="grid gap-0.5">
          {SOON_MODULES.map((hub) => {
            const ModuleIcon = MODULE_ICONS[hub.key];
            return (
              <li key={hub.key}>
                <span className={soonItem}>
                  <ModuleIcon className="size-[22px] shrink-0 text-slate-400" />
                  {hub.label}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto grid gap-0.5 pt-6">
          {admin && (
            <Link href="/admin" className={sideItem}>
              <AdminIcon className={sideIcon} />
              Admin
            </Link>
          )}
          {supportHref && (
            <a href={supportHref} {...supportLinkProps(supportHref)} className={sideItem}>
              <HelpIcon className={sideIcon} />
              Help
            </a>
          )}
          {account && (
            <Link href="/account" aria-current={current("/account")} className={sideItem}>
              <AccountIcon className={sideIcon} />
              Account
            </Link>
          )}
          <Link href="/billing" aria-current={current("/billing")} className={sideItem}>
            <BillingIcon className={sideIcon} />
            Billing
          </Link>
          {account && (
            <div className="mt-3 grid gap-0.5 border-t border-(--glass-rim) pt-3">
              <p className="flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-(--glass-fg-muted)">
                <span
                  aria-hidden="true"
                  className="glass-edge grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-[13px] font-semibold text-brand"
                >
                  {initial(account.email)}
                </span>
                <span className="min-w-0 truncate" title={account.email ?? undefined}>
                  {account.email ?? "Signed in"}
                </span>
              </p>
              <form action={signOut}>
                <button type="submit" className={sideItem}>
                  <LogOutIcon className={sideIcon} />
                  Log out
                </button>
              </form>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}

function TabBar({
  admin,
  account,
  latestSiteId,
  supportHref,
}: Omit<ChromeProps, "children" | "banner">) {
  const { current, pathname } = useCurrent();
  const moreRef = useRef<HTMLDetailsElement>(null);
  const moreActive = current("/billing") === "page" || current("/account") === "page";

  // Fecha a folha "More" mexendo direto no <details> (sem estado do React).
  const closeMore = () => {
    if (moreRef.current) moreRef.current.open = false;
  };
  // Mudou de tela (aba, voltar do navegador...): a folha não fica aberta por cima da nova.
  useEffect(() => {
    if (moreRef.current) moreRef.current.open = false;
  }, [pathname]);
  const onMoreKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key !== "Escape" || !moreRef.current?.open) return;
    closeMore();
    moreRef.current.querySelector("summary")?.focus();
  };

  return (
    <nav
      aria-label="Main"
      className={`fixed inset-x-3 z-40 h-16 rounded-[28px] lg:hidden ${TAB_BAR_BOTTOM}`}
    >
      {/* Vidro da barra numa camada à parte: `backdrop-filter` na própria <nav> viraria o bloco
          de referência dos filhos `fixed` (a folha "More" e o fundo dela ficariam presos aqui). */}
      <div aria-hidden="true" className="glass-strong absolute inset-0 -z-10 rounded-[28px]" />
      <ul className={`grid h-full px-1 ${TAB_COLUMNS[LIVE_MODULES.length + 2] ?? "grid-cols-5"}`}>
        <li>
          <Link
            href="/dashboard"
            aria-current={current("/dashboard")}
            onClick={closeMore}
            className={tabItem}
          >
            <HomeIcon className="size-6" />
            Home
          </Link>
        </li>
        {LIVE_MODULES.map((hub) => {
          const ModuleIcon = MODULE_ICONS[hub.key];
          return (
            <li key={hub.key}>
              <Link
                href={hub.href}
                aria-current={hub.key === "website" ? current("/sites") : current(hub.href)}
                onClick={closeMore}
                className={tabItem}
              >
                <ModuleIcon className="size-6" />
                {hub.label}
              </Link>
            </li>
          );
        })}
        <li>
          <details ref={moreRef} onKeyDown={onMoreKeyDown} className="group h-full">
            <summary
              aria-current={moreActive ? "page" : undefined}
              className={`${tabItem} cursor-pointer list-none group-open:bg-brand/10 group-open:text-brand [&::-webkit-details-marker]:hidden`}
            >
              <MoreIcon className="size-6" />
              More
            </summary>
            {/* Fundo: tocar fora fecha a folha. */}
            <button
              type="button"
              tabIndex={-1}
              aria-label="Close menu"
              onClick={closeMore}
              className="fixed inset-0 -z-20 cursor-default bg-ink/25"
            />
            {/* Folha flutuante de vidro logo acima da barra de abas. */}
            <div className="glass-strong glass-pop fixed inset-x-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.5rem)] max-h-[70dvh] overflow-y-auto overscroll-contain rounded-[28px] px-2 pt-2 pb-3">
              <ul className="grid gap-0.5">
                {latestSiteId && (
                  <li>
                    <Link
                      href={`/sites/${latestSiteId}#messages`}
                      onClick={closeMore}
                      className={sheetItem}
                    >
                      <MessagesIcon className="size-[22px] shrink-0 text-slate-500" />
                      Messages
                    </Link>
                  </li>
                )}
                {supportHref && (
                  <li>
                    <a
                      href={supportHref}
                      {...supportLinkProps(supportHref)}
                      onClick={closeMore}
                      className={sheetItem}
                    >
                      <HelpIcon className="size-[22px] shrink-0 text-slate-500" />
                      Help
                    </a>
                  </li>
                )}
                {account && (
                  <li>
                    <Link
                      href="/account"
                      aria-current={current("/account")}
                      onClick={closeMore}
                      className={sheetItem}
                    >
                      <AccountIcon className="size-[22px] shrink-0 text-slate-500" />
                      Account
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    href="/billing"
                    aria-current={current("/billing")}
                    onClick={closeMore}
                    className={sheetItem}
                  >
                    <BillingIcon className="size-[22px] shrink-0 text-slate-500" />
                    Billing
                  </Link>
                </li>
                {admin && (
                  <li>
                    <Link href="/admin" onClick={closeMore} className={sheetItem}>
                      <AdminIcon className="size-[22px] shrink-0 text-slate-500" />
                      Admin
                    </Link>
                  </li>
                )}
              </ul>

              <p
                id="sheet-soon"
                className="px-3 pt-4 pb-1 text-[13px] font-semibold text-(--glass-fg-muted)"
              >
                Coming soon
              </p>
              <ul aria-labelledby="sheet-soon" className="grid gap-0.5">
                {SOON_MODULES.map((hub) => {
                  const ModuleIcon = MODULE_ICONS[hub.key];
                  return (
                    <li key={hub.key}>
                      <span className={`${soonItem} min-h-12`}>
                        <ModuleIcon className="size-[22px] shrink-0 text-slate-400" />
                        {hub.label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {account && (
                <div className="mt-3 border-t border-(--glass-rim) pt-3">
                  {account.email && (
                    <p className="truncate px-3 pb-1 text-[13px] text-(--glass-fg-muted)">
                      {account.email}
                    </p>
                  )}
                  <form action={signOut}>
                    <button type="submit" className={sheetItem}>
                      <LogOutIcon className="size-[22px] shrink-0 text-slate-500" />
                      Log out
                    </button>
                  </form>
                </div>
              )}
            </div>
          </details>
        </li>
      </ul>
    </nav>
  );
}

/** Link de texto da barra de cima (tela de foco do /create). */
const topLink = `inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold whitespace-nowrap text-(--glass-fg-muted) transition-colors duration-150 hover:bg-(--glass-ghost-hover) hover:text-(--glass-fg) ${focusRing}`;

export function DashboardChrome({
  admin,
  account,
  latestSiteId,
  supportHref,
  banner,
  children,
}: ChromeProps) {
  const { isCreate } = useCurrent();

  // /create: tela de foco. Sem barra lateral nem abas; só o logo, a volta ao painel e "Log out".
  if (isCreate) {
    return (
      <div className="min-h-screen bg-surface">
        {banner}
        <header className="glass-bar sticky top-0 z-30">
          <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-5 sm:px-8">
            <Logo />
            <div className="flex items-center gap-1 sm:gap-3">
              <Link href="/dashboard" className={topLink}>
                Dashboard
              </Link>
              {account && (
                <form action={signOut}>
                  <button type="submit" className={topLink}>
                    Log out
                  </button>
                </form>
              )}
            </div>
          </div>
        </header>
        <main
          id="main"
          className="mx-auto max-w-[1200px] px-5 pt-8 pb-16 sm:px-8 lg:pt-12 lg:pb-24"
        >
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen">
      <GlassBackdrop />
      <SidebarNav
        admin={admin}
        account={account}
        latestSiteId={latestSiteId}
        supportHref={supportHref}
      />
      <header className="glass-bar sticky top-0 z-30 flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:hidden">
        <Logo />
        <Link href="/create" className={glassButtonClass({ variant: "secondary", size: "md" })}>
          <PlusIcon className="size-4" />
          New site
        </Link>
      </header>
      {/* No celular o conteúdo rola por baixo da barra de abas flutuante: o espaço embaixo deixa
          o fim da página aparecer acima dela. */}
      <main
        id="main"
        className="pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.5rem)] lg:pb-0 lg:pl-[16.5rem]"
      >
        {banner}
        <div className="mx-auto max-w-[1080px] px-4 pt-6 pb-10 sm:px-8 lg:px-10 lg:pt-12 lg:pb-20">
          {children}
        </div>
      </main>
      <TabBar
        admin={admin}
        account={account}
        latestSiteId={latestSiteId}
        supportHref={supportHref}
      />
    </div>
  );
}
