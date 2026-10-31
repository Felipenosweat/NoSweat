"use client";

import { useEffect } from "react";

// Movimento da Greenline: "quieto". Só opacidade e uma subida curta (0,7 s, power2.out, uma
// vez), barras do calendário que crescem da esquerda e uma deriva lenta das fotos da colagem
// com a rolagem. Sem JS, com "reduzir movimento" ou em máquina fraca (até 4 núcleos ou 4 GB)
// tudo aparece parado e completo; no modo leve só a deriva ligada à rolagem é cortada.
// Ganchos:
// - data-g-rise: o bloco sobe 18 px e aparece ao entrar na tela;
// - data-g-bars: as barras [data-g-bar] dentro crescem em sequência;
// - data-g-draw: o traço SVG (pathLength=1) se desenha (anel da I-485);
// - data-g-drift="0.06": a foto anda um pouco mais devagar que a página (colagem);
// - data-g-band: a foto de faixa inteira se aproxima devagar (escala 1,1 → 1) enquanto passa.

export function GreenlineMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lite = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;
    const root = document.querySelector<HTMLElement>(".greenline");
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
      const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
      const ease = "power2.out";

      const ctx = gsap.context(() => {
        for (const el of all("[data-g-rise]")) {
          gsap.from(el, {
            y: 18,
            opacity: 0,
            duration: 0.7,
            ease,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        }

        for (const group of all("[data-g-bars]")) {
          const bars = group.querySelectorAll<HTMLElement>("[data-g-bar]");
          gsap.fromTo(
            bars,
            { scaleX: 0 },
            {
              scaleX: 1,
              transformOrigin: "left center",
              duration: 0.9,
              ease: "power2.inOut",
              stagger: 0.07,
              scrollTrigger: { trigger: group, start: "top 80%", once: true },
            },
          );
        }

        for (const el of all("[data-g-draw]")) {
          gsap.fromTo(
            el,
            { strokeDasharray: 1, strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              duration: 2.2,
              ease: "power1.inOut",
              scrollTrigger: { trigger: el, start: "top 85%", once: true },
            },
          );
        }

        if (!lite) {
          for (const el of all("[data-g-drift]")) {
            const speed = Number(el.dataset.gDrift) || 0.06;
            gsap.fromTo(
              el,
              { yPercent: speed * 100 },
              {
                yPercent: -speed * 100,
                ease: "none",
                scrollTrigger: {
                  trigger: el,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.6,
                },
              },
            );
          }

          for (const el of all("[data-g-band]")) {
            const img = el.querySelector("img");
            if (!img) continue;
            gsap.fromTo(
              img,
              { scale: 1.1, yPercent: -3 },
              {
                scale: 1,
                yPercent: 3,
                ease: "none",
                scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
              },
            );
          }
        }
      }, root);
      cleanups.push(() => ctx.revert());

      // As fontes mudam a altura das seções: recalcula os gatilhos depois delas.
      void document.fonts?.ready.then(() => {
        if (!disposed) ScrollTrigger.refresh();
      });
    })();

    return () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}
