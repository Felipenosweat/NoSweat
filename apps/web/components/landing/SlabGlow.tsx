"use client";

import { useEffect } from "react";

// A luz dos cartões pretos segue o mouse: um ouvinte só na grade ([data-slabs]), uma escrita
// de estilo por quadro. Sem mouse de verdade ou com "reduzir movimento", não faz nada.

export function SlabGlow() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;
    const grid = document.querySelector<HTMLElement>("[data-slabs]");
    if (!grid) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      const tile = (event.target as Element | null)?.closest<HTMLElement>(".lp-slab");
      if (!tile) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = tile.getBoundingClientRect();
        tile.style.setProperty("--mx", `${event.clientX - box.left}px`);
        tile.style.setProperty("--my", `${event.clientY - box.top}px`);
      });
    };
    grid.addEventListener("pointermove", move, { passive: true });
    return () => {
      grid.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
