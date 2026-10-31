"use client";

import { useEffect } from "react";

// Movimento da Iron Lotus: "cinético contido". Curto (0,45–0,7 s), power3.out, peças em
// sequência de 40–60 ms, nada que balance nem que prenda a rolagem. A entrada da folha de
// flash do topo é CSS (roda desde a primeira pintura, sem piscar); aqui ficam os efeitos que
// dependem da rolagem e do ponteiro. Sem JS, com "reduzir movimento" ou em máquina fraca
// (até 4 núcleos ou 4 GB) a página fica parada e completa; no modo leve só as revelações
// simples continuam, sem paralaxe nem nada ligado à rolagem.
// Ganchos:
// - data-il-rise: o bloco sobe 24 px e aparece ao entrar na tela;
// - data-il-num (dentro de .il-num-mask): o número da folha sobe de dentro da máscara;
// - data-il-pin: o recorte "é preso" no papel (cai inclinado e assenta);
// - data-il-stamp: o carimbo bate no papel;
// - data-il-draw (SVG com pathLength=1): o traço se desenha;
// - data-il-stagger: os filhos diretos entram um a um;
// - data-il-sheet + data-il-depth: as peças da folha andam com o ponteiro, cada uma na sua
//   profundidade;
// - data-il-frame: a moldura dos artistas se inclina um pouco na direção do ponteiro;
// - data-il-drift: o elemento anda devagar na rolagem (scrub).

export function IronLotusMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lite = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;
    const root = document.querySelector<HTMLElement>(".ironlotus");
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
      const ease = "power3.out";
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

      const ctx = gsap.context(() => {
        for (const el of all("[data-il-rise]")) {
          gsap.from(el, {
            y: 24,
            opacity: 0,
            duration: 0.6,
            ease,
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        }

        for (const group of all("[data-il-stagger]")) {
          gsap.from(Array.from(group.children), {
            y: 28,
            opacity: 0,
            duration: 0.55,
            ease,
            stagger: 0.06,
            scrollTrigger: { trigger: group, start: "top 86%" },
          });
        }

        for (const el of all("[data-il-num]")) {
          gsap.from(el, {
            yPercent: 105,
            duration: 0.55,
            ease,
            scrollTrigger: { trigger: el, start: "top 94%" },
          });
        }

        for (const el of all("[data-il-pin]")) {
          if (el.closest("[data-il-frame]")) continue;
          gsap.from(el, {
            y: -26,
            rotation: "+=7",
            scale: 1.05,
            opacity: 0,
            duration: 0.6,
            ease,
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        }

        for (const el of all("[data-il-stamp]")) {
          gsap.from(el, {
            scale: 1.6,
            rotation: "-=18",
            opacity: 0,
            duration: 0.45,
            ease: "power4.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        }

        for (const el of all("[data-il-draw] path")) {
          gsap.fromTo(
            el,
            { strokeDashoffset: 1, strokeDasharray: "1 1" },
            {
              strokeDashoffset: 0,
              duration: 0.7,
              ease: "power2.inOut",
              scrollTrigger: { trigger: el.closest("svg") ?? el, start: "top 88%" },
            },
          );
        }

        if (!lite) {
          for (const el of all("[data-il-drift]")) {
            const amount = Number(el.dataset.ilDrift) || 40;
            gsap.fromTo(
              el,
              { y: amount },
              {
                y: -amount,
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
        }
      }, root);
      cleanups.push(() => ctx.revert());

      // Peças da folha andando com o ponteiro (só mouse de verdade e fora do modo leve).
      const sheet = root.querySelector<HTMLElement>("[data-il-sheet]");
      if (sheet && fine && !lite) {
        const pieces = Array.from(sheet.querySelectorAll<HTMLElement>("[data-il-depth]")).map(
          (el) => ({
            depth: Number(el.dataset.ilDepth) || 0.5,
            x: gsap.quickTo(el, "x", { duration: 0.7, ease: "power3" }),
            y: gsap.quickTo(el, "y", { duration: 0.7, ease: "power3" }),
          }),
        );
        const move = (event: PointerEvent) => {
          const box = sheet.getBoundingClientRect();
          const dx = (event.clientX - (box.left + box.width / 2)) / box.width;
          const dy = (event.clientY - (box.top + box.height / 2)) / box.height;
          for (const piece of pieces) {
            piece.x(-dx * 18 * piece.depth);
            piece.y(-dy * 14 * piece.depth);
          }
        };
        const leave = () => {
          for (const piece of pieces) {
            piece.x(0);
            piece.y(0);
          }
        };
        sheet.addEventListener("pointermove", move);
        sheet.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          sheet.removeEventListener("pointermove", move);
          sheet.removeEventListener("pointerleave", leave);
        });
      }

      // A moldura dos artistas se inclina levemente para o ponteiro.
      const frame = root.querySelector<HTMLElement>("[data-il-frame]");
      const list = frame?.closest("section");
      if (frame && list && fine && !lite) {
        const rotate = gsap.quickTo(frame, "rotation", { duration: 0.8, ease: "power3" });
        const shift = gsap.quickTo(frame, "y", { duration: 0.8, ease: "power3" });
        const move = (event: PointerEvent) => {
          const box = list.getBoundingClientRect();
          const dx = (event.clientX - (box.left + box.width / 2)) / box.width;
          const dy = (event.clientY - (box.top + box.height / 2)) / box.height;
          rotate(dx * 3);
          shift(dy * 16);
        };
        list.addEventListener("pointermove", move);
        cleanups.push(() => list.removeEventListener("pointermove", move));
      }

      // A página muda de altura sem mudar de largura (a ficha vira cópia carbono, a lista de
      // erros aparece, fotos carregam): sem recalcular, as revelações de baixo disparariam tarde
      // ou nunca. Um ResizeObserver no <main> recalcula as posições (com folga de 150 ms).
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
