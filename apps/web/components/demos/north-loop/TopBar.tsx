"use client";

import { useEffect, useRef, useState } from "react";
import { CAFE } from "./content";
import { OpenChip } from "./Live";
import { Icon, RegMark } from "./ui";

// Barra do topo (eixo "top-bar"): marca, índice das seções, estado "aberto agora", ligar e
// pedir. No celular: marca + ligar + pedir + "Index" (painel com as seções; Esc fecha e o foco
// volta ao botão). Fica presa no topo e ganha fundo de papel depois do herói.

const LINKS = [
  { href: "#menu", label: "Menu", no: "01" },
  { href: "#day", label: "The day", no: "02" },
  { href: "#roasting", label: "Roasting", no: "03" },
  { href: "#room", label: "The room", no: "04" },
  { href: "#visit", label: "Visit", no: "05" },
];

export function TopBar() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="nl-topbar">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-2 px-4 sm:gap-4 sm:px-8 lg:px-10">
        <a
          href="#top"
          className="nl-focus flex items-center gap-2.5"
          aria-label="North Loop Coffee, back to top"
        >
          <RegMark className="h-5 w-5 text-[var(--nl-blue)] sm:h-6 sm:w-6" />
          <span className="nl-display text-[17px] leading-none whitespace-nowrap sm:text-[20px]">
            North Loop <em className="italic">Coffee</em>
          </span>
        </a>
        <nav aria-label="Sections" className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-6">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="nl-navlink nl-focus">
                  <span className="nl-mono mr-1.5 text-[10px] text-[var(--nl-ink-2)]">{l.no}</span>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <span className="mr-2 hidden xl:block">
            <OpenChip />
          </span>
          <a
            href={CAFE.phoneHref}
            className="nl-iconbtn nl-focus"
            aria-label={`Call ${CAFE.phone}`}
          >
            <Icon name="phone" className="h-[18px] w-[18px]" />
            <span className="nl-mono hidden text-[12px] md:inline">{CAFE.phone}</span>
          </a>
          <a href="#menu" className="nl-btn nl-btn-sm nl-focus">
            <span className="sm:hidden">Order</span>
            <span className="hidden sm:inline">Order ahead</span>
          </a>
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls="nl-index"
            onClick={() => setOpen((v) => !v)}
            className="nl-iconbtn nl-focus lg:hidden"
          >
            <span className="nl-mono text-[11px]">{open ? "Close" : "Index"}</span>
          </button>
        </div>
      </div>
      <div id="nl-index" hidden={!open} className="nl-index-panel lg:hidden">
        <ul>
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="nl-focus flex items-baseline gap-4 py-3"
              >
                <span className="nl-mono text-[11px] text-[var(--nl-ink-2)]">{l.no}</span>
                <span className="nl-display text-[28px] leading-none">{l.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <OpenChip className="mt-4" />
      </div>
    </header>
  );
}
