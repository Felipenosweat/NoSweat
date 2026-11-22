import type { Metadata, Viewport } from "next";
import { Faq } from "@/components/landing-showroom/Faq";
import { HowItGetsBuilt, Office } from "@/components/landing-showroom/Office";
import { Showroom } from "@/components/landing-showroom/Showroom";
import { ShowroomPricing } from "@/components/landing-showroom/ShowroomPricing";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";
import { checkoutReady } from "@/server/billing";
import { currentOffer, promoActive } from "@/server/billing/plans";

// Landing "Showroom" (direção A): uma galeria de sites prontos, grandes. Bloco ink do topo até a
// prancha 07 (Showroom), depois branco e prático: o escritório, como é feito, preço e dúvidas.
// Sem formulário no topo. Só afirmações que o produto cumpre hoje; todo exemplo é um negócio
// inventado e está escrito assim. Nada de números, logos, notas ou depoimentos inventados.

// O título diz o que a No Sweat é (é o que o Google mostra e o que as pessoas procuram).
const TITLE = "No Sweat: AI Website Builder for Local Businesses";
const DESCRIPTION =
  "Describe your business in one sentence and get a real website for your trade, a simple client list for every request, and Instagram posts you approve. Plans from $19/month.";

// A imagem de compartilhamento vem de app/(landing)/opengraph-image.tsx (1200×630).
// Barra do navegador na cor do topo (ink).
export const viewport: Viewport = { themeColor: "#071b33" };

// O nome da oferta (Black Friday, Cyber Week...) muda pela data: a página se refaz de hora em hora.
export const revalidate = 3600;

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

export default function LandingPage() {
  // WhatsApp de vendas (só dígitos, ex.: 15085550142). Sem a variável, nada aparece.
  const whatsapp = salesWhatsappUrl();
  return (
    <>
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(LANDING_FAQS, "/"))} />
      <Showroom />
      <Office />
      <HowItGetsBuilt />

      {/* PREÇO — mesma venda do /pricing (botões para /create, regras de renovação, /billing). */}
      <section
        id="pricing"
        aria-labelledby="pricing-title"
        className="scroll-mt-16 bg-white px-5 sm:px-8"
      >
        <div className="mx-auto w-full max-w-[1280px] border-t border-slate-200 py-16 lg:py-24">
          <h2
            id="pricing-title"
            className="max-w-[20ch] font-display text-[2rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance text-ink lg:text-[3rem]"
          >
            Free to describe. Pay when you build.
          </h2>
          <div className="mt-6">
            <ShowroomPricing
              checkout={checkoutReady()}
              promo={promoActive()}
              offerName={currentOffer()}
            />
          </div>
        </div>
      </section>

      <Faq whatsapp={whatsapp} />
    </>
  );
}
