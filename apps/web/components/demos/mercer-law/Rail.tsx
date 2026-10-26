"use client";

import { useEffect, useRef, useState } from "react";
import { FIRM, SECTIONS } from "./content";
import { OfficeStatus } from "./OfficeStatus";

// Navegação da Mercer Law.
// - Computador (lg+): trilho lateral fixo em bloco vinho, como a lombada de um processo: nome,
//   os capítulos § 1–6 (o atual ganha o fio e o "§" cheio), um fio vertical com o progresso da
//   página e, embaixo, o horário de hoje, o telefone e "Book a consultation".
// - Celular: barra fina no topo (nome + Menu) e, para o polegar, uma barra fixa embaixo com
//   "Call" e "Book". O menu abre uma folha vinho; Esc fecha e o foco volta ao botão.

export function Rail() {
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const rail = useRef<HTMLElement>(null);

  // Qual capítulo está no meio da tela.
  useEffect(() => {
    const targets = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (el): el is HTMLElement => !!el,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const target of targets) observer.observe(target);
    const top = document.getElementById("top");
    const topObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive("");
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    if (top) topObserver.observe(top);
    return () => {
      observer.disconnect();
      topObserver.disconnect();
    };
  }, []);

  // Progresso da página no fio do trilho (uma variável CSS; só transform).
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      rail.current?.style.setProperty("--m-p", String(max > 0 ? window.scrollY / max : 0));
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
      {/* Trilho lateral (computador) */}
      <header
        ref={rail}
        className="m-on-ox fixed inset-y-0 left-0 z-40 hidden w-[var(--m-rail)] flex-col bg-[var(--m-ox)] text-[var(--m-on-ox)] lg:flex"
      >
        <a href="#top" className="block px-7 pt-8 pb-6">
          <span className="m-display block text-[30px] leading-none font-[500]">Mercer Law</span>
          <span className="mt-2 block text-[14px] leading-snug text-[var(--m-on-ox-muted)]">
            Family and estate law
            <br />
            German Village, Columbus
          </span>
        </a>
        <div className="relative mx-7 flex-1 overflow-y-auto border-t border-[var(--m-on-ox)]/25 pt-5">
          <span
            aria-hidden="true"
            className="absolute top-5 bottom-0 left-0 w-px bg-[var(--m-on-ox)]/20"
          />
          <span
            aria-hidden="true"
            className="m-progress absolute top-5 bottom-0 left-0 w-px bg-[var(--m-on-ox)]"
          />
          <nav aria-label="Sections">
            <ol>
              {SECTIONS.map((section) => {
                const current = active === section.id;
                return (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      aria-current={current ? "location" : undefined}
                      className={`group flex items-baseline gap-3 py-[7px] pl-4 text-[16px] leading-tight transition-colors ${current ? "text-[var(--m-on-ox)]" : "text-[var(--m-on-ox-muted)] hover:text-[var(--m-on-ox)]"}`}
                    >
                      <span className="m-num w-6 shrink-0 text-[13px]">§&nbsp;{section.no}</span>
                      <span className={current ? "underline decoration-1 underline-offset-4" : ""}>
                        {section.label}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
        <div className="border-t border-[var(--m-on-ox)]/25 px-7 pt-5 pb-7">
          <OfficeStatus className="block text-[14px] text-[var(--m-on-ox-muted)]" />
          <a
            href={`tel:${FIRM.tel}`}
            className="m-num mt-2 block text-[22px] leading-tight hover:underline"
          >
            {FIRM.phone}
          </a>
          <a
            href="#book"
            className="m-btn m-btn-paper mt-5 w-full px-3 text-[15px] whitespace-nowrap"
          >
            Book a consultation
          </a>
        </div>
      </header>

      {/* Barra do topo (celular e tablet) */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--m-rule)] bg-[var(--m-paper)]/95 lg:hidden">
        <div className="flex h-14 items-center justify-between pr-2 pl-4 sm:pl-8">
          <a href="#top" className="m-display text-[22px] leading-none font-[500]">
            Mercer Law
          </a>
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls="m-menu"
            onClick={() => setOpen((value) => !value)}
            className="m-label flex h-11 items-center gap-3 px-3 text-[12px]"
          >
            {open ? "Close" : "Menu"}
            <span aria-hidden="true" className="relative block h-2.5 w-5">
              <span
                className={`absolute left-0 h-px w-5 bg-current transition-transform duration-300 ${open ? "top-1 rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute left-0 h-px w-5 bg-current transition-transform duration-300 ${open ? "top-1 -rotate-45" : "top-2.5"}`}
              />
            </span>
          </button>
        </div>
      </header>

      <div
        id="m-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        data-open={open || undefined}
        className="m-menu m-on-ox fixed inset-x-0 top-14 bottom-0 z-30 overflow-y-auto bg-[var(--m-ox)] px-5 pt-6 pb-28 text-[var(--m-on-ox)] sm:px-8 lg:hidden"
      >
        <nav aria-label="Sections">
          <ol className="border-t border-[var(--m-on-ox)]/25">
            {SECTIONS.map((section, index) => (
              <li key={section.id} className="border-b border-[var(--m-on-ox)]/25">
                <a
                  ref={index === 0 ? firstLink : undefined}
                  href={`#${section.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 py-3.5"
                >
                  <span className="m-num w-8 text-[14px] text-[var(--m-on-ox-muted)]">
                    §&nbsp;{section.no}
                  </span>
                  <span className="m-display text-[30px] leading-none">{section.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <p className="mt-8 text-[16px] leading-relaxed text-[var(--m-on-ox-muted)]">
          {FIRM.street}, {FIRM.city}, {FIRM.state}
          <br />
          <OfficeStatus />
        </p>
      </div>

      {/* Barra do polegar (celular e tablet): ligar e marcar sempre a um toque. */}
      <nav
        aria-label="Call or book"
        className="m-on-ox fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 bg-[var(--m-ox)] pb-[env(safe-area-inset-bottom)] text-[var(--m-on-ox)] lg:hidden"
      >
        <a
          href={`tel:${FIRM.tel}`}
          className="flex min-h-14 flex-col items-center justify-center border-r border-[var(--m-on-ox)]/25 px-2 text-center leading-tight"
        >
          <span className="m-label text-[11px] text-[var(--m-on-ox-muted)]">Call the office</span>
          <span className="m-num text-[17px]">{FIRM.phone}</span>
        </a>
        <a
          href="#book"
          onClick={() => setOpen(false)}
          className="flex min-h-14 flex-col items-center justify-center px-2 text-center leading-tight"
        >
          <span className="m-label text-[11px] text-[var(--m-on-ox-muted)]">Private request</span>
          <span className="text-[17px]">Book a consultation</span>
        </a>
      </nav>
    </>
  );
}
