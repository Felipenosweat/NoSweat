import type { Metadata } from "next";
import Link from "next/link";
import { FaqList } from "@/components/marketing/FaqList";
import { PRICING_FAQS } from "@/components/marketing/faqs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, product } from "@/lib/structured-data";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { planPrices, pricingCredits } from "@/components/marketing/pricing-data";
import { TightPunctuation } from "@/components/marketing/TightPunctuation";
import {
  container,
  h1Class,
  h2Class,
  primaryButton,
  textLink,
} from "@/components/marketing/styles";
import { PriceReceipt } from "@/components/landing/PriceReceipt";
import { checkoutReady } from "@/server/billing";

// Página de preços. A tabela é a mesma da landing (<PricingPlans />, única fonte dos preços).
// Criar e ver a prévia é grátis; a cobrança (Stripe) só acontece ao escolher um plano para
// publicar (Stripe, ou à mão por WhatsApp/e-mail sem Stripe). As respostas do FAQ dizem só o
// que é verdade hoje. A imagem de compartilhamento vem de ./opengraph-image.tsx.

const TITLE = "Pricing";
const DESCRIPTION =
  "Build and preview your website free. Pick Starter, Pro or Premium when you go live, monthly or yearly.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: {
    type: "website",
    url: "/pricing",
    siteName: "No Sweat",
    title: `${TITLE} · No Sweat`,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: `${TITLE} · No Sweat`, description: DESCRIPTION },
};

export default function PricingPage() {
  return (
    <>
      <JsonLd data={jsonLd(product(), faqPage(PRICING_FAQS, "/pricing"))} />
      <section aria-labelledby="pricing-title" className="bg-surface">
        <div className={`${container} pt-14 pb-20 lg:pt-24 lg:pb-28`}>
          {/* Mesma promessa e mesmo recibo da seção de preço da landing. */}
          <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:items-end lg:gap-x-8">
            <h1 id="pricing-title" className={`lg:col-span-7 ${h1Class}`}>
              <TightPunctuation>Free to build. Pay when it goes live.</TightPunctuation>
            </h1>
            <PriceReceipt
              fromPrice={planPrices().starter.monthly}
              className="lg:col-span-5 lg:justify-self-end"
            />
          </div>

          <div className="mt-12 lg:mt-16">
            {/* Título invisível: os nomes dos planos são h3 (mesmo componente da landing). */}
            <h2 className="sr-only">Plans</h2>
            <PricingPlans
              checkout={checkoutReady()}
              prices={planPrices()}
              credits={pricingCredits()}
            />
          </div>

          <p className="mt-8 max-w-[70ch] text-[13px] leading-relaxed text-slate-500">
            Prices in US dollars. Creating and previewing your site is free; you pay when you choose
            a plan to publish. Domain registration is not included. See our{" "}
            <Link href="/terms" className={textLink}>
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </section>

      {/* FAQ: respostas honestas, só o que vale hoje. */}
      <section aria-labelledby="pricing-faq-title" className="bg-white py-16 lg:py-24">
        <div className={`${container} grid gap-y-10 lg:grid-cols-12 lg:gap-x-8`}>
          <div className="lg:col-span-4">
            <h2 id="pricing-faq-title" className={h2Class}>
              <TightPunctuation>Questions about pricing.</TightPunctuation>
            </h2>
            <p className="mt-4 max-w-[40ch] text-base leading-[1.65] text-pretty text-slate-600">
              More about how it works on the{" "}
              <Link href="/#faq" className={textLink}>
                main FAQ
              </Link>
              .
            </p>
          </div>
          <div className="lg:col-span-8">
            <FaqList faqs={PRICING_FAQS} />
          </div>
        </div>
      </section>

      {/* CTA FINAL. data-hide-mobile-cta: a barra fixa do celular some aqui (o botão já está
          na tela) e aparece no resto da página. */}
      <section
        aria-labelledby="pricing-cta-title"
        data-hide-mobile-cta
        className="border-t border-slate-200 bg-surface py-16 lg:py-20"
      >
        <div className={`${container} grid gap-y-8 lg:grid-cols-12 lg:items-end lg:gap-x-8`}>
          <div className="lg:col-span-7">
            <h2 id="pricing-cta-title" className={h2Class}>
              <TightPunctuation>See your website before you spend a dollar.</TightPunctuation>
            </h2>
            <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-pretty text-slate-600">
              Answer four questions. No account or credit card needed.
            </p>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end">
            <Link href="/create" className={`w-full sm:w-auto ${primaryButton}`}>
              Build my website
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
