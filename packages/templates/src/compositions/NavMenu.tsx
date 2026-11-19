"use client";

import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { PhoneIcon } from "../components/icons";

// Menu do celular e do tablet (e do cabeçalho "minimal" em qualquer largura). É um <details>:
// abre e fecha sem JavaScript; com JavaScript, fecha ao escolher um link, com Esc e ao tocar fora.
// O botão é um ícone simples (sem bolha) e o painel abre de ponta a ponta embaixo da barra, com o
// fundo e a letra do tema (styles.css, "Cabeçalho"); os links são grandes, na fonte dos títulos.

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

export type NavMenuProps = {
  links: { anchor: string; label: string }[];
  ctaHref: string;
  ctaLabel: string;
  ctaExternal: boolean;
  phoneHref?: string;
  phone?: string;
  /** Visibilidade por largura (ex.: "@5xl:hidden" quando o menu em linha aparece). */
  className?: string;
};

export function NavMenu({
  links,
  ctaHref,
  ctaLabel,
  ctaExternal,
  phoneHref,
  phone,
  className = "",
}: NavMenuProps) {
  const ref = useRef<HTMLDetailsElement>(null);

  // Toque fora do menu fecha.
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

  // Escolher um link fecha o menu (a rolagem até a seção continua normal).
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const menu = ref.current;
    if (menu && event.target instanceof Element && event.target.closest("a")) menu.open = false;
  };

  const external = ctaExternal ? { target: "_blank", rel: "noopener" } : {};

  return (
    <details ref={ref} onKeyDown={onKeyDown} className={`ns-menu group/menu ${className}`}>
      <summary
        className={`ns-menu-button flex size-11 cursor-pointer list-none items-center justify-center rounded-full [&::-webkit-details-marker]:hidden ${focus}`}
      >
        <span className="sr-only">Menu</span>
        <span aria-hidden="true" className="relative block h-3 w-[1.375rem]">
          <span className="absolute inset-x-0 top-0 h-[1.5px] rounded-full bg-current transition-transform duration-300 group-open/menu:translate-y-[5.25px] group-open/menu:rotate-45 motion-reduce:transition-none" />
          <span className="absolute inset-x-0 bottom-0 h-[1.5px] rounded-full bg-current transition-transform duration-300 group-open/menu:-translate-y-[5.25px] group-open/menu:-rotate-45 motion-reduce:transition-none" />
        </span>
      </summary>
      <div
        onClick={onClick}
        className="ns-menu-panel absolute inset-x-0 top-full max-h-[calc(100svh-4rem)] overflow-y-auto px-4 pt-2 pb-6 @3xl:px-8"
      >
        <div className="mx-auto w-full max-w-2xl">
          {links.length > 0 && (
            <nav aria-label="Menu">
              <ul className="ns-menu-list">
                {links.map((link) => (
                  <li key={link.anchor}>
                    <a
                      href={`#${link.anchor}`}
                      className={`flex min-h-14 items-center font-ns-heading text-[1.75rem] leading-none font-ns-display tracking-[-0.02em] ${focus}`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className={`grid gap-3 ${links.length > 0 ? "ns-menu-actions mt-2 pt-5" : "pt-3"}`}>
            <a
              href={ctaHref}
              {...external}
              className={`ns-menu-cta flex min-h-12 items-center justify-center rounded-full px-5 text-center text-[0.9375rem] leading-tight font-semibold transition hover:opacity-90 motion-reduce:transition-none ${focus}`}
            >
              {ctaLabel}
            </a>
            {phoneHref && phone && (
              <a
                href={phoneHref}
                className={`ns-menu-call flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-[0.9375rem] font-semibold tabular-nums ${focus}`}
              >
                <PhoneIcon className="size-4 shrink-0" />
                {`Call ${phone}`}
              </a>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}
