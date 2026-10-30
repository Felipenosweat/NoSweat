"use client";

import { useEffect, useRef, useState } from "react";
import { BUSINESS } from "./content";
import { PhoneIcon } from "./ui";

// Barra do topo da Hollis: fina, presa, no papel da página. No computador: nome, cinco links e,
// à direita, telefone + "Book a consultation". No celular: nome, "Call" (tel:), "Consult" e um
// botão de menu que abre uma folha com os links (Esc fecha, o resto da página fica inerte e o
// foco volta para o botão). Ganha um fio embaixo depois que a página rola.

const LINKS = [
  { href: "#rooms", label: "Rooms" },
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#studio", label: "Studio" },
  { href: "#visit", label: "Visit" },
];

export function TopBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const outside = ["main", "h-footer"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    outside.forEach((el) => el.setAttribute("inert", ""));
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      outside.forEach((el) => el.removeAttribute("inert"));
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={`h-bar fixed inset-x-0 top-0 z-40 ${scrolled || open ? "h-bar-scrolled" : ""}`}
    >
      <div className="h-wrap flex h-16 items-center justify-between gap-6">
        <a href="#top" className="h-focus h-wordmark shrink-0" onClick={() => setOpen(false)}>
          Hollis Interiors
        </a>
        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="h-focus h-navlink">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2 sm:gap-5">
          {/* invólucro: o .h-navlink define display e anularia o "hidden" do Tailwind */}
          <span className="hidden lg:inline">
            <a href={BUSINESS.phoneHref} className="h-focus h-navlink tabular-nums">
              {BUSINESS.phone}
            </a>
          </span>
          <a
            href={BUSINESS.phoneHref}
            aria-label={`Call the studio, ${BUSINESS.phone}`}
            className="h-focus inline-flex size-11 items-center justify-center lg:hidden"
          >
            <PhoneIcon />
          </a>
          <a href="#consult" className="h-focus h-btn h-btn-sm" onClick={() => setOpen(false)}>
            <span className="hidden sm:inline">Book a consultation</span>
            <span className="sm:hidden">Consult</span>
          </a>
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls="h-menu"
            onClick={() => setOpen((value) => !value)}
            className="h-focus inline-flex h-11 items-center gap-2 pl-1 text-[13px] lg:hidden"
          >
            <span aria-hidden="true" className="h-burger" data-open={open || undefined} />
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      <div
        id="h-menu"
        ref={panel}
        hidden={!open}
        className="h-menu border-t border-[var(--h-line)] lg:hidden"
      >
        <nav aria-label="Menu" className="h-wrap py-6">
          <ul>
            {LINKS.map((link, index) => (
              <li key={link.href} className="border-b border-[var(--h-line)]">
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="h-focus flex items-baseline gap-4 py-4 text-[22px] font-light"
                >
                  <span className="h-tag tabular-nums">0{index + 1}</span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[15px] leading-relaxed text-[var(--h-muted)]">
            {BUSINESS.street}, {BUSINESS.neighborhood}
            <br />
            <a
              href={BUSINESS.phoneHref}
              className="h-link h-focus tabular-nums text-[var(--h-ink)]"
            >
              {BUSINESS.phone}
            </a>
          </p>
        </nav>
      </div>
    </header>
  );
}
