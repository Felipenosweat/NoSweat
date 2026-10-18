"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useRef, type KeyboardEvent, type ReactNode } from "react";
import { signOut } from "@/app/(auth)/login/actions";
import { displayWordSpacing, focusRing } from "@/components/DashboardUi";
import { Logo } from "@/components/Logo";
import { LIVE_MODULES, SOON_MODULES } from "@/lib/modules";
import {
  AdminIcon,
  BillingIcon,
  HomeIcon,
  LogOutIcon,
  MODULE_ICONS,
  MessagesIcon,
  MoreIcon,
  PlusIcon,
} from "./NavIcons";

// Moldura do painel para quem tem conta (ou o DEV_USER): barra lateral no computador, barra de
// cima + abas embaixo no celular. Componente de cliente só para saber a rota atual (aria-current
// e esconder a navegação no /create). Visitantes não passam por aqui (ver layout.tsx).

type ChromeProps = {
  admin: boolean;
  /** Conta logada (com login ligado). `null` no dev sem Supabase: sem e-mail e sem "Log out". */
  account: { email: string | null } | null;
  /** Site mais recente, para o atalho "Messages". `null` = conta sem sites (atalho escondido). */
  latestSiteId: string | null;
  /** Faixa no topo do conteúdo (ex.: modo "ver como" do admin). */
  banner?: ReactNode;
  children: ReactNode;
};

// Visual "Apple": barra lateral clara e translúcida com linha fina; item ativo = cápsula cinza com
// o ícone na cor da marca. No celular, barra de abas do iOS (translúcida, ícone sobre o rótulo,
// ativo em azul).

const newSiteButton = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold whitespace-nowrap text-ink shadow-xs transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 active:translate-y-px lg:min-h-10 ${focusRing}`;

const sideItem = `group flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-100/70 hover:text-ink aria-[current=page]:bg-slate-100 aria-[current=page]:text-ink ${focusRing}`;

/** Ícone do item da barra lateral: cinza; azul da marca no item ativo. */
const sideIcon =
  "size-[22px] shrink-0 text-slate-500 transition-colors duration-150 group-hover:text-ink group-aria-[current=page]:text-brand";

const soonItem = "flex min-h-10 items-center gap-3 rounded-xl px-3 text-[15px] text-slate-500";

const tabItem = `flex h-full flex-col items-center justify-center gap-1 text-xs font-medium text-slate-600 transition-colors duration-150 hover:text-ink aria-[current=page]:text-brand focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand`;

// Colunas da barra de abas: Home + módulos ativos + More (classes inteiras para o Tailwind achar).
const TAB_COLUMNS: Record<number, string> = {
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

const sheetItem = `flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-ink transition-colors duration-150 hover:bg-slate-100/70 aria-[current=page]:bg-slate-100 ${focusRing}`;

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

function SidebarNav({ admin, account, latestSiteId }: Omit<ChromeProps, "children">) {
  const { current } = useCurrent();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col overflow-y-auto border-r border-slate-200/70 bg-white/80 px-3 pt-5 pb-4 backdrop-blur-xl lg:flex">
      <div className="px-3 pb-6">
        <Logo />
      </div>
      <div className="pb-5">
        <Link href="/create" className={`${newSiteButton} w-full`}>
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
                    aria-current={hub.key === "website" ? undefined : current(hub.href)}
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

        <p id="sidebar-soon" className="px-3 pt-6 pb-1.5 text-[13px] font-semibold text-slate-500">
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

        <div className="mt-auto grid gap-0.5 border-t border-slate-200/70 pt-3">
          {admin && (
            <Link href="/admin" className={sideItem}>
              <AdminIcon className={sideIcon} />
              Admin
            </Link>
          )}
          <Link href="/billing" aria-current={current("/billing")} className={sideItem}>
            <BillingIcon className={sideIcon} />
            Billing
          </Link>
          {account && (
            <>
              <p className="mt-2 flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-500">
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-200/80 text-[13px] font-semibold text-slate-700"
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
            </>
          )}
        </div>
      </nav>
    </aside>
  );
}

function TabBar({ admin, account, latestSiteId }: Omit<ChromeProps, "children">) {
  const { current } = useCurrent();
  const moreRef = useRef<HTMLDetailsElement>(null);
  const moreActive = current("/billing") === "page";

  // Fecha a folha "More" mexendo direto no <details> (sem estado do React).
  const closeMore = () => {
    if (moreRef.current) moreRef.current.open = false;
  };
  const onMoreKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key !== "Escape" || !moreRef.current?.open) return;
    closeMore();
    moreRef.current.querySelector("summary")?.focus();
  };

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {/* Vidro da barra numa camada à parte: `backdrop-filter` na própria <nav> viraria o bloco
          de referência dos filhos `fixed` (a folha "More" e o fundo dela ficariam presos aqui). */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-white/90 backdrop-blur-xl" />
      <ul className={`grid h-16 ${TAB_COLUMNS[LIVE_MODULES.length + 2] ?? "grid-cols-5"}`}>
        <li>
          <Link href="/dashboard" aria-current={current("/dashboard")} className={tabItem}>
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
                aria-current={hub.key === "website" ? undefined : current(hub.href)}
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
              className={`${tabItem} cursor-pointer list-none group-open:text-brand [&::-webkit-details-marker]:hidden`}
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
              className="fixed inset-x-0 top-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] cursor-default bg-ink/20"
            />
            <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-slate-200/70 bg-white px-3 pt-2 pb-4 shadow-[0_-12px_32px_-16px_rgb(7_27_51/0.25)]">
              {/* Alça da folha (só enfeite, como no iOS). */}
              <span
                aria-hidden="true"
                className="mx-auto mb-2 block h-1 w-9 rounded-full bg-slate-300"
              />
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
                className="px-3 pt-4 pb-1 text-[13px] font-semibold text-slate-500"
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
                <div className="mt-3 border-t border-slate-200/70 pt-3">
                  {account.email && (
                    <p className="truncate px-3 pb-1 text-[13px] text-slate-500">{account.email}</p>
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

export function DashboardChrome({ admin, account, latestSiteId, banner, children }: ChromeProps) {
  const { isCreate } = useCurrent();

  // /create: tela de foco. Sem barra lateral nem abas; só o logo, a volta ao painel e "Log out".
  if (isCreate) {
    return (
      <div className={`min-h-screen bg-surface ${displayWordSpacing}`}>
        {banner}
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-5 sm:px-8">
            <Logo />
            <div className="flex items-center gap-3 sm:gap-6">
              <Link
                href="/dashboard"
                className={`inline-flex min-h-11 items-center text-sm font-semibold whitespace-nowrap text-slate-600 transition-colors duration-150 hover:text-ink ${focusRing}`}
              >
                Dashboard
              </Link>
              {account && (
                <form action={signOut}>
                  <button
                    type="submit"
                    className={`min-h-11 text-sm font-semibold whitespace-nowrap text-slate-600 transition-colors duration-150 hover:text-ink ${focusRing}`}
                  >
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
    <div className={`min-h-screen bg-surface ${displayWordSpacing}`}>
      <SidebarNav admin={admin} account={account} latestSiteId={latestSiteId} />
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/85 px-5 backdrop-blur-xl sm:px-8 lg:hidden">
        <Logo />
        <Link href="/create" className={newSiteButton}>
          <PlusIcon className="size-4" />
          New site
        </Link>
      </header>
      <main id="main" className="pb-24 lg:pb-0 lg:pl-60">
        {banner}
        <div className="mx-auto max-w-[1080px] px-5 pt-8 pb-10 sm:px-8 lg:px-10 lg:pt-12 lg:pb-20">
          {children}
        </div>
      </main>
      <TabBar admin={admin} account={account} latestSiteId={latestSiteId} />
    </div>
  );
}
