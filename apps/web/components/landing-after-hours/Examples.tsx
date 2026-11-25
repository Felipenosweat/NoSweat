import Image from "next/image";
import Link from "next/link";
import { EXAMPLES_BODY, EXAMPLES_TITLE, exampleSites, type ExampleSite } from "./content";

// 2. "Como vai ficar o meu site?" Quatro sites de exemplo (negócios inventados, avisado em cada
// legenda) numa galeria calma: um grande e três menores, desencontrados na grade de 12 colunas,
// cada um numa moldura de linha fina com raio de 2px. Nome, ramo e cidade vêm das fixtures.
// Celular: fileira lateral com encaixe, só as capturas do celular.

const frame = "relative overflow-hidden rounded-[2px] bg-surface ring-1 ring-slate-200";
const ring = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

export function Examples() {
  const sites = exampleSites();
  const [lead, second, third, fourth] = sites;
  return (
    <section
      id="examples"
      aria-labelledby="examples-title"
      className="ah-grid relative scroll-mt-16 bg-white pt-20 pb-24 md:pt-28 md:pb-32 lg:pt-32 lg:pb-40"
    >
      {/* Âncoras antigas (/#looks, /#story) dos cabeçalhos e rodapés das outras páginas. */}
      <span id="looks" aria-hidden="true" className="absolute top-0 scroll-mt-16" />
      <span id="story" aria-hidden="true" className="absolute top-0 scroll-mt-16" />
      <h2 id="examples-title" className="ah-display ah-h2 col-[2/14] text-ink lg:col-[2/9]">
        {EXAMPLES_TITLE}
      </h2>
      <p className="col-[2/14] mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-pretty text-slate-600 md:text-[18px] lg:col-[10/14] lg:mt-0 lg:self-end">
        {EXAMPLES_BODY}
      </p>

      {/* Celular: capturas do celular lado a lado, o próximo aparecendo na borda. */}
      <ul
        aria-label="Example sites"
        className="ah-snap col-[1/-1] mt-12 flex gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 md:hidden"
      >
        {sites.map((site) => (
          <li key={site.slug} className="w-[58%] shrink-0 sm:w-[40%]">
            <Link href={`/examples/${site.slug}`} className={`group block rounded-[2px] ${ring}`}>
              <span className={`${frame} block aspect-[640/1385]`}>
                <Image
                  src={`/landing/signature/${site.slug}-m.webp`}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 40vw, 58vw"
                  className="object-cover object-top"
                />
              </span>
              <Label site={site} />
            </Link>
          </li>
        ))}
      </ul>

      {/* Tablet e computador: um grande e três menores, desencontrados. */}
      <div className="col-[2/14] mt-16 hidden grid-cols-12 gap-x-6 gap-y-20 md:grid lg:mt-24 lg:gap-y-24">
        {lead && <Figure site={lead} className="col-span-12 lg:col-span-8" sizes="62vw" />}
        {second && (
          <Figure
            site={second}
            className="col-span-6 lg:col-span-4 lg:self-end"
            sizes="(min-width: 1024px) 30vw, 45vw"
          />
        )}
        {third && (
          <Figure
            site={third}
            className="col-span-6 lg:col-span-5 lg:col-start-2"
            sizes="(min-width: 1024px) 38vw, 45vw"
          />
        )}
        {fourth && (
          <Figure
            site={fourth}
            className="col-span-8 col-start-3 lg:col-span-5 lg:col-start-8 lg:mt-32"
            sizes="(min-width: 1024px) 38vw, 60vw"
          />
        )}
      </div>
    </section>
  );
}

function Figure({
  site,
  className,
  sizes,
}: {
  site: ExampleSite;
  className: string;
  sizes: string;
}) {
  return (
    <Link
      href={`/examples/${site.slug}`}
      className={`group block rounded-[2px] ${ring} ${className}`}
    >
      <span className={`${frame} block aspect-[16/10]`}>
        <Image
          src={`/landing/signature/${site.slug}-d.webp`}
          alt=""
          fill
          sizes={sizes}
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.01] motion-reduce:transition-none"
        />
      </span>
      <Label site={site} />
    </Link>
  );
}

function Label({ site }: { site: ExampleSite }) {
  return (
    <span className="mt-4 block text-[15px] leading-snug text-pretty md:text-[16px]">
      <span className="font-medium text-ink underline-offset-4 group-hover:underline">
        {site.name}
      </span>
      <span className="text-slate-600">
        {" "}
        · {site.trade}, {site.city} · <span className="whitespace-nowrap">Made-up business</span>
      </span>
    </span>
  );
}
