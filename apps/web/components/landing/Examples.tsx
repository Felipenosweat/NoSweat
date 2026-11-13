import Image from "next/image";
import Link from "next/link";
import { bodyClass, focusRing, h2Class, h3Class } from "./type";

// Exemplos (#looks), numa bolha branca: seis sites de exemplo, cada um com a captura de verdade
// (public/landing/signature/<slug>-d.webp) e um link para o site inteiro (/examples/<slug>).
// A partir de sm é uma grade de cartões (2 colunas; 3 no computador) com número, nome e
// "ramo, cidade"; no celular, a mesma marcação vira uma lista de linhas com miniatura de 112×70.
// Negócios fictícios, avisado no texto. As capturas são enfeite do link (alt vazio): o nome
// acessível é o nome do negócio + ramo e cidade.

const SITES = [
  { slug: "still-water-spa", name: "Still Water Spa", kind: "Day spa", place: "Scottsdale" },
  { slug: "smoke-and-rail-bbq", name: "Smoke & Rail BBQ", kind: "Barbecue", place: "Kansas City" },
  { slug: "mercer-law", name: "Mercer Law", kind: "Family law", place: "Columbus" },
  {
    slug: "greenline-landscaping",
    name: "Greenline Landscaping",
    kind: "Landscaping",
    place: "Charlotte",
  },
  { slug: "fade-and-co-barbers", name: "Fade & Co. Barbers", kind: "Barbershop", place: "Chicago" },
  { slug: "sunrise-bakery", name: "Sunrise Bakery", kind: "Bakery", place: "Sacramento" },
];

export function Examples() {
  return (
    <div className="px-3 sm:px-5">
      <section
        id="looks"
        aria-labelledby="looks-title"
        className="lp-bubble scroll-mt-16 px-5 py-14 sm:px-10 lg:px-16 lg:py-20"
      >
        <h2 id="looks-title" className={h2Class}>
          Example sites.
        </h2>
        <p className={`mt-4 ${bodyClass}`}>Made-up businesses, real No Sweat sites.</p>
        <ul className="mt-10 grid grid-cols-1 border-b border-slate-200 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 sm:border-b-0 lg:mt-14 lg:grid-cols-3 lg:gap-y-12">
          {SITES.map((site, index) => (
            <li key={site.slug} className="border-t border-slate-200 sm:border-t-0">
              <Link
                href={`/examples/${site.slug}`}
                className={`group flex min-h-[94px] items-center gap-4 rounded-xl py-3 sm:block sm:min-h-0 sm:py-0 ${focusRing}`}
              >
                <Image
                  src={`/landing/signature/${site.slug}-d.webp`}
                  width={1600}
                  height={1000}
                  alt=""
                  sizes="(min-width: 1024px) 363px, (min-width: 640px) 45vw, 112px"
                  className="aspect-[16/10] w-28 shrink-0 rounded-xl border border-slate-200 object-cover object-top transition-colors duration-200 group-hover:border-slate-400 group-focus-visible:border-slate-400 sm:w-full"
                />
                <div className="grid min-w-0 flex-1 grid-cols-1 sm:mt-4 sm:grid-cols-[28px_1fr] sm:gap-x-2">
                  <span
                    aria-hidden="true"
                    className="hidden pt-1 text-sm leading-normal font-semibold text-slate-600 tabular-nums sm:block lg:pt-[5px]"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3
                      className={`${h3Class} transition-colors duration-200 group-hover:text-brand group-focus-visible:text-brand`}
                    >
                      {site.name}
                    </h3>
                    <p className="mt-0.5 text-sm leading-normal text-slate-600">
                      {site.kind}, {site.place}
                    </p>
                  </div>
                </div>
                {/* Seta só na lista do celular (no cartão, a captura já convida a abrir). */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0 text-slate-500 sm:hidden"
                >
                  <path
                    d="M5 11 11 5M6 5h5v5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
