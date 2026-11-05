import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Examples } from "@/components/landing/Examples";
import { Hero } from "@/components/landing/Hero";
import { LandingMotion } from "@/components/landing/LandingMotion";
import { Steps } from "@/components/landing/Steps";
import { WhatYouGet } from "@/components/landing/WhatYouGet";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";
import { checkoutReady } from "@/server/billing";

// Landing V12 (forma inspirada no averaks.com; conteúdo, cores e regras da No Sweat): topo com
// perguntas uma de cada vez → o que você ganha (site, clientes, Instagram) → como funciona →
// exemplos → preço → dúvidas → botão final. Sem fotos. Só afirmações que o produto cumpre hoje;
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

const tag = "lp-tag";
const h2 = "lp-h mt-6 text-[clamp(1.9rem,3.9vw,3.375rem)]";

const linkDark =
  "lp-underline rounded-sm font-medium text-[#071b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Linhas de fundo: três curvas paralelas e dois pulsos andando (enfeite). */
function Trail() {
  return (
    <svg
      className="lp-trail"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path d="M-80 640 C 220 560, 470 260, 760 300 C 1030 336, 1170 560, 1520 420" />
      <path d="M-80 690 C 240 612, 488 322, 768 360 C 1024 396, 1182 618, 1520 482" />
      <path d="M-80 744 C 260 672, 506 392, 776 426 C 1018 458, 1192 676, 1520 546" />
      <path
        className="pulse"
        d="M-80 690 C 240 612, 488 322, 768 360 C 1024 396, 1182 618, 1520 482"
      />
      <path
        className="pulse p2"
        d="M-80 744 C 260 672, 506 392, 776 426 C 1018 458, 1192 676, 1520 546"
      />
    </svg>
  );
}

export default function LandingPage() {
  // WhatsApp de vendas (só dígitos, ex.: 15085550142). Sem a variável, nada aparece.
  const whatsapp = salesWhatsappUrl();
  return (
    <>
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(LANDING_FAQS, "/"))} />
      <Trail />
      <Hero />
      <WhatYouGet />
      <Steps />
      <Examples />

      {/* PREÇO — o mesmo componente da página /pricing. */}
      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="scroll-mt-14 px-5 py-20 text-center sm:px-8 lg:py-28"
      >
        <span className={tag}>Pricing</span>
        <h2 id="pricing-title" className={h2}>
          Build it free.
          <br />
          <span className="dim">Pay when it’s live.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[46ch] text-[17px] leading-relaxed text-[#6e6e73]">
          Create and preview your whole site without paying. You only pay when you pick a plan to
          publish.
        </p>
        <div className="mx-auto mt-12 w-full max-w-[1180px] text-left">
          <PricingPlans checkout={checkoutReady()} />
        </div>
      </section>

      {/* DÚVIDAS — centralizadas; abrir uma fecha as outras (details com o mesmo name). */}
      <section
        id="faq"
        aria-labelledby="faq-title"
        className="scroll-mt-14 px-5 py-20 text-center sm:px-8 lg:py-28"
      >
        <span className={tag}>FAQ</span>
        <h2 id="faq-title" className={h2}>
          Questions,
          <br />
          <span className="dim">answered.</span>
        </h2>
        <div className="mx-auto mt-12 w-full max-w-[760px] text-left">
          {LANDING_FAQS.map((faq, index) => (
            <details
              key={faq.question}
              name="faq"
              className={`border-b border-[var(--lp-hair)] ${index === 0 ? "border-t" : ""}`}
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 rounded-sm px-0.5 py-5 text-[17px] font-semibold tracking-[-0.01em] text-[#071b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span aria-hidden="true" className="lp-fx" />
              </summary>
              <p className="max-w-[60ch] px-0.5 pb-5 text-[15px] leading-[1.65] text-pretty text-[#6e6e73]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-[52ch] text-[15px] leading-relaxed text-[#6e6e73]">
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

      {/* FIM — um botão só, de volta às perguntas do topo. */}
      <section
        aria-labelledby="final-title"
        data-hide-mobile-cta
        className="px-5 pt-8 pb-24 text-center sm:px-8"
      >
        <h2 id="final-title" className="lp-h text-[clamp(1.9rem,3.9vw,3.375rem)]">
          Ready when you are.
          <br />
          <span className="dim">It takes about a minute.</span>
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5">
          <a
            href="#start"
            className="lp-btn inline-flex items-center px-7 py-3 text-[17px] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand"
          >
            Start your website
          </a>
          <Link href="/pricing" className={`${linkDark} text-[15px]`}>
            See pricing
          </Link>
        </div>
      </section>

      <LandingMotion />
    </>
  );
}
