"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BUSINESS, CHAPTERS } from "./content";
import { RailMark } from "./ui";

// Cabeçalho da Smoke & Rail: marca à esquerda; "Preorder" e o telefone sempre à vista; o
// resto da navegação mora num menu em tela cheia (<dialog> nativo: prende o foco, Esc fecha,
// o foco volta ao botão). No celular, uma barra fixa embaixo com "Call" e "Preorder" (o
// polegar alcança; o selo da No Sweat no fim da página já reserva espaço para ela).

export function Header() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const show = () => {
    dialog.current?.showModal();
    setOpen(true);
  };
  const hide = () => dialog.current?.close();

  return (
    <>
      <header
        data-solid={solid || undefined}
        className="sr-header fixed inset-x-0 top-0 z-40 text-[var(--sr-smoke)]"
      >
        <div className="mx-auto flex h-16 max-w-[1520px] items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-8">
          <a
            href="#top"
            className="sr-focus flex min-h-11 items-center gap-3"
            aria-label="Smoke & Rail BBQ, back to top"
          >
            <RailMark className="h-4 w-7 text-[var(--sr-ember)]" />
            <span className="sr-display text-[22px] leading-none tracking-[0.02em]">
              Smoke &amp; Rail
            </span>
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={BUSINESS.phoneHref}
              className="sr-label sr-focus hidden min-h-11 items-center px-2 text-[12px] text-[var(--sr-smoke)] hover:text-[var(--sr-ember)] md:inline-flex"
            >
              Call {BUSINESS.phone}
            </a>
            <a
              href={BUSINESS.order}
              target="_blank"
              rel="noopener noreferrer"
              className="sr-btn sr-focus hidden h-11 items-center px-5 text-[12px] md:inline-flex"
            >
              Preorder pickup
            </a>
            <button
              type="button"
              onClick={show}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls="sr-menu"
              className="sr-label sr-focus group inline-flex h-11 items-center gap-3 border border-[var(--sr-line-strong)] px-4 text-[12px] hover:border-[var(--sr-smoke)]"
            >
              <span aria-hidden="true" className="flex flex-col gap-[5px]">
                <span className="block h-[2px] w-5 bg-current" />
                <span className="block h-[2px] w-3 bg-[var(--sr-ember)] transition-[width] duration-300 group-hover:w-5" />
              </span>
              Menu
            </button>
          </div>
        </div>
      </header>

      <dialog
        ref={dialog}
        id="sr-menu"
        aria-label="Site menu"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Clique fora do conteúdo (no fundo do diálogo) também fecha.
          if (event.target === dialog.current) hide();
        }}
        className="sr-menu text-[var(--sr-smoke)]"
      >
        <div className="mx-auto flex min-h-full max-w-[1520px] flex-col px-4 pt-4 pb-10 sm:px-8">
          <div className="flex h-12 items-center justify-between sm:h-14">
            <p className="sr-label text-[12px] text-[var(--sr-ash)]">
              {BUSINESS.street} · {BUSINESS.neighborhood}
            </p>
            <button
              type="button"
              onClick={hide}
              className="sr-label sr-focus inline-flex h-11 items-center gap-2 border border-[var(--sr-line-strong)] px-4 text-[12px] hover:border-[var(--sr-smoke)]"
            >
              Close <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="grid flex-1 gap-12 pt-8 lg:grid-cols-12 lg:items-end lg:gap-8 lg:pt-0">
            <nav aria-label="Sections" className="lg:col-span-8">
              <ol className="sr-menu-list">
                {CHAPTERS.map((chapter, index) => (
                  <li key={chapter.id} style={{ "--i": index } as CSSProperties}>
                    <a
                      href={`#${chapter.id}`}
                      onClick={hide}
                      className="sr-focus group flex items-baseline gap-4 py-1 sm:gap-6"
                    >
                      <span className="sr-label w-8 shrink-0 text-[12px] text-[var(--sr-ember)] tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="sr-display text-[clamp(2.6rem,7.4vw,6.4rem)] leading-[0.9] transition-colors duration-300 group-hover:text-[var(--sr-ember)]">
                        {chapter.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="grid gap-6 border-t border-[var(--sr-line)] pt-6 text-[15px] leading-relaxed lg:col-span-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
              <div>
                <p className="sr-label text-[11px] text-[var(--sr-ash)]">The pit</p>
                <p className="mt-2">Thu–Sat · 11 AM until we sell out</p>
              </div>
              <div>
                <p className="sr-label text-[11px] text-[var(--sr-ash)]">The truck</p>
                <p className="mt-2">
                  Tue · the Crossroads
                  <br />
                  Wed · River Market · 11 AM – 2 PM
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={BUSINESS.order}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sr-btn sr-focus inline-flex h-12 items-center px-5 text-[12px]"
                >
                  Preorder pickup
                </a>
                <a
                  href={BUSINESS.phoneHref}
                  className="sr-btn-ghost sr-focus inline-flex h-12 items-center px-5 text-[12px]"
                >
                  Call {BUSINESS.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </dialog>

      {/* Barra do polegar (celular e tablet): ligar e encomendar a um toque, em toda a página. */}
      <nav
        aria-label="Order or call"
        className="sr-dock fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-px md:hidden"
      >
        <a
          href={BUSINESS.phoneHref}
          className="sr-label sr-focus-inset flex h-14 items-center justify-center gap-2 bg-[var(--sr-iron)] text-[13px] text-[var(--sr-smoke)]"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="currentColor">
            <path d="M6.6 2.2 8.4 6c.2.5.1 1-.3 1.4l-1.3 1.2a10.6 10.6 0 0 0 4.6 4.6l1.2-1.3c.4-.4.9-.5 1.4-.3l3.8 1.8c.5.2.8.8.7 1.4l-.4 2.3c-.1.6-.6 1-1.2 1A15.6 15.6 0 0 1 1.9 3.1c0-.6.4-1.1 1-1.2L5.2 1.5c.6-.1 1.2.2 1.4.7Z" />
          </svg>
          Call
        </a>
        <a
          href={BUSINESS.order}
          target="_blank"
          rel="noopener noreferrer"
          className="sr-label sr-focus-inset flex h-14 items-center justify-center bg-[var(--sr-ember)] text-[13px] text-[var(--sr-coal)]"
        >
          Preorder pickup
        </a>
      </nav>
    </>
  );
}
