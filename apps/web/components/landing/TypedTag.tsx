"use client";

import { useEffect, useState } from "react";

// Etiqueta "BE ___" que se digita e se apaga, com cursor de bloco (forma inspirada no
// gianmediagroup.com, palavras nossas). Fonte mono, caixa alta, dentro de uma pílula com a borda
// em gradiente animado nas cores da logo. Com "reduzir movimento" fica parada na primeira palavra.

const WORDS = ["FOUND.", "TRUSTED.", "REMEMBERED."];

export function TypedTag({ className = "" }: { className?: string }) {
  const [text, setText] = useState(WORDS[0] ?? "");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let timer = 0;
    let current = WORDS[0] ?? "";
    const erase = () => {
      setTyping(true);
      if (current.length > 0) {
        current = current.slice(0, -1);
        setText(current);
        timer = window.setTimeout(erase, 55);
      } else {
        i = (i + 1) % WORDS.length;
        timer = window.setTimeout(type, 180);
      }
    };
    const type = () => {
      const target = WORDS[i] ?? "";
      if (current.length < target.length) {
        current = target.slice(0, current.length + 1);
        setText(current);
        timer = window.setTimeout(type, 70);
      } else {
        setTyping(false);
        timer = window.setTimeout(erase, 2600);
      }
    };
    timer = window.setTimeout(erase, 2600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <span className={`lp-typed ${className}`}>
      <span className="sr-only">Be found, trusted and remembered.</span>
      <span aria-hidden="true" className="inline-flex items-center">
        BE&nbsp;<span>{text}</span>
        <span className="lp-caret" data-on={typing ? "" : undefined} />
      </span>
    </span>
  );
}
