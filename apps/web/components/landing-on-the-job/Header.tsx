"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";

// Cabeçalho da landing "On the job". No topo é transparente, com letra branca (sobre o painel ink
// no computador e sobre a faixa ink do celular); ao rolar vira branco com letra ink.
// Sem JS ele fica no fluxo (absolute) e rola junto; com JS passa a ser fixo, sem salto (a troca
// acontece com a página no topo). Menu do celular: painel de ponta a ponta, foco preso dentro,
// Esc fecha e o foco volta para o botão.

export const NAV = [
  { href: "#examples", label: "Examples" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const ringLight =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const ringDark = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    // Fora do corpo do efeito (regra react-hooks/set-state-in-effect).
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      onScroll();
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => menuButton.current?.focus());
  }, []);

  // Menu aberto: trava a rolagem, foca o primeiro link, prende o Tab e fecha com Esc.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const focusables = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [],
      );
    focusables()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      root.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  // Fecha o menu se a tela crescer até o tamanho do computador.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const light = scrolled;
  const ring = light ? ringDark : ringLight;
  const linkTone = light ? "text-slate-600 hover:text-ink" : "text-white/85 hover:text-white";

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={`inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none ${
        mounted ? "fixed" : "absolute"
      } ${
        light
          ? "border-b border-slate-200 bg-white"
          : "border-b border-transparent bg-ink lg:bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1328px] items-center gap-6 px-5 md:px-8 lg:h-[72px] lg:px-6">
        <div className="[&>a]:min-h-11">
          <Logo tone={light ? "light" : "dark"} />
        </div>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-6 text-[15px] font-medium">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`-mx-2.5 inline-flex min-h-11 items-center rounded-sm px-2.5 transition-colors duration-150 ${ring} ${linkTone}`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 text-[15px] font-semibold">
          <Link
            href="/login"
            className={`hidden min-h-11 items-center rounded-full px-4 transition-colors duration-150 sm:inline-flex ${ring} ${
              light ? "text-ink hover:bg-slate-100" : "bg-ink/55 text-white hover:bg-ink/75"
            }`}
          >
            Log in
          </Link>
          <Link
            href="/create"
            className={`inline-flex h-11 items-center rounded-full bg-brand px-5 text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px ${ring}`}
          >
            Start
          </Link>
          <button
            ref={menuButton}
            type="button"
            aria-expanded={open}
            aria-controls="otj-menu"
            aria-label="Menu"
            onClick={() => setOpen(true)}
            className={`grid size-11 place-items-center rounded-full transition-colors duration-150 lg:hidden ${ring} ${
              light ? "text-ink hover:bg-slate-100" : "text-white hover:bg-white/10"
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              className="size-6"
            >
              <path d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          ref={panel}
          id="otj-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white lg:hidden"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5 md:px-8">
            <div className="[&>a]:min-h-11">
              <Logo />
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => close(true)}
              className={`grid size-11 place-items-center rounded-full text-ink hover:bg-slate-100 ${ringDark}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                className="size-6"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <nav aria-label="Site menu" className="px-5 pt-4 md:px-8">
            <ul className="divide-y divide-slate-200 border-b border-slate-200">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => close(false)}
                    className={`otj-display flex min-h-16 items-center rounded-sm text-[1.75rem] font-semibold text-ink ${ringDark}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto grid gap-3 px-5 pt-8 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-8">
            <Link
              href="/create"
              className={`inline-flex h-14 items-center justify-center rounded-full bg-brand px-6 text-[17px] font-semibold text-white hover:bg-brand-dark ${ringDark}`}
            >
              Start my website
            </Link>
            <Link
              href="/login"
              className={`inline-flex h-14 items-center justify-center rounded-full border border-slate-300 px-6 text-[17px] font-semibold text-ink hover:bg-slate-50 ${ringDark}`}
            >
              Log in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
