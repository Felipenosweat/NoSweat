import type { Metadata, Viewport } from "next";
import { LiveClosing } from "@/components/landing-live/LiveClosing";
import { LiveFaq } from "@/components/landing-live/LiveFaq";
import { LiveHero } from "@/components/landing-live/LiveHero";
import { LiveOffice } from "@/components/landing-live/LiveOffice";
import { LivePricing } from "@/components/landing-live/LivePricing";
import { LIVE_FAQS } from "@/components/landing-live/content";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";
import { checkoutReady } from "@/server/billing";
import { currentOffer, promoActive } from "@/server/billing/plans";

// Landing "Live" (versão D, components/landing-live): tudo na página é de verdade e dá para
// mexer. Blocos sólidos alternando azul (herói com um site de exemplo ao vivo), branco
// (escritório com capturas reais), ink (tabela de preços), branco (dúvidas) e azul (fim).
// Só afirmações que o produto cumpre hoje; nada de números, logos, notas ou depoimentos
// inventados. Todo número vem de components/landing-live/content.ts (testado contra a fonte).

// O título diz o que a No Sweat é (é o que o Google mostra e o que as pessoas procuram).
const TITLE = "No Sweat: AI Website Builder for Local Businesses";
const DESCRIPTION =
  "Describe your business in one sentence and get a real website for your trade, a simple client list for every request, and Instagram posts you approve. Plans from $19/month.";

// A imagem de compartilhamento vem de app/(landing)/opengraph-image.tsx (1200×630).
// Cor da barra do navegador = o azul do topo da página.
export const viewport: Viewport = { themeColor: "#0066ff" };

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
  return (
    <>
      {/* FAQPage só com as perguntas que aparecem na página. */}
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(LIVE_FAQS, "/"))} />
      <LiveHero />
      <LiveOffice />
      <LivePricing checkout={checkoutReady()} promo={promoActive()} offerName={currentOffer()} />
      <LiveFaq />
      <LiveClosing />
    </>
  );
}
