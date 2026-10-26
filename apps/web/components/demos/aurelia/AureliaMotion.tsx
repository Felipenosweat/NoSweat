"use client";

import { useEffect } from "react";

// Linguagem de movimento da Aurelia: "cerimonial". Tudo devagar e com a mesma curva
// (expo.out), nunca balançando. Só melhora o que já está na página: sem JS, com "reduzir
// movimento" ou em máquina fraca (até 4 núcleos ou 4 GB), tudo aparece parado e completo.
// Ganchos:
// - data-a-hero: a foto do salão se afasta (escala 1.15 → 1) enquanto o título sobe com a rolagem;
// - data-a-arch: a moldura em arco se abre de baixo para cima ao entrar na tela;
// - data-a-rise: o bloco sobe e aparece ao entrar na tela;
// - data-a-line: o filete dourado se desenha da esquerda;
// - data-a-parallax="0.2": a foto anda mais devagar que a rolagem;
// - data-a-enfilade (com .a-enfilade-track dentro): no computador, a galeria anda de lado presa;
// - data-a-cursor="View" num elemento: o cursor dourado mostra a palavra em cima dele.

export function AureliaMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lite = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;
    const root = document.querySelector<HTMLElement>(".aurelia");
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
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      const ease = "expo.out";

      const ctx = gsap.context(() => {
        for (const el of all("[data-a-arch]")) {
          gsap.fromTo(
            el,
            { clipPath: "inset(100% 0% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.8,
              ease,
              scrollTrigger: { trigger: el, start: "top 88%" },
            },
          );
          const img = el.querySelector("img");
          if (img)
            gsap.fromTo(
              img,
              { scale: 1.25 },
              { scale: 1, duration: 2.2, ease, scrollTrigger: { trigger: el, start: "top 88%" } },
            );
        }

        for (const el of all("[data-a-rise]")) {
          gsap.from(el, {
            y: 40,
            opacity: 0,
            duration: 1.4,
            ease,
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        }

        for (const el of all("[data-a-line]")) {
          gsap.fromTo(
            el,
            { scaleX: 0 },
            {
              scaleX: 1,
              transformOrigin: "left center",
              duration: 1.6,
              ease,
              scrollTrigger: { trigger: el, start: "top 92%" },
            },
          );
        }

        if (!lite) {
          for (const el of all("[data-a-hero]")) {
            const img = el.querySelector("img");
            const title = el.querySelector("[data-a-hero-title]");
            const timeline = gsap.timeline({
              scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
            });
            if (img) timeline.fromTo(img, { scale: 1.12 }, { scale: 1, ease: "none" }, 0);
            if (title) timeline.to(title, { yPercent: -30, opacity: 0.2, ease: "none" }, 0);
          }

          for (const el of all("[data-a-parallax]")) {
            const speed = Number(el.dataset.aParallax) || 0.2;
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

          if (wide) {
            for (const section of all("[data-a-enfilade]")) {
              const track = section.querySelector<HTMLElement>(".a-enfilade-track");
              if (!track) continue;
              section.dataset.pinned = "";
              const progress = section.querySelector<HTMLElement>("[data-a-progress]");
              gsap.to(track, {
                x: () => -Math.max(0, track.scrollWidth - window.innerWidth + 80),
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top top",
                  end: "bottom bottom",
                  scrub: 0.8,
                  invalidateOnRefresh: true,
                  onUpdate: (self) => {
                    if (progress) progress.style.transform = `scaleX(${self.progress})`;
                  },
                },
              });
              cleanups.push(() => delete section.dataset.pinned);
            }
          }
        }
      }, root);
      cleanups.push(() => ctx.revert());

      // Cursor dourado (só com mouse de verdade): um anel que segue o ponteiro e mostra a
      // palavra do elemento embaixo dele (data-a-cursor).
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const cursor = document.createElement("div");
        cursor.className = "a-cursor";
        cursor.setAttribute("aria-hidden", "true");
        cursor.innerHTML = "<span></span>";
        root.append(cursor);
        const label = cursor.firstElementChild as HTMLElement;
        const toX = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3" });
        const toY = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3" });
        const move = (event: PointerEvent) => {
          toX(event.clientX);
          toY(event.clientY);
          const target = (event.target as Element | null)?.closest<HTMLElement>("[data-a-cursor]");
          if (target) {
            cursor.dataset.label = "1";
            label.textContent = target.dataset.aCursor ?? "";
          } else delete cursor.dataset.label;
        };
        window.addEventListener("pointermove", move);
        cleanups.push(() => {
          window.removeEventListener("pointermove", move);
          cursor.remove();
        });
      }

      ScrollTrigger.refresh();
    })();

    return () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}
