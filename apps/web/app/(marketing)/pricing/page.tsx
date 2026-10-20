import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@/components/marketing/icons";
import { PRICING_FAQS } from "@/components/marketing/faqs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, product } from "@/lib/structured-data";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { TightPunctuation } from "@/components/marketing/TightPunctuation";
import { container, primaryButton, textLink } from "@/components/marketing/styles";
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

const h2Class =
  "font-display text-3xl leading-tight font-bold tracking-[-0.025em] text-balance text-ink lg:text-[2.5rem]";

export default function PricingPage() {
  return (
    <>
      <JsonLd data={jsonLd(product(), faqPage(PRICING_FAQS, "/pricing"))} />
      <section aria-labelledby="pricing-title" className="bg-surface">
        <div className={`${container} pt-14 pb-20 lg:pt-24 lg:pb-28`}>
          <div className="grid gap-y-6 lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-7">
              <p className="font-display text-sm font-semibold text-brand">Pricing</p>
              <h1
                id="pricing-title"
                className="mt-4 max-w-[16ch] font-display text-[2.5rem] leading-[1.05] font-bold tracking-[-0.03em] text-balance text-ink lg:text-6xl lg:leading-[1.02]"
              >
                <TightPunctuation>Build it free. Pay when it goes live.</TightPunctuation>
              </h1>
            </div>
            <p className="max-w-[52ch] text-lg leading-relaxed text-pretty text-slate-600 lg:col-span-5 lg:self-end">
              Describe your business, get a full website draft and edit it as much as you like. Pick
              a plan when you’re ready to publish and get messages from customers.
            </p>
          </div>

          <div className="mt-12 lg:mt-16">
            {/* Título invisível: os nomes dos planos são h3 (mesmo componente da landing). */}
            <h2 className="sr-only">Plans</h2>
            <PricingPlans checkout={checkoutReady()} />
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
            <h2 id="pricing-faq-title" className={`max-w-[20ch] ${h2Class}`}>
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
          <div className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-8">
            {PRICING_FAQS.map((faq) => (
              <details key={faq.question} className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-lg font-semibold tracking-[-0.01em] text-ink transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <PlusIcon className="size-5 shrink-0 text-slate-500 motion-safe:transition-transform group-open:rotate-45" />
                </summary>
                <p className="max-w-[65ch] pr-10 pb-6 text-base leading-[1.65] text-pretty text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
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
            <h2 id="pricing-cta-title" className={`max-w-[20ch] ${h2Class}`}>
              <TightPunctuation>See your website before you spend a dollar.</TightPunctuation>
            </h2>
            <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-pretty text-slate-600">
              Start with a sentence about your business. No account or credit card needed.
            </p>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end">
            <Link href="/create" className={`w-full sm:w-auto ${primaryButton}`}>
              Start building
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
