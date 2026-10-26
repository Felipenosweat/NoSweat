"use client";

import { useEffect, useRef, useState } from "react";
import { NAV } from "./content";
import { Crest } from "./ui";

// Menu da Aurelia: transparente sobre o salão, vira uma faixa escura com desfoque depois do
// topo. "Reserve" sempre à vista. No celular, o menu abre em tela cheia com os capítulos em
// serifa grande (entram um a um); Esc fecha e o foco volta ao botão.

export function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`a-nav fixed inset-x-0 top-0 z-40 transition-[background-color,border-color] duration-700 ${
          solid
            ? "border-b border-[var(--a-gold)]/20 bg-[var(--a-night)]/85 backdrop-blur-md"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:h-20 sm:px-10">
          <a
            href="#top"
            aria-label="Aurelia Royal Estate, back to top"
            className="a-focus flex items-center gap-3 text-[var(--a-ivory)]"
          >
            <Crest className="h-9 w-7 text-[var(--a-gold)]" />
            <span className="a-caps hidden text-[11px] sm:inline">Aurelia Royal Estate</span>
          </a>
          <nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="a-caps a-underline a-focus text-[11px] text-[var(--a-ivory)]/85 hover:text-[var(--a-ivory)]"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="#reserve"
              className="a-caps a-btn-gold a-focus inline-flex h-10 items-center px-5 text-[11px] sm:h-11 sm:px-6"
            >
              Reserve
            </a>
            <button
              ref={button}
              type="button"
              aria-expanded={open}
              aria-controls="a-menu"
              onClick={() => setOpen((value) => !value)}
              className="a-focus grid size-11 place-items-center text-[var(--a-ivory)] lg:hidden"
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <span aria-hidden="true" className="relative block h-3 w-6">
                <span
                  className={`absolute left-0 h-px w-6 bg-current transition-transform duration-500 ${open ? "top-1.5 rotate-45" : "top-0"}`}
                />
                <span
                  className={`absolute left-0 h-px w-6 bg-current transition-transform duration-500 ${open ? "top-1.5 -rotate-45" : "top-3"}`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="a-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        data-open={open || undefined}
        className="a-menu fixed inset-0 z-30 flex flex-col justify-end bg-[var(--a-night)] px-6 pt-24 pb-10 lg:hidden"
      >
        <ol className="flex flex-col gap-2">
          {[...NAV, { href: "#reserve", label: "Reserve" }].map((item, index) => (
            <li key={item.href} style={{ transitionDelay: open ? `${120 + index * 70}ms` : "0ms" }}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="a-display a-focus flex items-baseline gap-4 py-1 text-[2.6rem] leading-none text-[var(--a-ivory)] italic"
              >
                <span className="a-caps not-italic text-[11px] text-[var(--a-gold)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.label}
              </a>
            </li>
          ))}
        </ol>
        <p className="a-caps mt-10 text-[11px] text-[var(--a-ivory)]/60">
          A fictional estate · Concept by No Sweat
        </p>
      </div>
    </>
  );
}
