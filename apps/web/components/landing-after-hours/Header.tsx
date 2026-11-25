"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";

// Cabeçalho da landing "After hours". No topo é transparente, com letra branca sobre a foto da
// barbearia; ao rolar vira uma barra ink com linha fina embaixo (a letra continua branca).
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

  const linkTone = "text-white decoration-white/50 underline-offset-[6px] hover:underline";

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={`inset-x-0 top-0 z-40 border-b transition-[background-color,border-color] duration-200 motion-reduce:transition-none ${
        mounted ? "fixed" : "absolute"
      } ${scrolled ? "border-white/10 bg-ink" : "border-transparent bg-transparent"}`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1328px] items-center gap-8 px-5 md:px-8 lg:h-[72px] lg:px-6">
        <div className="[&>a]:min-h-11">
          <Logo tone="dark" />
        </div>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-[15px]">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`-mx-2.5 inline-flex min-h-11 items-center rounded-sm px-2.5 transition-colors duration-150 ${ringLight} ${linkTone}`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 text-[15px] font-medium">
          <Link
            href="/login"
            className={`hidden min-h-11 items-center rounded-full px-4 transition-colors duration-150 sm:inline-flex ${ringLight} ${linkTone}`}
          >
            Log in
          </Link>
          <Link
            href="/create"
            className={`inline-flex h-11 items-center rounded-full bg-white px-5 text-ink transition-colors duration-150 hover:bg-slate-200 active:translate-y-px ${ringLight}`}
          >
            Start
          </Link>
          <button
            ref={menuButton}
            type="button"
            aria-expanded={open}
            aria-controls="ah-menu"
            aria-label="Menu"
            onClick={() => setOpen(true)}
            className={`grid size-11 place-items-center rounded-full text-white transition-colors duration-150 hover:bg-white/10 lg:hidden ${ringLight}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              className="size-6"
            >
              <path d="M4 9h16M4 15h16" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          ref={panel}
          id="ah-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ink text-white lg:hidden"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5 md:px-8">
            <div className="[&>a]:min-h-11">
              <Logo tone="dark" />
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => close(true)}
              className={`grid size-11 place-items-center rounded-full text-white hover:bg-white/10 ${ringLight}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                className="size-6"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <nav aria-label="Site menu" className="px-5 pt-6 md:px-8">
            <ul className="divide-y divide-white/10 border-b border-white/10">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => close(false)}
                    className={`ah-display flex min-h-18 items-center rounded-sm text-[2rem] text-white ${ringLight}`}
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
              className={`inline-flex h-14 items-center justify-center rounded-full bg-white px-6 text-[17px] font-medium text-ink hover:bg-slate-200 ${ringLight}`}
            >
              Start my website
            </Link>
            <Link
              href="/login"
              className={`inline-flex h-14 items-center justify-center rounded-full border border-white/30 px-6 text-[17px] font-medium text-white hover:bg-white/10 ${ringLight}`}
            >
              Log in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
