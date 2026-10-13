"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

// Motor de movimento da landing V5:
// - rolagem suave (Lenis) ligada ao ScrollTrigger do GSAP;
// - [data-l-reveal]: sobe e aparece ao entrar na tela;
// - [data-l-parallax="0.15"]: desloca no eixo Y conforme a rolagem;
// - [data-l-skew]: as faixas de texto inclinam conforme a velocidade da rolagem;
// - .l-card: o brilho segue o mouse (variáveis --mx/--my).
// Com prefers-reduced-motion nada disso liga: o conteúdo já está visível no HTML.

export function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: { offset: -72 } });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-l-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 48,
          opacity: 0,
          duration: 1.1,
          ease: "expo.out",
          delay: Number(el.dataset.lReveal) || 0,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-l-parallax]").forEach((el) => {
        const speed = Number(el.dataset.lParallax) || 0.15;
        gsap.to(el, {
          yPercent: -speed * 100,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      // Inclina as faixas de texto com a velocidade da rolagem (volta a 0 sozinho).
      const skews = gsap.utils.toArray<HTMLElement>("[data-l-skew]");
      if (skews.length) {
        const setters = skews.map((el) =>
          gsap.quickTo(el, "skewX", { duration: 0.5, ease: "power3" }),
        );
        ScrollTrigger.create({
          onUpdate: (self) => {
            const skew = gsap.utils.clamp(-12, 12, self.getVelocity() / -250);
            setters.forEach((set) => set(skew));
          },
        });
      }
    });

    const onMove = (event: PointerEvent) => {
      const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(".l-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // As seções fixas (pin) mudam a altura da página: recalcula depois que tudo montou.
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      window.clearTimeout(refresh);
      window.removeEventListener("pointermove", onMove);
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
