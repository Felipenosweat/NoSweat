import type { BillingInterval, PlanId } from "@nosweat/schema";

// Preços cobrados de verdade (em centavos de dólar). Precisam bater com a tabela mostrada no site
// (components/marketing/PricingPlans.tsx). Anual = 10× o mensal; a taxa de implantação só existe
// nos planos mensais Starter e Pro.

export type Plan = {
  id: PlanId;
  name: string;
  monthlyCents: number;
  annualCents: number;
  /** Taxa única, cobrada na primeira fatura do plano MENSAL. `null` = não tem. */
  setupCents: number | null;
  /** Pode ligar domínio próprio. */
  customDomain: boolean;
};

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyCents: 3900,
    annualCents: 39000,
    setupCents: 24900,
    customDomain: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyCents: 6900,
    annualCents: 69000,
    setupCents: 24900,
    customDomain: true,
  },
  premium: {
    id: "premium",
    name: "Premium",
    monthlyCents: 12900,
    annualCents: 129000,
    setupCents: null,
    customDomain: true,
  },
};

export function priceCents(plan: Plan, interval: BillingInterval): number {
  return interval === "annual" ? plan.annualCents : plan.monthlyCents;
}

/** Taxa de implantação cobrada nesta compra (só no mensal). */
export function setupCentsFor(plan: Plan, interval: BillingInterval): number | null {
  return interval === "monthly" ? plan.setupCents : null;
}
