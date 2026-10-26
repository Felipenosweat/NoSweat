"use client";

import { useEffect } from "react";

// Movimento da landing V8 (o mesmo do molde Signature dos sites dos clientes). Só melhora o que
// já está na página: sem JavaScript, ou com "reduzir movimento", tudo aparece parado e legível.
// Ganchos (atributos no HTML):
// - data-lp-stage: a moldura do site de exemplo cresce com a rolagem. É CSS puro
//   (animation-timeline em landing.css), não passa mais por aqui;
// - data-lp-parallax="0.3": a foto anda mais devagar que a rolagem;
// - data-lp-reveal: a moldura da foto se abre de baixo para cima ao entrar na tela;
// - data-lp-rise: título ou bloco sobe ao entrar na tela;
// - data-lp-words: o parágrafo acende palavra por palavra conforme a rolagem;
// - data-lp-hscroll (com .lp-rail dentro): no computador, a rolagem vertical empurra a galeria
//   para o lado (sem isso, o trilho rola de lado com o dedo);
// - data-lp-magnetic: o botão puxa na direção do mouse;
// - data-lp-giant: o nome gigante do fim sobe com a rolagem.
//
// Desempenho (Lighthouse: ~1 s de TBT no celular vinha daqui): o GSAP + ScrollTrigger (~110 KB)
// eram baixados, executados e mediam a página inteira (ScrollTrigger.refresh) logo depois da
// hidratação, em cima do carregamento. Agora só começam no primeiro gesto da pessoa (rolar,
// tocar, clicar, tecla): todo efeito daqui depende de rolagem, então nada se perde parado no
// topo. E a montagem é feita em partes, devolvendo a vez ao navegador entre elas.

/** Gestos que ligam o movimento (o primeiro que acontecer). */
const START_EVENTS = ["scroll", "wheel", "touchstart", "pointerdown", "keydown"] as const;

/** Devolve a vez ao navegador (tarefas curtas em vez de uma longa). */
function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (scheduler?.yield) return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** O elemento já está na tela (ou acima dela)? Esses não animam a entrada: já foram vistos. */
function alreadySeen(el: HTMLElement, threshold: number): boolean {
  return el.getBoundingClientRect().top < window.innerHeight * threshold;
}

export function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.querySelector<HTMLElement>("#main");
    if (!root) return;
    let disposed = false;
    let started = false;
    const cleanups: (() => void)[] = [];

    const start = async () => {
      if (started) return;
      started = true;
      for (const type of START_EVENTS) window.removeEventListener(type, onGesture);

      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      // Máquina fraca (até 4 núcleos ou 4 GB): só as entradas de uma vez (sobe/abre). Os efeitos
      // presos à rolagem (parallax, palavras, galeria presa) recalculam a cada quadro e travam a
      // rolagem nesses computadores. Sem os dados no navegador, conta como máquina boa.
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
      const lite = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;

      // Um contexto só (ctx.revert desfaz tudo); cada grupo entra com ctx.add, com uma pausa
      // entre eles.
      const ctx = gsap.context(() => {}, root);
      cleanups.push(() => ctx.revert());
      const steps: (() => void)[] = [
        () => {
          for (const el of lite ? [] : all("[data-lp-parallax]")) {
            const speed = Number(el.dataset.lpParallax) || 0.2;
            gsap.fromTo(
              el,
              { yPercent: -speed * 30 },
              {
                yPercent: speed * 30,
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
        },
        () => {
          for (const el of all("[data-lp-reveal]")) {
            if (alreadySeen(el, 0.9)) continue;
            gsap.fromTo(
              el,
              { clipPath: "inset(100% 0% 0% 0%)" },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 1.6,
                ease: "expo.out",
                scrollTrigger: { trigger: el, start: "top 90%" },
              },
            );
          }
          for (const el of all("[data-lp-rise]")) {
            // Já visível quando o movimento ligou: não some para depois subir.
            if (alreadySeen(el, 0.92)) continue;
            gsap.from(el, {
              y: 48,
              opacity: 0,
              duration: 1.3,
              ease: "expo.out",
              scrollTrigger: { trigger: el, start: "top 92%" },
            });
          }
        },
        () => {
          for (const p of lite ? [] : all("[data-lp-words]")) {
            const words: HTMLElement[] = [];
            const walk = (node: Node) => {
              for (const child of Array.from(node.childNodes)) {
                if (child.nodeType === Node.TEXT_NODE) {
                  const frag = document.createDocumentFragment();
                  for (const part of (child.textContent ?? "").split(/(\s+)/)) {
                    if (!part) continue;
                    if (/^\s+$/.test(part)) frag.append(part);
                    else {
                      const span = document.createElement("span");
                      span.textContent = part;
                      words.push(span);
                      frag.append(span);
                    }
                  }
                  child.replaceWith(frag);
                } else walk(child);
              }
            };
            walk(p);
            gsap.fromTo(
              words,
              { opacity: 0.18 },
              {
                opacity: 1,
                stagger: 0.05,
                ease: "none",
                scrollTrigger: { trigger: p, start: "top 80%", end: "bottom 45%", scrub: true },
              },
            );
          }
        },
        () => {
          // Galeria lateral presa na tela: só no computador (no celular o dedo já rola de lado).
          if (!wide || lite) return;
          for (const section of all("[data-lp-hscroll]")) {
            const rail = section.querySelector<HTMLElement>(".lp-rail");
            if (!rail) continue;
            section.dataset.pinned = "";
            gsap.to(rail, {
              x: () => -Math.max(0, rail.scrollWidth - window.innerWidth),
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "bottom bottom",
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            });
            cleanups.push(() => delete section.dataset.pinned);
          }
        },
        () => {
          for (const el of lite ? [] : all("[data-lp-giant]")) {
            gsap.from(el, {
              yPercent: 40,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom bottom",
                scrub: true,
              },
            });
          }
        },
      ];
      for (const step of steps) {
        await yieldToMain();
        if (disposed) return;
        ctx.add(step);
      }

      if (fine) {
        for (const button of all("[data-lp-magnetic]")) {
          const move = (event: MouseEvent) => {
            const box = button.getBoundingClientRect();
            gsap.to(button, {
              x: (event.clientX - box.left - box.width / 2) * 0.3,
              y: (event.clientY - box.top - box.height / 2) * 0.3,
              duration: 0.6,
            });
          };
          const leave = () =>
            gsap.to(button, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
          button.addEventListener("mousemove", move);
          button.addEventListener("mouseleave", leave);
          cleanups.push(() => {
            button.removeEventListener("mousemove", move);
            button.removeEventListener("mouseleave", leave);
          });
        }
      }

      await yieldToMain();
      if (disposed) return;
      ScrollTrigger.refresh();
    };

    const onGesture = () => void start();
    for (const type of START_EVENTS) {
      window.addEventListener(type, onGesture, { passive: true, once: true });
    }

    return () => {
      disposed = true;
      for (const type of START_EVENTS) window.removeEventListener(type, onGesture);
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}
