import Image from "next/image";
import type { CSSProperties } from "react";
import { PromptForm } from "@/components/marketing/PromptForm";

// Hero da landing V8: a cortina de abertura (só CSS), o título gigante em serifa com a última
// palavra em itálico, o campo REAL de descrição em vidro e, logo abaixo, a moldura de um site
// de exemplo de verdade (captura do molde Signature, negócio fictício) que cresce com a rolagem.

/** O título, uma linha por <span> (sobem de dentro de uma máscara depois da cortina). */
const LINES = [
  <>Your business,</>,
  <>
    online by <em>lunch.</em>
  </>,
];

export function Hero() {
  return (
    <>
      <div aria-hidden="true" className="lp-intro">
        <p className="lp-intro-word lp-serif text-[clamp(2.5rem,7vw,5rem)] leading-none">
          No <em>Sweat</em>
        </p>
      </div>

      <section
        aria-labelledby="hero-title"
        data-hide-mobile-cta
        className="lp-night relative isolate overflow-hidden pt-32 pb-12 sm:pt-40 lg:pt-36 lg:pb-14"
      >
        <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
          <p className="lp-eyebrow lp-fade-up text-white/60" style={{ "--i": 0 } as CSSProperties}>
            Website builder for local businesses
          </p>
          <h1
            id="hero-title"
            className="lp-serif mt-6 text-[clamp(3.4rem,10.5vw,10.5rem)] leading-[0.9] text-white"
          >
            {LINES.map((line, index) => (
              <span key={index} className="lp-line">
                <span style={{ "--i": index } as CSSProperties}>{line}</span>
              </span>
            ))}
          </h1>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-12 lg:items-start lg:gap-8">
            <p
              className="lp-fade-up max-w-[40ch] text-lg leading-[1.6] text-pretty text-white/75 lg:col-span-5 lg:text-xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              Write one sentence about what you do and where. No Sweat builds the website with your
              call button and contact form, and keeps every request in one list.
            </p>
            <div
              className="lp-fade-up lg:col-span-6 lg:col-start-7"
              style={{ "--i": 2 } as CSSProperties}
            >
              <PromptForm tone="glass" />
            </div>
          </div>
        </div>
      </section>

      {/* O site de exemplo: no computador a captura inteira; no celular, a do celular. */}
      <figure className="lp-night px-3 pb-14 sm:px-5 lg:pb-20">
        <div
          data-lp-stage
          className="lp-stage relative mx-auto max-w-[300px] overflow-hidden rounded-[2.2rem] ring-1 ring-white/15 sm:max-w-[1440px] sm:rounded-[10px]"
        >
          <Image
            src="/landing/signature/still-water-spa-d.webp"
            alt="Home page of Still Water Spa, an example site made with No Sweat: a full-width photo of a treatment room with the spa’s name in large serif type."
            width={1600}
            height={1000}
            sizes="(min-width: 1440px) 1440px, 100vw"
            priority
            className="hidden h-auto w-full sm:block"
          />
          <Image
            src="/landing/signature/still-water-spa-m.webp"
            alt="Home page of Still Water Spa on a phone, an example site made with No Sweat."
            width={640}
            height={1385}
            sizes="300px"
            className="block aspect-[9/14] h-auto w-full object-cover object-top sm:hidden"
          />
        </div>
        <figcaption className="mx-auto mt-5 flex max-w-[1440px] flex-wrap justify-between gap-2 px-2 text-[13px] text-white/55">
          <span>Still Water Spa, Scottsdale. Made with No Sweat.</span>
          <span>Example site. The business is made up.</span>
        </figcaption>
      </figure>
    </>
  );
}
