import { MODEL_LIBRARY } from "@nosweat/fixtures";
import { LANDING_FAQS, type Faq } from "@/components/marketing/faqs";
import { PLANS, promoPercentOff } from "@/server/billing/plans";
import { MONTHLY_CREDITS } from "@/server/credits/pricing";

// Texto e dados da landing "After hours". Tudo que é número ou fato vem da fonte certa (preços e
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
  /** Linha pequena acima do título (o "depois de fechar"). */
  kicker: "Your shop closes at six. Your website doesn’t.",
  title: "Tell us about your business. We’ll build the whole website.",
  // E-mail dos pedidos: só com o envio configurado (Resend); marcações: só com o agendamento ligado.
  lead: "Your phone number, services, hours and photos, on a site made for your trade. Requests and bookings it takes overnight are in your inbox by morning.",
  cta: "Start my website",
};

/** Site de exemplo que sobe da foto do topo (negócio inventado, avisado na legenda). */
export const HERO_PROOF_SLUG = "brick-oven-pizza";

// ---------- Exemplos ----------

export const EXAMPLES_TITLE = "Every site is designed for its business.";
export const EXAMPLES_BODY =
  "No Sweat picks the layout, the type and the photos for each trade, so a bakery doesn’t come out looking like an electrician.";

/** Aviso único, logo abaixo do texto de abertura da galeria. */
export const EXAMPLES_NOTE = "All businesses shown are made up.";

/**
 * Os quatro exemplos da galeria, um por composição diferente (spec.design.composition: o teste
 * confere que não se repetem). O site do topo (HERO_PROOF_SLUG) é a quinta composição.
 */
export const EXAMPLE_SLUGS = [
  "sunrise-bakery",
  "north-loop-coffee",
  "greenline-landscaping",
  "fade-and-co-barbers",
] as const;

export type ExampleSite = {
  slug: string;
  name: string;
  trade: string;
  city: string;
  /** Composição do site (spec.design.composition). */
  composition: string;
  /** "<Nome> · <Ramo>" (a cidade vai numa segunda linha). */
  label: string;
};

/** Nome, ramo e cidade de um site de exemplo, lidos das fixtures (negócios inventados). */
export function exampleSite(slug: string): ExampleSite {
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
    composition: entry.spec.design?.composition ?? "service-led",
    label: `${name} · ${trade}`,
  };
}

export function exampleSites(): ExampleSite[] {
  return EXAMPLE_SLUGS.map(exampleSite);
}

/** Legenda do site que sobe da foto do topo: "<Nome>, <ramo> in <cidade>. An example site; ..." */
export function heroProof(): ExampleSite & { caption: string } {
  const site = exampleSite(HERO_PROOF_SLUG);
  const trade = site.trade.charAt(0).toLowerCase() + site.trade.slice(1);
  return {
    ...site,
    caption: `${site.name}, ${trade} in ${site.city}. An example site; the business is made up.`,
  };
}

// ---------- Depois de fechar ----------

export const OVERNIGHT_TITLE = "While you’re closed, it keeps taking requests.";
// Verdade no produto: o formulário vira cliente em /clients (syncLeadsToClients) e cada pedido
// manda e-mail ao dono (server/notify/lead-email.ts); a marcação online cria cliente + job e
// manda e-mail ao dono (server/notify/booking-email.ts), quando o agendamento está ligado.
export const OVERNIGHT_BODY =
  "Every form and online booking from your site lands in one client list, and you get an email for each one.";

export type OvernightRequest = {
  kind: "Request" | "Booking";
  name: string;
  job: string;
  /** Hora em que chegou (inventada, é um exemplo). */
  time: string;
};

/** "A lista da madrugada": três pedidos de exemplo, de ramos diferentes, ao longo da noite. */
export const OVERNIGHT_REQUESTS: OvernightRequest[] = [
  { kind: "Booking", name: "Dana", job: "Fade and beard trim, Saturday", time: "9:42 PM" },
  { kind: "Request", name: "Luis", job: "Leaking water heater", time: "11:18 PM" },
  { kind: "Request", name: "Priya", job: "Birthday cake for 20", time: "6:05 AM" },
];

/** Legenda de cada cartão: os nomes e os pedidos são inventados. */
export const REQUEST_CAPTION = "Example";

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

// ---------- Escritório ----------

export const OFFICE_TITLE = "In the morning, it’s all on one screen.";
export const OFFICE_BODY =
  "Each request becomes a row in your client list, with the name, phone and email. Reply, set a follow-up and mark the job won from the same screen, on your phone or at your desk.";
export const OFFICE_CAPTION = "Real No Sweat screen. The customers are made up.";

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

export const CLOSING_TITLE = "Get some sleep. We’ll build the website.";

export const FOOTER_NOTE = "Example businesses on this site are made up.";
