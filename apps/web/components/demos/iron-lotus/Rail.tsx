"use client";

import { useEffect, useRef, useState } from "react";
import { SECTIONS, STUDIO, type SectionId } from "./content";
import { LotusMark } from "./flash";

// Navegação da Iron Lotus: o índice da margem de uma folha de flash.
// - Computador (lg+): trilho fixo na margem DIREITA, no mesmo papel da página, com os números
//   01–06 e o rótulo de cada folha (nada de menu-mistério). A folha atual ganha o número em
//   vermelho e um círculo de caneta; uma linha de tinta vermelha desce com a rolagem (o índice
//   que "corre"). Embaixo: horário, "Call" e "Book".
// - Tablet: barra no topo com o nome, "Index", "Call" e "Book".
// - Celular: barra fina no topo (nome + Index) e, para o polegar, a doca embaixo com "Call" e
//   "Consult". O índice abre numa folha; Esc fecha e o foco volta ao botão.

export function Rail() {
  const [active, setActive] = useState<SectionId | "">("flash");
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  // Qual folha está no meio da tela.
  useEffect(() => {
    const targets = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (el): el is HTMLElement => !!el,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(entry.target.id as SectionId);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Progresso da página na linha vermelha do trilho (uma variável CSS; só transform).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const value = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      document.documentElement.style.setProperty("--il-progress", value.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    firstLink.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Trilho do computador: margem direita */}
      <header className="il-rail">
        <a
          href="#flash"
          className="il-rail-mark il-focus"
          aria-label="Iron Lotus Tattoo, back to top"
        >
          <LotusMark className="size-11" />
          <span className="il-display mt-2 block text-[15px] leading-[0.9] uppercase">
            Iron
            <br />
            Lotus
          </span>
        </a>
        <nav aria-label="Sheets" className="il-rail-nav">
          <span aria-hidden="true" className="il-rail-track">
            <span className="il-rail-ink" />
          </span>
          <ol>
            {SECTIONS.map((section) => {
              const current = active === section.id;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={current ? "location" : undefined}
                    className="il-rail-link il-focus"
                  >
                    <span className="il-rail-no il-display">
                      {section.no}
                      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path
                          d="M52 6C78 5 95 23 94 50C93 77 73 94 47 93C21 92 5 75 6 49C7 25 23 9 46 7C50 7 55 8 58 10"
                          pathLength={1}
                        />
                      </svg>
                    </span>
                    <span className="il-mono text-[11px] tracking-[0.08em] uppercase">
                      {section.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="il-rail-foot">
          <p className="il-mono text-[10.5px] leading-[1.45] tracking-[0.04em] uppercase">
            Tue–Sat
            <br />
            12–8 PM
          </p>
          <a href={STUDIO.phoneHref} className="il-rail-call il-focus">
            <span className="il-mono text-[11px] tracking-[0.08em] uppercase">Call</span>
            <span className="text-[12px] leading-tight">(303) 555‑0126</span>
          </a>
          <a href="#consult" className="il-btn il-btn-red il-rail-book">
            Book a consult
          </a>
        </div>
      </header>

      {/* Barra do topo (celular e tablet) */}
      <header className="il-topbar">
        <a
          href="#flash"
          className="il-focus flex items-center gap-2.5"
          aria-label="Iron Lotus Tattoo, back to top"
        >
          <LotusMark className="size-9" />
          <span className="il-display text-[19px] leading-none uppercase">Iron Lotus</span>
        </a>
        <div className="flex items-center gap-2">
          <a href={STUDIO.phoneHref} className="il-btn il-btn-line il-btn-sm il-topbar-cta">
            Call {STUDIO.phone}
          </a>
          <a href="#consult" className="il-btn il-btn-red il-btn-sm il-topbar-cta">
            Book a consult
          </a>
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls="il-index"
            onClick={() => setOpen((value) => !value)}
            className="il-btn il-btn-line il-btn-sm"
          >
            {open ? "Close" : "Index"}
          </button>
        </div>
      </header>

      <div
        id="il-index"
        role="dialog"
        aria-modal="true"
        aria-label="Index"
        inert={!open}
        data-open={open || undefined}
        className="il-index"
      >
        <ol className="flex flex-col">
          {SECTIONS.map((section, index) => (
            <li key={section.id} style={{ transitionDelay: open ? `${60 + index * 45}ms` : "0ms" }}>
              <a
                ref={index === 0 ? firstLink : undefined}
                href={`#${section.id}`}
                onClick={() => setOpen(false)}
                className="il-focus flex items-baseline gap-4 border-b border-[var(--il-rule)] py-3"
              >
                <span className="il-display w-12 text-[34px] leading-none text-[var(--il-red)]">
                  {section.no}
                </span>
                <span className="il-display text-[34px] leading-none uppercase">
                  {section.label}
                </span>
              </a>
            </li>
          ))}
        </ol>
        <p className="il-mono mt-8 text-[12px] leading-relaxed tracking-[0.04em] uppercase">
          {STUDIO.street} · {STUDIO.area}, {STUDIO.city}
          <br />
          Tue–Sat 12 PM – 8 PM
        </p>
      </div>

      {/* Doca do polegar (só celular) */}
      <nav aria-label="Call or book" className="il-dock">
        <a href={STUDIO.phoneHref} className="il-btn il-btn-line">
          Call
        </a>
        <a href="#consult" className="il-btn il-btn-red">
          Request a consult
        </a>
      </nav>
    </>
  );
}
