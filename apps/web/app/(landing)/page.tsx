import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Examples } from "@/components/landing/Examples";
import { Hero } from "@/components/landing/Hero";
import { Pill } from "@/components/landing/Pill";
import { Steps } from "@/components/landing/Steps";
import {
  edgeInner,
  edgeOuter,
  focusRing,
  h2Base,
  h2Class,
  leadClass,
} from "@/components/landing/type";
import { WhatYouGet } from "@/components/landing/WhatYouGet";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";
import { checkoutReady } from "@/server/billing";

// Landing V13 (revisada): fundo cinza-claro e cada bloco numa "bolha" branca arredondada,
// intercalando com blocos direto no cinza (passos, preços). Títulos de seção num só estilo,
// alinhados à esquerda na mesma borda (components/landing/type.ts); só o fim é centralizado. Topo com perguntas uma de cada vez → o que você ganha
// (site, clientes, Instagram) → como funciona → exemplos → preço → dúvidas → fim (bolha escura).
// Pouco texto por bloco: o cliente quer praticidade. Sem vidro/transparência. Sem fotos. Só afirmações que o produto cumpre hoje;
// nada de números, logos, notas ou depoimentos inventados.

// O título diz o que a No Sweat é (é o que o Google mostra e o que as pessoas procuram).
const TITLE = "No Sweat: AI Website Builder for Local Businesses";
const DESCRIPTION =
  "Describe your business in one sentence and get a real website for your trade, a simple client list for every request, and Instagram posts you approve. Plans from $39/month.";

// A imagem de compartilhamento vem de app/(landing)/opengraph-image.tsx (1200×630).
export const viewport: Viewport = { themeColor: "#ffffff" };

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

export default function LandingPage() {
  // WhatsApp de vendas (só dígitos, ex.: 15085550142). Sem a variável, nada aparece.
  const whatsapp = salesWhatsappUrl();
  return (
    <>
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(LANDING_FAQS, "/"))} />
      <Hero />
      <WhatYouGet />
      <Steps />
      <Examples />

      {/* PREÇO — direto no fundo cinza; o mesmo componente da página /pricing. O título e a
          introdução entram pelo `heading`, para a escolha mensal/anual ficar na mesma linha. */}
      <section id="pricing" aria-labelledby="pricing-title" className={`scroll-mt-14 ${edgeOuter}`}>
        <div className={`${edgeInner} py-16 lg:py-24`}>
          <PricingPlans
            checkout={checkoutReady()}
            heading={
              <>
                <h2 id="pricing-title" className={h2Class}>
                  Build it free.
                  <br />
                  <span className="text-slate-600">Pay when it’s live.</span>
                </h2>
                <p className={`mt-4 ${leadClass}`}>
                  Create and preview your whole site without paying. You only pay when you pick a
                  plan to publish.
                </p>
              </>
            }
          />
        </div>
      </section>

      {/* DÚVIDAS — numa bolha branca; abrir uma fecha as outras (details com o mesmo name). No
          computador o título e a linha de contato ficam à esquerda (colunas 1–4) e as perguntas à
          direita (6–12); abaixo de lg, empilhado na ordem do DOM. */}
      <div className={edgeOuter}>
        <section
          id="faq"
          aria-labelledby="faq-title"
          className="lp-bubble scroll-mt-16 px-5 py-14 sm:px-10 lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:px-16 lg:py-20"
        >
          <h2 id="faq-title" className={`${h2Class} lg:col-span-4 lg:row-start-1`}>
            Questions.
          </h2>
          <div className="mt-8 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:mt-0">
            {LANDING_FAQS.map((faq, index) => (
              <details
                key={faq.question}
                name="faq"
                className={`border-b border-slate-200 ${index === 0 ? "border-t" : ""}`}
              >
                <summary
                  className={`flex min-h-11 cursor-pointer list-none items-center gap-4 rounded-sm py-5 text-base font-semibold text-ink transition-colors duration-200 hover:text-brand lg:text-[17px] [&::-webkit-details-marker]:hidden ${focusRing}`}
                >
                  {faq.question}
                  <span aria-hidden="true" className="lp-fx" />
                </summary>
                <p className="max-w-[65ch] pb-5 text-base leading-[1.6] text-pretty text-slate-600">
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
      </div>

      {/* FIM — bolha escura com um botão só, de volta às perguntas do topo. */}
      <div className="px-3 pt-3 pb-3 sm:px-5 sm:pt-5 sm:pb-5">
        <section
          aria-labelledby="final-title"
          data-hide-mobile-cta
          className="lp-bubble lp-bubble-dark px-5 py-16 text-center sm:px-10 lg:py-24"
        >
          <h2 id="final-title" className={`${h2Base} text-white`}>
            Ready when you are.{" "}
            {/* Bloco próprio: no celular a segunda frase quebra em duas linhas equilibradas. */}
            <span className="block text-white/70">It takes about a minute.</span>
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Pill href="#start" tone="light">
              Build my website
            </Pill>
            <Link
              href="/pricing"
              className="inline-flex min-h-11 items-center rounded-sm px-3 text-base font-medium text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              See pricing
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
