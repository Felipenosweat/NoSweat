import Link from "next/link";
import { CLOSING_TITLE, HERO, priceLine } from "./content";
import { PHOTOS } from "./photos";
import { UnsplashImage } from "./UnsplashImage";

// 7. Fim. Computador: o padeiro no forno de ponta a ponta, com o véu ink (no máximo 55%) só do
// lado do texto, onde fica a boca escura do forno. Celular e tablet: a foto inteira em cima e o
// texto num painel ink logo abaixo (sem texto sobre a foto, sem véu).
// `data-hide-mobile-cta`: a barra fixa do celular some aqui (o botão já está na tela).

export function Closing() {
  return (
    <section
      aria-labelledby="closing-title"
      data-hide-mobile-cta
      className="relative isolate bg-ink lg:min-h-[680px]"
    >
      <div className="relative aspect-[4/3] overflow-hidden md:aspect-[16/9] lg:absolute lg:inset-0 lg:aspect-auto">
        <UnsplashImage photo={PHOTOS.baker} sizes="100vw" />
        {/* Véu funcional só do lado do texto (computador). */}
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(7_27_51/.55)_0%,rgb(7_27_51/.55)_42%,rgb(7_27_51/0)_62%)] lg:block"
        />
      </div>
      <div className="otj-grid relative lg:min-h-[680px]">
        <div className="col-[2/14] py-14 md:py-16 lg:col-[2/7] lg:self-start lg:pt-24 lg:pb-24">
          <h2 id="closing-title" className="otj-display otj-h2 text-white">
            {CLOSING_TITLE}
          </h2>
          <Link
            href="/create"
            className="mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand px-7 text-[17px] font-semibold text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px sm:w-auto"
          >
            {HERO.cta}
          </Link>
          <p className="mt-4 text-[15px] leading-normal text-white/85">{priceLine()}</p>
        </div>
      </div>
    </section>
  );
}
