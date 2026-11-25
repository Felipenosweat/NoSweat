import Image from "next/image";
import { OFFICE_CAPTION, OFFICE_TITLE, OFFICE_TOOLS, REQUEST_CARD } from "./content";
import { PHOTOS } from "./photos";
import { RequestCard } from "./RequestCard";
import { UnsplashImage } from "./UnsplashImage";

// 4. "O que acontece depois que alguém me encontra?" À esquerda (5 colunas), o cozinheiro de
// avental azul lendo o celular, com o cartão de pedido na borda de baixo da foto, logo abaixo do
// celular dele; à direita (7 colunas), a captura real da tela Clients. Embaixo, as ferramentas do
// painel que existem hoje (content.ts → OFFICE_TOOLS, cada uma com a rota conferida no teste).

export function Office() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="office-title"
      className="otj-grid relative scroll-mt-16 bg-white py-16 md:py-24 lg:py-28"
    >
      {/* Âncoras antigas (/#clients, /#social) do rodapé e das outras páginas. */}
      <span id="clients" aria-hidden="true" className="absolute top-0 scroll-mt-16" />
      <span id="social" aria-hidden="true" className="absolute top-0 scroll-mt-16" />
      <h2 id="office-title" className="otj-display otj-h2 col-[2/14] max-w-[22ch] text-ink">
        {OFFICE_TITLE}
      </h2>

      <div className="col-[2/14] mt-10 md:mt-14 lg:col-[2/7]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-slate-200 md:aspect-[4/3] lg:aspect-[4/5]">
          <UnsplashImage
            photo={PHOTOS.cook}
            sizes="(min-width: 1024px) 38vw, (min-width: 768px) 90vw, 100vw"
          />
        </div>
        <div className="relative z-10 -mt-10 px-4 md:-mt-16 md:px-6">
          <RequestCard {...REQUEST_CARD.office} caption={REQUEST_CARD.caption} />
        </div>
      </div>

      <figure className="col-[2/14] mt-12 lg:col-[7/14] lg:mt-14 lg:self-center">
        <div className="relative aspect-[8/5] overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-[0_1px_2px_rgb(7_27_51/.06),0_12px_32px_-16px_rgb(7_27_51/.25)]">
          <Image
            src="/landing/real/clients-2.webp"
            alt="The No Sweat Clients screen: five new requests, each with a name, phone, email, a New badge and a Reply button."
            fill
            sizes="(min-width: 1024px) 55vw, 90vw"
            className="object-cover object-left-top"
          />
        </div>
        <figcaption className="mt-3 text-[14px] text-slate-600">{OFFICE_CAPTION}</figcaption>
      </figure>

      <dl className="col-[2/14] mt-14 grid gap-x-6 sm:grid-cols-2 md:mt-20 lg:grid-cols-3">
        {OFFICE_TOOLS.map((tool) => (
          <div key={tool.term} className="border-t border-slate-200 py-5 lg:py-6">
            <dt className="text-[17px] font-semibold text-ink">{tool.term}</dt>
            <dd className="mt-1.5 max-w-[38ch] text-[16px] leading-[1.6] text-slate-600">
              {tool.detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
