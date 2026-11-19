import type { BillingInterval, PlanId } from "@nosweat/schema";

// Preços cobrados de verdade (em centavos de dólar). Precisam bater com a tabela mostrada no site
// (components/marketing/PricingPlans.tsx). Anual = 10× o mensal. Sem taxa de implantação desde
// nov/2026 (decisão do fundador para o lançamento); `setupCents` continua para poder voltar.
// Todo plano pode ligar domínio próprio (o cliente compra o domínio; para nós não custa nada).

export type Plan = {
  id: PlanId;
  name: string;
  monthlyCents: number;
  annualCents: number;
  /** Preço normal mensal, que volta quando a oferta de lançamento acaba (ver `PROMO`). */
  regularMonthlyCents: number;
  /** Taxa única, cobrada na primeira fatura do plano MENSAL. `null` = não tem. */
  setupCents: number | null;
  /** Pode ligar domínio próprio. */
  customDomain: boolean;
  /** Sites publicados (no ar) ao mesmo tempo. Rascunhos não contam e não têm limite. */
  publishedSitesLimit: number;
  /** Posts no Instagram aprovados por mês (calendário de redes sociais). */
  socialPostsPerMonth: number;
  /** Contas de rede social conectadas. */
  socialAccounts: number;
};

// Starter a US$ 19 (decisão do fundador, nov/2026, oferta de Black Friday): 1 site no ar, 60
// créditos de IA por mês (server/credits/pricing.ts) e 4 posts no Instagram por mês; o sistema de
// gestão (clientes, agenda, agendamento, avaliações) continua inteiro. Pro e Premium não mudaram.
// Preço e limites aqui precisam bater com components/marketing/PricingPlans.tsx.

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    publishedSitesLimit: 1,
    name: "Starter",
    monthlyCents: 1900,
    annualCents: 19000,
    regularMonthlyCents: 3900,
    setupCents: null,
    customDomain: true,
    socialPostsPerMonth: 4,
    socialAccounts: 1,
  },
  pro: {
    id: "pro",
    publishedSitesLimit: 5,
    name: "Pro",
    monthlyCents: 6900,
    annualCents: 69000,
    regularMonthlyCents: 14900,
    setupCents: null,
    customDomain: true,
    socialPostsPerMonth: 30,
    socialAccounts: 1,
  },
  premium: {
    id: "premium",
    publishedSitesLimit: 10,
    name: "Premium",
    monthlyCents: 12900,
    annualCents: 129000,
    regularMonthlyCents: 29900,
    setupCents: null,
    customDomain: true,
    socialPostsPerMonth: 60,
    socialAccounts: 1,
  },
};

export function priceCents(plan: Plan, interval: BillingInterval): number {
  return interval === "annual" ? plan.annualCents : plan.monthlyCents;
}

/** Taxa de implantação cobrada nesta compra (só no mensal). */
export function setupCentsFor(plan: Plan, interval: BillingInterval): number | null {
  return interval === "monthly" ? plan.setupCents : null;
}

// Oferta de lançamento (Black Friday): os planos custam menos que o preço normal até `endsOn`.
// O preço normal só pode aparecer riscado enquanto a oferta vale E se a empresa for mesmo cobrar
// esse valor depois (regra de preço de referência da FTC e dos estados): por isso a data é
// decisão do fundador, e passada a data a tela deixa de mostrar o risco. O que é COBRADO vem de
// `monthlyCents`/`annualCents`, não daqui. Anual = 10× o mensal normal, como no preço de oferta.
export const PROMO = { endsOn: "2026-12-01", lastDayLabel: "Nov 30" } as const;

/** A oferta ainda vale em `now`? (`endsOn` é o primeiro dia SEM oferta, em UTC.) */
export function promoActive(now: Date = new Date()): boolean {
  return now.getTime() < Date.parse(`${PROMO.endsOn}T00:00:00Z`);
}

/** Desconto do preço de oferta em relação ao normal, em % inteiro. */
export function promoPercentOff(plan: Plan): number {
  return Math.round((1 - plan.monthlyCents / plan.regularMonthlyCents) * 100);
}
