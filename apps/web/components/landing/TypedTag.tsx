"use client";

import { useEffect, useState } from "react";

// Etiqueta "BE ___" (forma inspirada no gianmediagroup.com, palavras nossas): começa só com "BE"
// e o cursor de bloco piscando; depois da abertura da página, digita a palavra, espera, apaga e
// digita a próxima. Fonte mono, caixa alta, pílula com borda em gradiente animado nas cores da
// logo. Digitar não é deslocamento na tela, então roda também com "reduzir movimento" (o Windows
// liga essa opção quando "Efeitos de animação" está desligado); só a borda fica parada.

const WORDS = ["FOUND.", "TRUSTED.", "REMEMBERED."];

export function TypedTag({ className = "" }: { className?: string }) {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let i = 0;
    let timer = 0;
    let current = "";
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
      setTyping(true);
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
    // Começa a digitar depois da abertura (IntroCurtain, ~1,7 s) e de um instante de cursor.
    timer = window.setTimeout(type, 2400);
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
