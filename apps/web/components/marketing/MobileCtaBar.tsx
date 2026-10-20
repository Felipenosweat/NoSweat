"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { focusRing, primaryButton } from "./styles";

// Peças de cliente do topo/rodapé do marketing no celular: a barra fixa com o CTA e o menu
// (MarketingMenu, usado pelo header de SiteChrome.tsx, que é server component).

/**
 * Barra fixa embaixo (só < sm, telas de celular) com o CTA principal. Aparece quando o hero sai da tela e some
 * de novo quando um bloco com `data-hide-mobile-cta` (hero, CTA final) está visível, para não
 * repetir o botão azul que já está na tela. Página sem nenhum desses blocos (termos,
 * privacidade…): a barra fica sempre visível. Respeita a área segura do iPhone.
 */
export function MobileCtaBar({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-hide-mobile-cta]"));
    if (targets.length === 0) {
      // Fora do corpo do efeito (regra react-hooks/set-state-in-effect).
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setVisible(onScreen.size === 0);
    });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      inert={!visible}
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 border-t px-5 ${tone === "dark" ? "border-white/10 bg-ink/95" : "border-slate-200 bg-white/95"} pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none sm:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Link href="/create" className={`w-full ${primaryButton}`}>
        Build my website
      </Link>
    </div>
  );
}

type MenuItem = { href: string; label: string };

/**
 * Menu do header abaixo de lg (onde a navegação principal some). <details> nativo: abre e fecha
 * sem JS; o JS só fecha ao tocar num link (os links "/#…" não trocam de página), ao tocar fora
 * e com Esc. Linhas de 44px.
 */
export function MarketingMenu({
  items,
  tone = "light",
}: {
  items: MenuItem[];
  tone?: "light" | "dark";
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const dark = tone === "dark";
  const ring = dark
    ? "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    : focusRing;

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const menu = ref.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) {
        menu.open = false;
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const menu = ref.current;
      if (event.key !== "Escape" || !menu?.open) return;
      menu.open = false;
      menu.querySelector("summary")?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const close = () => {
    if (ref.current) ref.current.open = false;
  };
  const rowClass = `flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium transition-colors duration-150 ${ring} ${
    dark
      ? "text-slate-200 hover:bg-white/10 hover:text-white"
      : "text-slate-700 hover:bg-slate-50 hover:text-ink"
  }`;

  return (
    <details ref={ref} className="group relative lg:hidden">
      <summary
        aria-label="Menu"
        className={`flex size-11 cursor-pointer list-none items-center justify-center rounded-lg transition-colors duration-150 [&::-webkit-details-marker]:hidden ${ring} ${
          dark
            ? "text-slate-200 hover:bg-white/10 hover:text-white"
            : "text-slate-700 hover:bg-slate-50 hover:text-ink"
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
          <path d="M4 7h16M4 12h16M4 17h16" className="group-open:hidden" />
          <path d="M6 6l12 12M18 6L6 18" className="hidden group-open:block" />
        </svg>
      </summary>
      <nav
        aria-label="Site menu"
        className={`absolute top-full right-0 z-40 mt-2 w-60 rounded-xl border p-2 shadow-[0_24px_60px_-24px_rgb(7_27_51/.45)] ${
          dark ? "border-white/10 bg-ink" : "border-slate-200 bg-white"
        }`}
      >
        <ul>
          {items.map((item) => (
            <li key={item.href}>
              {item.href.startsWith("/#") ? (
                <a href={item.href} onClick={close} className={rowClass}>
                  {item.label}
                </a>
              ) : (
                <Link href={item.href} onClick={close} className={rowClass}>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
