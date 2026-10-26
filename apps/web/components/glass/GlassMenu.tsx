"use client";

import Link from "next/link";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { MoreIcon } from "./icons";
import { cx, glassButtonClass, type GlassButtonSize } from "./styles";

// Menu "⋯" de ações de uma linha (Edit / Open / Take offline / Delete) no lugar de vários botões
// soltos. Padrão de menu do WAI-ARIA: Enter/Espaço/↓ abrem no primeiro item, ↑ no último; setas,
// Home/End e a primeira letra navegam; Esc fecha e devolve o foco ao botão; Tab fecha.
// O menu abre na camada de cima do navegador (popover API), então não é cortado por cartões com
// overflow-hidden. Fecha ao clicar fora, rolar a página ou redimensionar a janela.

export type GlassMenuAction = {
  type?: "action";
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  /** Vermelho (apagar, tirar do ar). Ponha por último, depois de um separador. */
  destructive?: boolean;
  disabled?: boolean;
  key?: string;
};

export type GlassMenuLink = {
  type: "link";
  label: string;
  href: string;
  icon?: ReactNode;
  /** Abre em outra aba (ex.: o site publicado). */
  external?: boolean;
  destructive?: boolean;
  key?: string;
};

export type GlassMenuSeparator = { type: "separator"; key?: string };

export type GlassMenuItem = GlassMenuAction | GlassMenuLink | GlassMenuSeparator;

const ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';

function menuItems(menu: HTMLElement | null): HTMLElement[] {
  return menu ? Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : [];
}

/** Põe o menu embaixo do botão (ou em cima, se não couber), sem sair da janela. */
function placeMenu(menu: HTMLElement, trigger: HTMLElement, align: "start" | "end") {
  const gap = 6;
  const margin = 8;
  const rect = trigger.getBoundingClientRect();
  const width = menu.offsetWidth;
  const height = menu.offsetHeight;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;

  const preferredLeft = align === "end" ? rect.right - width : rect.left;
  const left = Math.min(Math.max(margin, preferredLeft), viewportWidth - width - margin);
  let top = rect.bottom + gap;
  let vertical = "top";
  if (top + height > viewportHeight - margin && rect.top - gap - height >= margin) {
    top = rect.top - gap - height;
    vertical = "bottom";
  }
  menu.style.left = `${Math.max(margin, left)}px`;
  menu.style.top = `${top}px`;
  menu.style.transformOrigin = `${vertical} ${align === "end" ? "right" : "left"}`;
}

export function GlassMenu({
  items,
  label = "More actions",
  align = "end",
  size = "md",
  triggerVariant = "ghost",
  triggerIcon,
  className,
}: {
  items: GlassMenuItem[];
  /** Nome acessível do botão. Diga de quê: "More actions for Joe's Plumbing". */
  label?: string;
  /** Alinha o menu pela direita (padrão, botão no fim da linha) ou pela esquerda do botão. */
  align?: "start" | "end";
  size?: GlassButtonSize;
  triggerVariant?: "ghost" | "secondary";
  /** Troca o "⋯" por outro ícone. */
  triggerIcon?: ReactNode;
  /** Classes do botão. */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Onde o foco vai ao abrir: primeiro/último item (teclado) ou o próprio menu (mouse/toque).
  const focusTargetRef = useRef<"first" | "last" | "menu">("first");
  const typeaheadRef = useRef({ text: "", at: 0 });
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const menuId = `${baseId}-menu`;

  useLayoutEffect(() => {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!open || !menu || !trigger) return;

    if (typeof menu.showPopover === "function" && !menu.matches(":popover-open")) {
      menu.showPopover();
    }
    placeMenu(menu, trigger, align);

    const list = menuItems(menu);
    const target =
      focusTargetRef.current === "menu"
        ? menu
        : focusTargetRef.current === "last"
          ? list[list.length - 1]
          : list[0];
    (target ?? menu).focus({ preventScroll: true });

    function isInside(node: EventTarget | null): boolean {
      return node instanceof Node && (menu?.contains(node) || trigger?.contains(node) || false);
    }
    function onPointerDown(event: PointerEvent) {
      if (!isInside(event.target)) setOpen(false);
    }
    function onScroll(event: Event) {
      if (!(event.target instanceof Node && menu?.contains(event.target))) setOpen(false);
    }
    function onResize() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, align]);

  function openMenu(focus: "first" | "last" | "menu") {
    focusTargetRef.current = focus;
    setOpen(true);
  }

  function closeMenu(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function onTriggerClick(event: MouseEvent<HTMLButtonElement>) {
    if (open) {
      closeMenu(false);
      return;
    }
    // detail === 0: ativado pelo teclado (Enter/Espaço) → foco no primeiro item.
    openMenu(event.detail === 0 ? "first" : "menu");
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(event.key === "ArrowDown" ? "first" : "last");
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const list = menuItems(menuRef.current);
    const current = list.findIndex((item) => item === document.activeElement);
    const focusAt = (index: number) => list[index]?.focus({ preventScroll: true });

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusAt(current < 0 ? 0 : (current + 1) % list.length);
        return;
      case "ArrowUp":
        event.preventDefault();
        focusAt(current <= 0 ? list.length - 1 : current - 1);
        return;
      case "Home":
        event.preventDefault();
        focusAt(0);
        return;
      case "End":
        event.preventDefault();
        focusAt(list.length - 1);
        return;
      case "Escape":
        event.preventDefault();
        closeMenu(true);
        return;
      case "Tab":
        // O foco segue a ordem normal (o menu fica logo depois do botão no DOM).
        setOpen(false);
        return;
    }

    // Busca pela primeira letra (ou pelas primeiras, digitadas rápido).
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      const typeahead = typeaheadRef.current;
      typeahead.text = (now - typeahead.at < 600 ? typeahead.text : "") + event.key.toLowerCase();
      typeahead.at = now;
      const start = current < 0 ? 0 : current + (typeahead.text.length === 1 ? 1 : 0);
      for (let i = 0; i < list.length; i += 1) {
        const item = list[(start + i) % list.length];
        if (item?.textContent?.trim().toLowerCase().startsWith(typeahead.text)) {
          item.focus({ preventScroll: true });
          break;
        }
      }
    }
  }

  const itemBase =
    "flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[15px] font-medium outline-none select-none";

  function itemClass(destructive = false, disabled = false) {
    if (disabled) return cx(itemBase, "cursor-not-allowed text-(--glass-fg-muted) opacity-60");
    return cx(
      itemBase,
      "cursor-default",
      destructive
        ? "text-red-700 hover:bg-red-500/10 focus:bg-red-500/10"
        : "text-(--glass-fg) hover:bg-(--glass-ghost-hover) focus:bg-(--glass-ghost-hover)",
    );
  }

  function itemContent(icon: ReactNode, text: string) {
    return (
      <>
        {icon && (
          <span aria-hidden="true" className="inline-flex shrink-0 opacity-80 [&>svg]:size-[18px]">
            {icon}
          </span>
        )}
        <span className="min-w-0 truncate">{text}</span>
      </>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
        className={cx(
          glassButtonClass({ variant: triggerVariant, size, iconOnly: true }),
          className,
        )}
      >
        {triggerIcon ?? <MoreIcon />}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          tabIndex={-1}
          popover="manual"
          onKeyDown={onMenuKeyDown}
          className="glass-pop glass-strong fixed inset-auto z-50 m-0 max-h-[min(24rem,calc(100dvh-1rem))] max-w-[calc(100vw-1rem)] min-w-52 overflow-y-auto rounded-2xl border-0 p-1.5 text-(--glass-fg) outline-none"
        >
          {items.map((item, index) => {
            const key = item.key ?? `${item.type ?? "action"}-${index}`;
            if (item.type === "separator") {
              return (
                <div key={key} role="separator" className="mx-2 my-1.5 h-px bg-(--glass-rim)" />
              );
            }
            if (item.type === "link") {
              return (
                <Link
                  key={key}
                  href={item.href}
                  role="menuitem"
                  tabIndex={-1}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className={itemClass(item.destructive)}
                >
                  {itemContent(item.icon, item.label)}
                  {item.external && <span className="sr-only"> (opens in a new tab)</span>}
                </Link>
              );
            }
            return (
              <button
                key={key}
                type="button"
                role="menuitem"
                tabIndex={-1}
                aria-disabled={item.disabled || undefined}
                onClick={() => {
                  if (item.disabled) return;
                  closeMenu(true);
                  item.onSelect();
                }}
                className={itemClass(item.destructive, item.disabled)}
              >
                {itemContent(item.icon, item.label)}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
