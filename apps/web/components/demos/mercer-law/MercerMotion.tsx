"use client";

import { useEffect } from "react";

// Movimento da Mercer Law: temperamento "quieto" (docs/design/motion.md). Só opacidade e uma
// subida curta, uma vez, com a mesma curva (power2.out), nunca balançando. Sem abertura: o que
// está na primeira tela já chega pronto. Sem JS, com "reduzir movimento" ou em máquina fraca
// (até 4 núcleos ou 4 GB), tudo fica parado e completo; no modo leve só ficam os fios.
// Ganchos:
// - data-m-rise: o bloco aparece subindo 16 px ao entrar na tela;
// - data-m-rule: o fio ao lado do "§" se desenha da esquerda;
// - data-m-frame: a foto emoldurada aparece e assenta (escala 1.04 → 1);
// - data-m-timeline: o fio da linha do tempo da primeira reunião se desenha de ponta a ponta,
//   e os marcos (data-m-node) acendem em sequência.

export function MercerMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lite = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;
    const root = document.querySelector<HTMLElement>(".mercer");
    if (!root) return;
    let disposed = false;
    const cleanups: (() => void)[] = [];

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const ease = "power2.out";
      // Só o que ainda está abaixo da primeira tela: nada pisca no carregamento.
      const below = (selector: string) =>
        Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
          (el) => el.getBoundingClientRect().top > window.innerHeight * 0.92,
        );

      const ctx = gsap.context(() => {
        for (const el of below("[data-m-rule]")) {
          gsap.fromTo(
            el,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.8,
              ease,
              scrollTrigger: { trigger: el, start: "top 92%", once: true },
            },
          );
        }

        for (const el of below("[data-m-timeline]")) {
          const line = el.querySelector("[data-m-line]");
          const nodes = el.querySelectorAll("[data-m-node]");
          const timeline = gsap.timeline({
            scrollTrigger: { trigger: el, start: "top 80%", once: true },
          });
          if (line)
            timeline.fromTo(
              line,
              { scaleX: 0 },
              { scaleX: 1, transformOrigin: "left center", duration: 1.4, ease: "power1.inOut" },
            );
          if (nodes.length)
            timeline.fromTo(
              nodes,
              { scale: 0.4, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.4, ease, stagger: 0.42 },
              0.1,
            );
        }

        if (lite) return;

        for (const el of below("[data-m-rise]")) {
          gsap.from(el, {
            y: 16,
            opacity: 0,
            duration: 0.65,
            ease,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        }

        for (const el of below("[data-m-frame]")) {
          const img = el.querySelector("img");
          gsap.from(el, {
            opacity: 0,
            y: 20,
            duration: 0.7,
            ease,
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
          if (img)
            gsap.fromTo(
              img,
              { scale: 1.04 },
              {
                scale: 1,
                duration: 1.2,
                ease,
                scrollTrigger: { trigger: el, start: "top 88%", once: true },
              },
            );
        }
      }, root);
      cleanups.push(() => ctx.revert());

      if ("fonts" in document) void document.fonts.ready.then(() => ScrollTrigger.refresh());
      ScrollTrigger.refresh();
    })();

    return () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}
