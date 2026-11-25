import type { Metadata, Viewport } from "next";
import { Closing } from "@/components/landing-after-hours/Closing";
import { landingFaqs, lowestMonthly } from "@/components/landing-after-hours/content";
import { Examples } from "@/components/landing-after-hours/Examples";
import { Faq } from "@/components/landing-after-hours/Faq";
import { Hero } from "@/components/landing-after-hours/Hero";
import { Office } from "@/components/landing-after-hours/Office";
import { Overnight } from "@/components/landing-after-hours/Overnight";
import { Pricing } from "@/components/landing-after-hours/Pricing";
import { JsonLd } from "@/components/marketing/JsonLd";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";

// Landing "After hours": a loja fecha às seis, o site não. Fotos de lugares à noite (nenhuma pessoa
// posando), letra leve e grande, fundos quase pretos e o que o produto faz de verdade: o site de
// exemplo saindo da foto, os pedidos chegando de madrugada e a tela real do painel. Cada seção
// responde uma pergunta: o que é, como fica o site, o que acontece depois, é de verdade, quanto
// custa, dúvidas e o fim. Só afirmações que o produto cumpre hoje; nada de números, logos, notas
// ou depoimentos inventados.

// O título diz o que a No Sweat é (é o que o Google mostra e o que as pessoas procuram).
const TITLE = "No Sweat: AI Website Builder for Local Businesses";
const DESCRIPTION =
  "Describe your business in one sentence and get a real website for your trade, a simple client list for every request, and Instagram posts you approve. " +
  `Plans from ${lowestMonthly()}/month.`;

// A imagem de compartilhamento vem de app/(landing)/opengraph-image.tsx (1200×630).
// Cor da barra do navegador: o ink do topo (faixa do cabeçalho no celular, painel no computador).
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

const linkClass =
  "rounded-sm font-medium text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default function LandingPage() {
  // WhatsApp de vendas (só dígitos, ex.: 15085550142). Sem a variável, nada aparece.
  const whatsapp = salesWhatsappUrl();
  // As 6 perguntas mostradas são as mesmas do JSON-LD.
  const faqs = landingFaqs();
  return (
    <>
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(faqs, "/"))} />
      <Hero />
      <Examples />
      <Overnight />
      <Office />
      <Pricing />
      <Faq
        faqs={faqs}
        contact={
          <>
            Still wondering? Write to{" "}
            <a href="mailto:hello@nosweatfd.com" className={linkClass}>
              hello@nosweatfd.com
            </a>
            {whatsapp && (
              <>
                {" "}
                or{" "}
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  message us on WhatsApp
                </a>
              </>
            )}
            . A real person writes back.
          </>
        }
      />
      <Closing />
    </>
  );
}
