import { HeroGrid } from "./HeroGrid";
import { HeroStepper } from "./HeroStepper";
import { HeroTitle } from "./HeroTitle";
import { TypedTag } from "./TypedTag";

// Topo da landing V12: ocupa a primeira tela inteira. Título com brilho e verbo que se digita,
// uma frase em cinza e as perguntas, uma de cada vez. Sem fotos. Dentro de uma bolha branca.

export function Hero() {
  return (
    <div className="px-3 pt-2 sm:px-5">
      <section
        id="start"
        aria-labelledby="hero-title"
        data-hide-mobile-cta
        className="lp-bubble relative isolate flex min-h-[calc(100svh-4.5rem)] scroll-mt-14 flex-col overflow-hidden items-center justify-center px-5 pt-12 pb-8 text-center sm:px-8"
      >
        <HeroGrid />
        <TypedTag className="lp-rise mb-7" />
        <HeroTitle />
        <p
          className="lp-rise-solid mt-4 max-w-[44ch] text-[clamp(1.15rem,2vw,1.55rem)] leading-[1.35] text-[#6e6e73]"
          style={{ animationDelay: "calc(var(--lp-intro) + 300ms)" }}
        >
          Websites for local businesses, built from a few answers.
          <br className="hidden sm:block" /> Free to make. Pay only when it goes live.
        </p>
        <HeroStepper />
      </section>
    </div>
  );
}
