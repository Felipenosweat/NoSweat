"use client";

import type { MouseEvent, ReactNode } from "react";
import { primaryButton } from "@/components/marketing/styles";

// Botão do fim da página: volta às perguntas do topo (#start) e põe o foco na primeira opção (ou
// no campo da pergunta em que a pessoa parou). Sem JavaScript, é só o link para #start.

export function StartButton({ children }: { children: ReactNode }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const start = document.getElementById("start");
    if (!start) return;
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    start.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    const target =
      start.querySelector<HTMLElement>("[data-first-chip]") ??
      start.querySelector<HTMLElement>("#hero-field");
    target?.focus({ preventScroll: true });
    history.replaceState(null, "", "#start");
  };

  return (
    <a href="#start" onClick={onClick} className={primaryButton}>
      {children}
    </a>
  );
}
