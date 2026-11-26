import Image from "next/image";
import Link from "next/link";
import { preconnect } from "react-dom";
import { HERO, heroProof, priceLine } from "./content";
import { PHOTOS } from "./photos";
import { UnsplashImage } from "./UnsplashImage";

// 1. "O que é isto, e por que me importa?"
// O neon "open" num fundo quase preto. Computador: a foto começa a 24% da largura (passa por baixo
// do cabeçalho transparente) e termina acima do site de exemplo, fundindo no ink; o anel fica
// inteiro, à direita do centro, e o título leve fica à esquerda, sobre o escuro.
// Celular e tablet: a foto no alto (quadrada no celular, 16:10 no tablet), o anel inteiro no
// quadro, e o texto logo abaixo, no ink.
// Na borda de baixo, um site de exemplo de verdade sobe da foto (a captura do computador e,
// encavalada à direita, a do celular) e continua na seção seguinte; a legenda avisa que o negócio
// é inventado.

export function Hero() {
  // A foto do topo é o maior elemento da tela: conexão aberta cedo com o Unsplash.
  preconnect("https://images.unsplash.com");
  const proof = heroProof();
  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="ah-grid relative isolate overflow-hidden bg-ink text-white lg:min-h-svh"
      >
        <div className="relative col-[1/-1] row-start-1 aspect-square overflow-hidden md:aspect-[16/10] lg:absolute lg:top-0 lg:right-0 lg:bottom-[clamp(8rem,18vh,11rem)] lg:left-[24%] lg:aspect-auto">
          <UnsplashImage photo={PHOTOS.hero} priority sizes="(min-width: 1024px) 76vw, 100vw" />
          {/* Véu funcional: em cima, para o cabeçalho; embaixo (e, no computador, à esquerda),
              onde o texto encosta na foto. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgb(7_27_51/.6)_0%,rgb(7_27_51/0)_20%,rgb(7_27_51/0)_62%,rgb(7_27_51/.7)_82%,rgb(7_27_51/1)_100%)] lg:bg-[linear-gradient(90deg,rgb(7_27_51/1)_0%,rgb(7_27_51/.55)_14%,rgb(7_27_51/0)_32%),linear-gradient(180deg,rgb(7_27_51/.45)_0%,rgb(7_27_51/0)_14%,rgb(7_27_51/0)_70%,rgb(7_27_51/1)_100%)]"
          />
        </div>

        <div className="relative col-[2/14] row-start-2 -mt-8 pb-[clamp(8.5rem,26vw,12rem)] md:col-[2/12] md:-mt-6 md:pb-[clamp(12rem,26vw,16rem)] lg:col-[2/7] lg:row-start-1 lg:mt-0 lg:flex lg:min-h-svh lg:flex-col lg:justify-end lg:pt-32 lg:pb-[clamp(10rem,22vh,13rem)]">
          <h1 id="hero-title" className="ah-display ah-h1 max-w-[13ch] text-white">
            {HERO.title}
          </h1>
          <p className="mt-6 max-w-[36rem] text-[17px] leading-[1.6] text-pretty text-white/80 md:mt-8 md:text-[18px]">
            {HERO.lead}
          </p>
          <div className="mt-8 md:mt-10">
            <Link
              id="hero-cta"
              href="/create"
              className="inline-flex h-14 w-full items-center justify-center rounded-full bg-white px-8 text-[17px] font-medium text-ink transition-colors duration-150 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-px sm:w-auto"
            >
              {HERO.cta}
            </Link>
            <p className="mt-4 text-[15px] leading-normal text-white/75">{priceLine()}</p>
          </div>
        </div>
      </section>

      {/* O site de exemplo sobe da foto: metade em cima do topo escuro, metade no branco. */}
      <div className="ah-grid relative z-10 -mt-[clamp(6.5rem,20vw,9rem)] bg-transparent md:-mt-[clamp(10rem,22vw,13rem)] lg:-mt-[clamp(8rem,18vh,11rem)]">
        <figure className="col-[2/14] md:col-[3/13] lg:col-[7/14]">
          <Link
            href={`/examples/${proof.slug}`}
            aria-label={`See the example site: ${proof.name}`}
            className="group relative block pr-[13%] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <span className="relative block aspect-[16/10] overflow-hidden rounded-[2px] bg-surface shadow-[0_32px_64px_-32px_rgb(7_27_51/.6)] ring-1 ring-white/15">
              <Image
                src={`/landing/signature/${proof.slug}-d.webp`}
                alt=""
                fill
                sizes="(min-width: 1024px) 46vw, (min-width: 768px) 70vw, 80vw"
                className="object-cover object-top"
              />
            </span>
            <span className="absolute right-0 bottom-[-12%] block aspect-[640/1385] w-[22%] overflow-hidden rounded-[2px] bg-surface shadow-[0_24px_48px_-24px_rgb(7_27_51/.6)] ring-1 ring-white/15">
              <Image
                src={`/landing/signature/${proof.slug}-m.webp`}
                alt=""
                fill
                sizes="(min-width: 1024px) 11vw, 20vw"
                className="object-cover object-top"
              />
            </span>
          </Link>
          <figcaption className="mt-4 pr-[26%] text-[14px] leading-snug text-pretty text-slate-600">
            {proof.caption}
          </figcaption>
        </figure>
      </div>
    </>
  );
}
