import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Examples } from "@/components/landing/Examples";
import { Hero } from "@/components/landing/Hero";
import { OfficeChapter } from "@/components/landing/OfficeChapter";
import { PriceReceipt } from "@/components/landing/PriceReceipt";
import { StartButton } from "@/components/landing/StartButton";
import { FaqList } from "@/components/marketing/FaqList";
import {
  ArrowUturnLeftIcon,
  CheckIcon,
  ChatIcon,
  EnvelopeIcon,
  SparklesIcon,
} from "@/components/marketing/icons";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";
import { REFUND_WINDOW_DAYS } from "@/components/marketing/legal/policy";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { planPrices, pricingCredits } from "@/components/marketing/pricing-data";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import {
  chapterNumberClass,
  container,
  focusRing,
  h2Class,
  h3Class,
  textLink,
} from "@/components/marketing/styles";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";
import { checkoutReady } from "@/server/billing";

// Landing (redesenho de 2026-11): a página acompanha um serviço inventado do primeiro toque no
// site até a fatura paga. Topo com as quatro perguntas e o celular → três fatos → "The office"
// (a única seção escura, com telas reais) → exemplos → três passos → preço → uma pessoa responde
// → dúvidas → fim. Branco e tinta, grade de 12 colunas, tudo à esquerda (só o fim centralizado);
// o azul é só do botão da ação principal. Só afirmações que o produto cumpre hoje: nada de
// números, logos, notas ou depoimentos inventados. Preços só de pricing-data.ts e legal/policy.ts.

// O título diz o que a No Sweat é (é o que o Google mostra e o que as pessoas procuram).
const TITLE = "No Sweat: AI Website Builder for Local Businesses";
const FROM_PRICE = planPrices().starter.monthly;
const DESCRIPTION = `Answer four questions and get a website that takes bookings, plus the office behind it: requests, estimates, your schedule, invoices and Google review requests. Free to build; plans from ${FROM_PRICE}/month.`;

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

const STEPS = [
  {
    title: "Answer four questions.",
    body: "Your kind of business, your city, the name if you have one and anything a customer should know. The first draft is ready in about a minute.",
  },
  {
    title: "Change anything.",
    body: "Editing by hand is free; asking the AI uses credits, and you see the cost first.",
  },
  {
    title: "Pick a plan and go live on your own domain.",
    body: "Every plan can connect a domain you own or use a free nosweatfd.com address.",
  },
];

const contactRow = `inline-flex min-h-11 items-center gap-3 rounded-lg text-[17px] font-semibold text-ink underline decoration-ink/35 underline-offset-4 transition-colors duration-150 hover:decoration-ink ${focusRing}`;

export default function LandingPage() {
  // WhatsApp de vendas (só dígitos, ex.: 15085550142). Sem a variável, nada aparece.
  const whatsapp = salesWhatsappUrl();
  return (
    <>
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(LANDING_FAQS, "/"))} />
      <Hero fromPrice={FROM_PRICE} />

      {/* TRÊS FATOS — verdadeiros hoje; sem números, logos nem estrelas. */}
      <section aria-label="Before you start" className="border-y border-slate-200 bg-white">
        <ul
          className={`${container} flex flex-col gap-3 py-5 text-[15px] text-ink lg:flex-row lg:items-center lg:gap-10 lg:py-6`}
        >
          <li className="flex items-center gap-3">
            <SparklesIcon className="size-5 shrink-0 text-slate-500" />
            First draft in about a minute
          </li>
          <li className="flex items-center gap-3">
            <CheckIcon className="size-5 shrink-0 text-slate-500" />
            No account or card to start
          </li>
          <li className="flex items-center gap-3">
            <ArrowUturnLeftIcon className="size-5 shrink-0 text-slate-500" />
            <Link href="/refund" className={`inline-flex min-h-11 items-center ${textLink}`}>
              {REFUND_WINDOW_DAYS}-day money-back guarantee
            </Link>
          </li>
        </ul>
      </section>

      <OfficeChapter />
      <Examples />

      {/* COMO FUNCIONA — título à esquerda, três passos numerados à direita. Sem ilustrações. */}
      <section
        id="how"
        aria-labelledby="how-title"
        className="scroll-mt-16 bg-white py-12 lg:py-16"
      >
        <div className={`${container} grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-8`}>
          <h2 id="how-title" className={`lg:col-span-4 ${h2Class}`}>
            Three steps.
          </h2>
          <ol className="lg:col-span-8">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-slate-200 py-6 last:border-b"
              >
                <span className={`pt-1 ${chapterNumberClass}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className={h3Class}>{step.title}</h3>
                  <p className="mt-2 max-w-[62ch] text-base leading-[1.65] text-pretty text-slate-600 lg:text-[17px]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PREÇO — recibo completo e a mesma tabela da página /pricing. */}
      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="scroll-mt-16 border-t border-slate-200 bg-white py-16 lg:py-28"
      >
        <div className={container}>
          <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:items-end lg:gap-x-8">
            <h2 id="pricing-title" className={`lg:col-span-7 ${h2Class}`}>
              Free to build. Pay when it goes live.
            </h2>
            <PriceReceipt fromPrice={FROM_PRICE} className="lg:col-span-5 lg:justify-self-end" />
          </div>
          <div className="mt-12 lg:mt-16">
            <PricingPlans
              checkout={checkoutReady()}
              prices={planPrices()}
              credits={pricingCredits()}
            />
          </div>
        </div>
      </section>

      {/* UMA PESSOA RESPONDE — sem foto nem nome inventados. */}
      <section aria-labelledby="person-title" className="bg-surface py-12 lg:py-16">
        <div className={`${container} grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-8`}>
          <div className="lg:col-span-5">
            <h2 id="person-title" className={h3Class}>
              Questions before you start?
            </h2>
            <p className="mt-2 max-w-[44ch] text-base leading-[1.65] text-slate-600">
              Write to us. A real person on our team writes back.
            </p>
          </div>
          <ul className="flex flex-col gap-1 lg:col-span-7">
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className={contactRow}>
                <EnvelopeIcon className="size-5 shrink-0 text-slate-500" />
                {CONTACT_EMAIL}
              </a>
            </li>
            {whatsapp && (
              <li>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={contactRow}>
                  <ChatIcon className="size-5 shrink-0 text-slate-500" />
                  Message us on WhatsApp
                </a>
              </li>
            )}
            <li>
              <Link href="/contact" className={contactRow}>
                <span aria-hidden="true" className="inline-block w-5" />
                All the ways to reach us
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* DÚVIDAS — abrir uma fecha as outras (details com o mesmo name). */}
      <section
        id="faq"
        aria-labelledby="faq-title"
        className="scroll-mt-16 bg-white py-16 lg:py-24"
      >
        <div className={`${container} grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-8`}>
          <div className="lg:col-span-4">
            <h2 id="faq-title" className={`lg:sticky lg:top-24 ${h2Class}`}>
              Questions
            </h2>
          </div>
          <div className="lg:col-span-8">
            <FaqList faqs={LANDING_FAQS} name="faq" />
          </div>
        </div>
      </section>

      {/* FIM — o único bloco centralizado: um botão azul de volta às perguntas do topo. */}
      <section
        aria-labelledby="final-title"
        data-hide-mobile-cta
        className="border-t border-slate-200 bg-white py-20 lg:py-28"
      >
        <div className={`${container} flex flex-col items-center text-center`}>
          <h2 id="final-title" className={`mx-auto ${h2Class}`}>
            Start with four questions.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <StartButton>Build my website</StartButton>
            <Link href="/pricing" className={`inline-flex min-h-11 items-center ${textLink}`}>
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
