import type { CSSProperties } from "react";
import { PromptForm } from "@/components/marketing/PromptForm";
import { MiniSite } from "./MiniSite";

// Hero da landing V10: fundo branco, título em serifa com a palavra de destaque em azul, o campo
// REAL de descrição e, ao lado, um painel com o fluxo (frase → site) desenhado em HTML. Sem
// fotos nem capturas (pedido do fundador).

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      data-hide-mobile-cta
      className="relative isolate overflow-hidden pt-28 pb-16 sm:pt-36 lg:pt-36 lg:pb-24"
    >
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-6">
          <p
            className="lp-eyebrow lp-fade-up text-[#071b33]/60"
            style={{ "--i": 0 } as CSSProperties}
          >
            Website builder for local businesses
          </p>
          <h1
            id="hero-title"
            className="lp-serif mt-6 text-[clamp(3.2rem,7.4vw,6.75rem)] leading-[0.92]"
          >
            <span className="lp-line">
              <span style={{ "--i": 0 } as CSSProperties}>A website</span>
            </span>
            <span className="lp-line">
              <span style={{ "--i": 1 } as CSSProperties}>
                with <em>presence.</em>
              </span>
            </span>
          </h1>
          <p
            className="lp-fade-up mt-8 max-w-[40ch] text-lg leading-[1.6] text-pretty text-[#071b33]/70 lg:text-xl"
            style={{ "--i": 1 } as CSSProperties}
          >
            Tell us what you do and where. We build the website for you.
          </p>
          <div className="lp-fade-up mt-8 max-w-[560px]" style={{ "--i": 2 } as CSSProperties}>
            <PromptForm caption="Free to create. No account or credit card needed." />
          </div>
        </div>

        <div className="lp-fade-up lg:col-span-6" style={{ "--i": 3 } as CSSProperties}>
          <div className="lp-frame lp-tint rounded-[4px] p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="lp-eyebrow text-[#071b33]/55">1. You write one sentence</p>
              <span className="rounded-full border border-[var(--lp-line)] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#071b33]/60">
                Example
              </span>
            </div>
            <p className="mt-3 rounded-lg bg-white p-4 text-[15px] leading-[1.7] ring-1 ring-[var(--lp-line)]">
              <span className="font-semibold text-[#0066ff]">Still Water Spa</span>. Massage and
              facials in <span className="font-semibold text-[#0066ff]">Old Town Scottsdale</span>.
              Open <span className="font-semibold text-[#0066ff]">daily 9 to 8</span>. Call{" "}
              <span className="font-semibold text-[#0066ff]">(480) 555-0171</span>.
            </p>
            <p className="lp-eyebrow mt-5 mb-3 text-[#071b33]/55">2. We build the site</p>
            <MiniSite />
          </div>
        </div>
      </div>
    </section>
  );
}
