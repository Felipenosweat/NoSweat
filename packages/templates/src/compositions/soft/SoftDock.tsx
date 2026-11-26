"use client";

import { useEffect, useState } from "react";
import {
  CalendarIcon,
  HomeIcon,
  ListIcon,
  MapPinIcon,
  MessageIcon,
  PhoneIcon,
  UtensilsIcon,
} from "../../components/icons";
import { BookLink } from "./BookLink";

/** Abas da barra: as da beleza e as dos outros ramos (casa, restaurante, profissional, portfólio). */
export type DockKey =
  | "home"
  | "services"
  | "book"
  | "call"
  | "menu"
  | "order"
  | "estimate"
  | "area"
  | "find"
  | "inquire";

export type DockSlot = {
  key: DockKey;
  href: string;
  label: string;
  /** Nome acessível, quando o rótulo curto não basta (ex.: "Call (305) 555-0187"). */
  ariaLabel?: string;
  external?: boolean;
  /** Botão "Book" que leva ao seletor de agendamento (com saída se ele não existir). */
  bookLink?: boolean;
  /** Para onde ir se o seletor de agendamento não existir mais. */
  fallbackHref?: string;
  /** A ação principal da barra (a pílula mais larga, na cor de ação do site). */
  primary?: boolean;
};

const ICONS: Record<DockKey, typeof HomeIcon> = {
  home: HomeIcon,
  services: ListIcon,
  book: CalendarIcon,
  call: PhoneIcon,
  menu: ListIcon,
  order: UtensilsIcon,
  estimate: MessageIcon,
  area: MapPinIcon,
  find: MapPinIcon,
  inquire: MessageIcon,
};

/**
 * Barra flutuante do celular (some a partir de 768 px). A aba da seção que está na tela vira a
 * pílula cheia; no topo, "Home". Funciona sem JavaScript (a pílula de "Home" fica de início).
 */
export function SoftDock({ slots }: { slots: DockSlot[] }) {
  const [active, setActive] = useState<DockKey>("home");

  useEffect(() => {
    const targets = slots.flatMap((slot) =>
      slot.href.startsWith("#") && slot.key !== "home"
        ? [{ key: slot.key, id: slot.href.slice(1) }]
        : [],
    );
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      let current: DockKey = "home";
      for (const target of targets) {
        const top = document.getElementById(target.id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line) current = target.key;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [slots]);

  return (
    <nav aria-label="Quick links" className="ns-s-dock" data-count={slots.length}>
      {slots.map((slot) => {
        const Icon = ICONS[slot.key];
        const on = active === slot.key;
        const state = slot.primary ? " is-primary" : on ? " is-on" : "";
        const className = `ns-s-dock-item${state}`;
        const content = (
          <>
            <Icon />
            <span>{slot.label}</span>
          </>
        );
        if (slot.bookLink) {
          return (
            <BookLink
              key={slot.key}
              className={className}
              fallbackHref={slot.fallbackHref}
              ariaLabel={slot.ariaLabel}
            >
              {content}
            </BookLink>
          );
        }
        return (
          <a
            key={slot.key}
            href={slot.href}
            aria-label={slot.ariaLabel}
            aria-current={on ? "true" : undefined}
            className={className}
            {...(slot.external ? { target: "_blank", rel: "noopener" } : {})}
          >
            {content}
          </a>
        );
      })}
    </nav>
  );
}
