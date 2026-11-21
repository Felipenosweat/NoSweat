import Image from "next/image";
import Link from "next/link";
import { container, focusRing, frameShadow, h2Class } from "@/components/marketing/styles";
import { FREEFORM_EXAMPLES } from "@/lib/freeform-examples";

// Exemplos (#examples): capturas reais de sites feitos com a No Sweat (negócios inventados,
// avisado na legenda). Cada site tem a própria composição, não só outra cor. No celular, uma
// fileira que rola de lado com o dedo (capturas de celular, sem passar sozinha); no computador,
// grade de 3 colunas com capturas de computador, a primeira ocupando duas linhas.
// Cada cartão é um link só para /examples/<slug>. Capturas em public/landing/signature.
// Abaixo, os seis exemplos em código livre (lib/freeform-examples.ts) numa lista só de texto:
// ainda não têm captura, então nada de imagem inventada; cada linha abre o exemplo de verdade.

const SITES = [
  {
    slug: "greenline-landscaping",
    name: "Greenline Landscaping",
    trade: "Landscaping",
    city: "Charlotte, NC",
  },
  { slug: "mercer-law", name: "Mercer Law", trade: "Family law", city: "Columbus, OH" },
  {
    slug: "smoke-and-rail-bbq",
    name: "Smoke & Rail BBQ",
    trade: "Barbecue",
    city: "Kansas City, MO",
  },
  { slug: "still-water-spa", name: "Still Water Spa", trade: "Day spa", city: "Scottsdale, AZ" },
  {
    slug: "fade-and-co-barbers",
    name: "Fade & Co. Barbers",
    trade: "Barbershop",
    city: "Chicago, IL",
  },
] as const;

export function Examples() {
  return (
    <section
      id="examples"
      aria-labelledby="examples-title"
      className="scroll-mt-16 bg-surface py-16 lg:py-24"
    >
      <div className={container}>
        <h2 id="examples-title" className={h2Class}>
          Sites made with No Sweat.
        </h2>
        <p className="mt-3 text-[15px] text-slate-600">The businesses are made up.</p>

        <ul className="lp-rail -mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:mt-12 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:gap-y-10 lg:overflow-visible lg:p-0">
          {SITES.map((site, index) => {
            const tall = index === 0;
            return (
              <li
                key={site.slug}
                className={`w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-auto ${tall ? "lg:row-span-2" : ""}`}
              >
                <Link
                  href={`/examples/${site.slug}`}
                  className={`group flex h-full flex-col rounded-lg ${focusRing}`}
                >
                  <span
                    className={`relative block overflow-hidden rounded-2xl border border-slate-200 bg-white ${frameShadow} ${
                      tall
                        ? "aspect-[640/1385] lg:aspect-auto lg:flex-1"
                        : "aspect-[640/1385] lg:aspect-[16/10]"
                    }`}
                  >
                    {/* Celular: captura de celular. Computador: captura de computador (o primeiro
                        cartão, mais alto, segue com a de celular). A versão escondida não baixa. */}
                    <Image
                      src={`/landing/signature/${site.slug}-m.webp`}
                      width={640}
                      height={1385}
                      alt={`The ${site.name} example site on a phone.`}
                      sizes="(min-width: 1024px) 360px, (min-width: 640px) 44vw, 72vw"
                      className={`absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.015] motion-reduce:transition-none ${
                        tall ? "" : "lg:hidden"
                      }`}
                    />
                    {!tall && (
                      <Image
                        src={`/landing/signature/${site.slug}-d.webp`}
                        width={1600}
                        height={1000}
                        alt={`The ${site.name} example site on a computer.`}
                        sizes="360px"
                        className="absolute inset-0 hidden h-full w-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.015] motion-reduce:transition-none lg:block"
                      />
                    )}
                  </span>
                  <span className="mt-3 flex min-h-11 flex-col justify-center">
                    <span className="text-[15px] font-semibold text-ink underline decoration-transparent underline-offset-4 transition-colors duration-150 group-hover:decoration-ink">
                      {site.name}
                    </span>
                    <span className="text-[13px] text-slate-600">
                      {site.trade}, {site.city}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mais exemplos (código livre): lista de texto, uma linha por site, cada uma um link. */}
        <h3 className="mt-14 text-[13px] font-semibold text-slate-600 lg:mt-20">
          More example sites
        </h3>
        <ul className="mt-3 grid grid-cols-1 border-t border-slate-200 lg:grid-cols-2 lg:gap-x-8">
          {FREEFORM_EXAMPLES.map((site) => (
            <li key={site.slug} className="border-b border-slate-200">
              <Link
                href={`/examples/${site.slug}`}
                className={`group flex min-h-12 flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 rounded-lg py-3 ${focusRing}`}
              >
                <span className="text-[15px] font-semibold text-ink underline decoration-transparent underline-offset-4 transition-colors duration-150 group-hover:decoration-ink">
                  {site.name}
                </span>
                <span className="text-[13px] text-slate-600">
                  {site.kind}, {site.place}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
