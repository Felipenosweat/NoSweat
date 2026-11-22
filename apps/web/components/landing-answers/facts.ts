import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";
import { LANDING_FAQS, type Faq } from "@/components/marketing/faqs";
import { PLANS, promoPercentOff, type Plan } from "@/server/billing/plans";

// Fatos da landing "Straight answers" (direção C). Cada resposta da página sai daqui, e cada
// número vem do código de verdade: preços de server/billing/plans.ts, dúvidas de
// components/marketing/faqs.ts, e-mail de components/marketing/legal/contact.ts e as frases de
// cancelamento copiadas palavra por palavra dos Termos (app/(marketing)/terms, seção "Renewal";
// o teste confere que continuam lá). Nada de reembolso: o produto não promete isso.

/** "$19", "$1,290": dólares inteiros, como o resto do site mostra. */
export const dollars = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const { starter, pro, premium } = PLANS;

/** Meses grátis no anual (anual = 10× o mensal → 2). */
export const monthsFreeYearly = Math.round(12 - starter.annualCents / starter.monthlyCents);

export const priceFacts = {
  starterMonthly: dollars(starter.monthlyCents),
  starterRegular: dollars(starter.regularMonthlyCents),
  /** Só riscamos o preço normal quando ele é maior que o cobrado (regra da FTC, ver plans.ts). */
  starterDiscounted: promoPercentOff(starter) > 0,
  starterLines: [
    starter.publishedSitesLimit === 1
      ? "1 live website"
      : `${starter.publishedSitesLimit} live websites`,
    "Your own domain, or a free nosweatfd.com/s/ address",
    "Clients list for every request your site brings in",
    `${starter.socialPostsPerMonth} Instagram posts a month`,
  ],
  others: [pro, premium].map((plan: Plan) => ({
    id: plan.id,
    name: plan.name,
    monthly: dollars(plan.monthlyCents),
    sites: `Up to ${plan.publishedSitesLimit} live websites`,
  })),
};

/** A resposta curta da primeira pergunta (também usada no CTA final). */
export const costAnswer = `$0 to describe your business. ${priceFacts.starterMonthly} a month to put it online.`;
export const fromPriceLine = `Describing your business is free. Plans from ${priceFacts.starterMonthly}/mo when you build.`;

export const contactEmail = CONTACT_EMAIL;

/**
 * Trechos dos Termos de Serviço (seção "Renewal"), palavra por palavra. Com checkout online
 * (Stripe) vale o primeiro; com venda manual (sem Stripe), o segundo.
 */
export const TERMS_QUOTES = {
  checkout: {
    lead: "For plans bought through online checkout, you can cancel anytime",
    rest: " in your account, online, in a few clicks. You don’t need to call or email us. Canceling stops the next renewal; you keep your plan until the end of the period you already paid for.",
  },
  direct: {
    lead: "If you pay us directly",
    rest: " (for example by invoice or a payment link we send), your plan does not renew automatically; it ends on the date shown in your account unless you renew.",
  },
} as const;

/** Dúvidas que a página mostra no fim (as outras já viraram as cinco respostas grandes). */
export const SHORT_FAQ_QUESTIONS = [
  "Can I customize my site?",
  "Can I add my own photos?",
  "Can I use my own domain?",
  "What happens after I publish?",
  "Can it post to Instagram for me?",
] as const;

export const SHORT_FAQS: Faq[] = SHORT_FAQ_QUESTIONS.map((question) => {
  const faq = LANDING_FAQS.find((item) => item.question === question);
  if (!faq) throw new Error(`Missing landing FAQ: ${question}`);
  return faq;
});

/** Sites de exemplo (negócios inventados) com captura em public/landing/signature. */
export type ExampleSite = { slug: string; name: string; kind: string; place: string };

export const FEATURED_EXAMPLE: ExampleSite = {
  slug: "bright-spark-electric",
  name: "Bright Spark Electric",
  kind: "Electrician",
  place: "Phoenix, AZ",
};

export const MORE_EXAMPLES: ExampleSite[] = [
  { slug: "mercer-law", name: "Mercer Law", kind: "Family law", place: "Columbus, OH" },
  {
    slug: "smoke-and-rail-bbq",
    name: "Smoke & Rail BBQ",
    kind: "Barbecue",
    place: "Kansas City, MO",
  },
  { slug: "still-water-spa", name: "Still Water Spa", kind: "Day spa", place: "Scottsdale, AZ" },
  {
    slug: "greenline-landscaping",
    name: "Greenline Landscaping",
    kind: "Landscaping",
    place: "Charlotte, NC",
  },
];
