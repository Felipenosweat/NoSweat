"use client";

import { useEffect } from "react";

/**
 * Fallback das revelações ao rolar (`.ns-reveal`) para navegadores sem
 * `animation-timeline: view()`. Só liga a classe `ns-io` no <html> quando roda,
 * então sem JS (ou com movimento reduzido) o conteúdo aparece normalmente.
 */
export function RevealObserver() {
  useEffect(() => {
    if (CSS.supports("animation-timeline: view()")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("ns-io");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-in", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    document.querySelectorAll(".ns-reveal").forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      root.classList.remove("ns-io");
    };
  }, []);

  return null;
}
