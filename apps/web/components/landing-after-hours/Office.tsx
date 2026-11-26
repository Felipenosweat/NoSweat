import Image from "next/image";
import { OFFICE_BODY, OFFICE_CAPTION, OFFICE_TITLE } from "./content";

// 4. "Dá para cuidar disso pelo celular? É de verdade?" A tela Clients de verdade, com pedidos de
// demonstração semeados pelas APIs reais (formulário do site, etapas e um serviço lançado): os
// mesmos nomes e horários da lista da madrugada. Computador: a captura do computador na largura
// toda do conteúdo, com a do celular encavalada no canto de baixo. Abaixo do tablet: só a captura
// do celular, a 70% da largura (nunca a do computador encolhida). A legenda avisa que os clientes
// são inventados.

export function Office() {
  return (
    <section
      id="office"
      aria-labelledby="office-title"
      className="ah-grid scroll-mt-16 bg-white py-24 md:py-32 lg:py-40"
    >
      <div className="col-[2/14] lg:col-[2/10]">
        <h2 id="office-title" className="ah-display ah-h2 max-w-[18ch] text-ink">
          {OFFICE_TITLE}
        </h2>
        <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.6] text-pretty text-slate-600 md:text-[18px]">
          {OFFICE_BODY}
        </p>
      </div>

      <figure className="col-[2/14] mt-12 md:mt-16 lg:mt-20">
        {/* Celular: a tela do celular. */}
        <div className="relative mx-auto aspect-[390/844] w-[70%] overflow-hidden rounded-[2px] bg-surface ring-1 ring-slate-200 md:hidden">
          <Image
            src="/landing/real/clients-office-m.webp"
            alt="The No Sweat Clients screen on a phone: counters for new requests and follow-ups, and the newest requests with a Reply button."
            fill
            sizes="70vw"
            className="object-cover object-top"
          />
        </div>
        {/* Tablet e computador: a tela do computador e, no computador, a do celular por cima. */}
        <div className="relative hidden md:block lg:pr-[14%] lg:pb-[6%]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[2px] bg-surface ring-1 ring-slate-200">
            <Image
              src="/landing/real/clients-office-d.webp"
              alt="The No Sweat Clients screen: 3 new requests, 1 follow-up due, 1 won this month and $185 logged, above a list of clients with their stage, time and a Reply button."
              fill
              sizes="(min-width: 1024px) 1100px, 92vw"
              className="object-cover object-left-top"
            />
          </div>
          <div className="absolute right-0 bottom-0 hidden aspect-[390/844] w-[20%] overflow-hidden rounded-[2px] bg-surface shadow-[0_24px_48px_-24px_rgb(7_27_51/.45)] ring-1 ring-slate-200 lg:block">
            <Image
              src="/landing/real/clients-office-m.webp"
              alt=""
              fill
              sizes="260px"
              className="object-cover object-top"
            />
          </div>
        </div>
        <figcaption className="mt-4 text-center text-[14px] text-slate-600 md:text-left">
          {OFFICE_CAPTION}
        </figcaption>
      </figure>
    </section>
  );
}
