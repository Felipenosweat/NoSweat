import { MODEL_LIBRARY } from "@nosweat/fixtures";
import { LANDING_FAQS, type Faq } from "@/components/marketing/faqs";
import { PLANS, promoPercentOff } from "@/server/billing/plans";
import { MONTHLY_CREDITS } from "@/server/credits/pricing";
import type { PhotoKey } from "./photos";

// Texto e dados da landing "On the job". Tudo que é número ou fato vem da fonte certa (preços e
// limites de server/billing/plans.ts e server/credits/pricing.ts, exemplos das fixtures,
// perguntas de components/marketing/faqs.ts). O teste content.test.ts confere cada ligação e
// procura palavras proibidas, travessões e qualquer promessa de reembolso no texto novo.
// Só para server components e testes: o componente de preço (cliente) recebe os dados prontos.

const dollars = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;

/** Menor preço mensal entre os planos ("Plans from $19/mo"). */
export function lowestMonthly(): string {
  return dollars(Math.min(...Object.values(PLANS).map((plan) => plan.monthlyCents)));
}

/** Linha embaixo dos botões principais (topo e fim da página). */
export function priceLine(): string {
  return `Describing your business is free. Plans from ${lowestMonthly()}/mo when you build.`;
}

export const HERO = {
  title: "You do the work. We’ll build the website.",
  lead: "Tell us about your business in a few sentences. No Sweat builds the whole site, with your phone number, services and hours, and sends every request it brings in to your inbox.",
  cta: "Start my website",
};

/** O cartão de pedido (cópia fiel do aviso da tela Clients). Exemplo: nome e serviço inventados. */
export const REQUEST_CARD = {
  hero: { name: "Marcus", job: "Built-in shelves, 2 walls", time: "Just now" },
  office: { name: "Denise", job: "Catering for 40, Saturday", time: "2 min ago" },
  caption: "Example request",
};

// ---------- Ramos ----------

export type Trade = {
  photo: PhotoKey;
  label: string;
  /** Site de exemplo do mesmo ramo (negócio inventado); sem ele, o cartão não é link. */
  example?: { slug: string; linkLabel: string };
};

export const TRADES_TITLE = "For the people who are booked all day.";

export const TRADES: Trade[] = [
  {
    photo: "barber",
    label: "Barber",
    example: { slug: "fade-and-co-barbers", linkLabel: "See a barber site" },
  },
  {
    photo: "baker",
    label: "Baker",
    example: { slug: "sunrise-bakery", linkLabel: "See a bakery site" },
  },
  {
    photo: "electrician",
    label: "Electrician",
    example: { slug: "bright-spark-electric", linkLabel: "See an electrician site" },
  },
  {
    photo: "lawn",
    label: "Landscaping & lawn care",
    example: { slug: "greenline-landscaping", linkLabel: "See a landscaping site" },
  },
  { photo: "stylist", label: "Hair stylist" },
  { photo: "shopOwner", label: "Shop owner" },
  { photo: "handyman", label: "Handyman" },
];

// ---------- Exemplos ----------

export const EXAMPLES_TITLE = "Every site is designed for its business.";
export const EXAMPLES_BODY =
  "No Sweat picks the layout, the type and the photos for each trade, so a barbershop doesn’t come out looking like an electrician.";

/** Os três exemplos mostrados, na ordem (o primeiro é o grande). */
export const EXAMPLE_SLUGS = [
  "greenline-landscaping",
  "fade-and-co-barbers",
  "bright-spark-electric",
] as const;

export type ExampleSite = {
  slug: string;
  name: string;
  trade: string;
  city: string;
  /** "<Nome> · <Ramo>, <Cidade> · Made-up business" */
  label: string;
};

/** Nome, ramo e cidade lidos das fixtures (negócios inventados). */
export function exampleSites(): ExampleSite[] {
  return EXAMPLE_SLUGS.map((slug) => {
    const entry = MODEL_LIBRARY.find((model) => model.slug === slug);
    if (!entry) throw new Error(`Example ${slug} not found in @nosweat/fixtures`);
    const { name, category, city } = entry.spec.business;
    const trade = category ?? "";
    const place = city ?? "";
    return {
      slug,
      name,
      trade,
      city: place,
      label: `${name} · ${trade}, ${place} · Made-up business`,
    };
  });
}

// ---------- Escritório ----------

export const OFFICE_TITLE = "Every request and booking lands in one place.";
export const OFFICE_CAPTION = "Real No Sweat screen. The customers are made up.";

/** Ferramentas que existem hoje no painel (cada uma com a rota onde vive, conferida no teste). */
export const OFFICE_TOOLS: { term: string; detail: string; route: string }[] = [
  {
    term: "Requests and clients",
    detail: "Every form from your site becomes a client you can move from New to Won.",
    route: "clients",
  },
  {
    term: "Reply by email or text",
    detail: "Answer from the client’s card and keep the message in their history.",
    route: "clients",
  },
  {
    term: "Online booking",
    detail: "Customers pick an open time from your hours and your services.",
    route: "office/booking",
  },
  {
    term: "Estimates and invoices",
    detail: "Write the price before the job and the bill after it.",
    route: "estimates",
  },
  {
    term: "Google review requests",
    detail: "Send your review link by text, email or QR code.",
    route: "reviews",
  },
  {
    term: "Instagram post calendar",
    detail: "AI drafts posts from your website. Nothing goes out until you approve it.",
    route: "social",
  },
];

// ---------- Preço ----------

export const PRICING_TITLE = "Free to start. Pay when you build.";
export const PRICING_INTRO =
  "Describe your business and answer a few quick questions for free. You pick a plan when you want your website built.";

export type PlanCard = {
  id: string;
  name: string;
  /** Destaque neutro só no Starter. */
  note: string | null;
  monthly: string;
  annual: string;
  annualPerMonth: string;
  setupMonthly: string | null;
  /** Preço normal riscado (só com oferta valendo e normal > mensal). */
  regular: { monthly: string; annual: string; percentOff: number } | null;
  limits: string[];
};

const plural = (count: number, one: string, many: string) =>
  `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;

/** Os 3 planos com os 4 limites reais de cada um. */
export function planCards(promo: boolean): PlanCard[] {
  return Object.values(PLANS).map((plan) => {
    const percentOff = promoPercentOff(plan);
    return {
      id: plan.id,
      name: plan.name,
      note: plan.id === "starter" ? "A good place to start" : null,
      monthly: dollars(plan.monthlyCents),
      annual: dollars(plan.annualCents),
      annualPerMonth: dollars(Math.round(plan.annualCents / 12)),
      setupMonthly: plan.setupCents === null ? null : dollars(plan.setupCents),
      regular:
        promo && plan.regularMonthlyCents > plan.monthlyCents
          ? {
              monthly: dollars(plan.regularMonthlyCents),
              annual: dollars(plan.regularMonthlyCents * 10),
              percentOff,
            }
          : null,
      limits: [
        plan.publishedSitesLimit === 1
          ? "1 live website"
          : `Up to ${plan.publishedSitesLimit} live websites`,
        `${plural(MONTHLY_CREDITS[plan.id], "AI credit", "AI credits")} a month`,
        `${plural(plan.socialPostsPerMonth, "Instagram post", "Instagram posts")} a month`,
        plan.customDomain ? "Your own domain or a free address" : "A free nosweatfd.com address",
      ],
    };
  });
}

/** "2 months free" só se o anual for exatamente 10× o mensal em todos os planos. */
export function yearlyNote(): string | null {
  return Object.values(PLANS).every((plan) => plan.annualCents === plan.monthlyCents * 10)
    ? "2 months free"
    : null;
}

// ---------- Dúvidas ----------

export const FAQ_TITLE = "Questions, answered.";

const FAQ_QUESTIONS = [
  "How does it work?",
  "Do I need technical experience?",
  "What happens after I publish?",
  "How much does it cost?",
  "Can I cancel?",
  "Can I use my own domain?",
];

/** As 6 perguntas mostradas (as mesmas do JSON-LD), com o texto de faqs.ts. */
export function landingFaqs(): Faq[] {
  return FAQ_QUESTIONS.map((question) => {
    const faq = LANDING_FAQS.find((item) => item.question === question);
    if (!faq) throw new Error(`FAQ "${question}" not found in faqs.ts`);
    return faq;
  });
}

// ---------- Fim ----------

export const CLOSING_TITLE = "Get back to work. We’ll build the website.";

export const FOOTER_NOTE = "Example businesses on this site are made up.";
