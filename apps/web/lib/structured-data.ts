import type { Faq } from "@/components/marketing/faqs";
import { escapeJsonForScript } from "@/components/site-metadata";
import { PLANS } from "@/server/billing/plans";
import { SITE_ORIGIN, siteUrl } from "./site";

// Dados estruturados (schema.org em JSON-LD) do nosweatfd.com. O Google usa para entender a
// empresa, o produto e as perguntas frequentes; buscadores com IA (ChatGPT, Perplexity, Gemini)
// também leem. Só fatos verdadeiros: preços vêm de server/billing/plans.ts (os cobrados de
// verdade), perguntas de components/marketing/faqs.ts (o texto visível na página).
// Nada de nota, avaliação, número de clientes ou prêmio.

const ORG_ID = `${SITE_ORIGIN}/#organization`;
const SITE_ID = `${SITE_ORIGIN}/#website`;
const APP_ID = `${SITE_ORIGIN}/#product`;

const dollars = (cents: number) => (cents / 100).toFixed(2);

export function organization() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: "No Sweat",
    url: siteUrl(),
    logo: `${SITE_ORIGIN}/icon.png`,
    email: "hello@nosweatfd.com",
    description:
      "No Sweat builds websites for small local businesses in the United States from a one-sentence description, with AI.",
  };
}

export function website() {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    name: "No Sweat",
    url: siteUrl(),
    inLanguage: "en-US",
    publisher: { "@id": ORG_ID },
  };
}

/** O produto e os planos, com os preços mensais e anuais cobrados de verdade. */
export function product() {
  const offers = Object.values(PLANS).flatMap((plan) => [
    {
      "@type": "Offer",
      name: `${plan.name} (monthly)`,
      price: dollars(plan.monthlyCents),
      priceCurrency: "USD",
      url: siteUrl("/pricing"),
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: dollars(plan.monthlyCents),
        priceCurrency: "USD",
        billingDuration: "P1M",
        unitText: "MONTH",
      },
    },
    {
      "@type": "Offer",
      name: `${plan.name} (yearly)`,
      price: dollars(plan.annualCents),
      priceCurrency: "USD",
      url: siteUrl("/pricing"),
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: dollars(plan.annualCents),
        priceCurrency: "USD",
        billingDuration: "P1Y",
        unitText: "ANN",
      },
    },
  ]);
  return {
    "@type": "SoftwareApplication",
    "@id": APP_ID,
    name: "No Sweat",
    url: siteUrl(),
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Website builder",
    operatingSystem: "Web",
    description:
      "Describe your business in a sentence or two and get a complete website with your services, a call button, a contact form and an FAQ. Edit it yourself or ask the AI for changes, then publish on a free address or your own domain.",
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Small local businesses in the United States",
    },
    provider: { "@id": ORG_ID },
    offers,
  };
}

export function faqPage(faqs: Faq[], path: string) {
  return {
    "@type": "FAQPage",
    "@id": `${siteUrl(path)}#faq`,
    url: siteUrl(path),
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

/** Junta os blocos num único JSON-LD, pronto para <script type="application/ld+json">. */
export function jsonLd(...nodes: object[]): string {
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
  return escapeJsonForScript(json);
}
