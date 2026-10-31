"use client";

import { useEffect } from "react";

// Movimento da Fade & Co.: temperamento "kinetic" (0,5–0,9 s, power3/expo.out, escalonado de
// 40–60 ms). Cada efeito aparece UMA vez na página e nenhum deixa o texto ilegível:
// - herói: a "fade" se faz ao carregar (CSS, ver fade.css) e, com mouse, o ponteiro passa como
//   uma máquina: as letras perto dele afinam e voltam devagar (data-f-clip);
// - data-f-lines: as linhas do título sobem de dentro da máscara;
// - data-f-word: na frase do meio, o peso das palavras sobe com a rolagem (scrub);
// - data-f-stretch: os nomes dos barbeiros abrem de condensado até a largura da linha;
// - data-f-sweep: a marca do rodapé refaz a fade ao entrar na tela.
// Ajuste de largura (data-f-fit) é layout, não movimento: roda sempre, até com "reduzir
// movimento". Sem JS, com "reduzir movimento" ou em máquina fraca (até 4 núcleos ou 4 GB) não
// há scrub nem ponteiro; com "reduzir movimento" nada se mexe e tudo fica no estado final.

/** Acha a largura (eixo wdth 50–150) em que a linha cabe exatamente no espaço do pai. */
function fitLines(root: HTMLElement) {
  for (const line of root.querySelectorAll<HTMLElement>("[data-f-fit]")) {
    const box = line.parentElement;
    if (!box) continue;
    const target = box.clientWidth;
    // Mede com a largura aberta (--sq 1), mesmo que a entrada ainda não tenha acontecido.
    const squeeze = line.style.getPropertyValue("--sq");
    line.style.setProperty("--sq", "1");
    let low = 50;
    let high = 150;
    for (let i = 0; i < 9; i++) {
      const mid = (low + high) / 2;
      line.style.setProperty("--wd", String(mid));
      if (line.scrollWidth <= target) low = mid;
      else high = mid;
    }
    line.style.setProperty("--wd", low.toFixed(1));
    if (squeeze) line.style.setProperty("--sq", squeeze);
    else line.style.removeProperty("--sq");
  }
}

export function FadeMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".fade");
    if (!root) return;

    // Largura dos nomes: depois das fontes e a cada mudança de tamanho.
    const refit = () => fitLines(root);
    void document.fonts.ready.then(refit);
    const observer = new ResizeObserver(refit);
    observer.observe(root);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => observer.disconnect();
    }
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const lite = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;
    let disposed = false;
    const cleanups: (() => void)[] = [() => observer.disconnect()];

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      await document.fonts.ready;
      if (disposed) return;
      const all = (selector: string, scope: ParentNode = root) =>
        Array.from(scope.querySelectorAll<HTMLElement>(selector));

      const ctx = gsap.context(() => {
        for (const title of all("[data-f-lines]")) {
          gsap.from(all(".f-line-in", title), {
            yPercent: 112,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.06,
            scrollTrigger: { trigger: title, start: "top 88%", once: true },
          });
        }

        for (const el of all("[data-f-rise]")) {
          gsap.from(el, {
            y: 28,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          });
        }

        for (const line of all("[data-f-stretch]")) {
          gsap.fromTo(
            line,
            { "--sq": 0 },
            {
              "--sq": 1,
              duration: 0.9,
              ease: "expo.out",
              scrollTrigger: { trigger: line, start: "top 90%", once: true },
            },
          );
        }

        for (const mark of all("[data-f-sweep]")) {
          // fromTo com o peso final de cada letra (o `from` do GSAP não lê bem a variável).
          all(".f-ch", mark).forEach((letter, index) => {
            const end = Number.parseFloat(letter.style.getPropertyValue("--wg")) || 800;
            gsap.fromTo(
              letter,
              { "--wg": 900 },
              {
                "--wg": end,
                duration: 0.8,
                ease: "power3.out",
                delay: index * 0.05,
                scrollTrigger: { trigger: mark, start: "top 85%", once: true },
              },
            );
          });
        }

        if (!lite) {
          // A frase do meio ganha peso enquanto é lida (uma vez na página).
          for (const block of all("[data-f-weigh]")) {
            gsap.fromTo(
              all("[data-f-word]", block),
              { "--wg": 230 },
              {
                "--wg": 820,
                ease: "none",
                stagger: 0.12,
                scrollTrigger: { trigger: block, start: "top 78%", end: "bottom 55%", scrub: 0.5 },
              },
            );
          }
        }
      }, root);
      cleanups.push(() => ctx.revert());

      // A "máquina": com mouse, as letras do herói perto do ponteiro afinam e voltam devagar.
      const hero = root.querySelector<HTMLElement>("[data-f-hero]");
      if (!lite && hero && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const letters = all("[data-f-clip]", hero).map((el) => ({
          el,
          to: gsap.quickTo(el, "--cut", { duration: 0.9, ease: "power3.out" }),
        }));
        const move = (event: PointerEvent) => {
          for (const letter of letters) {
            const box = letter.el.getBoundingClientRect();
            const dx = (box.left + box.width / 2 - event.clientX) / 170;
            const dy = (box.top + box.height / 2 - event.clientY) / 120;
            letter.to(560 * Math.exp(-(dx * dx + dy * dy)));
          }
        };
        const leave = () => {
          for (const letter of letters) letter.to(0);
        };
        hero.addEventListener("pointermove", move);
        hero.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          hero.removeEventListener("pointermove", move);
          hero.removeEventListener("pointerleave", leave);
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
