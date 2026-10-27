"use client";

import { useEffect, useRef, useState } from "react";

// Motor das letras que viram (split-flap), usado pelo quadro da semana e pela tirinha do herói.
// Um relógio de 45 ms decide, letra por letra, se ainda mostra uma letra de passagem (2–4) ou já
// a definitiva, numa onda da esquerda para a direita e de cima para baixo. O visual (a plaqueta
// girando com mola) é CSS (.sb-flap); aqui só muda o texto. Com "reduzir movimento", troca direto.

const CHARSET = "ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789$";

export function useFlip(target: string[]): { display: string[]; animated: boolean } {
  const [display, setDisplay] = useState<string[]>(target);
  const [animated, setAnimated] = useState(false);
  const shown = useRef<string[]>(target);
  const key = target.join("|");

  useEffect(() => {
    const goal = key.split("|");
    const from = shown.current;
    if (from.join("|") === key) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      shown.current = goal;
      const id = window.setTimeout(() => setDisplay(goal), 0);
      return () => window.clearTimeout(id);
    }
    const plan = goal.map((row, r) =>
      Array.from(row).map((ch, c) => ({
        changes: ch !== from[r]?.[c],
        start: r * 55 + c * 16,
        steps: 2 + ((r * 7 + c * 3) % 3),
      })),
    );
    const t0 = performance.now();
    // Cadeia de setTimeout (e não setInterval): mesma coisa no navegador, e o relógio virtual do
    // gravador de vídeo só repete timers simples.
    let id = 0;
    const tick = () => {
      const elapsed = performance.now() - t0;
      let done = true;
      const next = goal.map((row, r) =>
        Array.from(row)
          .map((ch, c) => {
            const cell = plan[r]?.[c];
            if (!cell?.changes) return ch;
            const k = Math.floor((elapsed - cell.start) / 60);
            if (k < 0) {
              done = false;
              return from[r]?.[c] ?? " ";
            }
            if (k < cell.steps) {
              done = false;
              return CHARSET.charAt((r * 11 + c * 5 + k * 7) % CHARSET.length);
            }
            return ch;
          })
          .join(""),
      );
      setAnimated(true);
      setDisplay(next);
      if (done) shown.current = goal;
      else id = window.setTimeout(tick, 45);
    };
    id = window.setTimeout(tick, 45);
    return () => window.clearTimeout(id);
  }, [key]);

  return { display, animated };
}

/** Uma fileira de plaquetas (o texto já vem com o tamanho certo). */
export function padRow(text: string, cols: number): string {
  return text.padEnd(cols).slice(0, cols);
}
