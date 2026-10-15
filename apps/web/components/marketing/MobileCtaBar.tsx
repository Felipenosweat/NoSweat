"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { primaryButton } from "./styles";

/**
 * Barra fixa embaixo (só < sm, telas de celular) com o CTA principal. Aparece quando o hero sai da tela e some
 * de novo quando um bloco com `data-hide-mobile-cta` (hero, CTA final) está visível, para não
 * repetir o botão azul que já está na tela. Respeita a área segura do iPhone.
 */
export function MobileCtaBar({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-hide-mobile-cta]"));
    if (targets.length === 0) return;
    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setVisible(onScreen.size === 0);
    });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      inert={!visible}
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 border-t px-5 ${tone === "dark" ? "border-white/10 bg-ink/95" : "border-slate-200 bg-white/95"} pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none sm:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Link href="/create" className={`w-full ${primaryButton}`}>
        Build my website
      </Link>
    </div>
  );
}
