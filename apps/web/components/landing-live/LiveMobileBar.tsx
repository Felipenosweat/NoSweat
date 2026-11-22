"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Barra fixa do celular (só < sm): ink, com o botão branco. Aparece quando o botão do herói
// ([data-live-hero-cta]) sai da tela e some de novo enquanto o bloco final
// ([data-live-hide-bar]) está visível, para não repetir o botão que já está ali.
// Mesma ideia do MobileCtaBar, com desenho próprio.

export function LiveMobileBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heroCta = document.querySelector("[data-live-hero-cta]");
    const hiders = Array.from(document.querySelectorAll("[data-live-hide-bar]"));
    if (!heroCta) return;
    // O botão do herói "acima" da tela conta como passado; abaixo dela (antes de rolar), não.
    let pastHero = false;
    const onScreen = new Set<Element>();
    const update = () => setVisible(pastHero && onScreen.size === 0);
    const heroObserver = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      pastHero = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      update();
    });
    const hideObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      update();
    });
    heroObserver.observe(heroCta);
    hiders.forEach((target) => hideObserver.observe(target));
    return () => {
      heroObserver.disconnect();
      hideObserver.disconnect();
    };
  }, []);

  return (
    <div
      inert={!visible}
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 bg-ink px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-white transition-transform duration-200 ease-out motion-reduce:transition-none sm:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <p className="text-[15px] leading-tight font-medium">Describing it is free.</p>
      <Link
        href="/create"
        className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-white px-6 text-base font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px"
      >
        Start my website
      </Link>
    </div>
  );
}
