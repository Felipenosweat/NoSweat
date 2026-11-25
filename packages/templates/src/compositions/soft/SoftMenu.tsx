"use client";

import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { MenuIcon } from "../../components/icons";

/**
 * Menu do celular e do tablet: um <details> (abre sem JavaScript). Com JavaScript fecha ao escolher
 * um link, com Esc e ao tocar fora. O painel é um cartão arredondado logo abaixo do botão redondo.
 */
export function SoftMenu({
  links,
  ctaHref,
  ctaLabel,
  ctaExternal,
}: {
  links: { anchor: string; label: string }[];
  ctaHref: string;
  ctaLabel: string;
  ctaExternal: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      const menu = ref.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) {
        menu.open = false;
      }
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
    const menu = ref.current;
    if (event.key !== "Escape" || !menu?.open) return;
    menu.open = false;
    menu.querySelector("summary")?.focus();
  };

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const menu = ref.current;
    if (menu && event.target instanceof Element && event.target.closest("a")) menu.open = false;
  };

  return (
    <details ref={ref} onKeyDown={onKeyDown} className="ns-s-menu">
      <summary className="ns-s-circ">
        <MenuIcon />
        <span className="sr-only">Menu</span>
      </summary>
      <div className="ns-s-menu-panel" onClick={onClick}>
        <nav aria-label="Menu">
          <ul>
            {links.map((link) => (
              <li key={link.anchor}>
                <a href={`#${link.anchor}`}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href={ctaHref}
          {...(ctaExternal ? { target: "_blank", rel: "noopener" } : {})}
          className="ns-s-btn ns-s-btn--sm"
        >
          {ctaLabel}
        </a>
      </div>
    </details>
  );
}
