import Image from "next/image";
import Link from "next/link";
import { HERO, heroProof, priceLine } from "./content";
import { PHOTOS } from "./photos";
import { UnsplashImage } from "./UnsplashImage";

// 1. "O que é isto, e por que me importa?"
// O neon "open" num fundo quase preto. Computador: a foto começa a 24% da largura (passa por baixo
// do cabeçalho transparente) e termina acima do site de exemplo, fundindo no ink; o anel fica
// inteiro, à direita do centro, e o título leve fica à esquerda, sobre o escuro.
// Celular e tablet: a foto no alto em 16:10 (baixa, para o site de exemplo aparecer na primeira
// tela do celular) e o texto logo abaixo, no ink. Acima do título, a linha do "depois de fechar".
// Na borda de baixo, um site de exemplo de verdade sobe da foto (a captura do computador e a do
// celular encavalada no canto de baixo, sobre a foto do forno, nunca sobre o nome ou o botão) e
// continua na seção seguinte. No computador, a legenda ocupa o vazio à esquerda.
// A foto do topo é o LCP: passa pelo otimizador do Next (no nosso domínio, AVIF/WebP, qualidade
// 60) e o celular recebe no máximo 828px de largura.

export function Hero() {
  const proof = heroProof();
  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="ah-grid relative isolate overflow-hidden bg-ink text-white lg:min-h-svh"
      >
        <div className="relative col-[1/-1] row-start-1 aspect-[16/10] overflow-hidden lg:absolute lg:top-0 lg:right-0 lg:bottom-[clamp(8rem,18vh,11rem)] lg:left-[24%] lg:aspect-auto">
          <UnsplashImage
            photo={PHOTOS.hero}
            priority
            optimized
            sizes="(min-width: 1024px) 76vw, (min-width: 768px) 100vw, 276px"
          />
          {/* Véu funcional: em cima, para o cabeçalho; embaixo (e, no computador, à esquerda),
              onde o texto encosta na foto. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgb(7_27_51/.6)_0%,rgb(7_27_51/0)_20%,rgb(7_27_51/0)_62%,rgb(7_27_51/.7)_82%,rgb(7_27_51/1)_100%)] lg:bg-[linear-gradient(90deg,rgb(7_27_51/1)_0%,rgb(7_27_51/.55)_14%,rgb(7_27_51/0)_32%),linear-gradient(180deg,rgb(7_27_51/.45)_0%,rgb(7_27_51/0)_14%,rgb(7_27_51/0)_70%,rgb(7_27_51/1)_100%)]"
          />
        </div>

        <div className="relative col-[2/14] row-start-2 -mt-6 pb-[clamp(8.5rem,26vw,12rem)] md:col-[2/12] md:-mt-6 md:pb-[clamp(12rem,26vw,16rem)] lg:col-[2/7] lg:row-start-1 lg:mt-0 lg:flex lg:min-h-svh lg:flex-col lg:justify-end lg:pt-32 lg:pb-[clamp(10rem,22vh,13rem)]">
          <p className="text-[15px] leading-snug text-white/70 md:text-[16px]">{HERO.kicker}</p>
          <h1 id="hero-title" className="ah-display ah-h1 mt-4 max-w-[14ch] text-white md:mt-5">
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
        <figure className="col-[2/14] md:col-[3/13] lg:col-[6/14] lg:row-start-1">
          <Link
            href={`/examples/${proof.slug}`}
            aria-label={`See the example site: ${proof.name}`}
            className="group relative block pb-[28%] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <span className="relative block aspect-[16/10] w-[86%] overflow-hidden rounded-[2px] bg-surface shadow-[0_32px_64px_-32px_rgb(7_27_51/.6)] ring-1 ring-white/15">
              <Image
                src={`/landing/signature/${proof.slug}-d.webp`}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, (min-width: 768px) 72vw, 80vw"
                className="object-cover object-top"
              />
            </span>
            {/* O celular encavala só no canto de baixo à direita (a foto do forno). */}
            <span className="absolute right-0 bottom-0 block aspect-[390/844] w-[19%] overflow-hidden rounded-[2px] bg-surface shadow-[0_24px_48px_-24px_rgb(7_27_51/.6)] ring-1 ring-slate-900/10">
              <Image
                src={`/landing/signature/${proof.slug}-m.webp`}
                alt=""
                fill
                sizes="(min-width: 1024px) 12vw, 20vw"
                className="object-cover object-top"
              />
            </span>
          </Link>
          <figcaption className="mt-4 max-w-[60ch] text-[14px] leading-snug text-pretty text-slate-600 lg:hidden">
            {proof.caption}
          </figcaption>
        </figure>
        {/* Computador: a legenda ocupa o vazio à esquerda, já no branco, abaixo da borda da foto. */}
        <p className="col-[2/6] row-start-1 mt-[calc(clamp(8rem,18vh,11rem)+2.5rem)] hidden max-w-[30ch] text-[15px] leading-[1.6] text-pretty text-slate-600 lg:block">
          {proof.caption}
        </p>
      </div>
    </>
  );
}
