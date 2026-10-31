"use client";

import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { PhoneIcon } from "../components/icons";

// Menu do celular e do tablet (e do cabeçalho "minimal" em qualquer largura). É um <details>:
// abre e fecha sem JavaScript; com JavaScript, fecha ao escolher um link, com Esc e ao tocar fora.

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
        className={`flex size-11 cursor-pointer list-none items-center justify-center rounded-full bg-ns-text text-ns-background transition hover:opacity-90 motion-reduce:transition-none [&::-webkit-details-marker]:hidden ${focus}`}
      >
        <span className="sr-only">Menu</span>
        <span aria-hidden="true" className="relative block h-2.5 w-4">
          <span className="absolute inset-x-0 top-0 h-[1.5px] rounded-full bg-current transition-transform duration-300 group-open/menu:translate-y-[4.25px] group-open/menu:rotate-45 motion-reduce:transition-none" />
          <span className="absolute inset-x-0 bottom-0 h-[1.5px] rounded-full bg-current transition-transform duration-300 group-open/menu:-translate-y-[4.25px] group-open/menu:-rotate-45 motion-reduce:transition-none" />
        </span>
      </summary>
      <div
        onClick={onClick}
        className="ns-glass ns-menu-panel absolute inset-x-0 top-[calc(100%+0.5rem)] max-h-[calc(100svh-6rem)] overflow-y-auto rounded-[1.75rem] p-2 text-ns-text @3xl:left-auto @3xl:w-80"
      >
        {links.length > 0 && (
          <nav aria-label="Menu">
            <ul>
              {links.map((link) => (
                <li key={link.anchor}>
                  <a
                    href={`#${link.anchor}`}
                    className={`flex min-h-12 items-center rounded-2xl px-4 font-ns-heading text-2xl leading-none font-ns-display tracking-[-0.02em] transition-colors hover:bg-ns-text/5 motion-reduce:transition-none ${focus}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div
          className={`grid gap-2 p-2 ${links.length > 0 ? "mt-2 border-t border-ns-text/10 pt-4" : ""}`}
        >
          <a
            href={ctaHref}
            {...external}
            className={`ns-btn flex min-h-12 items-center justify-center rounded-full bg-ns-text px-5 text-center text-[0.9375rem] leading-tight font-medium text-ns-background transition hover:opacity-90 motion-reduce:transition-none ${focus}`}
          >
            {ctaLabel}
          </a>
          {phoneHref && phone && (
            <a
              href={phoneHref}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-full border border-ns-text/15 px-5 text-[0.9375rem] font-medium tabular-nums ${focus}`}
            >
              <PhoneIcon className="size-4 shrink-0" />
              {`Call ${phone}`}
            </a>
          )}
        </div>
      </div>
    </details>
  );
}
