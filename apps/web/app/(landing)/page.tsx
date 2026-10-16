import type { Metadata } from "next";
import Link from "next/link";
import { AlsoIncluded } from "@/components/landing/AlsoIncluded";
import { Hero } from "@/components/landing/Hero";
import { Story } from "@/components/landing/story/Story";
import { PlusIcon } from "@/components/marketing/icons";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { PromptForm } from "@/components/marketing/PromptForm";
import { container, focusRing } from "@/components/marketing/styles";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";

// Landing V6 (aprovada pelo fundador): hero → tour em seis cenas sobre ink (#story, uma só
// história: a Sparkle & Co. Cleaning, fictícia) → a faixa que "acende" → o que vem junto →
// preço → dúvidas → CTA final, no claro.
// Só afirmações que o produto cumpre hoje. Nada de números, logos ou depoimentos inventados.

// O título diz o que a No Sweat é (é o que o Google mostra e o que as pessoas procuram).
const TITLE = "No Sweat: AI Website Builder for Local Businesses";
const DESCRIPTION =
  "Describe your business in one sentence and get a real website for your trade, a simple client list for every request, and Instagram posts you approve. Plans from $39/month.";

// A imagem de compartilhamento vem de app/(landing)/opengraph-image.tsx (1200×630).
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

const h2Light =
  "font-display text-[clamp(2rem,4.6vw,3.5rem)] leading-[1.04] font-bold tracking-[-0.03em] text-balance text-ink";

export default function LandingPage() {
  return (
    <>
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(LANDING_FAQS, "/"))} />
      <Hero />
      <Story />

      {/* A faixa "acende" com a rolagem (ink → surface; ScrollStage escreve --l e data-lit). */}
      <div data-lights className="st-lights grid h-[60svh] place-items-center px-5">
        <p className="text-center font-display text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.1] font-bold tracking-[-0.025em]">
          That’s the whole morning.
        </p>
      </div>

      <AlsoIncluded />

      {/* PREÇO — o mesmo componente da página /pricing, num painel branco. */}
      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="border-t border-slate-200 bg-surface py-20 lg:py-28"
      >
        <div className={container}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <h2 id="pricing-title" className={`${h2Light} lg:col-span-7`}>
              Build it free. <span className="text-slate-500">Pay when it’s live.</span>
            </h2>
            <p className="max-w-[44ch] text-lg leading-relaxed text-pretty text-slate-600 lg:col-span-4 lg:col-start-9">
              Create and preview your whole site without paying. You only pay when you pick a plan
              to publish.
            </p>
          </div>
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 sm:p-8 lg:mt-14 lg:p-10">
            <PricingPlans />
          </div>
        </div>
      </section>

      {/* DÚVIDAS */}
      <section id="faq" aria-labelledby="faq-title" className="bg-white py-20 lg:py-28">
        <div className={`${container} grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8`}>
          <div className="lg:col-span-4">
            <h2 id="faq-title" className={h2Light}>
              Questions, <span className="text-slate-500">answered.</span>
            </h2>
            <p className="mt-6 max-w-[36ch] text-lg leading-relaxed text-slate-600">
              Real humans answer email. Write to{" "}
              <a
                href="mailto:hello@nosweatfd.com"
                className={`rounded-sm font-semibold text-ink underline decoration-brand underline-offset-4 hover:text-brand ${focusRing}`}
              >
                hello@nosweatfd.com
              </a>{" "}
              and a person on our team writes back.
            </p>
          </div>
          <div className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-8">
            {LANDING_FAQS.map((faq) => (
              <details key={faq.question} className="ns-faq group">
                <summary
                  className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-5 text-lg font-semibold text-ink transition-colors duration-150 hover:text-brand lg:py-6 lg:text-xl [&::-webkit-details-marker]:hidden ${focusRing}`}
                >
                  {faq.question}
                  <PlusIcon className="size-5 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none" />
                </summary>
                <p className="max-w-[65ch] pr-10 pb-7 text-base leading-[1.7] text-pretty text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        aria-labelledby="final-title"
        data-hide-mobile-cta
        className="border-t border-slate-200 bg-white py-20 lg:py-32"
      >
        <div className={`${container} grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end`}>
          <div className="lg:col-span-6">
            <h2 id="final-title" className={`${h2Light} max-w-[14ch] lg:text-[4rem]`}>
              Stop sweating <span className="text-slate-500">the website.</span>
            </h2>
            <p className="mt-5 max-w-[40ch] text-lg text-slate-600">
              See your site before you spend a dollar.
            </p>
          </div>
          <div className="lg:col-span-6">
            <PromptForm
              tone="light"
              examples={false}
              caption="Free account. Create and preview free."
            />
            <p className="mt-6 text-sm text-slate-600">
              Prefer to look around first?{" "}
              <Link
                href="/pricing"
                className={`rounded-sm font-semibold text-ink underline decoration-brand underline-offset-4 hover:text-brand ${focusRing}`}
              >
                See pricing
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
