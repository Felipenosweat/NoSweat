"use client";

import { useEffect } from "react";

// Movimento "quieto" da North Loop: só opacidade + subida curta, uma vez, com power2.out.
// Sem JS, com "reduzir movimento" ou em máquina fraca, tudo aparece parado e completo
// (o vapor do copo é CSS e também para com "reduzir movimento").
// Ganchos:
// - data-nl-rise: o bloco sobe 18 px e aparece ao entrar na tela;
// - data-nl-pour: o café enche o copo de baixo para cima ao carregar (o "servir" devagar);
// - data-nl-rule: o fio da seção se desenha da esquerda;
// - data-nl-marks: as marcas de corte chegam aos cantos;
// - data-nl-drift="0.2": recorte do herói anda um pouco mais devagar que a rolagem (scrub,
//   desligado no modo leve: até 4 núcleos ou 4 GB).

export function NorthLoopMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lite = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;
    const root = document.querySelector<HTMLElement>(".northloop");
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
        for (const el of all("[data-nl-pour]")) {
          gsap.fromTo(
            el,
            { scaleY: 0, transformOrigin: "50% 100%" },
            { scaleY: 1, duration: 2.4, delay: 0.5, ease: "power1.inOut" },
          );
        }

        for (const el of all("[data-nl-rise]")) {
          gsap.from(el, {
            y: 18,
            opacity: 0,
            duration: 0.7,
            ease,
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        }

        for (const el of all("[data-nl-rule]")) {
          gsap.fromTo(
            el,
            { scaleX: 0 },
            {
              scaleX: 1,
              transformOrigin: "left center",
              duration: 1.1,
              ease,
              scrollTrigger: { trigger: el, start: "top 92%", once: true },
            },
          );
        }

        for (const el of all("[data-nl-marks]")) {
          gsap.from(el.children, {
            opacity: 0,
            scale: 0.4,
            duration: 0.8,
            ease,
            stagger: 0.06,
            scrollTrigger: { trigger: el.parentElement ?? el, start: "top 85%", once: true },
          });
        }

        if (!lite) {
          for (const el of all("[data-nl-drift]")) {
            const speed = Number(el.dataset.nlDrift) || 0.2;
            gsap.fromTo(
              el,
              { yPercent: 0 },
              {
                yPercent: -speed * 40,
                ease: "none",
                scrollTrigger: {
                  trigger: el.closest("section") ?? el,
                  start: "top top",
                  end: "bottom top",
                  scrub: true,
                },
              },
            );
          }
        }
      }, root);
      cleanups.push(() => ctx.revert());
      document.fonts?.ready.then(() => !disposed && ScrollTrigger.refresh());
    })();

    return () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}
