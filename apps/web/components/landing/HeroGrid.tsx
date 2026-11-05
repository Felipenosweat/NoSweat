"use client";

import { useEffect, useRef } from "react";

// Fundo do topo: uma grade de pontos bem clara (papel de projeto) que some nas bordas, e uma
// segunda grade em azul que só aparece num círculo em volta do mouse, como uma lanterna sobre a
// planta. Enfeite (aria-hidden). Sem mouse de verdade ou com "reduzir movimento", fica só a
// grade clara, parada.

export function HeroGrid() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const section = el?.parentElement;
    if (!el || !section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = section.getBoundingClientRect();
        el.style.setProperty("--gx", `${event.clientX - box.left}px`);
        el.style.setProperty("--gy", `${event.clientY - box.top}px`);
        el.dataset.on = "";
      });
    };
    const leave = () => delete el.dataset.on;
    section.addEventListener("pointermove", move, { passive: true });
    section.addEventListener("pointerleave", leave);
    return () => {
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="lp-grid pointer-events-none absolute inset-0 -z-10"
    >
      <div className="lp-grid-base absolute inset-0" />
      <div className="lp-grid-glow absolute inset-0" />
    </div>
  );
}
