import Image from "next/image";
import type { CSSProperties } from "react";
import { HeroPreview } from "./HeroPreview";
import { HeroStepper } from "./HeroStepper";
import { HeroTitle } from "./HeroTitle";
import { shell } from "./type";

// Topo da landing, num bloco ink de ponta a ponta: o título, uma frase e as perguntas (uma de
// cada vez) num cartão branco; embaixo, a vitrine: três capturas de sites de exemplo saindo da
// base do bloco. A do meio é a grande, numa moldura de navegador simples, e acompanha o ramo
// escolhido (HeroPreview); as dos lados são enfeite (alt vazio, cortadas pela borda da tela) e só
// aparecem a partir de md. Os exemplos dos lados não estão no mapa do HeroPreview, para nunca
// repetir o do meio. Entrada: título, frase e cartão em sequência; depois as três molduras sobem
// 24 px, a do meio primeiro (landing.css).

// A moldura do lado. A entrada dela não mexe na opacidade (lp-show-solid): o bloco some e volta
// com `hidden md:block`, e uma animação recomeça quando o elemento volta a aparecer; assim ele
// nunca fica invisível (nem nas capturas de página inteira, que mexem no tamanho da tela).
const side = "lp-show-solid hidden w-[26vw] max-w-[460px] shrink-0 md:block lg:w-[30vw]";
const sideShot = "aspect-[16/10] w-full rounded-t-2xl object-cover object-top opacity-75";

function SideShot({ slug, order }: { slug: string; order: number }) {
  return (
    <div className={side} style={{ "--i": order } as CSSProperties}>
      <Image
        src={`/landing/signature/${slug}-d.webp`}
        width={1600}
        height={1000}
        alt=""
        sizes="(min-width: 768px) 30vw, 1px"
        className={sideShot}
      />
    </div>
  );
}

export function Hero() {
  return (
    <div className="overflow-x-clip bg-ink text-white">
      <section
        id="start"
        aria-labelledby="hero-title"
        data-hide-mobile-cta
        className={`${shell} flex flex-col items-center pt-10 text-center sm:pt-16`}
      >
        <HeroTitle />
        <p
          className="lp-rise mt-6 max-w-[34rem] text-lg leading-normal text-pretty text-slate-300 sm:text-xl"
          style={{ "--i": 1 } as CSSProperties}
        >
          Websites for local businesses, built from a few answers. Free to make. Pay only when it
          goes live.
        </p>
        <HeroStepper />
      </section>

      <section
        aria-label="Example sites"
        className="mt-12 flex items-end justify-center gap-7 overflow-hidden px-5 sm:mt-[4.5rem] md:px-0"
      >
        <SideShot slug="fade-and-co-barbers" order={1} />
        <HeroPreview />
        <SideShot slug="north-loop-coffee" order={2} />
      </section>
    </div>
  );
}
