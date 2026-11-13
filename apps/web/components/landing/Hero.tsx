import type { CSSProperties } from "react";
import { HeroPreview } from "./HeroPreview";
import { HeroStepper } from "./HeroStepper";
import { HeroTitle } from "./HeroTitle";

// Topo da landing, dentro de uma bolha branca: o título, uma frase em cinza e as perguntas, uma
// de cada vez. No computador (≥ lg) fica dividido: texto e perguntas à esquerda (colunas 1–7) e,
// à direita (8–12), a captura de um site de exemplo que acompanha o ramo escolhido (HeroPreview).
// Abaixo de lg, tudo centralizado e sem a captura. Altura do conteúdo (não a tela inteira), para
// a próxima bolha aparecer na primeira tela. Sem enfeites em movimento.

export function Hero() {
  return (
    <div className="px-3 pt-2 sm:px-5">
      <section
        id="start"
        aria-labelledby="hero-title"
        data-hide-mobile-cta
        className="lp-bubble scroll-mt-14 px-5 py-12 text-center sm:px-10 lg:grid lg:min-h-[640px] lg:grid-cols-12 lg:items-start lg:gap-x-8 lg:px-16 lg:py-20 lg:text-left"
      >
        <div className="lg:col-span-7">
          <HeroTitle />
          <p
            className="lp-rise mx-auto mt-5 max-w-[46ch] text-lg leading-normal tracking-[-0.01em] text-pretty text-slate-600 lg:mx-0 lg:text-xl"
            style={{ "--i": 1 } as CSSProperties}
          >
            Websites for local businesses, built from a few answers. Free to make. Pay only when it
            goes live.
          </p>
          <HeroStepper />
        </div>
        <HeroPreview />
      </section>
    </div>
  );
}
