"use client";

import { useId, useState, type CSSProperties } from "react";
import { FLASH, type FlashId } from "./content";
import { Flash } from "./flash";

// A folha de flash do topo (a interação que só serve a um estúdio de tatuagem): 12 desenhos
// numerados presos no papel em escalas diferentes. Passar o mouse ou focar mostra a etiqueta
// da peça no rodapé da folha; clicar "circula" a peça com caneta vermelha, como o cliente faz
// na parede do estúdio, e libera "Put No. 05 on a consult slip", que preenche a ficha de
// consulta lá embaixo (evento "il:flash"). Preço só o que a fixture dá: Flash Fridays, $100+.
//
// Camadas de cada peça (para que dois transforms não briguem):
//   li (entrada em CSS) → .il-piece-float (paralaxe do ponteiro, GSAP) → button (inclinação
//   e hover em CSS).

export type FlashPick = { no: string; name: string };

export function FlashSheet() {
  const id = useId();
  const [hover, setHover] = useState<FlashId | null>(null);
  const [picked, setPicked] = useState<FlashId | null>(null);
  const shownId = hover ?? picked;
  const shown = FLASH.find((piece) => piece.id === shownId);
  const pickedPiece = FLASH.find((piece) => piece.id === picked);

  const sendToSlip = () => {
    if (!pickedPiece) return;
    window.dispatchEvent(
      new CustomEvent<FlashPick>("il:flash", {
        detail: { no: pickedPiece.no, name: pickedPiece.name },
      }),
    );
  };

  return (
    <div className="il-sheet" data-il-sheet>
      <span aria-hidden="true" className="il-crop il-crop-tl" />
      <span aria-hidden="true" className="il-crop il-crop-tr" />
      <span aria-hidden="true" className="il-crop il-crop-bl" />
      <span aria-hidden="true" className="il-crop il-crop-br" />
      <ul className="il-sheet-grid" aria-label="Flash sheet: twelve numbered designs">
        {FLASH.map((piece, index) => {
          const [c, r, w, h] = piece.area;
          const isPicked = picked === piece.id;
          return (
            <li
              key={piece.id}
              className="il-cell"
              data-big={w === 3 || undefined}
              data-wide={w === 2 && h === 1 ? "" : undefined}
              style={
                {
                  "--c": c,
                  "--r": r,
                  "--w": w,
                  "--h": h,
                  "--i": index,
                  "--tilt": `${piece.tilt}deg`,
                } as CSSProperties
              }
            >
              <div className="il-piece-float" data-il-depth={piece.depth}>
                <button
                  type="button"
                  className="il-piece"
                  aria-pressed={isPicked}
                  aria-describedby={`${id}-readout`}
                  onMouseEnter={() => setHover(piece.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(piece.id)}
                  onBlur={() => setHover(null)}
                  onClick={() => setPicked((value) => (value === piece.id ? null : piece.id))}
                >
                  <span className="il-piece-no il-mono" aria-hidden="true">
                    {piece.no}
                  </span>
                  <Flash id={piece.id} className="il-piece-art" />
                  <svg
                    aria-hidden="true"
                    className="il-marker"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M52 4C80 3 97 22 96 50C95 78 74 96 47 95C20 94 3 76 4 49C5 24 22 7 46 5C50 5 55 6 58 8"
                      pathLength={1}
                    />
                  </svg>
                  <span className="il-piece-name il-mono" aria-hidden="true">
                    {piece.name}
                  </span>
                  <span className="sr-only">
                    Flash No. {piece.no}, {piece.name}
                    {isPicked ? ", circled" : ""}
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="il-readout" id={`${id}-readout`}>
        <div aria-live="polite" className="min-w-0 flex-1">
          {shown ? (
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="il-display text-[28px] leading-none text-[var(--il-red)]">
                No.&nbsp;{shown.no}
              </span>
              <span className="il-display text-[22px] leading-none uppercase">{shown.name}</span>
              <span className="w-full text-[14px] leading-snug text-[var(--il-ink-soft)]">
                Flash Fridays: walk in on a Friday and pick from the flash. From $100, first come.
                {picked === shown.id ? "" : " Click to circle it."}
              </span>
            </p>
          ) : (
            <p className="text-[14px] leading-snug text-[var(--il-ink-soft)]">
              <span className="il-mono mr-2 text-[12px] tracking-[0.08em] text-[var(--il-ink)] uppercase">
                Read the tag
              </span>
              Point at a number, or tap it, to see the design. Twelve designs drawn for this demo.
            </p>
          )}
        </div>
        {pickedPiece ? (
          <a href="#consult" onClick={sendToSlip} className="il-btn il-btn-red shrink-0">
            Put No.&nbsp;{pickedPiece.no} on a consult slip
          </a>
        ) : null}
      </div>
    </div>
  );
}
