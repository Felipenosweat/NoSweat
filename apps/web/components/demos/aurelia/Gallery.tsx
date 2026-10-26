"use client";

import { useEffect, useRef, useState } from "react";
import { GALLERY } from "./content";
import { Credit, Photo } from "./ui";

// A enfilada: as fotos em sequência, como salas uma depois da outra, alternando arcos e
// molduras de alturas diferentes. No computador a rolagem vertical empurra a fileira para o
// lado (AureliaMotion, `data-a-enfilade`); no celular o dedo passa. Clicar abre a foto em tela
// cheia (<dialog> nativo): setas do teclado ou botões trocam a foto, Esc fecha.

const HEIGHTS = ["h-[62vh]", "h-[48vh]", "h-[56vh]"];

export function Gallery() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const box = dialog.current;
    if (!box) return;
    if (index !== null && !box.open) box.showModal();
    if (index === null && box.open) box.close();
  }, [index]);

  const step = (by: number) =>
    setIndex((current) =>
      current === null ? null : (current + by + GALLERY.length) % GALLERY.length,
    );

  const item = index === null ? null : GALLERY[index];

  return (
    <>
      <ul className="a-enfilade-track flex items-center gap-6 lg:gap-10">
        {GALLERY.map((entry, i) => (
          <li key={entry.photo.id} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setIndex(i)}
              data-a-cursor="View"
              className={`a-focus group relative block overflow-hidden ${entry.shape === "arch" ? "rounded-t-full" : ""} ${
                HEIGHTS[i % HEIGHTS.length]
              } aspect-[0.72] max-h-[560px] min-h-[340px] lg:aspect-auto ${
                entry.shape === "arch" ? "lg:w-[30vw]" : "lg:w-[38vw]"
              } lg:max-w-[560px]`}
            >
              <span className="sr-only">Open photo: {entry.caption}</span>
              <Photo
                photo={entry.photo}
                sizes="(min-width: 1024px) 38vw, 75vw"
                ratio={entry.shape === "arch" ? 0.72 : 0.82}
                alt=""
                className="size-full object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]"
              />
            </button>
            <p className="a-caps mt-4 flex gap-3 text-[11px] text-[var(--a-ivory)]/75">
              <span className="text-[var(--a-gold)]">{String(i + 1).padStart(2, "0")}</span>
              {entry.caption}
            </p>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setIndex(null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
        aria-label={item ? item.caption : "Photo"}
        className="a-lightbox m-0 h-dvh max-h-none w-screen max-w-none bg-[var(--a-night)]/96 p-0 text-[var(--a-ivory)] backdrop:bg-black/70"
      >
        {item && index !== null && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-5 py-4 sm:px-10">
              <p className="a-caps text-[11px]">
                <span className="text-[var(--a-gold)]">
                  {String(index + 1).padStart(2, "0")} / {String(GALLERY.length).padStart(2, "0")}
                </span>{" "}
                · {item.caption}
              </p>
              <button
                type="button"
                onClick={() => setIndex(null)}
                className="a-caps a-focus h-11 px-3 text-[11px] text-[var(--a-ivory)]"
                autoFocus
              >
                Close
              </button>
            </div>
            <div className="relative min-h-0 flex-1 px-5 sm:px-16">
              <Photo
                key={item.photo.id}
                photo={item.photo}
                sizes="100vw"
                priority
                style={{ backgroundColor: "transparent" }}
                className="a-lightbox-img mx-auto size-full object-contain"
              />
              <button
                type="button"
                onClick={() => step(-1)}
                className="a-focus absolute top-1/2 left-2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-[var(--a-gold)]/50 bg-[var(--a-night)]/60 sm:left-6"
              >
                <span className="sr-only">Previous photo</span>
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                className="a-focus absolute top-1/2 right-2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-[var(--a-gold)]/50 bg-[var(--a-night)]/60 sm:right-6"
              >
                <span className="sr-only">Next photo</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
            <p className="px-5 py-4 text-[12px] text-[var(--a-ivory)]/60 sm:px-10">
              <Credit photo={item.photo} />
            </p>
          </div>
        )}
      </dialog>
    </>
  );
}
