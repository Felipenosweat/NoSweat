import Link from "next/link";
import { CLOSING_TITLE, HERO, priceLine } from "./content";
import { PHOTOS } from "./photos";
import { UnsplashImage } from "./UnsplashImage";

// 7. Fim: de manhã. O balcão de café na luz da manhã, de ponta a ponta (90% da altura da tela no
// computador). A foto é clara, então o texto nunca fica em branco sobre ela: título em ink num
// painel branco, embaixo à esquerda (raio de 2px), com o botão azul (ação em fundo claro).
// Celular e tablet: a foto numa faixa e o painel encavalado na borda de baixo.
// `data-hide-mobile-cta`: a barra fixa do celular some aqui (o botão já está na tela).

export function Closing() {
  return (
    <section
      aria-labelledby="closing-title"
      data-hide-mobile-cta
      className="ah-grid relative isolate bg-white lg:min-h-[max(90vh,720px)]"
    >
      <div className="relative col-[1/-1] row-start-1 aspect-[4/3] overflow-hidden md:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto">
        <UnsplashImage photo={PHOTOS.closing} sizes="100vw" />
      </div>
      <div className="relative col-[2/14] row-start-2 -mt-16 rounded-[2px] bg-white px-6 pt-10 pb-12 sm:px-10 md:col-[2/11] md:-mt-24 md:px-12 md:pt-12 lg:col-[2/8] lg:row-start-1 lg:mt-0 lg:mb-16 lg:self-end lg:px-14 lg:pt-14 lg:pb-14">
        <h2 id="closing-title" className="ah-display ah-h2 max-w-[13ch] text-ink">
          {CLOSING_TITLE}
        </h2>
        <Link
          href="/create"
          className="mt-10 inline-flex h-14 w-full items-center justify-center rounded-full bg-brand px-8 text-[17px] font-medium text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink active:translate-y-px sm:w-auto"
        >
          {HERO.cta}
        </Link>
        <p className="mt-4 text-[15px] leading-normal text-slate-600">{priceLine()}</p>
      </div>
    </section>
  );
}
