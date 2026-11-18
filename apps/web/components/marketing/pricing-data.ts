import type { PlanId } from "@nosweat/schema";
import { PLANS } from "@/server/billing/plans";
import {
  CREDIT_ACTION_LABELS,
  CREDIT_ACTIONS,
  TOPUP_PACKS,
  creditCost,
  monthlyAllowance,
} from "@/server/credits/pricing";

// Números de preço e de créditos que as páginas de marketing mostram, lidos das fontes únicas
// (server/billing/plans.ts e server/credits/pricing.ts). Server-side: a cota mensal pode ser
// ajustada pelas variáveis CREDITS_MONTHLY_* (monthlyAllowance), como no /billing.
// Nada de número escrito à mão em PricingPlans.tsx ou no FAQ.

/** "$39", "$32.50", "$1,290". */
export function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export type PlanPrice = {
  monthly: string;
  annual: string;
  /** Equivalente mensal do anual (anual ÷ 12). */
  annualPerMonth: string;
  /** Taxa única no mensal; `null` = não tem. */
  setupMonthly: string | null;
  publishedSitesLimit: number;
};

/** Preço de cada plano, formatado (de server/billing/plans.ts). */
export function planPrices(): Record<PlanId, PlanPrice> {
  const price = (id: PlanId): PlanPrice => {
    const plan = PLANS[id];
    return {
      monthly: usd(plan.monthlyCents),
      annual: usd(plan.annualCents),
      annualPerMonth: usd(Math.round(plan.annualCents / 12)),
      setupMonthly: plan.setupCents ? usd(plan.setupCents) : null,
      publishedSitesLimit: plan.publishedSitesLimit,
    };
  };
  return { starter: price("starter"), pro: price("pro"), premium: price("premium") };
}

export type PricingCredits = {
  /** Créditos da IA por mês de cada plano. */
  monthly: Record<PlanId, number>;
  /** O que cada ação da IA custa, na ordem da tabela do /billing. */
  costs: { label: string; credits: number }[];
  /** Pacotes avulsos (não vencem). */
  packs: { credits: number; price: string }[];
};

/** Créditos por plano e preço de cada ação (de server/credits/pricing.ts). */
export function pricingCredits(): PricingCredits {
  return {
    monthly: {
      starter: monthlyAllowance("starter"),
      pro: monthlyAllowance("pro"),
      premium: monthlyAllowance("premium"),
    },
    costs: CREDIT_ACTIONS.map((action) => ({
      label: CREDIT_ACTION_LABELS[action],
      credits: creditCost(action),
    })),
    packs: TOPUP_PACKS.map((pack) => ({ credits: pack.credits, price: usd(pack.priceCents) })),
  };
}
