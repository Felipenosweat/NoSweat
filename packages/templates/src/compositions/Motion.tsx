"use client";

import { useEffect, useRef } from "react";

// Movimento do molde Signature (padrão de site premiado). Só melhora o que já está na página:
// sem JavaScript, ou com "reduzir movimento", tudo aparece parado e legível.
// Ganchos (atributos no HTML, ver Signature.tsx):
// - data-ns-rise / data-ns-fade: o bloco sobe e aparece ao entrar na tela (IntersectionObserver
//   + transição de CSS; o ritmo vem da composição, ver styles.css). data-ns-stagger: o mesmo
//   para cada filho direto, um depois do outro. O que já está na primeira tela não se mexe;
// - data-ns-parallax="0.3": a foto anda mais devagar que a rolagem;
// - data-ns-zoom: a foto do cartão assenta (escala 1,14 → 1) enquanto entra na tela;
// - data-ns-reveal: a moldura da foto se abre de baixo para cima ao entrar na tela;
// - data-ns-words: o parágrafo acende palavra por palavra conforme a rolagem;
// - data-ns-hscroll (com .ns-rail dentro): a rolagem vertical empurra a galeria para o lado;
// - data-ns-float (com [data-ns-float-row] e [data-ns-float-img]): foto que segue o mouse;
// - data-ns-magnetic: o botão puxa na direção do mouse;
// - data-ns-quotes (com [data-ns-quote]): depoimentos que trocam sozinhos.

export function Motion() {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>(".ns-site");
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    const cleanups: (() => void)[] = [];

    cleanups.push(revealOnScroll(root), smoothAnchors(root));

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      // Máquina fraca (até 4 núcleos ou 4 GB): só as entradas de uma vez (revelar, subir). Os
      // efeitos presos à rolagem recalculam a cada quadro e travam a rolagem nesses aparelhos.
      // Sem os dados no navegador, conta como máquina boa.
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
      const lite = (navigator.hardwareConcurrency || 8) <= 4 || memory <= 4;
      const ctx = gsap.context(() => {
        const all = <T extends Element = HTMLElement>(selector: string) =>
          Array.from(root.querySelectorAll<T & HTMLElement>(selector));
        const heavy = <T extends Element = HTMLElement>(selector: string) =>
          lite ? [] : all<T>(selector);

        for (const el of heavy("[data-ns-parallax]")) {
          const speed = Number(el.dataset.nsParallax) || 0.2;
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

        for (const el of all("[data-ns-reveal]")) {
          gsap.fromTo(
            el,
            { clipPath: "inset(100% 0% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.6,
              ease: "expo.out",
              scrollTrigger: { trigger: el, start: "top 88%" },
            },
          );
        }

        for (const el of heavy("[data-ns-zoom]")) {
          gsap.fromTo(
            el,
            { scale: 1.14 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: el.parentElement ?? el,
                start: "top bottom",
                end: "center 55%",
                scrub: true,
              },
            },
          );
        }

        for (const p of heavy("[data-ns-words]")) {
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
            { opacity: 0.16 },
            {
              opacity: 1,
              stagger: 0.05,
              ease: "none",
              scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 45%", scrub: true },
            },
          );
        }

        // A galeria fica presa mesmo em máquina fraca: o CSS já deixa a seção alta (um só
        // transform por quadro).
        for (const section of all("[data-ns-hscroll]")) {
          const rail = section.querySelector<HTMLElement>(".ns-rail");
          if (!rail) continue;
          gsap.to(rail, {
            x: () => -Math.max(0, rail.scrollWidth - root.clientWidth + 64),
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          });
        }

        for (const el of heavy("footer [data-ns-giant]")) {
          gsap.from(el, {
            yPercent: 55,
            ease: "none",
            scrollTrigger: {
              trigger: el.closest("footer"),
              start: "top bottom",
              end: "bottom bottom",
              scrub: true,
            },
          });
        }
      }, root);
      cleanups.push(() => ctx.revert());

      // Foto que segue o mouse na lista de serviços (só com mouse de verdade).
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        for (const list of Array.from(root.querySelectorAll<HTMLElement>("[data-ns-float]"))) {
          const float = list.querySelector<HTMLElement>("[data-ns-float-box]");
          const images = Array.from(list.querySelectorAll<HTMLElement>("[data-ns-float-img]"));
          if (!float || images.length === 0) continue;
          let x = 0;
          let y = 0;
          let tx = 0;
          let ty = 0;
          const move = (event: MouseEvent) => {
            tx = event.clientX;
            ty = event.clientY;
          };
          const tick = () => {
            x += (tx - x) * 0.12;
            y += (ty - y) * 0.12;
            float.style.transform = `translate(${x}px, ${y}px)`;
          };
          window.addEventListener("mousemove", move);
          gsap.ticker.add(tick);
          const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-ns-float-row]"));
          rows.forEach((row, index) => {
            const enter = () => {
              float.dataset.show = "";
              images.forEach(
                (img, k) => (img.style.opacity = k === index % images.length ? "1" : "0"),
              );
            };
            const leave = () => delete float.dataset.show;
            row.addEventListener("mouseenter", enter);
            row.addEventListener("mouseleave", leave);
            cleanups.push(() => {
              row.removeEventListener("mouseenter", enter);
              row.removeEventListener("mouseleave", leave);
            });
          });
          cleanups.push(() => {
            window.removeEventListener("mousemove", move);
            gsap.ticker.remove(tick);
          });
        }

        for (const button of Array.from(root.querySelectorAll<HTMLElement>("[data-ns-magnetic]"))) {
          const move = (event: MouseEvent) => {
            const box = button.getBoundingClientRect();
            gsap.to(button, {
              x: (event.clientX - box.left - box.width / 2) * 0.35,
              y: (event.clientY - box.top - box.height / 2) * 0.35,
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

      // Depoimentos trocam devagar.
      for (const box of Array.from(root.querySelectorAll<HTMLElement>("[data-ns-quotes]"))) {
        const quotes = Array.from(box.querySelectorAll<HTMLElement>("[data-ns-quote]"));
        if (quotes.length < 2) continue;
        box.dataset.rotating = "";
        let current = 0;
        quotes[0]?.setAttribute("data-on", "");
        const timer = window.setInterval(() => {
          quotes[current]?.removeAttribute("data-on");
          current = (current + 1) % quotes.length;
          quotes[current]?.setAttribute("data-on", "");
        }, 5600);
        cleanups.push(() => window.clearInterval(timer));
      }

      ScrollTrigger.refresh();
    })();

    return () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return <span ref={anchor} hidden />;
}

const REVEAL = "[data-ns-rise], [data-ns-fade], [data-ns-stagger] > *";

/**
 * Revelação ao rolar sem biblioteca. O CSS só esconde (opacidade + deslocamento) quando o site
 * tem `data-ns-motion`, que só é ligado aqui: sem JavaScript, nada fica escondido. O que já está
 * na tela ao abrir é marcado como visto antes, para não piscar. Devolve a limpeza.
 */
function revealOnScroll(root: HTMLElement): () => void {
  const targets = Array.from(root.querySelectorAll<HTMLElement>(REVEAL));
  const fold = window.innerHeight;
  const pending: HTMLElement[] = [];
  for (const el of targets) {
    const box = el.getBoundingClientRect();
    if (box.top < fold && box.bottom > 0) {
      el.dataset.nsIn = "";
      el.dataset.nsDone = "";
    } else pending.push(el);
  }
  root.dataset.nsMotion = "";

  const observer = new IntersectionObserver(
    (entries) => {
      const entering = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target as HTMLElement)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      // Os que entram juntos vêm um depois do outro (no máximo 6 degraus).
      entering.forEach((el, k) => {
        el.style.setProperty("--ns-d", `calc(var(--ns-stagger) * ${Math.min(k, 6)})`);
        el.dataset.nsIn = "";
        observer.unobserve(el);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0 },
  );
  for (const el of pending) observer.observe(el);

  // Terminada a entrada, a transição sai (o hover e o resto voltam às transições próprias).
  const settle = (event: TransitionEvent) => {
    const el = event.target;
    if (event.propertyName !== "transform" || !(el instanceof HTMLElement)) return;
    if (el.dataset.nsIn !== undefined) el.dataset.nsDone = "";
  };
  root.addEventListener("transitionend", settle);

  return () => {
    observer.disconnect();
    root.removeEventListener("transitionend", settle);
    delete root.dataset.nsMotion;
  };
}

/**
 * Rolagem suave até as âncoras do próprio site (menu, "voltar ao topo"). Fica no clique e não no
 * CSS (scroll-behavior) porque o ScrollTrigger também rola a página ao recalcular. O foco vai
 * para a seção, para o teclado e o leitor de tela continuarem dali.
 */
function smoothAnchors(root: HTMLElement): () => void {
  const click = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest("a") : null;
    const hash = link?.getAttribute("href");
    if (!hash || !hash.startsWith("#") || hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target || !root.contains(target)) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    history.pushState(null, "", hash);
  };
  root.addEventListener("click", click);
  return () => root.removeEventListener("click", click);
}
