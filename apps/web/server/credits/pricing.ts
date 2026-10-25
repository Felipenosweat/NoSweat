import type { PlanId } from "@nosweat/schema";
import type { AiUsageKind } from "../store/types";

// Créditos: a moeda da No Sweat para o uso da IA. Cada ação da IA custa créditos; editar o site
// à mão é grátis. Todos os números abaixo são PROVISÓRIOS (o fundador ainda vai decidir): mudar
// só aqui. Referência de custo real por uso: server/admin/costs.ts.
//
// - Cota mensal do plano: zera no começo de cada mês (UTC). O que sobrou NÃO passa para o mês
//   seguinte (decisão do fundador).
// - Créditos comprados (top-up): saldo separado, não vencem e só são usados depois da cota do mês.
// - Admins: sem limite. Visitantes (sem conta) não usam créditos: continuam com os limites
//   GUEST_* por cookie/IP/global (server/quota.ts).

/** Ações da IA que custam créditos. `regenerate_section` ainda não existe na API (TODO). */
export type CreditAction = AiUsageKind | "regenerate_section";

export const CREDIT_COSTS: Record<CreditAction, number> = {
  generate: 5,
  ai_edit: 2,
  regenerate_section: 1,
  social_plan: 5,
  social_caption: 1,
};

/** Nome de cada ação para as telas (inglês: interface). */
export const CREDIT_ACTION_LABELS: Record<CreditAction, string> = {
  generate: "New website",
  ai_edit: "AI change to your website",
  regenerate_section: "Rewrite one section with AI",
  social_plan: "AI month plan for Instagram",
  social_caption: "AI caption",
};

/** Ordem das ações na tabela de preços de /billing. */
export const CREDIT_ACTIONS: CreditAction[] = [
  "generate",
  "ai_edit",
  "social_plan",
  "social_caption",
];

/** Créditos por mês de cada plano, e de quem não tem plano (para experimentar). */
export const MONTHLY_CREDITS: Record<PlanId | "none", number> = {
  none: 30,
  starter: 150,
  pro: 400,
  premium: 1000,
};

/**
 * Pacotes de créditos avulsos (não vencem). Por enquanto a compra é manual (WhatsApp/e-mail) e o
 * admin lança com `adminAdjustCredits`.
 * TODO(Stripe): checkout avulso (mode "payment") que, no webhook, chama `addTopupCredits`.
 */
export const TOPUP_PACKS: { credits: number; priceCents: number }[] = [
  { credits: 100, priceCents: 500 },
  { credits: 300, priceCents: 1200 },
];

const ENV: Record<PlanId | "none", string> = {
  none: "CREDITS_MONTHLY_NO_PLAN",
  starter: "CREDITS_MONTHLY_STARTER",
  pro: "CREDITS_MONTHLY_PRO",
  premium: "CREDITS_MONTHLY_PREMIUM",
};

/** Custo em créditos de uma ação. */
export function creditCost(action: CreditAction): number {
  return CREDIT_COSTS[action];
}

/**
 * Cota mensal do plano (`null` = sem plano). As variáveis CREDITS_MONTHLY_* são opcionais e só
 * servem para testes/ajuste rápido; o valor de verdade é a constante acima.
 */
export function monthlyAllowance(plan: PlanId | null): number {
  const key = plan ?? "none";
  const raw = process.env[ENV[key]];
  const value = Number(raw);
  return raw !== undefined && raw !== "" && Number.isInteger(value) && value >= 0
    ? value
    : MONTHLY_CREDITS[key];
}

/** Início do mês atual (UTC): começo do período da cota mensal. */
export function periodStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Quando a cota mensal volta a encher: começo do mês seguinte (UTC). */
export function periodEnd(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}
