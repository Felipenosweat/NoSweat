"use client";

import { useEffect, useRef } from "react";

// Movimento do molde Signature (padrão de site premiado). Só melhora o que já está na página:
// sem JavaScript, ou com "reduzir movimento", tudo aparece parado e legível.
// Ganchos (atributos no HTML, ver Signature.tsx):
// - data-ns-parallax="0.3": a foto anda mais devagar que a rolagem;
// - data-ns-reveal: a moldura da foto se abre de baixo para cima ao entrar na tela;
// - data-ns-rise: título ou linha sobe ao entrar na tela;
// - data-ns-words: o parágrafo acende palavra por palavra conforme a rolagem;
// - data-ns-hscroll (com .ns-rail dentro): a rolagem vertical empurra a galeria para o lado;
// - data-ns-float (com [data-ns-float-row] e [data-ns-float-img]): foto que segue o mouse;
// - data-ns-magnetic: o botão puxa na direção do mouse;
// - data-ns-quotes (com [data-ns-quote]): depoimentos que trocam sozinhos.

export function Motion({ smooth = true }: { smooth?: boolean }) {
  const anchor = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>(".ns-site");
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    const cleanups: (() => void)[] = [];

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        const all = <T extends Element = HTMLElement>(selector: string) =>
          Array.from(root.querySelectorAll<T & HTMLElement>(selector));

        for (const el of all("[data-ns-parallax]")) {
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

        for (const el of all("[data-ns-rise]")) {
          gsap.from(el, {
            y: 48,
            opacity: 0,
            duration: 1.3,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 92%" },
          });
        }

        for (const p of all("[data-ns-words]")) {
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

        for (const el of all("footer [data-ns-giant]")) {
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

      // Rolagem suave (a roda do mouse e o toque continuam mandando; links #âncora também).
      if (smooth && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const { default: Lenis } = await import("lenis");
        if (disposed) return;
        const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        cleanups.push(() => {
          gsap.ticker.remove(raf);
          lenis.destroy();
        });
      }

      ScrollTrigger.refresh();
    })();

    return () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
    };
  }, [smooth]);

  return <span ref={anchor} hidden />;
}
