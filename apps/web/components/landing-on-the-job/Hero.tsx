import Link from "next/link";
import { preconnect } from "react-dom";
import { HERO, priceLine, REQUEST_CARD } from "./content";
import { PHOTOS } from "./photos";
import { RequestCard } from "./RequestCard";
import { UnsplashImage } from "./UnsplashImage";

// 1. "O que é isto, e é para mim?"
// Computador: colunas 1–5 são um painel ink com o texto branco; da coluna 6 até a borda direita,
// a foto do marceneiro rindo para o celular, de cima a baixo (passa por baixo do cabeçalho). O
// cartão de pedido fica logo acima do celular dele e sobe uma vez ao carregar.
// Celular e tablet: foto primeiro (4:5 no celular, rosto e celular no quadro), o cartão encavalado
// na borda de baixo, depois título, texto e botão no branco.

export function Hero() {
  // A foto do topo é o maior elemento da tela: conexão aberta cedo com o Unsplash.
  preconnect("https://images.unsplash.com");
  return (
    <section
      aria-labelledby="hero-title"
      className="otj-grid relative bg-white pt-16 lg:min-h-[clamp(640px,100svh,940px)] lg:bg-ink lg:pt-0"
    >
      <div className="relative col-[1/-1] lg:col-[7/-1] lg:row-start-1">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-800 md:aspect-[4/3] lg:absolute lg:inset-0 lg:aspect-auto">
          <UnsplashImage
            photo={PHOTOS.carpenter}
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
          />
        </div>
        <div className="relative z-10 -mt-20 px-5 md:-mt-24 md:px-8 lg:absolute lg:top-[52%] lg:right-[5%] lg:m-0 lg:w-[21rem] lg:px-0">
          <RequestCard
            {...REQUEST_CARD.hero}
            caption={REQUEST_CARD.caption}
            className="otj-arrive"
          />
        </div>
      </div>

      <div className="col-[2/14] pt-10 pb-14 md:pt-12 md:pb-20 lg:col-[2/7] lg:row-start-1 lg:self-center lg:py-32 lg:pr-4">
        <h1 id="hero-title" className="otj-display otj-h1 text-ink lg:text-white">
          {HERO.title}
        </h1>
        <p className="mt-6 max-w-[34rem] text-[17px] leading-[1.6] text-pretty text-slate-600 md:text-[18px] lg:text-white/80">
          {HERO.lead}
        </p>
        <div className="mt-8">
          <Link
            id="hero-cta"
            href="/create"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand px-7 text-[17px] font-semibold text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-px sm:w-auto lg:focus-visible:outline-white"
          >
            {HERO.cta}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <p className="mt-4 text-[15px] leading-normal text-slate-600 lg:text-white/75">
            {priceLine()}
          </p>
        </div>
      </div>
    </section>
  );
}
