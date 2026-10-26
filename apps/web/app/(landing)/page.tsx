import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { MODEL_UNSPLASH_PHOTOS } from "@nosweat/fixtures";
import { AfterLaunch } from "@/components/landing/AfterLaunch";
import { Hero } from "@/components/landing/Hero";
import { LandingMotion } from "@/components/landing/LandingMotion";
import { Showcase } from "@/components/landing/Showcase";
import { Steps } from "@/components/landing/Steps";
import { PlusIcon } from "@/components/marketing/icons";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { PromptForm } from "@/components/marketing/PromptForm";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";
import { checkoutReady } from "@/server/billing";

// Landing V8 ("Signature", pedido do fundador: "de realeza, que nem os templates premium", sem
// degradê "cara de IA"): hero com título gigante em serifa e o site de exemplo que cresce →
// parágrafo que acende → galeria de sites de exemplo (#looks) → como funciona (#story) →
// depois de publicado (#clients, #social) → preço → dúvidas → CTA final
// sobre foto e o nome gigante. Um só exemplo do começo ao fim: a Still Water Spa (fictícia).
// Só afirmações que o produto cumpre hoje. Nada de números, logos ou depoimentos inventados.

// O título diz o que a No Sweat é (é o que o Google mostra e o que as pessoas procuram).
const TITLE = "No Sweat: AI Website Builder for Local Businesses";
const DESCRIPTION =
  "Describe your business in one sentence and get a real website for your trade, a simple client list for every request, and Instagram posts you approve. Plans from $39/month.";

// A imagem de compartilhamento vem de app/(landing)/opengraph-image.tsx (1200×630).
// Barra do navegador do celular escura, da cor do topo da landing (o padrão do app é branco).
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

const wrap = "mx-auto w-full max-w-[1240px] px-5 sm:px-8";

const linkDark =
  "lp-underline rounded-sm font-semibold text-[#071b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

// A foto do CTA final: a mesma do topo do site de exemplo (Unsplash, hotlink com crédito).
const finalPhoto = MODEL_UNSPLASH_PHOTOS["still-water-spa"]?.hero;

export default function LandingPage() {
  // WhatsApp de vendas (só dígitos, ex.: 15085550142). Sem a variável, nada aparece.
  const whatsapp = salesWhatsappUrl();
  return (
    <>
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(LANDING_FAQS, "/"))} />
      <Hero />

      {/* O QUE VEM: o parágrafo acende palavra por palavra com a rolagem. */}
      <section aria-label="What you get" className="lp-paper py-16 lg:py-24">
        <div className={`${wrap} grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8`}>
          <p className="lp-eyebrow text-[#071b33]/55 lg:col-span-3 lg:pt-4">What you get</p>
          <p
            data-lp-words
            className="lp-serif text-[clamp(1.7rem,3.4vw,3rem)] leading-[1.14] text-balance lg:col-span-9"
          >
            You tell us what you do and where. We write the site, choose photos that fit your trade,
            add a call button for phones and a contact form, and put it online at a free address or
            your own domain. Nothing goes live until you say so.
          </p>
        </div>
      </section>

      <Showcase />
      <Steps />
      <AfterLaunch />

      {/* PREÇO — o mesmo componente da página /pricing. */}
      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="lp-paper border-t border-[var(--lp-line)] py-16 lg:py-24"
      >
        <div className={wrap}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <h2
              id="pricing-title"
              data-lp-rise
              className="lp-serif text-[clamp(2.4rem,5.5vw,5rem)] leading-[0.95] lg:col-span-8"
            >
              Build it free. Pay when it’s <em>live.</em>
            </h2>
            <p className="max-w-[40ch] text-lg leading-relaxed text-[#071b33]/70 lg:col-span-4">
              Create and preview your whole site without paying. You only pay when you pick a plan
              to publish.
            </p>
          </div>
          <div className="mt-10 rounded-[1.75rem] bg-white p-4 ring-1 ring-[var(--lp-line)] sm:p-8 lg:mt-12 lg:p-10">
            <PricingPlans checkout={checkoutReady()} />
          </div>
        </div>
      </section>

      {/* DÚVIDAS */}
      <section
        id="faq"
        aria-labelledby="faq-title"
        className="lp-paper border-t border-[var(--lp-line)] py-16 lg:py-24"
      >
        <div className={`${wrap} grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8`}>
          <div className="lg:col-span-4">
            <h2
              id="faq-title"
              data-lp-rise
              className="lp-serif text-[clamp(2.4rem,5vw,4.25rem)] leading-[0.95]"
            >
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
            {LANDING_FAQS.map((faq) => (
              <details key={faq.question} className="ns-faq group border-t border-[var(--lp-line)]">
                <summary
                  className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-5 text-lg font-medium text-[#071b33] transition-colors duration-150 hover:text-[#071b33]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:text-xl [&::-webkit-details-marker]:hidden`}
                >
                  {faq.question}
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

      {/* CTA FINAL — sobre a foto do site de exemplo, escurecida. */}
      <section
        aria-labelledby="final-title"
        data-hide-mobile-cta
        className="lp-night relative isolate overflow-hidden py-20 lg:py-28"
      >
        {finalPhoto && (
          <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
            {/* Hotlink do Unsplash (exigido pelas regras deles); o otimizador do Next não entra. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-lp-parallax="0.25"
              src={finalPhoto.url.replace(/([?&])w=\d+/, "$1w=1920")}
              alt=""
              loading="lazy"
              className="absolute inset-[-12%_0] size-full h-[124%] object-cover"
              style={{ objectPosition: finalPhoto.focus }}
            />
            <div className="lp-hero-veil absolute inset-0" />
          </div>
        )}
        <div className={`${wrap} grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-end`}>
          <div className="lg:col-span-7">
            <h2
              id="final-title"
              data-lp-rise
              className="lp-serif text-[clamp(2.8rem,6.5vw,6rem)] leading-[0.92] text-white"
            >
              Stop sweating the <em>website.</em>
            </h2>
            <p className="mt-6 max-w-[40ch] text-lg text-white/75">
              See your site before you spend a dollar.
            </p>
          </div>
          <div className="lg:col-span-5">
            <PromptForm
              tone="glass"
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
        {finalPhoto?.credit && (
          <p className={`${wrap} mt-10 text-[12px] text-white/50`}>
            Photo by{" "}
            <a href={finalPhoto.credit.url} className="underline underline-offset-2">
              {finalPhoto.credit.name}
            </a>{" "}
            on{" "}
            <a
              href="https://unsplash.com/?utm_source=nosweat&utm_medium=referral"
              className="underline underline-offset-2"
            >
              Unsplash
            </a>
          </p>
        )}
      </section>

      {/* O nome gigante antes do rodapé (enfeite; o logo de verdade está no rodapé). */}
      <div aria-hidden="true" className="overflow-hidden border-t border-white/10 bg-ink pt-10">
        <p
          data-lp-giant
          className="lp-serif text-center text-[24vw] leading-[0.8] whitespace-nowrap text-white"
        >
          No <em>Sweat</em>
        </p>
      </div>

      <LandingMotion />
    </>
  );
}
