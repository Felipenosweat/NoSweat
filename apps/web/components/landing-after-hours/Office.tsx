import Image from "next/image";
import { OFFICE_BODY, OFFICE_CAPTION, OFFICE_TITLE } from "./content";
import { PHOTOS } from "./photos";
import { UnsplashImage } from "./UnsplashImage";

// 4. "Dá para cuidar disso pelo celular? É de verdade?" No branco, a captura real da tela Clients,
// grande, numa moldura de linha fina; ao lado (5 colunas, só no computador), a vitrine
// da barbearia de dia, com a bicicleta, num recorte quadrado. A legenda avisa que os clientes são inventados.

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

      <div className="relative col-[2/7] mt-20 hidden aspect-square overflow-hidden rounded-[2px] bg-slate-800 lg:block">
        <UnsplashImage photo={PHOTOS.office} sizes="34vw" />
      </div>

      <figure className="col-[2/14] mt-12 md:mt-16 lg:col-[7/14] lg:mt-20 lg:self-center">
        <div className="relative aspect-[8/5] overflow-hidden rounded-[2px] bg-surface ring-1 ring-slate-200">
          <Image
            src="/landing/real/clients-2.webp"
            alt="The No Sweat Clients screen: five new requests, each with a name, phone, email, a New badge and a Reply button."
            fill
            sizes="(min-width: 1024px) 50vw, 92vw"
            className="object-cover object-left-top"
          />
        </div>
        <figcaption className="mt-4 text-[14px] text-slate-600">{OFFICE_CAPTION}</figcaption>
      </figure>
    </section>
  );
}
