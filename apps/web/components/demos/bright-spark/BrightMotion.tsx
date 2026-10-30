"use client";

import { useEffect } from "react";

// Movimento da Bright Spark: "quieto". Só opacidade + subida curta (16–24 px, 0,5–0,7 s,
// power2.out), uma vez. A assinatura é o FIO: cada seção tem um fio na margem esquerda que se
// "energiza" com a rolagem (scaleY ligado à rolagem) e, quando a ponta chega ao cabeçalho do
// circuito, o interruptor desenhado liga (data-bs-off sai). Sem JS, com "reduzir movimento" ou em
// máquina fraca (até 4 núcleos ou 4 GB) tudo fica no estado final: fios cheios, interruptores
// ligados. No modo leve os interruptores ainda ligam (gatilho simples), mas o fio não é ligado
// à rolagem.
// Ganchos:
// - data-bs-line: linhas do cartaz do topo sobem em sequência na carga;
// - data-bs-rise: o bloco sobe e aparece ao entrar na tela;
// - data-bs-reveal: a foto abre de baixo para cima dentro da moldura;
// - data-bs-circuit (seção) com .bs-wire-fill dentro: o fio e o interruptor.

export function BrightMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lite = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;
    const root = document.querySelector<HTMLElement>(".brightspark");
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
        gsap.from(all("[data-bs-line]"), {
          yPercent: 40,
          opacity: 0,
          duration: 0.7,
          ease,
          stagger: 0.08,
          delay: 0.1,
        });

        for (const el of all("[data-bs-rise]")) {
          gsap.from(el, {
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease,
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        }

        for (const el of all("[data-bs-reveal]")) {
          gsap.fromTo(
            el,
            { clipPath: "inset(0% 0% 100% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 0.8,
              ease: "power2.inOut",
              scrollTrigger: { trigger: el, start: "top 88%" },
            },
          );
        }

        for (const section of all("[data-bs-circuit]")) {
          const head = section.querySelector<HTMLElement>(".bs-circuithead") ?? section;
          section.dataset.bsOff = "";
          ScrollTrigger.create({
            trigger: head,
            start: "top 70%",
            once: true,
            onEnter: () => delete section.dataset.bsOff,
          });
          if (lite) continue;
          const fill = section.querySelector<HTMLElement>(".bs-wire-fill");
          if (!fill) continue;
          gsap.fromTo(
            fill,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: { trigger: section, start: "top 70%", end: "bottom 70%", scrub: 0.4 },
            },
          );
        }
      }, root);
      cleanups.push(() => {
        ctx.revert();
        for (const section of all("[data-bs-circuit]")) delete section.dataset.bsOff;
      });

      // A página muda de altura (passos do orçamento, fotos que carregam, troca de serviço):
      // recalcula as posições com folga de 150 ms.
      let timer = 0;
      const main = root.querySelector("main");
      const resize = new ResizeObserver(() => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
      });
      if (main) resize.observe(main);
      cleanups.push(() => {
        resize.disconnect();
        window.clearTimeout(timer);
      });

      await document.fonts.ready;
      if (!disposed) ScrollTrigger.refresh();
    })();

    return () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}
