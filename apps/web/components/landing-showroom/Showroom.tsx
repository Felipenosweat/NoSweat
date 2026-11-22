import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { priceLine, showroomPlates, type Plate } from "./data";
import { PlateMotion } from "./PlateMotion";
import { INK_BLOCK_ID } from "./ShowroomHeader";

// Bloco ink da landing "Showroom": o topo (sem formulário) e a galeria de sites prontos, grandes.
// Pranchas 01-06 = sites de exemplo de negócios fictícios (capturas reais do renderer); a 07 é a
// moldura vazia "Your business", sem site falso dentro. No celular a captura do celular ocupa a
// largura toda; no computador, a captura grande + o celular por cima da borda de baixo, alternando
// os lados. Só a prancha 01 carrega com prioridade.

/** Botão azul sobre o fundo ink (foco em branco, que aparece no escuro). */
export const inkButton =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-base font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none";

export function Showroom() {
  const plates = showroomPlates();
  const total = String(plates.length + 1).padStart(2, "0");
  return (
    <div id={INK_BLOCK_ID} className="bg-ink text-white">
      <section
        aria-labelledby="hero-title"
        data-hide-mobile-cta
        // No celular o topo ocupa a tela menos ~160px: o começo da prancha 01 aparece embaixo.
        className="mx-auto flex min-h-[calc(100svh-14rem)] w-full max-w-[1280px] flex-col justify-end px-5 pt-10 pb-20 sm:block sm:min-h-0 sm:px-8 sm:pt-14 sm:pb-14 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-8 lg:pt-20 lg:pb-20"
      >
        <h1
          id="hero-title"
          className="max-w-[12ch] font-display text-[2.5rem] leading-[1.04] font-bold tracking-[-0.035em] text-balance text-white sm:text-[3.5rem] lg:col-span-7 lg:text-[4.5rem]"
        >
          A website that looks like your business.
        </h1>
        <div className="mt-4 sm:mt-6 lg:col-span-5 lg:mt-0 lg:pb-2">
          <p className="max-w-[46ch] text-[17px] leading-[1.5] text-pretty text-slate-300 lg:text-lg">
            Tell us what you do and where. No Sweat builds the whole site with your phone number,
            services and hours, plus the office that handles the requests it brings in.
          </p>
          <Link href="/create" className={`mt-5 w-full sm:w-auto ${inkButton}`}>
            Start my website
          </Link>
          <p className="mt-3 text-sm leading-snug text-slate-300">{priceLine()}</p>
        </div>
      </section>

      <section
        id="examples"
        aria-labelledby="examples-title"
        className="scroll-mt-16 pb-20 lg:pb-32"
      >
        <h2 id="examples-title" className="sr-only">
          Example websites made with No Sweat, for made-up businesses
        </h2>
        <ol className="flex flex-col gap-14 sm:gap-20 lg:gap-36">
          {plates.map((plate, index) => (
            <li key={plate.slug}>
              <PlateView plate={plate} index={index} total={total} />
            </li>
          ))}
          <li>
            <YourPlate number={total} total={total} />
          </li>
        </ol>
      </section>
      <PlateMotion />
    </div>
  );
}

/** Classes que fazem a prancha subir e aparecer uma vez (o PlateMotion marca data-reveal). */
const reveal =
  "transition-[opacity,translate] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] data-[reveal=pending]:translate-y-4 data-[reveal=pending]:opacity-0 motion-reduce:transition-none";

function PlateView({ plate, index, total }: { plate: Plate; index: number; total: string }) {
  // Pranchas ímpares: captura grande à esquerda e celular à direita; pares: o contrário.
  const left = index % 2 === 0;
  // Prancha 01: carrega já e com prioridade alta (é o LCP no celular). As outras esperam.
  const first = index === 0;
  const common = {
    alt: `${plate.name} example website`,
    quality: 75,
    loading: first ? "eager" : "lazy",
    fetchPriority: first ? "high" : "auto",
  } as const;
  // Uma imagem só por tamanho de tela: celular abaixo de 768px, captura de computador acima.
  const { props: mobileProps } = getImageProps({
    ...common,
    src: plate.mobileSrc,
    width: 640,
    height: 1385,
    sizes: "100vw",
  });
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    ...common,
    src: plate.desktopSrc,
    width: 1600,
    height: 1000,
    sizes: "(min-width: 1024px) 70vw, 100vw",
  });

  return (
    <article
      aria-labelledby={`plate-${plate.slug}`}
      data-plate
      className={`group/plate mx-auto w-full max-w-[1280px] sm:px-8 lg:grid lg:grid-cols-12 lg:gap-x-8 ${reveal}`}
    >
      <div
        className={`relative aspect-[390/640] overflow-hidden ring-1 ring-white/10 transition-shadow duration-150 group-has-[a:hover]/plate:ring-white/40 sm:aspect-[16/10] sm:rounded-xl lg:col-span-9 lg:row-start-1 ${
          left ? "lg:col-start-1" : "lg:col-start-4"
        }`}
      >
        <picture>
          <source
            media="(min-width: 640px)"
            srcSet={desktopSrcSet}
            sizes="(min-width: 1024px) 70vw, 100vw"
          />
          <img
            {...mobileProps}
            alt={`${plate.name} example website`}
            className="absolute inset-0 size-full object-cover object-top"
          />
        </picture>
      </div>

      {/* Celular por cima da borda de baixo da captura grande (só no computador). */}
      <div
        className={`relative z-10 hidden aspect-[390/640] translate-y-16 self-end overflow-hidden rounded-xl shadow-[0_24px_48px_-16px_rgb(0_0_0/.6)] ring-1 ring-white/10 transition-shadow duration-150 group-has-[a:hover]/plate:ring-white/40 lg:col-span-3 lg:row-start-1 lg:block ${
          left ? "lg:col-start-10 lg:-ml-20" : "lg:col-start-1 lg:-mr-20"
        }`}
      >
        <Image
          src={plate.mobileSrc}
          alt={`${plate.name} example website on a phone`}
          width={640}
          height={1385}
          sizes="320px"
          className="absolute inset-0 size-full object-cover object-top"
        />
      </div>

      <div
        className={`mt-6 px-5 sm:px-0 lg:col-span-6 lg:row-start-2 lg:mt-24 ${
          left ? "lg:col-start-1" : "lg:col-start-4"
        }`}
      >
        <ExhibitLabel
          href={plate.href}
          number={plate.number}
          total={total}
          id={`plate-${plate.slug}`}
          name={plate.name}
          meta={plate.meta}
        />
      </div>
    </article>
  );
}

function ExhibitLabel({
  href,
  number,
  total,
  id,
  name,
  meta,
}: {
  href: string;
  number: string;
  total: string;
  id: string;
  name: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      // Sem prefetch: a página do exemplo puxaria as fotos dele já na landing.
      prefetch={false}
      className="group/link -mx-2 flex min-h-11 flex-col items-start rounded-lg px-2 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <span className="flex items-center gap-3">
        <span aria-hidden="true" className="h-px w-8 bg-accent" />
        <span className="font-display text-[15px] font-bold text-accent tabular-nums">
          {number}
          <span className="sr-only"> of {total}</span>
        </span>
      </span>
      <h3
        id={id}
        className="mt-3 font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-white decoration-1 underline-offset-[6px] group-hover/link:underline lg:text-[2rem]"
      >
        {name}
      </h3>
      <span className="mt-1 text-[15px] leading-snug text-slate-300">{meta}</span>
      <span className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-white underline-offset-4 group-hover/link:underline">
        Open this example
        <ArrowUpRight />
      </span>
    </Link>
  );
}

function ArrowUpRight() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M5 11l6-6M6 5h5v5" />
    </svg>
  );
}

/** Prancha 07: a moldura do site do visitante, vazia de propósito (nada de site falso dentro). */
function YourPlate({ number, total }: { number: string; total: string }) {
  return (
    <article
      aria-labelledby="plate-yours"
      data-plate
      data-hide-mobile-cta
      className={`mx-auto w-full max-w-[1280px] sm:px-8 lg:grid lg:grid-cols-12 lg:gap-x-8 ${reveal}`}
    >
      <div className="flex aspect-[390/640] flex-col justify-end border-y border-dashed border-white/25 px-5 py-8 sm:aspect-[16/10] sm:rounded-xl sm:border sm:p-10 lg:col-span-9 lg:p-14">
        <span className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          <span className="font-display text-[15px] font-bold text-accent tabular-nums">
            {number}
            <span className="sr-only"> of {total}</span>
          </span>
        </span>
        <h3
          id="plate-yours"
          className="mt-3 font-display text-[2.5rem] leading-[1.04] font-bold tracking-[-0.035em] text-white lg:text-[4rem]"
        >
          Your business
        </h3>
        <p className="mt-2 text-[17px] text-slate-300">Your trade · Your town</p>
        <Link href="/create" className={`mt-8 w-full sm:w-auto sm:self-start ${inkButton}`}>
          Start my website
        </Link>
        <p className="mt-3 text-sm leading-snug text-slate-300">{priceLine()}</p>
      </div>
    </article>
  );
}
