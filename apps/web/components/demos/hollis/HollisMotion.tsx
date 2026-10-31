"use client";

import { useEffect } from "react";

// Movimento da Hollis: "cinemático, mas devagar e quieto". Dissoluções longas, molduras que se
// abrem como um diafragma, uma câmera que anda devagar; nunca quica (power2/power3, sem "back").
// Só melhora o que já está na página: sem JS, com "reduzir movimento" ou em máquina fraca
// (até 4 núcleos ou 4 GB) tudo aparece parado e completo; no modo leve ficam só as entradas
// simples (nada ligado à rolagem). O palco dos cômodos (RoomStage) cuida de si mesmo.
// Ganchos:
// - data-h-rise: o bloco sobe 18 px e aparece ao entrar na tela;
// - data-h-line: o fio se desenha da esquerda;
// - data-h-frame (com <img> dentro): a moldura abre das bordas para fora e a foto assenta;
// - data-h-hero: a foto do topo anda mais devagar que a rolagem enquanto o topo sai (scrub);
// - data-h-drift="0.12": a foto anda um pouco mais devagar que a rolagem (scrub);
// - data-h-progress: o fio vertical do processo desce conforme a seção passa (scrub).

export function HollisMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lite = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;
    const root = document.querySelector<HTMLElement>(".hollis");
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

      const ctx = gsap.context(() => {
        for (const el of all("[data-h-rise]")) {
          gsap.from(el, {
            y: 18,
            opacity: 0,
            duration: 1.3,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        }

        for (const el of all("[data-h-line]")) {
          gsap.fromTo(
            el,
            { scaleX: 0 },
            {
              scaleX: 1,
              transformOrigin: "left center",
              duration: 1.4,
              ease: "power2.inOut",
              scrollTrigger: { trigger: el, start: "top 94%" },
            },
          );
        }

        for (const el of all("[data-h-frame]")) {
          gsap.fromTo(
            el,
            { clipPath: "inset(7% 7% 7% 7%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.9,
              ease: "power3.inOut",
              scrollTrigger: { trigger: el, start: "top 86%" },
            },
          );
          const img = el.querySelector("img");
          if (img)
            gsap.fromTo(
              img,
              { scale: 1.12 },
              {
                scale: 1,
                duration: 2.6,
                ease: "power2.out",
                scrollTrigger: { trigger: el, start: "top 86%" },
              },
            );
        }

        if (!lite) {
          for (const el of all("[data-h-hero]")) {
            const photo = el.querySelector("[data-h-hero-photo]");
            const text = el.querySelector("[data-h-hero-text]");
            const timeline = gsap.timeline({
              scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
            });
            if (photo) timeline.to(photo, { yPercent: 9, ease: "none" }, 0);
            if (text) timeline.to(text, { yPercent: -12, ease: "none" }, 0);
          }

          for (const el of all("[data-h-drift]")) {
            const speed = Number(el.dataset.hDrift) || 0.12;
            gsap.fromTo(
              el,
              { yPercent: -speed * 40 },
              {
                yPercent: speed * 40,
                ease: "none",
                scrollTrigger: {
                  trigger: el.parentElement ?? el,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                },
              },
            );
          }

          for (const el of all("[data-h-progress]")) {
            gsap.fromTo(
              el,
              { scaleY: 0 },
              {
                scaleY: 1,
                transformOrigin: "center top",
                ease: "none",
                scrollTrigger: {
                  trigger: el.closest("section") ?? el,
                  start: "top 70%",
                  end: "bottom 60%",
                  scrub: 0.6,
                },
              },
            );
          }
        }
      }, root);
      cleanups.push(() => ctx.revert());

      // Fontes e o palco preso (que só cresce depois de hidratar) mudam a altura da página:
      // recalcula as posições quando a altura mudar (com folga, para não recalcular a cada quadro).
      let height = root.offsetHeight;
      let timer = 0;
      const resize = new ResizeObserver(() => {
        if (root.offsetHeight === height) return;
        height = root.offsetHeight;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => !disposed && ScrollTrigger.refresh(), 200);
      });
      resize.observe(root);
      cleanups.push(() => {
        resize.disconnect();
        window.clearTimeout(timer);
      });
      void document.fonts.ready.then(() => !disposed && ScrollTrigger.refresh());
      ScrollTrigger.refresh();
    })();

    return () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}
