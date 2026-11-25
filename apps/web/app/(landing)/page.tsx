import type { Metadata, Viewport } from "next";
import { Closing } from "@/components/landing-on-the-job/Closing";
import { landingFaqs, lowestMonthly } from "@/components/landing-on-the-job/content";
import { Examples } from "@/components/landing-on-the-job/Examples";
import { Faq } from "@/components/landing-on-the-job/Faq";
import { Hero } from "@/components/landing-on-the-job/Hero";
import { Office } from "@/components/landing-on-the-job/Office";
import { Pricing } from "@/components/landing-on-the-job/Pricing";
import { Trades } from "@/components/landing-on-the-job/Trades";
import { JsonLd } from "@/components/marketing/JsonLd";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { faqPage, jsonLd, organization, product, website } from "@/lib/structured-data";

// Landing "On the job": a página é sobre o dono, não sobre o software. Fotos documentais de gente
// trabalhando (marceneiro, barbeiro, padeiro...) e, dentro desse mundo, o momento que a No Sweat
// cria: um pedido chegando no celular. Cada seção responde uma pergunta: o que é, para quem, como
// fica o site, o que acontece depois, quanto custa, dúvidas e o fim.
// Só afirmações que o produto cumpre hoje; nada de números, logos, notas ou depoimentos inventados.

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
  "rounded-sm font-semibold text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export default function LandingPage() {
  // WhatsApp de vendas (só dígitos, ex.: 15085550142). Sem a variável, nada aparece.
  const whatsapp = salesWhatsappUrl();
  // As 6 perguntas mostradas são as mesmas do JSON-LD.
  const faqs = landingFaqs();
  return (
    <>
      <JsonLd data={jsonLd(organization(), website(), product(), faqPage(faqs, "/"))} />
      <Hero />
      <Trades />
      <Examples />
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
