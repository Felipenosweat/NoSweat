import type { SiteSpec } from "@nosweat/schema";
import { NameForm } from "./NameForm";
import { BrowserFrame, PhoneFrame } from "./PreviewFrames";
import { HERO_COMPOSITION } from "./personalize";
import { container, h1 } from "./type";

// Topo: a pergunta é o título da página E o rótulo do campo (o LCP é este texto, desenhado no
// servidor). Embaixo, a prévia de verdade com o nome digitado: computador + celular a partir de
// sm, só o celular abaixo disso. A legenda diz o que é inventado.

export function Hero({ base, priceLine }: { base: SiteSpec; priceLine: string }) {
  return (
    <section aria-labelledby="yn-title" className="relative isolate">
      {/* Só o bloco do campo esconde a barra do celular: o botão azul já está nele. */}
      <div data-hide-mobile-cta className={`${container} pt-10 pb-12 sm:pt-14 lg:pt-14 lg:pb-12`}>
        <div>
          <h1 id="yn-title" className={h1}>
            <label htmlFor="yn-name" className="cursor-text">
              What’s your business called?
            </label>
          </h1>
          <p className="mt-4 max-w-[54ch] text-lg leading-[1.55] text-pretty text-slate-600 lg:max-w-[62ch] lg:text-xl">
            Type it in and a finished website takes your name. No Sweat builds the real one from a
            few sentences about what you do, with your phone number, services and hours.
          </p>
          <NameForm priceLine={priceLine} />
        </div>
      </div>

      {/* Fundo cinza na metade de baixo da prévia: continua na seção de estilos. */}
      <div className="relative">
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 bottom-0 -z-10 bg-surface" />
        <div className={container}>
          <div className="sm:hidden">
            <PhoneFrame
              base={base}
              composition={HERO_COMPOSITION}
              height={700}
              className="mx-auto max-w-[24rem]"
            />
          </div>
          <div className="relative hidden pb-10 sm:block lg:pb-14">
            <BrowserFrame base={base} composition={HERO_COMPOSITION} className="w-[86%]" />
            <PhoneFrame
              base={base}
              composition={HERO_COMPOSITION}
              height={720}
              className="absolute right-0 bottom-0 w-[23%]"
            />
          </div>
        </div>
      </div>
      <div className="bg-surface">
        <p
          id="yn-preview-note"
          className={`${container} pt-5 text-[15px] leading-snug text-pretty text-slate-600 sm:pt-0`}
        >
          Example site with your name. The rest of the text is from a made-up business.
        </p>
      </div>
    </section>
  );
}
