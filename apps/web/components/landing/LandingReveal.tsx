"use client";

import { useEffect } from "react";

// Movimento da landing que depende da rolagem, num só componente pequeno (sem biblioteca):
// 1. Revelação, uma vez por elemento: `.lp-reveal` (sobe e aparece) e `.lp-rule` (o fio dos
//    passos) ganham `data-in` quando entram na tela. O estado escondido só existe no CSS sob
//    `.lp[data-lp-js]`, atributo que este componente liga depois de marcar o que JÁ está na
//    tela; sem JavaScript, ou com "reduzir movimento", nada fica escondido.
// 2. Cabeçalho: `.lp[data-scrolled]` quando a página saiu do topo (o fio embaixo da barra).
// Os estilos ficam em app/(landing)/landing.css.

export function LandingReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".lp");
    if (!root) return;
    const observers: IntersectionObserver[] = [];

    const top = root.querySelector("[data-lp-top]");
    if (top) {
      const onTop = new IntersectionObserver(([entry]) => {
        if (entry) root.toggleAttribute("data-scrolled", !entry.isIntersecting);
      });
      onTop.observe(top);
      observers.push(onTop);
    }

    const targets = Array.from(root.querySelectorAll<HTMLElement>(".lp-reveal, .lp-rule"));
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate) {
      // O que já está na tela ao carregar (ou acima dela, numa página aberta já rolada) nunca
      // passa pelo estado escondido.
      const pending = targets.filter((el) => {
        const visible = el.getBoundingClientRect().top < window.innerHeight;
        if (visible) el.setAttribute("data-in", "");
        return !visible;
      });
      root.setAttribute("data-lp-js", "");
      const onEnter = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.setAttribute("data-in", "");
            onEnter.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -8% 0px" },
      );
      pending.forEach((el) => onEnter.observe(el));
      observers.push(onEnter);
    }

    return () => {
      observers.forEach((observer) => observer.disconnect());
      root.removeAttribute("data-lp-js");
      root.removeAttribute("data-scrolled");
      targets.forEach((el) => el.removeAttribute("data-in"));
    };
  }, []);

  return null;
}
