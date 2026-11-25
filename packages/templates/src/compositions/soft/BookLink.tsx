"use client";

import type { MouseEvent, ReactNode } from "react";
import { BOOK_SERVICE_EVENT } from "../../sections/BookingSection";

/**
 * Link para o bloco de agendamento (#book). Com `service`, o seletor escolhe esse serviço (evento
 * `ns:book-service`). Se o bloco não existe (agendamento desligado depois de a página abrir), vai
 * para `fallbackHref`. Sem JavaScript, é só uma âncora para #book.
 */
export function BookLink({
  service,
  fallbackHref,
  className,
  ariaLabel,
  children,
}: {
  service?: string;
  fallbackHref?: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (service) {
      window.dispatchEvent(new CustomEvent(BOOK_SERVICE_EVENT, { detail: { name: service } }));
    }
    const target = document.getElementById("book");
    if (!target) {
      if (!fallbackHref) return;
      event.preventDefault();
      if (/^https?:/.test(fallbackHref)) window.open(fallbackHref, "_blank", "noopener");
      else window.location.assign(fallbackHref);
      return;
    }
    event.preventDefault();
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", "#book");
  };
  return (
    <a href="#book" onClick={onClick} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
