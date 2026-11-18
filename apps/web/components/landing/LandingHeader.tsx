"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { MarketingMenu } from "@/components/marketing/MobileCtaBar";
import { focusRing, primaryTone } from "@/components/marketing/styles";

// Cabeçalho do marketing (landing "/" e páginas claras como /pricing, os mesmos links e o mesmo
// botão "Build my website"). Barra branca de 64px; a linha de baixo só aparece depois de rolar.
// O botão azul fica `invisible` (não some do layout) enquanto as perguntas do topo (#start) estão
// na tela: o azul da ação principal já está ali. Abaixo de lg o botão não aparece no topo (o
// `invisible` reservava ~150px vazios no tablet): no celular ele fica na barra fixa de baixo
// (MobileCtaBar); no topo ficam o logo, "Log in" e o menu.

export const MARKETING_NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/#office", label: "The office" },
  { href: "/#examples", label: "Examples" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

const navLink = `inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors duration-150 hover:text-ink ${focusRing}`;

export function LandingHeader() {
  // Na landing o hero começa na tela: o botão já nasce escondido (sem piscar na hidratação).
  const onLanding = usePathname() === "/";
  const [heroInView, setHeroInView] = useState(onLanding);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const hero = document.getElementById("start");
    if (!hero) {
      // Fora do corpo do efeito (regra react-hooks/set-state-in-effect).
      const frame = requestAnimationFrame(() => setHeroInView(false));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(Boolean(entry?.isIntersecting)),
      // Conta como "na tela" só a parte abaixo do cabeçalho.
      { rootMargin: "-64px 0px 0px 0px" },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white transition-colors duration-150 ${
        scrolled ? "border-slate-200" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex min-h-16 w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-4 px-5 sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <div className="justify-self-start">
          <Logo />
        </div>
        <nav aria-label="Main" className="hidden items-center lg:flex">
          {MARKETING_NAV.map((item) => (
            <a key={item.href} href={item.href} className={navLink}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 justify-self-end sm:gap-2">
          <Link
            href="/login"
            className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-slate-50 ${focusRing}`}
          >
            Log in
          </Link>
          <Link
            href="/create"
            className={`hidden h-10 items-center rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150 active:translate-y-px lg:inline-flex ${primaryTone} ${focusRing} ${
              heroInView ? "invisible" : ""
            }`}
          >
            Build my website
          </Link>
          {/* Abaixo de lg a navegação some; o menu (44×44) leva às mesmas seções. */}
          <MarketingMenu items={MARKETING_NAV} />
        </div>
      </div>
    </header>
  );
}
