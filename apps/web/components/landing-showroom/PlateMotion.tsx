"use client";

import { useEffect } from "react";

// As pranchas sobem e aparecem uma vez ao entrar na tela (300 ms). Sem JS ou com "reduzir
// movimento", nada é escondido: só as pranchas que ainda estão abaixo da tela ganham
// data-reveal="pending" e viram "in" quando aparecem.
export function PlateMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    const plates = Array.from(document.querySelectorAll<HTMLElement>("[data-plate]")).filter(
      (plate) => plate.getBoundingClientRect().top > window.innerHeight,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const plate = entry.target as HTMLElement;
          plate.dataset.reveal = "in";
          observer.unobserve(plate);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    for (const plate of plates) {
      plate.dataset.reveal = "pending";
      observer.observe(plate);
    }
    return () => {
      observer.disconnect();
      // Ao desmontar, nada fica escondido.
      for (const plate of plates) plate.dataset.reveal = "in";
    };
  }, []);
  return null;
}
