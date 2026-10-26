"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SVGProps,
} from "react";
import { signOut } from "@/app/(auth)/login/actions";
import { focusRing } from "@/components/DashboardUi";
import { GlassBackdrop, glassButtonClass } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { SOON_MODULES } from "@/lib/modules";
import {
  AccountIcon,
  AdminIcon,
  BillingIcon,
  ClientsIcon,
  EstimatesIcon,
  HelpIcon,
  HomeIcon,
  InvoicesIcon,
  LogOutIcon,
  MODULE_ICONS,
  MessagesIcon,
  MoreIcon,
  PlusIcon,
  ScheduleIcon,
  SettingsIcon,
  SocialIcon,
  StarIcon,
  TeamIcon,
  WebsiteIcon,
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

const sheetItem = `flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-[15px] font-medium text-(--glass-fg) transition-colors duration-150 hover:bg-(--glass-ghost-hover) aria-[current=page]:glass-pill ${focusRing}`;

/**
 * Onde a barra de abas flutua (acima da área segura do iPhone). Quem gruda embaixo da tela no
 * celular (ex.: a barra de aprovar posts) soma a altura da barra (4rem) + um respiro.
 */
const TAB_BAR_BOTTOM = "bottom-[max(0.75rem,env(safe-area-inset-bottom))]";

// ---------- itens da navegação ----------
// Ordem pensada para o dia a dia de quem presta serviço: primeiro a agenda e os clientes, depois o
// dinheiro (orçamentos e faturas) e por fim o site e as redes. "Business" junta o que se mexe pouco.

type NavItem = {
  key: string;
  label: string;
  href: string;
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
  /** Prefixo da rota que marca o item como atual (padrão: o próprio `href`). `null` = nunca. */
  match?: string | null;
  /** Link de fora (Help): `<a>` com os atributos de `supportLinkProps`. */
  external?: boolean;
};

const HOME_ITEM: NavItem = { key: "home", label: "Home", href: "/dashboard", Icon: HomeIcon };
const SCHEDULE_ITEM: NavItem = {
  key: "schedule",
  label: "Schedule",
  href: "/schedule",
  Icon: ScheduleIcon,
};
const CLIENTS_ITEM: NavItem = {
  key: "clients",
  label: "Clients",
  href: "/clients",
  Icon: ClientsIcon,
};
const ESTIMATES_ITEM: NavItem = {
  key: "estimates",
  label: "Estimates",
  href: "/estimates",
  Icon: EstimatesIcon,
};
const INVOICES_ITEM: NavItem = {
  key: "invoices",
  label: "Invoices",
  href: "/invoices",
  Icon: InvoicesIcon,
};
const WEBSITE_ITEM: NavItem = {
  key: "website",
  label: "Website",
  href: "/dashboard#sites",
  Icon: WebsiteIcon,
  match: "/sites",
};
const SOCIAL_ITEM: NavItem = { key: "social", label: "Social", href: "/social", Icon: SocialIcon };
const REVIEWS_ITEM: NavItem = {
  key: "reviews",
  label: "Google reviews",
  href: "/reviews",
  Icon: StarIcon,
};
// "Google reviews" já é item normal da navegação: não aparece mais em "Coming soon" (mesmo que
// lib/modules.ts ainda o marque como em breve).
const SOON_ITEMS = SOON_MODULES.filter((hub) => hub.key !== "reviews");
const TEAM_ITEM: NavItem = { key: "team", label: "Team", href: "/team", Icon: TeamIcon };
const SETTINGS_ITEM: NavItem = {
  key: "settings",
  label: "Business settings",
  href: "/office/settings",
  Icon: SettingsIcon,
  match: "/office",
};
const BILLING_ITEM: NavItem = {
  key: "billing",
  label: "Billing",
  href: "/billing",
  Icon: BillingIcon,
};

/** "Messages": a caixa do site mais recente (some sem site). */
function messagesItem(latestSiteId: string | null): NavItem[] {
  return latestSiteId
    ? [
        {
          key: "messages",
          label: "Messages",
          href: `/sites/${latestSiteId}#messages`,
          Icon: MessagesIcon,
          match: null,
        },
      ]
    : [];
}

/** Grupo "Business" (embaixo da barra lateral): equipe, configurações, cobrança, ajuda, admin. */
function businessItems({
  admin,
  account,
  supportHref,
}: Pick<ChromeProps, "admin" | "account" | "supportHref">): NavItem[] {
  return [
    TEAM_ITEM,
    SETTINGS_ITEM,
    BILLING_ITEM,
    ...(supportHref
      ? [{ key: "help", label: "Help", href: supportHref, Icon: HelpIcon, external: true }]
      : []),
    ...(admin
      ? [{ key: "admin", label: "Admin", href: "/admin", Icon: AdminIcon, match: null }]
      : []),
    ...(account ? [{ key: "account", label: "Account", href: "/account", Icon: AccountIcon }] : []),
  ];
}

function useCurrent() {
  const pathname = usePathname();
  const current = (href: string): "page" | undefined =>
    pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined;
  const isCreate = current("/create") === "page";
  const currentItem = (item: NavItem): "page" | undefined =>
    item.match === null || item.external ? undefined : current(item.match ?? item.href);
  return { pathname, current, currentItem, isCreate };
}

/** Um item como link (ou `<a>` para o link de fora). */
function NavLink({
  item,
  className,
  iconClassName,
  current,
  onClick,
}: {
  item: NavItem;
  className: string;
  iconClassName: string;
  current: "page" | undefined;
  onClick?: () => void;
}) {
  const content = (
    <>
      <item.Icon className={iconClassName} />
      {item.label}
    </>
  );
  if (item.external) {
    return (
      <a href={item.href} {...supportLinkProps(item.href)} onClick={onClick} className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link href={item.href} aria-current={current} onClick={onClick} className={className}>
      {content}
    </Link>
  );
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
  const { currentItem } = useCurrent();
  const main: NavItem[] = [
    HOME_ITEM,
    SCHEDULE_ITEM,
    CLIENTS_ITEM,
    ESTIMATES_ITEM,
    INVOICES_ITEM,
    WEBSITE_ITEM,
    ...messagesItem(latestSiteId),
    SOCIAL_ITEM,
    REVIEWS_ITEM,
  ];
  const business = businessItems({ admin, account, supportHref });
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
          {main.map((item) => (
            <li key={item.key}>
              <NavLink
                item={item}
                current={currentItem(item)}
                className={sideItem}
                iconClassName={sideIcon}
              />
            </li>
          ))}
        </ul>

        {SOON_ITEMS.length > 0 && (
          <>
            <p
              id="sidebar-soon"
              className="px-3 pt-6 pb-1.5 text-[13px] font-semibold text-(--glass-fg-muted)"
            >
              Coming soon
            </p>
            <ul aria-labelledby="sidebar-soon" className="grid gap-0.5">
              {SOON_ITEMS.map((hub) => {
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
          </>
        )}

        <div className="mt-auto pt-6">
          <p
            id="sidebar-business"
            className="px-3 pb-1.5 text-[13px] font-semibold text-(--glass-fg-muted)"
          >
            Business
          </p>
          <ul aria-labelledby="sidebar-business" className="grid gap-0.5">
            {business.map((item) => (
              <li key={item.key}>
                <NavLink
                  item={item}
                  current={currentItem(item)}
                  className={sideItem}
                  iconClassName={sideIcon}
                />
              </li>
            ))}
          </ul>
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
  const { currentItem, pathname } = useCurrent();
  const moreRef = useRef<HTMLDetailsElement>(null);
  // Abas fixas (o que se usa na rua) e o resto na folha "More".
  const tabs: NavItem[] = [HOME_ITEM, SCHEDULE_ITEM, CLIENTS_ITEM, WEBSITE_ITEM];
  const more: NavItem[] = [
    ESTIMATES_ITEM,
    INVOICES_ITEM,
    ...messagesItem(latestSiteId),
    SOCIAL_ITEM,
    REVIEWS_ITEM,
    ...businessItems({ admin, account, supportHref }),
  ];
  const moreActive = more.some((item) => currentItem(item) === "page");

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
      <ul className="grid h-full grid-cols-5 px-1">
        {tabs.map((item) => (
          <li key={item.key}>
            <NavLink
              item={item}
              current={currentItem(item)}
              onClick={closeMore}
              className={tabItem}
              iconClassName="size-6"
            />
          </li>
        ))}
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
                {more.map((item) => (
                  <li key={item.key}>
                    <NavLink
                      item={item}
                      current={currentItem(item)}
                      onClick={closeMore}
                      className={sheetItem}
                      iconClassName="size-[22px] shrink-0 text-slate-500"
                    />
                  </li>
                ))}
              </ul>

              {SOON_ITEMS.length > 0 && (
                <>
                  <p
                    id="sheet-soon"
                    className="px-3 pt-4 pb-1 text-[13px] font-semibold text-(--glass-fg-muted)"
                  >
                    Coming soon
                  </p>
                  <ul aria-labelledby="sheet-soon" className="grid gap-0.5">
                    {SOON_ITEMS.map((hub) => {
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
                </>
              )}

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
