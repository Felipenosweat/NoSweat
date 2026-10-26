"use client";

import { useEffect, useRef, useState } from "react";
import { Crest } from "./ui";

// Abertura (só na primeira visita da sessão, ~2,4 s, com "Skip"): o brasão se desenha em ouro,
// o nome aparece com o espaçamento fechando e duas portas se abrem sobre o salão de baile.
// A animação é CSS (aurelia.css): funciona sem JS e termina sozinha. O JS só pula a abertura
// nas visitas seguintes (sessionStorage, lido por um script antes da pintura no layout) e
// cuida do botão "Skip". Com "reduzir movimento" a abertura não aparece.

const KEY = "aurelia-opened";

export function Opening() {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const finish = () => {
      setDone(true);
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        // Modo privado: a abertura volta na próxima visita, sem problema.
      }
    };
    el.addEventListener("animationend", (event) => {
      if (event.target === el) finish();
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (done) return null;
  return (
    <div ref={ref} className="a-opening" aria-hidden="true">
      <div className="a-door a-door-left" />
      <div className="a-door a-door-right" />
      <div className="a-opening-mark">
        <Crest draw className="h-24 w-[4.8rem] text-[var(--a-gold)] sm:h-28 sm:w-[5.6rem]" />
        <p className="a-opening-name a-display mt-6 text-[clamp(2rem,6vw,4.25rem)] text-[var(--a-ivory)] italic">
          Aurelia
        </p>
        <p className="a-opening-sub a-caps mt-3 text-[11px] text-[var(--a-gold)]">
          Royal Estate · Lake Valcora
        </p>
      </div>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setDone(true)}
        className="a-caps absolute right-6 bottom-6 text-[11px] text-[var(--a-ivory)]/70 hover:text-[var(--a-ivory)]"
      >
        Skip
      </button>
    </div>
  );
}

/** Script que roda antes da pintura: visita repetida na sessão = sem abertura. */
export const OPENING_SEEN_SCRIPT = `try{if(sessionStorage.getItem("${KEY}"))document.documentElement.dataset.aOpened="1"}catch(e){}`;
