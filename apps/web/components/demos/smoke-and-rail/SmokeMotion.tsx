"use client";

import { useEffect } from "react";

// Movimento da Smoke & Rail: temperamento "cinematográfico" (ligado à rolagem, dissoluções de
// 1–1,4 s, nada que quique). Só melhora o que já está na página: sem JS, com "reduzir
// movimento" ou em máquina fraca (até 4 núcleos ou 4 GB), tudo aparece parado e completo, e o
// palco vira uma pilha de cenas. Ganchos:
// - data-sr-stage: o palco preso (só movimento completo): a rolagem é o relógio de 14 horas;
// - data-sr-rise: o bloco sobe e aparece ao entrar na tela;
// - data-sr-wipe: a foto abre da esquerda para a direita, como um vagão passando;
// - data-sr-draw (="y" para vertical): o fio ou o trilho se desenha (ligado à rolagem no
//   modo completo);
// - data-sr-flap: as plaquinhas da placa de partidas giram uma vez e param no texto certo.

const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$&";

/** Faz as letras de uma placa girarem e pararem uma a uma (rAF: funciona no relógio virtual). */
function flip(el: HTMLElement, delay: number) {
  const cells = Array.from(el.querySelectorAll<HTMLElement>(".sr-flap-cell"));
  const start = performance.now() + delay;
  const stops = cells.map((_, index) => 260 + index * 55);
  let last = 0;
  const tick = (now: number) => {
    const elapsed = now - start;
    if (elapsed >= 0 && now - last > 45) {
      last = now;
      cells.forEach((cell, index) => {
        const final = cell.dataset.char ?? "";
        if (elapsed >= (stops[index] ?? 0)) {
          if (cell.textContent !== final) {
            cell.textContent = final;
            cell.dataset.settled = "";
          }
        } else {
          cell.textContent = FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)] ?? final;
        }
      });
    }
    if (elapsed < (stops[stops.length - 1] ?? 0) + 60) requestAnimationFrame(tick);
    else cells.forEach((cell) => (cell.textContent = cell.dataset.char ?? ""));
  };
  requestAnimationFrame(tick);
}

export function SmokeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".smoke-rail");
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.dataset.motion = "reduced";
      return;
    }
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lite = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;
    root.dataset.motion = lite ? "lite" : "full";

    let disposed = false;
    const cleanups: (() => void)[] = [];

    // Placas de partida: giram uma vez quando entram (também no modo leve: é barato).
    const flapObserver = new IntersectionObserver(
      (entries) => {
        let order = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          flapObserver.unobserve(entry.target);
          flip(entry.target as HTMLElement, order++ * 70);
        }
      },
      { threshold: 0.6 },
    );
    root.querySelectorAll("[data-sr-flap]").forEach((el) => flapObserver.observe(el));
    cleanups.push(() => flapObserver.disconnect());

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const all = (selector: string, scope: ParentNode = root) =>
        Array.from(scope.querySelectorAll<HTMLElement>(selector));

      const ctx = gsap.context(() => {
        for (const el of all("[data-sr-rise]")) {
          gsap.from(el, {
            y: 28,
            opacity: 0,
            duration: 1.1,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        }

        for (const el of all("[data-sr-wipe]")) {
          const trigger = { trigger: el, start: "top 80%" };
          gsap.fromTo(
            el,
            { clipPath: "inset(0% 100% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.4,
              ease: "power3.inOut",
              scrollTrigger: trigger,
            },
          );
          const img = el.querySelector("img");
          if (img)
            gsap.fromTo(
              img,
              { scale: 1.14, xPercent: -4 },
              { scale: 1, xPercent: 0, duration: 1.8, ease: "power3.out", scrollTrigger: trigger },
            );
        }

        for (const el of all("[data-sr-draw]")) {
          // data-sr-draw="y": a linha é vertical (linha do tempo) e desce de cima.
          const vertical = el.dataset.srDraw === "y";
          gsap.fromTo(el, vertical ? { scaleY: 0 } : { scaleX: 0 }, {
            ...(vertical ? { scaleY: 1 } : { scaleX: 1 }),
            transformOrigin: vertical ? "center top" : "left center",
            ease: lite ? "power2.inOut" : "none",
            duration: lite ? 1.4 : undefined,
            scrollTrigger: lite
              ? { trigger: el, start: "top 85%" }
              : { trigger: el, start: "top 90%", end: "top 35%", scrub: 0.6 },
          });
        }

        if (!lite) {
          const stage = root.querySelector<HTMLElement>("[data-sr-stage]");
          if (stage) cleanups.push(setupStage(stage));
        }
      }, root);
      cleanups.push(() => ctx.revert());

      // O palco preso: a rolagem pela seção alta é o relógio de 0 a 14 horas.
      function setupStage(stage: HTMLElement) {
        stage.dataset.staged = "";
        const scenes = all(".sr-scene", stage);
        const copies = scenes.map((scene) => scene.querySelector<HTMLElement>("[data-sr-copy]"));
        const media = scenes.map((scene) => scene.querySelector<HTMLElement>("[data-sr-media]"));
        const units = stage.querySelector<HTMLElement>("[data-sr-units]");
        const tens = stage.querySelector<HTMLElement>("[data-sr-tens]");
        const fill = stage.querySelector<HTMLElement>("[data-sr-fill]");
        const smoke = stage.querySelector<HTMLElement>("[data-sr-smoke]");
        const stations = all("[data-sr-jump]", stage);
        // Hora (no relógio de 14) em que cada cena começa a entrar; a cena 0 é a primeira dobra.
        const enter = [0, 0.6, 3.6, 8.2, 12.2];
        const FADE = 1.3;

        const tl = gsap.timeline({ defaults: { ease: "none" } });
        scenes.forEach((scene, index) => {
          const at = enter[index] ?? 0;
          const until = enter[index + 1] ?? 14;
          const copy = copies[index];
          const photo = media[index];
          if (index > 0) {
            tl.fromTo(scene, { opacity: 0 }, { opacity: 1, duration: FADE }, at);
            if (copy)
              tl.fromTo(
                copy,
                { opacity: 0, y: 48 },
                { opacity: 1, y: 0, duration: FADE * 0.8 },
                at + FADE * 0.4,
              );
          }
          if (photo)
            tl.fromTo(
              photo,
              { scale: 1.12 },
              { scale: 1, duration: Math.min(14, until + FADE) - at },
              at,
            );
          if (copy && index < scenes.length - 1)
            tl.to(copy, { opacity: 0, y: -36, duration: FADE * 0.6 }, until - FADE * 0.2);
        });
        if (smoke) {
          tl.fromTo(
            smoke,
            { opacity: 0, xPercent: -12 },
            { opacity: 0.5, xPercent: 0, duration: 3 },
            2.6,
          );
          tl.to(smoke, { opacity: 0.32, xPercent: 8, duration: 5 }, 5.6);
          tl.to(smoke, { opacity: 0, xPercent: 14, duration: 2.4 }, 10.6);
        }
        tl.set({}, {}, 14);

        let current = -1;
        const sync = () => {
          // A linha do tempo tem exatamente 14 "horas"; a hora sai do progresso.
          const hour = Math.min(14, tl.progress() * tl.duration());
          // Contador mecânico: o número fica parado e só rola no último quarto de cada hora.
          const whole = Math.floor(hour);
          const part = Math.max(0, (hour - whole - 0.75) / 0.25);
          const rolled = whole + part * part * (3 - 2 * part);
          if (units) units.style.transform = `translate3d(0, ${-rolled}em, 0)`;
          if (tens)
            tens.style.transform = `translate3d(0, ${-Math.min(1, Math.max(0, rolled - 9))}em, 0)`;
          if (fill) fill.style.transform = `scaleX(${hour / 14})`;
          let active = 0;
          enter.forEach((at, index) => {
            if (hour >= at + FADE * 0.5) active = index;
          });
          if (active !== current) {
            current = active;
            scenes.forEach((scene, index) => {
              if (index === active) scene.dataset.current = "";
              else delete scene.dataset.current;
            });
            stations.forEach((station, index) => {
              if (index === active - 1) station.dataset.current = "";
              else delete station.dataset.current;
            });
          }
        };
        tl.eventCallback("onUpdate", sync);

        const trigger = ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          animation: tl,
        });
        sync();

        /** Posição de rolagem em que a cena `index` está inteira no palco. */
        const scrollFor = (index: number) => {
          const hour = Math.min(14, (enter[index] ?? 0) + FADE * 1.2);
          return trigger.start + (trigger.end - trigger.start) * (hour / 14);
        };
        const onJump = (event: Event) => {
          const key = (event.currentTarget as HTMLElement).dataset.srJump;
          const index = scenes.findIndex((scene) => scene.dataset.scene === key);
          if (index > 0) window.scrollTo({ top: scrollFor(index), behavior: "smooth" });
        };
        stations.forEach((station) => station.addEventListener("click", onJump));
        // Teclado: se o foco cai numa cena que não está à vista, a rolagem vai até ela.
        const onFocus = (event: FocusEvent) => {
          const scene = (event.target as HTMLElement).closest<HTMLElement>(".sr-scene");
          const index = scene ? scenes.indexOf(scene) : -1;
          if (index >= 0 && index !== current) window.scrollTo({ top: scrollFor(index) });
        };
        stage.addEventListener("focusin", onFocus);

        return () => {
          stations.forEach((station) => station.removeEventListener("click", onJump));
          stage.removeEventListener("focusin", onFocus);
          trigger.kill();
          delete stage.dataset.staged;
        };
      }

      void document.fonts?.ready.then(() => {
        if (!disposed) ScrollTrigger.refresh();
      });
      ScrollTrigger.refresh();
    })();

    return () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
      delete root.dataset.motion;
    };
  }, []);

  return null;
}
