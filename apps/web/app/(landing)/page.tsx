import { joesPlumbing } from "@nosweat/fixtures";
import { siteStyle } from "@nosweat/templates";
import type { Metadata, Viewport } from "next";
import { Hero } from "@/components/landing-your-name/Hero";
import { previewBase } from "@/components/landing-your-name/personalize";
import {
  FaqSection,
  FinalCta,
  HowItsBuilt,
  Office,
  Pricing,
  Styles,
} from "@/components/landing-your-name/Sections";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";
import { checkoutReady } from "@/server/billing";
import { currentOffer, PLANS, promoActive } from "@/server/billing/plans";
import { creditCost, monthlyAllowance } from "@/server/credits/pricing";

// Landing "Your name on it": o visitante digita o nome da empresa e um site de exemplo de
// verdade (<SiteRenderer>, carregado depois do título) repinta com ele → o mesmo nome em três
// composições → o escritório (clientes, agenda...) → como o site real é feito → preço → dúvidas →
// fim. Só afirmações que o produto cumpre hoje; todo exemplo diz que o negócio é inventado.
// Preços e créditos sempre lidos do código (billing/plans.ts, credits/pricing.ts).

// O título diz o que a No Sweat é (é o que o Google mostra e o que as pessoas procuram).
const TITLE = "No Sweat: AI Website Builder for Local Businesses";
const DESCRIPTION =
  "Describe your business in one sentence and get a real website for your trade, a simple client list for every request, and Instagram posts you approve. Plans from $19/month.";

// A imagem de compartilhamento vem de app/(landing)/opengraph-image.tsx (1200×630).
export const viewport: Viewport = { themeColor: "#ffffff" };

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

const dollars = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/** Preço de entrada: o menor mensal entre os planos. */
const lowestMonthly = Math.min(...Object.values(PLANS).map((plan) => plan.monthlyCents));

const PRICE_LINE = `Describing your business is free. Plans from ${dollars(lowestMonthly)}/mo when you build.`;

export default function LandingPage() {
  // WhatsApp de vendas (só dígitos, ex.: 15085550142). Sem a variável, nada aparece.
  const whatsapp = salesWhatsappUrl();
  // Base da prévia: o site de exemplo do encanador (inventado), com menu e botões travados.
  const base = previewBase(joesPlumbing, siteStyle(joesPlumbing));
  const creditsLine = `The AI runs on credits: a new website uses ${creditCost("generate")}, and each change you ask it for uses ${creditCost("ai_edit")}. Starter includes ${monthlyAllowance("starter")} credits a month. Editing by hand is always free.`;
  return (
    <>
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(LANDING_FAQS, "/"))} />
      <Hero base={base} priceLine={PRICE_LINE} />
      <Styles base={base} />
      <Office />
      <HowItsBuilt creditsLine={creditsLine} />
      <Pricing
        checkout={checkoutReady()}
        promo={promoActive()}
        offerName={currentOffer()}
        intro="Describing your business and answering the quick questions costs nothing. Pick a plan when you want the site built. There’s no contract."
      />
      <FaqSection faqs={LANDING_FAQS} whatsapp={whatsapp} />
      <FinalCta priceLine={PRICE_LINE} />
    </>
  );
}
