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
  /** Preço normal mensal, o que será cobrado quando os preços subirem (ver `OFFERS`). */
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

// Oferta de lançamento: os planos custam menos que o preço normal (`regularMonthlyCents`) até o
// fundador decidir subir os preços (decisão dele, a partir de ~10 clientes ativos). Não há data
// final: a oferta vale enquanto o preço cobrado for menor que o normal, e o nome dela muda sozinho
// pelo calendário abaixo (só o NOME e o texto: nada aqui muda o preço cobrado).
// Honestidade: o preço normal só aparece como referência porque é o que a empresa vai cobrar quando
// subir (regra da FTC e dos estados). Por isso NÃO há relógio nem "acaba em": prazo que se renova
// sem o preço mudar é urgência falsa. Quando o preço subir de verdade, ponha `regularMonthlyCents`
// igual a `monthlyCents` e a oferta some sozinha.
// Para subir os preços: igualar `monthlyCents`/`annualCents` ao normal; quem já assina mantém o
// valor do checkout em que entrou (o Stripe guarda o preço na assinatura).

/** Nomes sazonais, em ordem de data. Cada um vale até `endsOn` (1º dia SEM ele, em UTC). */
export const OFFERS: readonly { name: string; endsOn: string }[] = [
  { name: "Black Friday", endsOn: "2026-11-29" },
  { name: "Cyber Week", endsOn: "2026-12-07" },
  { name: "Holiday Special", endsOn: "2026-12-20" },
  { name: "Christmas Offer", endsOn: "2026-12-27" },
  { name: "New Year’s Offer", endsOn: "2027-01-06" },
];

/** Nome da oferta em `now`; passada a última data do calendário, "Launch price". */
export function currentOffer(now: Date = new Date()): string {
  const found = OFFERS.find((offer) => now.getTime() < Date.parse(`${offer.endsOn}T00:00:00Z`));
  return found ? found.name : "Launch price";
}

/** Há oferta de lançamento valendo? (algum plano custa menos que o preço normal) */
export function promoActive(): boolean {
  return Object.values(PLANS).some((plan) => plan.regularMonthlyCents > plan.monthlyCents);
}

/** Desconto do preço de oferta em relação ao normal, em % inteiro (0 se não há desconto). */
export function promoPercentOff(plan: Plan): number {
  if (plan.regularMonthlyCents <= plan.monthlyCents) return 0;
  return Math.round((1 - plan.monthlyCents / plan.regularMonthlyCents) * 100);
}
