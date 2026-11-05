import type { CSSProperties } from "react";
import { PromptForm } from "@/components/marketing/PromptForm";

// Hero da landing V11 (limpo, estilo Apple): título centralizado com o verbo que troca, uma frase
// e o campo REAL de descrição. Sem fotos, sem capturas. Os verbos são aspiração de estilo, não
// promessa de resultado.

const VERBS = ["impress.", "get found.", "win trust.", "work."];

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      data-hide-mobile-cta
      className="relative isolate flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center px-5 py-16 text-center sm:px-8"
    >
      <h1 id="hero-title" className="lp-serif text-[clamp(2.9rem,7vw,5.75rem)] leading-[1.04]">
        <span className="sr-only">A website built to impress, to get found and to win trust.</span>
        <span aria-hidden="true" className="block">
          <span className="lp-fade-up block" style={{ "--i": 0 } as CSSProperties}>
            Built to
          </span>
          <span className="lp-fade-up block" style={{ "--i": 1 } as CSSProperties}>
            <span className="lp-rotor">
              {VERBS.map((verb, k) => (
                <span key={verb} style={{ "--k": k } as CSSProperties}>
                  {verb}
                </span>
              ))}
            </span>
          </span>
        </span>
      </h1>
      <p
        className="lp-fade-up mt-6 max-w-[34ch] text-[clamp(1.15rem,2vw,1.5rem)] leading-[1.4] text-[#6e6e73]"
        style={{ "--i": 2 } as CSSProperties}
      >
        Tell us what you do and where.
        <br className="hidden sm:block" /> We build the website for you.
      </p>
      <div
        className="lp-fade-up mt-10 w-full max-w-[640px] text-left"
        style={{ "--i": 3 } as CSSProperties}
      >
        <PromptForm caption="Free to create. No account or credit card needed." />
      </div>
    </section>
  );
}
