"use client";

import { useEffect } from "react";

// Linguagem de movimento da Sunrise Bakery: "playful". Molas leves (back.out), coisas que crescem
// como massa e assentam, um sol que atravessa a manhã. Nunca bloqueia: tudo já está no HTML e
// só melhora o que está lá. Sem JS, com "reduzir movimento" ou em máquina fraca (até 4 núcleos ou
// 4 GB: sem efeitos ligados à rolagem), as coisas aparecem paradas e completas.
// Ganchos:
// - data-sb-rise: o bloco sobe "crescendo" (achatado → normal) com mola ao entrar na tela;
//   data-sb-rise-group: os filhos diretos crescem um depois do outro;
// - data-sb-print: a foto-cópia cai na mesa (sobe, gira até a inclinação dela e assenta);
// - data-sb-score: o corte da massa (SVG com pathLength=1) se desenha;
// - data-sb-count: o número conta de 0 até o valor do texto;
// - data-sb-hero: a foto do herói se afasta com a rolagem (só sem modo leve);
// - data-sb-sky: o sol percorre o arco da manhã com a rolagem e acende as paradas
//   (data-sb-stop com data-at de 0 a 1); sem rolagem ligada, ele só sobe até as 7 da manhã.

type Sun = { x: number; y: number };

export function SunriseMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lite = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;
    const root = document.querySelector<HTMLElement>(".sunrise");
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
      const once = (trigger: Element, start = "top 86%") => ({ trigger, start, once: true });

      const ctx = gsap.context(() => {
        const rise = (targets: Element | Element[], trigger: Element, stagger = 0) =>
          gsap.from(targets, {
            y: 46,
            scaleY: 0.84,
            scaleX: 1.04,
            opacity: 0,
            transformOrigin: "50% 100%",
            duration: 1,
            ease: "back.out(1.9)",
            stagger,
            scrollTrigger: once(trigger),
          });

        for (const el of all("[data-sb-rise]")) rise(el, el);
        for (const group of all("[data-sb-rise-group]")) {
          const kids = Array.from(group.children);
          if (kids.length) rise(kids, group, 0.08);
        }

        // O invólucro cai; a cópia dentro mantém a inclinação dela (CSS --tilt), sem briga de
        // transform entre o GSAP e a transição de hover.
        for (const el of all("[data-sb-print]")) {
          const dir = Number(el.dataset.sbPrint) < 0 ? -1 : 1;
          gsap.fromTo(
            el,
            { y: 90, rotate: dir * 7, opacity: 0 },
            {
              y: 0,
              rotate: 0,
              opacity: 1,
              duration: 1.25,
              ease: "back.out(1.5)",
              clearProps: "transform",
              scrollTrigger: once(el, "top 92%"),
            },
          );
        }

        for (const path of all("[data-sb-score]")) {
          gsap.fromTo(
            path,
            { strokeDasharray: 1, strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              duration: 0.9,
              ease: "power2.out",
              scrollTrigger: once(path, "top 90%"),
            },
          );
        }

        for (const el of all("[data-sb-count]")) {
          const end = Number(el.textContent) || 0;
          const counter = { v: 0 };
          el.textContent = "0";
          gsap.to(counter, {
            v: end,
            duration: 1.6,
            ease: "power3.out",
            snap: { v: 1 },
            onUpdate: () => {
              el.textContent = String(Math.round(counter.v));
            },
            scrollTrigger: once(el, "top 85%"),
          });
        }

        // O céu: arco elíptico (o mesmo da marcação, ver page.tsx) e o sol.
        for (const sky of all("[data-sb-sky]")) {
          const sun = sky.querySelector<SVGGElement>("[data-sb-sun]");
          const trail = sky.querySelector<SVGPathElement>("[data-sb-trail]");
          const stops = Array.from(sky.querySelectorAll<HTMLElement>("[data-sb-stop]"));
          if (!sun) continue;
          const cx = Number(sky.dataset.cx);
          const cy = Number(sky.dataset.cy);
          const rx = Number(sky.dataset.rx);
          const ry = Number(sky.dataset.ry);
          const at = (t: number): Sun => ({
            x: cx - rx * Math.cos(Math.PI * t),
            y: cy - ry * Math.sin(Math.PI * t),
          });
          const paint = (t: number) => {
            const p = at(t);
            sun.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
            if (trail) trail.style.strokeDashoffset = String(1 - t);
            for (const stop of stops) {
              if (t >= Number(stop.dataset.at) - 0.005) stop.dataset.lit = "";
              else delete stop.dataset.lit;
            }
          };
          const morning = Number(sky.dataset.morning) || 0.187;
          if (lite) {
            // Sem rolagem ligada: o sol nasce até as 7 da manhã quando o céu aparece.
            const state = { t: 0 };
            paint(0);
            gsap.to(state, {
              t: morning,
              duration: 1.6,
              ease: "back.out(1.4)",
              onUpdate: () => paint(state.t),
              scrollTrigger: once(sky, "top 75%"),
            });
          } else {
            paint(0);
            ScrollTrigger.create({
              trigger: sky,
              start: "top 78%",
              end: "bottom 35%",
              scrub: 0.6,
              onUpdate: (self) => paint(self.progress),
            });
          }
        }

        if (!lite) {
          for (const el of all("[data-sb-hero]")) {
            const img = el.querySelector("img");
            const copy = el.querySelector("[data-sb-hero-copy]");
            const timeline = gsap.timeline({
              scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
            });
            if (img) timeline.fromTo(img, { yPercent: 0 }, { yPercent: 12, ease: "none" }, 0);
            if (copy) timeline.to(copy, { yPercent: -18, ease: "none" }, 0);
          }
          for (const el of all("[data-sb-drift]")) {
            gsap.fromTo(
              el,
              { yPercent: -8 },
              {
                yPercent: 8,
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

      if (document.fonts?.ready) await document.fonts.ready;
      if (!disposed) ScrollTrigger.refresh();
    })();

    return () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}
