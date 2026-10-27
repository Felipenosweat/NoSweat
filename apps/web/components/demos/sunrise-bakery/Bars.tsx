"use client";

import { useEffect, useState } from "react";
import { BAKERY } from "./content";
import { OpenChip } from "./Live";
import { Icon, SunMark } from "./ui";

// Navegação "bottom-bar-mobile": no computador e no tablet, uma barra simples no topo (marca,
// 4 seções, telefone e "Preorder"); no celular, a barra de cima fica só com a marca e o estado
// (aberto/fechado) e as três ações vão para baixo, no alcance do polegar: Order, Call, Directions.
// A barra de cima é transparente sobre a foto do herói e vira papel depois dele.

const LINKS = [
  { href: "#board", label: "This week" },
  { href: "#menu", label: "Menu" },
  { href: "#cakes", label: "Cakes" },
  { href: "#visit", label: "Visit" },
];

export function TopBar() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-solid={solid ? "" : undefined}
      className="sb-topbar fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 lg:gap-6 px-4 sm:px-8 lg:h-[72px] lg:px-10">
        <a
          href="#top"
          className="sb-focus flex items-center gap-2.5"
          aria-label="Sunrise Bakery, back to top"
        >
          <SunMark className="h-[19px] w-[33px] shrink-0 sm:h-[22px] sm:w-[38px]" />
          <span className="sb-display text-[1.12rem] leading-none font-bold tracking-[-0.01em] whitespace-nowrap sm:text-[1.3rem]">
            Sunrise <span className="font-medium italic">Bakery</span>
          </span>
        </a>
        <nav aria-label="Sections" className="hidden md:block lg:ml-4">
          <ul className="flex items-center gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="sb-navlink sb-focus">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-3 lg:gap-4">
          <OpenChip className="sb-chip text-[12px] font-medium sm:text-[13px] md:hidden lg:inline-flex" />
          <a
            href={BAKERY.phoneHref}
            className="sb-focus hidden text-[15px] font-medium tabular-nums lg:inline"
          >
            {BAKERY.phone}
          </a>
          <a href="#order" className="sb-btn sb-btn-crust sb-focus hidden md:inline-flex">
            Preorder
          </a>
        </div>
      </div>
    </header>
  );
}

/** Barra fixa embaixo, só no celular (até 767 px): pedir, ligar, como chegar. */
export function BottomBar() {
  return (
    <nav
      aria-label="Quick actions"
      className="sb-bottombar fixed inset-x-0 bottom-0 z-40 md:hidden"
    >
      <ul className="grid grid-cols-3 gap-2 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <li>
          <a href="#order" className="sb-bb sb-bb-main sb-focus">
            <Icon name="bag" />
            Order
          </a>
        </li>
        <li>
          <a href={BAKERY.phoneHref} className="sb-bb sb-focus">
            <Icon name="call" />
            Call
          </a>
        </li>
        <li>
          <a
            href={BAKERY.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sb-bb sb-focus"
          >
            <Icon name="map" />
            Directions
          </a>
        </li>
      </ul>
    </nav>
  );
}
