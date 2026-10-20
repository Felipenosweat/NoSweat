import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { AlsoIncluded } from "@/components/landing/AlsoIncluded";
import { BackdropPhoto, BackdropShade } from "@/components/landing/Backdrop";
import { Hero } from "@/components/landing/Hero";
import { Story } from "@/components/landing/story/Story";
import { PlusIcon } from "@/components/marketing/icons";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { PromptForm } from "@/components/marketing/PromptForm";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { container, focusRing } from "@/components/marketing/styles";
import { TightPunctuation } from "@/components/marketing/TightPunctuation";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";
import { checkoutReady } from "@/server/billing";

// Landing V7 (pedido do fundador: "moderna, super visual"): hero em tela cheia com fotos de
// ofícios → tour em oito cenas que ensinam a usar tudo, cada uma sobre uma foto (#story, uma só
// história: a Sparkle & Co. Cleaning, fictícia) → a faixa que "acende" → o que vem junto →
// preço e dúvidas no claro (com textura de pontos e luz) → CTA final sobre foto.
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

const h2Light =
  "font-display text-[clamp(2.25rem,5.2vw,4.25rem)] leading-[1] font-extrabold tracking-[-0.04em] text-balance text-ink";

export default function LandingPage() {
  // WhatsApp de vendas (só dígitos, ex.: 15085550142). Sem a variável, nada aparece.
  const whatsapp = salesWhatsappUrl();
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
        className="lp-dots relative isolate overflow-hidden border-t border-slate-200 bg-surface py-20 lg:py-28"
      >
        {/* Luz da marca bem desfocada atrás do painel de preço. */}
        <div
          aria-hidden="true"
          className="lp-pricing-glow absolute top-1/2 left-1/2 -z-10 h-[80%] w-[min(1100px,140%)] -translate-x-1/2 -translate-y-1/4"
        />
        <div className={container}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
            <h2 id="pricing-title" className={`${h2Light} lg:col-span-7`}>
              <TightPunctuation strong>Build it free.</TightPunctuation>{" "}
              <span className="text-slate-500">
                <TightPunctuation strong>Pay when it’s live.</TightPunctuation>
              </span>
            </h2>
            <p className="max-w-[44ch] text-lg leading-relaxed text-pretty text-slate-600 lg:col-span-4 lg:col-start-9">
              Create and preview your whole site without paying. You only pay when you pick a plan
              to publish.
            </p>
          </div>
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_50px_120px_-50px_rgb(7_27_51/.35)] backdrop-blur-sm sm:p-8 lg:mt-14 lg:p-10">
            <PricingPlans checkout={checkoutReady()} />
          </div>
        </div>
      </section>

      {/* DÚVIDAS */}
      <section
        id="faq"
        aria-labelledby="faq-title"
        className="bg-linear-to-b from-surface to-white py-20 lg:py-28"
      >
        <div className={`${container} grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8`}>
          <div className="lg:col-span-4">
            <h2 id="faq-title" className={h2Light}>
              <TightPunctuation strong>Questions,</TightPunctuation>{" "}
              <span className="text-slate-500">
                <TightPunctuation strong>answered.</TightPunctuation>
              </span>
            </h2>
            <p className="mt-6 max-w-[36ch] text-lg leading-relaxed text-slate-600">
              Real humans answer email. Write to{" "}
              <a
                href="mailto:hello@nosweatfd.com"
                className={`rounded-sm font-semibold text-ink underline decoration-brand underline-offset-4 hover:text-brand ${focusRing}`}
              >
                hello@nosweatfd.com
              </a>
              {whatsapp && (
                <>
                  {" "}
                  or{" "}
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded-sm font-semibold text-ink underline decoration-brand underline-offset-4 hover:text-brand ${focusRing}`}
                  >
                    message us on WhatsApp
                  </a>
                </>
              )}{" "}
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

      {/* CTA FINAL — sobre uma foto em tela cheia, escurecida. */}
      <section
        aria-labelledby="final-title"
        data-hide-mobile-cta
        className="relative isolate overflow-hidden bg-ink py-24 lg:py-36"
      >
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <BackdropPhoto photo="storefront" />
          <BackdropShade side="left" />
        </div>
        <div className={`${container} grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end`}>
          <div className="lg:col-span-6">
            <h2
              id="final-title"
              className="max-w-[12ch] font-display text-[clamp(2.5rem,6.4vw,5.5rem)] leading-[0.96] font-extrabold tracking-[-0.045em] text-balance text-white"
            >
              <TightPunctuation strong>Stop sweating</TightPunctuation>{" "}
              <span className="text-slate-300">
                <TightPunctuation strong>the website.</TightPunctuation>
              </span>
            </h2>
            <p className="mt-5 max-w-[40ch] text-lg text-slate-200">
              See your site before you spend a dollar.
            </p>
          </div>
          <div className="lg:col-span-6">
            <PromptForm
              tone="dark"
              examples={false}
              caption="No account needed. Create and preview free."
            />
            <p className="mt-6 text-sm text-slate-200">
              Prefer to look around first?{" "}
              <Link
                href="/pricing"
                className="rounded-sm font-semibold text-white underline decoration-accent underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
