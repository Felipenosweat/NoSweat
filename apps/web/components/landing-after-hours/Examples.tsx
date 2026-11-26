import Image from "next/image";
import Link from "next/link";
import { EXAMPLES_BODY, EXAMPLES_NOTE, EXAMPLES_TITLE, exampleSites } from "./content";

// 2. "Como vai ficar o meu site?" Quatro sites de exemplo, cada um de uma composição diferente
// (padaria, café, paisagismo, barbearia), em capturas do renderer atual
// (qa/capture-signatures.mjs). Tablet e computador: grade 2×2, cada captura com a primeira tela
// do site (16:10) grande o bastante para ler. Celular: as capturas do celular em duas colunas,
// nada escondido. Legenda em duas linhas: "Nome · Ramo" e a cidade; o aviso de que os negócios
// são inventados aparece uma vez, abaixo do texto de abertura.

const frame = "relative block overflow-hidden rounded-[2px] bg-surface ring-1 ring-slate-200";
const ring = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

export function Examples() {
  const sites = exampleSites();
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
      <div className="col-[2/14] mt-6 lg:col-[10/14] lg:mt-0 lg:self-end">
        <p className="max-w-[46ch] text-[17px] leading-[1.6] text-pretty text-slate-600 md:text-[18px]">
          {EXAMPLES_BODY}
        </p>
        <p className="mt-3 text-[15px] text-slate-600">{EXAMPLES_NOTE}</p>
      </div>

      <ul
        aria-label="Example sites"
        className="col-[2/14] mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-16 md:gap-x-6 md:gap-y-14 lg:mt-20 lg:gap-y-16"
      >
        {sites.map((site) => (
          <li key={site.slug}>
            <Link href={`/examples/${site.slug}`} className={`group block rounded-[2px] ${ring}`}>
              {/* Celular: a captura do celular. */}
              <span className={`${frame} aspect-[390/844] md:hidden`}>
                <Image
                  src={`/landing/signature/${site.slug}-m.webp`}
                  alt=""
                  fill
                  sizes="45vw"
                  className="object-cover object-top"
                />
              </span>
              {/* Tablet e computador: a primeira tela do site no computador. */}
              <span className={`${frame} hidden aspect-[16/10] md:block`}>
                <Image
                  src={`/landing/signature/${site.slug}-d.webp`}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 640px, 46vw"
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.01] motion-reduce:transition-none"
                />
              </span>
              <span className="mt-4 block text-[15px] leading-snug text-pretty md:text-[17px]">
                <span className="font-medium text-ink underline-offset-4 group-hover:underline">
                  {site.name}
                </span>
                <span className="text-slate-600"> ·&nbsp;{site.trade}</span>
              </span>
              <span className="mt-1 block text-[14px] text-slate-600 md:text-[15px]">
                {site.city}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
