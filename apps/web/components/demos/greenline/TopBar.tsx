"use client";

import { useEffect, useRef, useState } from "react";
import { BUSINESS, NAV } from "./content";
import { PhoneIcon, Wordmark } from "./ui";

// Barra do topo da Greenline: sempre presa, no mesmo papel da página. "Get a quote" e o
// telefone ficam à vista em qualquer largura (no celular o telefone vira um botão de 44 px).
// Depois do topo ganha um fio embaixo. No celular, "Menu" abre uma lista curta logo abaixo da
// barra; Esc fecha e o foco volta ao botão.

export function TopBar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="g-bar fixed inset-x-0 top-0 z-40 bg-[var(--g-paper)]"
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-8 lg:h-[72px] lg:px-10">
        <a
          href="#top"
          aria-label="Greenline Landscaping, back to top"
          className="g-focus flex items-baseline gap-3 text-[var(--g-ink)]"
        >
          <Wordmark className="text-[26px] sm:text-[30px]" />
          <span className="g-caps hidden text-[11px] text-[var(--g-ink)]/75 xl:inline">
            Landscaping · Charlotte
          </span>
        </a>

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="g-underline g-focus text-[15px] text-[var(--g-ink)]/85 hover:text-[var(--g-ink)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={BUSINESS.phoneHref}
            className="g-focus hidden items-center gap-2 px-2 text-[15px] font-semibold text-[var(--g-ink)] tabular-nums md:inline-flex"
          >
            <PhoneIcon className="size-[18px] text-[var(--g-pine)]" />
            {BUSINESS.phone}
          </a>
          <a
            href={BUSINESS.phoneHref}
            aria-label={`Call ${BUSINESS.phone}`}
            className="g-focus grid size-11 place-items-center rounded-full border border-[var(--g-ink)]/25 text-[var(--g-pine)] md:hidden"
          >
            <PhoneIcon className="size-5" />
          </a>
          <a
            href="#quote"
            className="g-btn g-focus inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold"
          >
            Get a quote
          </a>
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls="g-menu"
            onClick={() => setOpen((value) => !value)}
            className="g-focus grid size-11 place-items-center text-[var(--g-ink)] lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" className="relative block h-3 w-5">
              <span
                className={`absolute left-0 h-[1.5px] w-5 bg-current transition-transform duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute left-0 h-[1.5px] w-5 bg-current transition-transform duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        id="g-menu"
        inert={!open}
        data-open={open || undefined}
        className="g-menu border-t border-[var(--g-ink)]/12 bg-[var(--g-paper)] px-4 sm:px-8 lg:hidden"
      >
        <nav aria-label="Sections">
          <ul className="flex flex-col py-3">
            {[...NAV, { href: "#quote", label: "Get a quote" }].map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="g-display g-focus flex min-h-12 items-center text-[26px] text-[var(--g-ink)]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
