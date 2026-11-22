import type { PlanId } from "@nosweat/schema";
import { LANDING_FAQS, type Faq } from "@/components/marketing/faqs";
import { PLANS, promoPercentOff } from "@/server/billing/plans";
import { CREDIT_COSTS, MONTHLY_CREDITS } from "@/server/credits/pricing";

// Dados da landing "Live" (versão D). Todo número e toda afirmação da página sai daqui, e daqui
// sai das fontes de verdade: preços de server/billing/plans.ts, créditos de
// server/credits/pricing.ts, perguntas de components/marketing/faqs.ts. O teste content.test.ts
// amarra cada valor à fonte. Nada de número escrito à mão nos componentes.

/** Centavos → "$19", "$1,290" ou "$15.83" (centavos só quando existem). */
export function dollars(cents: number): string {
  const rounded = Math.round(cents);
  const whole = rounded % 100 === 0;
  return `$${(rounded / 100).toLocaleString("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`;
}

// ---------- Herói: o site de exemplo ao vivo ----------

export type Trade = {
  /** Texto da aba. */
  label: string;
  /** Pasta em app/demos/<slug> (o teste confere que existe). */
  slug: string;
  /** Nome da empresa fictícia (para o `title` do iframe). */
  business: string;
};

// Ordem da fila de abas. Cada uma é uma demonstração feita à mão em app/demos.
export const TRADES: readonly [Trade, ...Trade[]] = [
  { label: "Barber", slug: "fade-and-co-barbers", business: "Fade & Co. Barbers" },
  { label: "Electrician", slug: "bright-spark-electric", business: "Bright Spark Electric" },
  { label: "Bakery", slug: "sunrise-bakery", business: "Sunrise Bakery" },
  { label: "Law office", slug: "mercer-law", business: "Mercer Law" },
  { label: "Landscaper", slug: "greenline-landscaping", business: "Greenline Landscaping" },
  { label: "BBQ", slug: "smoke-and-rail-bbq", business: "Smoke & Rail BBQ" },
];

export const demoHref = (slug: string) => `/demos/${slug}`;

// ---------- Preços ----------

export const PLAN_ORDER: readonly [PlanId, ...PlanId[]] = ["starter", "pro", "premium"];

/** Menor preço mensal entre os planos ("Plans from $19/mo"). */
export const LOWEST_MONTHLY = dollars(Math.min(...PLAN_ORDER.map((id) => PLANS[id].monthlyCents)));

/** Meses grátis no anual (anual = 10× o mensal → 2). Calculado, não escrito. */
export const FREE_MONTHS = 12 - PLANS.starter.annualCents / PLANS.starter.monthlyCents;

export type PlanColumn = {
  id: PlanId;
  name: string;
  monthly: string;
  annual: string;
  /** Anual ÷ 12. */
  annualPerMonth: string;
  /** Preço normal (riscado na oferta); `null` quando o plano não tem desconto. */
  regularMonthly: string | null;
  regularAnnual: string | null;
  percentOff: number;
  /** Taxa de implantação mensal (hoje nenhuma), no formato que `renewalTerms` espera. */
  setupMonthly: string | null;
};

export function planColumns(): [PlanColumn, ...PlanColumn[]] {
  const [first, ...rest] = PLAN_ORDER;
  return [toColumn(first), ...rest.map(toColumn)];
}

function toColumn(id: PlanId): PlanColumn {
  {
    const plan = PLANS[id];
    const discounted = plan.regularMonthlyCents > plan.monthlyCents;
    return {
      id,
      name: plan.name,
      monthly: dollars(plan.monthlyCents),
      annual: dollars(plan.annualCents),
      annualPerMonth: dollars(plan.annualCents / 12),
      regularMonthly: discounted ? dollars(plan.regularMonthlyCents) : null,
      regularAnnual: discounted ? dollars(plan.regularMonthlyCents * 10) : null,
      percentOff: promoPercentOff(plan),
      setupMonthly: plan.setupCents === null ? null : dollars(plan.setupCents),
    };
  }
}

export type LimitRow = {
  label: string;
  /** Uma linha curta embaixo do nome (opcional). */
  note?: string;
  values: Record<PlanId, string>;
};

const byPlan = (pick: (id: PlanId) => string) =>
  Object.fromEntries(PLAN_ORDER.map((id) => [id, pick(id)])) as Record<PlanId, string>;

/** Linhas da tabela de preços (os limites de cada plano). */
export function limitRows(): LimitRow[] {
  return [
    {
      label: "Live websites",
      note: "Drafts are unlimited.",
      values: byPlan((id) => PLANS[id].publishedSitesLimit.toLocaleString("en-US")),
    },
    {
      label: "AI credits every month",
      note: `A new website uses ${CREDIT_COSTS.generate}. An AI change uses ${CREDIT_COSTS.ai_edit}. Editing by hand is free.`,
      values: byPlan((id) => MONTHLY_CREDITS[id].toLocaleString("en-US")),
    },
    {
      label: "Instagram posts a month",
      note: "You approve each one.",
      values: byPlan((id) => PLANS[id].socialPostsPerMonth.toLocaleString("en-US")),
    },
    {
      label: "Your own domain",
      values: byPlan((id) => (PLANS[id].customDomain ? "Yes" : "No")),
    },
    {
      label: "Office tools",
      note: "Requests, schedule, booking, estimates, invoices, reviews.",
      // plans.ts: o sistema de gestão continua inteiro em todo plano.
      values: byPlan(() => "All included"),
    },
  ];
}

// ---------- Escritório (capturas reais em public/landing/real) ----------

export type OfficeTab = {
  id: string;
  label: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  text: string;
};

// Só ferramentas com captura de verdade. site-2.webp mostra um site publicado (Mercer Law), não
// o editor nem a agenda, então não vira aba aqui: o site já está ao vivo no herói.
export const OFFICE_TABS: readonly [OfficeTab, ...OfficeTab[]] = [
  {
    id: "requests",
    label: "Requests",
    src: "/landing/real/clients-2.webp",
    width: 2400,
    height: 1500,
    alt: "The Clients screen in No Sweat: five new requests, each with a name, phone, email and a Reply button.",
    text: "Each form request from your site becomes a client you can call, text or reply to, then move from New to Won.",
  },
  {
    id: "instagram",
    label: "Instagram",
    src: "/landing/real/social-2.webp",
    width: 2400,
    height: 1500,
    alt: "The Social screen in No Sweat: a connected Instagram account, a posting plan and a month calendar.",
    text: "AI drafts a month of posts from your website. Nothing goes out until you approve it.",
  },
];

/** Outras ferramentas do escritório que existem hoje (rotas em app/(dashboard) e CLAUDE.md). */
export const OFFICE_EXTRAS: readonly { name: string; text: string; route: string }[] = [
  {
    name: "Online booking",
    text: "Customers pick an open time on your site, and it lands on your schedule.",
    route: "office/booking",
  },
  {
    name: "Estimates and invoices",
    text: "Send an estimate your customer can accept from a link. Invoices go out the same way.",
    route: "estimates",
  },
  {
    name: "Google review requests",
    text: "Ask customers for a Google review by text, email or QR code.",
    route: "reviews",
  },
];

// ---------- Perguntas (6 de components/marketing/faqs.ts) ----------

export const LIVE_FAQ_QUESTIONS = [
  "How does it work?",
  "Do I need technical experience?",
  "What happens after I publish?",
  "Can I use my own domain?",
  "Can it post to Instagram for me?",
  "Can I cancel?",
] as const;

export const LIVE_FAQS: Faq[] = LIVE_FAQ_QUESTIONS.map((question) => {
  const faq = LANDING_FAQS.find((item) => item.question === question);
  if (!faq) throw new Error(`FAQ missing from faqs.ts: ${question}`);
  return faq;
});
