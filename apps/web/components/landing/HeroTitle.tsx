"use client";

import { useEffect, useState } from "react";

// Título do topo: "Built to" + um verbo que se digita e se apaga (sem cursor). O servidor já
// manda o primeiro verbo inteiro (é o LCP); com "reduzir movimento" ele fica parado.
// Os verbos são intenção de estilo, não promessa de resultado.

const WORDS = ["impress.", "get found.", "look the part.", "win trust."];

export function HeroTitle() {
  const [text, setText] = useState(WORDS[0] ?? "");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let word = 0;
    let chars = (WORDS[0] ?? "").length;
    let deleting = false;
    let timer = 0;
    const step = () => {
      const current = WORDS[word] ?? "";
      if (!deleting && chars === current.length) {
        deleting = true;
        timer = window.setTimeout(step, 1400);
        return;
      }
      if (deleting && chars === 0) {
        deleting = false;
        word = (word + 1) % WORDS.length;
        timer = window.setTimeout(step, 180);
        return;
      }
      chars += deleting ? -1 : 1;
      setText((WORDS[word] ?? "").slice(0, chars));
      timer = window.setTimeout(step, deleting ? 30 : 55);
    };
    timer = window.setTimeout(step, 1800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <h1
      id="hero-title"
      className="lp-h lp-rise-solid text-[clamp(3rem,6.4vw,5.5rem)] leading-[1.06] font-semibold tracking-[-0.025em]"
    >
      <span className="sr-only">A website built to impress, get found and win trust.</span>
      <span aria-hidden="true">
        <span className="lp-sheen" style={{ "--c": "#071b33" } as React.CSSProperties}>
          Built to{" "}
        </span>
        <span
          className="lp-whirl lp-sheen min-h-[1.1em]"
          style={{ "--c": "#071b33" } as React.CSSProperties}
        >
          {text || " "}
        </span>
      </span>
    </h1>
  );
}
