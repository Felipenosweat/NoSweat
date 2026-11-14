import type { Metadata, Viewport } from "next";
import { MODEL_LIBRARY } from "@nosweat/fixtures";
import type { SiteSpec } from "@nosweat/schema";
import Link from "next/link";
import { Arrow } from "@/components/landing/Arrow";
import { Examples } from "@/components/landing/Examples";
import { BuildStory } from "@/components/landing/BuildStory";
import { SignatureHero } from "@/components/landing/SignatureHero";
import { TRADES } from "@/components/landing/trades";
import {
  arrowShift,
  focusRing,
  focusRingOnInk,
  h2Class,
  leadClass,
  sectionHead,
  shell,
} from "@/components/landing/type";
import { WhatYouGet } from "@/components/landing/WhatYouGet";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";
import { checkoutReady } from "@/server/billing";

// Landing ("o site se monta sozinho"): página branca com seções de ponta a ponta e fios de 1 px;
// o topo e o fim são blocos ink. Topo com a frase que o visitante completa e um site de exemplo
// de verdade numa moldura → como funciona (cena presa à rolagem) → o que você ganha (site,
// clientes, Instagram) → exemplos → preço (faixa surface, a seção com mais respiro) →
// dúvidas → fim. Títulos de seção num só estilo, alinhados à esquerda na mesma borda
// (components/landing/type.ts); só o topo e o fim são centralizados. Pouco texto por bloco. Só
// afirmações que o produto cumpre hoje; nada de números, logos, notas ou depoimentos inventados.

// O título diz o que a No Sweat é (é o que o Google mostra e o que as pessoas procuram).
const TITLE = "No Sweat: AI Website Builder for Local Businesses";
const DESCRIPTION =
  "Describe your business in one sentence and get a real website for your trade, a simple client list for every request, and Instagram posts you approve. Plans from $39/month.";

// A imagem de compartilhamento vem de app/(landing)/opengraph-image.tsx (1200×630).
// Cor da barra do navegador no celular: o ink do cabeçalho e do topo.
export const viewport: Viewport = { themeColor: "#071b33" };

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "No Sweat",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const linkDark = `lp-underline rounded-sm font-medium text-ink ${focusRing}`;

// Os sites de exemplo (fictícios) que a moldura do topo e o "how it works" desenham: só os seis
// ramos da frase, para não mandar a biblioteca inteira ao navegador.
const TRADE_SPECS: Record<string, SiteSpec> = Object.fromEntries(
  MODEL_LIBRARY.filter((entry) => TRADES.some((t) => t.slug === entry.slug)).map((entry) => [
    entry.slug,
    entry.spec,
  ]),
);

export default function LandingPage() {
  const specs = TRADE_SPECS;
  // WhatsApp de vendas (só dígitos, ex.: 15085550142). Sem a variável, nada aparece.
  const whatsapp = salesWhatsappUrl();
  return (
    <>
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(LANDING_FAQS, "/"))} />
      <SignatureHero specs={specs} />
      <BuildStory specs={specs} />

      <WhatYouGet />
      <Examples />

      {/* PREÇO — faixa surface de ponta a ponta, a seção com mais respiro (é a da decisão); o
          mesmo componente da página /pricing. O cabeçalho entra pelo `heading`. */}
      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="mt-24 border-y border-slate-200 bg-surface lg:mt-32"
      >
        <div className={`${shell} py-24 lg:py-36`}>
          <PricingPlans
            checkout={checkoutReady()}
            heading={
              <div className={`lp-reveal ${sectionHead}`}>
                <h2 id="pricing-title" className={h2Class}>
                  Build it free.
                  <br />
                  <span className="text-slate-600">Pay when it’s live.</span>
                </h2>
                <p className={leadClass}>
                  Create and preview your whole site without paying. You only pay when you pick a
                  plan to publish.
                </p>
              </div>
            }
          />
        </div>
      </section>

      {/* DÚVIDAS — abrir uma fecha as outras (details com o mesmo name). No computador o título e
          a linha de contato ficam à esquerda (colunas 1–4) e as perguntas à direita (6–12);
          abaixo de lg, empilhado na ordem do DOM. */}
      <section
        id="faq"
        aria-labelledby="faq-title"
        className={`${shell} py-20 lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:py-28`}
      >
        <h2 id="faq-title" className={`lp-reveal ${h2Class} lg:col-span-4 lg:row-start-1`}>
          Questions.
        </h2>
        <div className="lp-reveal mt-10 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:mt-3">
          {LANDING_FAQS.map((faq, index) => (
            <details
              key={faq.question}
              name="faq"
              className={`border-b border-slate-300 ${index === 0 ? "border-t" : ""}`}
            >
              <summary
                className={`flex min-h-11 cursor-pointer list-none items-center gap-4 rounded-sm py-5 text-[17px] font-semibold text-ink transition-colors duration-200 hover:text-brand-dark lg:text-lg [&::-webkit-details-marker]:hidden ${focusRing}`}
              >
                {faq.question}
                <span aria-hidden="true" className="lp-fx text-slate-600" />
              </summary>
              <p className="max-w-[65ch] pb-6 text-[17px] leading-[1.6] text-pretty text-slate-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
        <p className="mt-8 max-w-[40ch] text-base leading-[1.6] text-slate-600 lg:col-span-4 lg:col-start-1 lg:row-start-2 lg:mt-6">
          Still wondering? Write to{" "}
          <a href="mailto:hello@nosweatfd.com" className={linkDark}>
            hello@nosweatfd.com
          </a>
          {whatsapp && (
            <>
              {" "}
              or{" "}
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={linkDark}>
                message us on WhatsApp
              </a>
            </>
          )}
          . A real person writes back.
        </p>
      </section>

      {/* FIM — bloco ink de ponta a ponta, de volta às perguntas do topo; o rodapé (também ink)
          vem logo embaixo, separado por um fio. */}
      <section aria-labelledby="final-title" data-hide-mobile-cta className="bg-ink text-white">
        <div className={`${shell} flex flex-col items-center py-24 text-center lg:py-32`}>
          <h2
            id="final-title"
            className="lp-reveal font-display text-[clamp(2.5rem,6.4vw,5.5rem)] leading-none font-extrabold tracking-[-0.045em] text-balance"
          >
            Ready when you are.
          </h2>
          <p className="mt-6 text-xl text-slate-300">It takes about a minute.</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <a
              href="#start"
              className={`group inline-flex h-14 items-center gap-2.5 rounded-full bg-brand px-7 text-[17px] font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px ${focusRingOnInk}`}
            >
              Build my website
              <Arrow className={arrowShift} />
            </a>
            <Link
              href="/pricing"
              className={`inline-flex min-h-11 items-center rounded-sm px-3 text-base font-medium text-white underline-offset-4 hover:underline ${focusRingOnInk}`}
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
