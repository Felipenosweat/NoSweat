import Link from "next/link";
import { TRADES, TRADES_TITLE } from "./content";
import { PHOTOS } from "./photos";
import { UnsplashImage } from "./UnsplashImage";

// 2. "Quem usa isto?" Sete ramos em fotos documentais (retrato 4:5), com o nome embaixo.
// Onde há um site de exemplo do mesmo ramo, um link separado da foto leva a ele ("See a barber
// site"): a pessoa da foto não é o dono daquele site, então a foto em si nunca é o link.
// Celular e tablet: fileira com rolagem lateral e encaixe, o próximo cartão aparecendo na borda.

export function Trades() {
  return (
    <section aria-labelledby="trades-title" className="otj-grid bg-white py-16 md:py-20 lg:py-24">
      <h2 id="trades-title" className="otj-display otj-h2 col-[2/14] max-w-[16ch] text-ink">
        {TRADES_TITLE}
      </h2>
      <div className="col-[1/-1] mt-10 lg:col-[2/14] lg:mt-14">
        <ul
          aria-label="Trades"
          tabIndex={0}
          className="otj-snap flex gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink md:scroll-px-8 md:gap-6 md:px-8 lg:grid lg:grid-cols-7 lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {TRADES.map((trade) => {
            const photo = PHOTOS[trade.photo];
            return (
              <li key={trade.label} className="w-[62%] shrink-0 sm:w-[38%] md:w-[30%] lg:w-auto">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-slate-200">
                  <UnsplashImage
                    photo={photo}
                    sizes="(min-width: 1024px) 13vw, (min-width: 640px) 38vw, 62vw"
                  />
                </div>
                <p className="mt-3 text-[16px] leading-snug font-semibold text-ink">
                  {trade.label}
                </p>
                {trade.example && (
                  <Link
                    href={`/examples/${trade.example.slug}`}
                    className="group inline-block min-h-11 rounded-sm py-2.5 text-[15px] leading-snug text-slate-600 underline decoration-slate-300 underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {/* Espaço inquebrável: a seta nunca desce sozinha para a linha de baixo. */}
                    {trade.example.linkLabel}
                    {" "}
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
