"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Barra fixa embaixo, só no celular e no tablet pequeno (< md). Aparece depois que o botão do topo
// (#hero-cta) sai da tela por cima, e some de novo quando um bloco com `data-hide-mobile-cta` (o
// fim da página) está visível, para não repetir o botão que já está na tela. Sem JS não aparece
// (o botão do topo e o do fim continuam lá). Respeita a área segura do iPhone.

export function StickyCta({ label }: { label: string }) {
  const [pastHero, setPastHero] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const cta = document.getElementById("hero-cta");
    const blockers = Array.from(document.querySelectorAll<HTMLElement>("[data-hide-mobile-cta]"));
    const heroObserver = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      // Só conta como "passou" quando o botão saiu por cima (não antes de chegar nele).
      setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    if (cta) heroObserver.observe(cta);
    const onScreen = new Set<Element>();
    const blockObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setHidden(onScreen.size > 0);
    });
    blockers.forEach((block) => blockObserver.observe(block));
    return () => {
      heroObserver.disconnect();
      blockObserver.disconnect();
    };
  }, []);

  const visible = pastHero && !hidden;
  return (
    <div
      inert={!visible}
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Link
        href="/create"
        className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand px-6 text-[16px] font-semibold text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-px"
      >
        {label}
      </Link>
    </div>
  );
}
