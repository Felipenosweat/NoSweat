import type { Metadata, Viewport } from "next";
import { Answers } from "@/components/landing-answers/Answers";
import { AnswersFaq } from "@/components/landing-answers/AnswersFaq";
import { FinalCta } from "@/components/landing-answers/FinalCta";
import { SHORT_FAQS } from "@/components/landing-answers/facts";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { JsonLd } from "@/components/marketing/JsonLd";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";
import { checkoutReady } from "@/server/billing";
import { currentOffer, promoActive } from "@/server/billing/plans";

// Landing "Straight answers" (direção C): a página são as cinco perguntas que o dono de um
// negócio faz, em letra enorme, cada uma com um fato e uma prova de verdade (preço do plans.ts,
// captura real, trecho dos Termos, o e-mail de contato). Depois o CTA, dúvidas curtas e o rodapé.
// Componentes em components/landing-answers; os da versão anterior (components/landing) ficam.
// Só afirmações que o produto cumpre hoje; nada de números, logos, notas ou depoimentos
// inventados, e nenhuma promessa de reembolso.

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

export default function LandingPage() {
  // WhatsApp de vendas (só dígitos, ex.: 15085550142). Sem a variável, nada aparece.
  const whatsapp = salesWhatsappUrl();
  return (
    <>
      {/* FAQPage só com as dúvidas que a página mostra (o texto precisa estar visível). */}
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(SHORT_FAQS, "/"))} />
      <Answers
        checkout={checkoutReady()}
        promo={promoActive()}
        offerName={currentOffer()}
        whatsapp={whatsapp}
      />
      <FinalCta />
      <AnswersFaq />
    </>
  );
}
