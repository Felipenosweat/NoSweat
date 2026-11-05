"use client";

import { useEffect, useRef } from "react";

// Cursor "View" (a forma do cursor próprio do Redstone): um disco marfim que segue o mouse sobre
// qualquer elemento com data-lp-cursor. Só com mouse de verdade (hover + ponteiro fino); em toque
// e teclado não existe, e os links continuam sendo os mesmos. É enfeite (aria-hidden).

export function LandingCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    const move = (event: PointerEvent) => {
      el.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
      const over = (event.target as Element | null)?.closest("[data-lp-cursor]");
      if (over) el.setAttribute("data-on", "");
      else el.removeAttribute("data-on");
    };
    const leave = () => el.removeAttribute("data-on");
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="lp-cursor">
      View
    </div>
  );
}
