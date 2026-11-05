import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { AfterLaunch } from "@/components/landing/AfterLaunch";
import { Examples } from "@/components/landing/Examples";
import { Hero } from "@/components/landing/Hero";
import { Included } from "@/components/landing/Included";
import { LandingMotion } from "@/components/landing/LandingMotion";
import { Steps } from "@/components/landing/Steps";
import { PlusIcon } from "@/components/marketing/icons";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { PromptForm } from "@/components/marketing/PromptForm";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { SocialLinks } from "@/components/marketing/SocialLinks";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";
import { checkoutReady } from "@/server/billing";

// Landing V10: fundo branco, cores da logo, sem fotos de sites. V9 (V8 "Signature" + forma das referências Redstone e Miligram: pílulas de imagem no título, faixa de nomes, cursor "View", pilha nos passos). V8 ("Signature", pedido do fundador: "de realeza, que nem os templates premium", sem
// degradê "cara de IA"): hero com título gigante em serifa e o site de exemplo que cresce →
// parede de celulares com sites de exemplo → galeria de sites de exemplo (#looks) → como funciona (#story) →
// depois de publicado (#clients, #social) → preço → dúvidas → CTA final
// sobre foto e o nome gigante. Um só exemplo do começo ao fim: a Still Water Spa (fictícia).
// Só afirmações que o produto cumpre hoje. Nada de números, logos ou depoimentos inventados.

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

const wrap = "mx-auto w-full max-w-[1240px] px-5 sm:px-8";

const linkDark =
  "lp-underline rounded-sm font-semibold text-[#071b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export default function LandingPage() {
  // WhatsApp de vendas (só dígitos, ex.: 15085550142). Sem a variável, nada aparece.
  const whatsapp = salesWhatsappUrl();
  return (
    <>
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(LANDING_FAQS, "/"))} />
      <Hero />
      <Steps />
      <Included />
      <Examples />
      <AfterLaunch />

      {/* PREÇO — o mesmo componente da página /pricing. */}
      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="border-t border-[var(--lp-line)] py-16 lg:py-24"
      >
        <div className={wrap}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <h2
              id="pricing-title"
              data-lp-rise
              className="lp-serif text-[clamp(2rem,4.4vw,3.5rem)] lg:col-span-8"
            >
              Build it free. Pay when it’s <em>live.</em>
            </h2>
            <p className="max-w-[40ch] text-lg leading-relaxed text-[#071b33]/70 lg:col-span-4">
              Create and preview your whole site without paying. You only pay when you pick a plan
              to publish.
            </p>
          </div>
          <div className="mt-10 lp-frame lp-tint rounded-[4px] p-4 sm:p-8 lg:mt-12 lg:p-10">
            <PricingPlans checkout={checkoutReady()} />
          </div>
        </div>
      </section>

      {/* DÚVIDAS */}
      <section
        id="faq"
        aria-labelledby="faq-title"
        className="border-t border-[var(--lp-line)] py-16 lg:py-24"
      >
        <div className={`${wrap} grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8`}>
          <div className="lg:col-span-4">
            <h2 id="faq-title" data-lp-rise className="lp-serif text-[clamp(2rem,4vw,3rem)]">
              Questions, <em>answered</em>
            </h2>
            <p className="mt-6 max-w-[36ch] text-lg leading-relaxed text-[#071b33]/70">
              Real people answer email. Write to{" "}
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
              )}{" "}
              and someone on our team writes back.
            </p>
          </div>
          <div className="border-b border-[var(--lp-line)] lg:col-span-8">
            {LANDING_FAQS.map((faq, index) => (
              <details key={faq.question} className="ns-faq group border-t border-[var(--lp-line)]">
                <summary
                  className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-5 text-lg font-medium text-[#071b33] transition-colors duration-150 hover:text-[#071b33]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:text-xl [&::-webkit-details-marker]:hidden`}
                >
                  <span className="flex items-baseline gap-5">
                    <span
                      aria-hidden="true"
                      className="w-6 text-[13px] font-semibold tracking-[0.14em] text-[#071b33]/45"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {faq.question}
                  </span>
                  <PlusIcon className="size-5 shrink-0 text-[#071b33]/50 transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none" />
                </summary>
                <p className="max-w-[65ch] pr-10 pb-8 text-base leading-[1.7] text-pretty text-[#071b33]/72">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL — painel de tinta (o único bloco escuro da página). */}
      <section aria-labelledby="final-title" data-hide-mobile-cta className="px-3 pb-6 sm:px-5">
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-12 rounded-[2rem] bg-[#071b33] px-6 py-16 sm:px-12 lg:grid-cols-12 lg:items-end lg:py-24">
          <div className="lg:col-span-7">
            <h2
              id="final-title"
              data-lp-rise
              className="lp-serif text-[clamp(2.4rem,5.5vw,4.5rem)] !text-white"
            >
              Stop sweating the <em className="!text-[#00c2ff]">website.</em>
            </h2>
            <p className="mt-6 max-w-[40ch] text-lg text-white/75">
              See your site before you spend a dollar.
            </p>
          </div>
          <div className="lg:col-span-5">
            <PromptForm
              tone="dark"
              examples={false}
              caption="No account needed. Create and preview free."
            />
            <p className="mt-6 text-sm text-white/70">
              Prefer to look around first?{" "}
              <Link
                href="/pricing"
                className="lp-underline rounded-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                See pricing
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* O nome gigante antes do rodapé (enfeite; o logo de verdade está no rodapé). */}
      <div aria-hidden="true" className="overflow-hidden pt-10">
        <p
          data-lp-giant
          className="lp-serif text-center text-[17.5vw] leading-[0.85] tracking-[-0.05em] whitespace-nowrap"
        >
          No <em>Sweat</em>
        </p>
      </div>
      <section aria-labelledby="follow-title" className="pt-6 pb-14 text-center">
        <h2 id="follow-title" className="lp-eyebrow text-[#071b33]/60">
          Follow @nosweatfd
        </h2>
        <SocialLinks tone="light" className="mt-5 justify-center" />
      </section>

      <LandingMotion />
    </>
  );
}
