import {
  expenseDatesInOrder,
  type CompanyExpense,
  type CreateCompanyExpenseRequest,
  type PlanId,
  type UpdateCompanyExpenseRequest,
} from "@nosweat/schema";
import { dateKeyIn, parseDollars } from "@/lib/clients";
import { FINANCE_TIME_ZONE } from "@/lib/finance";
import { isActiveStatus } from "../billing";
import { isGrantActive, type AccessGrant } from "../billing/grants";
import { PLANS } from "../billing/plans";
import type { SubscriptionRecord } from "../billing/store";
import { getExpenseStore, type ExpensePatch } from "./finance-store";

// Finanças da No Sweat para o painel do admin (/admin/finance): custos da empresa, receita dos
// planos ativos e quantos clientes pagantes faltam para empatar (break-even).
// Quase tudo aqui é conta pura (testada em finance.test.ts); a leitura do banco para a página
// fica em finance-data.ts. Dinheiro sempre em centavos inteiros.
//
// O modelo (linear, de propósito simples):
//   custo do mês   = custos fixos + clientes × custo variável por cliente
//   receita do mês = clientes × ARPU (receita média por cliente)
//   empate         = ⌈ custos fixos / (ARPU − custo variável) ⌉ clientes
// Custo fixo = mensais + anuais/12 que valem no dia; os únicos ficam fora (aparecem como "gasto
// até agora"). Custo variável = taxa do Stripe sobre o ARPU + IA estimada por cliente.

// ---------- custos ----------

/** "Hoje" das finanças ("AAAA-MM-DD", fuso da empresa). */
export function financeToday(now: Date = new Date()): string {
  return dateKeyIn(FINANCE_TIME_ZONE, now);
}

/** O custo vale neste dia? (começou e não acabou; datas "AAAA-MM-DD" comparam como texto). */
export function isExpenseActiveOn(
  expense: Pick<CompanyExpense, "startsOn" | "endsOn">,
  onDate: string,
): boolean {
  return expense.startsOn <= onDate && (expense.endsOn === null || expense.endsOn >= onDate);
}

type CostLine = Pick<CompanyExpense, "amountCents" | "frequency" | "startsOn" | "endsOn">;

/**
 * Custo fixo por mês no dia `onDate`: mensais + anuais / 12 que valem nesse dia. Únicos ficam de
 * fora. Os anuais são somados antes de dividir (um arredondamento só).
 */
export function monthlyFixedCents(expenses: readonly CostLine[], onDate: string): number {
  let monthly = 0;
  let yearly = 0;
  for (const expense of expenses) {
    if (!isExpenseActiveOn(expense, onDate)) continue;
    if (expense.frequency === "monthly") monthly += expense.amountCents;
    else if (expense.frequency === "yearly") yearly += expense.amountCents;
  }
  return monthly + Math.round(yearly / 12);
}

/** Custos únicos já pagos até `onDate` (inclusive). */
export function oneTimeSpentCents(expenses: readonly CostLine[], onDate: string): number {
  return expenses
    .filter((expense) => expense.frequency === "one_time" && expense.startsOn <= onDate)
    .reduce((sum, expense) => sum + expense.amountCents, 0);
}

export type ExpenseStatus = "active" | "upcoming" | "ended";

/** Situação do custo no dia: valendo, ainda vai começar ou já acabou (único pago = "active"). */
export function expenseStatus(
  expense: Pick<CompanyExpense, "frequency" | "startsOn" | "endsOn">,
  onDate: string,
): ExpenseStatus {
  if (expense.startsOn > onDate) return "upcoming";
  if (expense.frequency !== "one_time" && expense.endsOn !== null && expense.endsOn < onDate) {
    return "ended";
  }
  return "active";
}

// ---------- receita ----------

export type PayingAccount = {
  userId: string;
  plan: PlanId;
  source: "stripe" | "manual";
  /** Quanto a conta paga por mês (anual = preço / 12). */
  monthlyCents: number;
};

export type RevenueModel = {
  accounts: PayingAccount[];
  /** Receita recorrente por mês (MRR). */
  mrrCents: number;
  stripe: { count: number; mrrCents: number };
  manual: { count: number; mrrCents: number };
};

/**
 * Contas pagantes e MRR a partir dos dados reais: assinaturas do Stripe ativas (mesmo critério do
 * /admin: active, trialing, past_due) + acessos manuais valendo, com os preços de
 * server/billing/plans.ts. A conta com os dois conta uma vez (vale o Stripe). Plano anual entra
 * como preço / 12; acesso manual, pelo preço mensal do plano. `excluded` tira admins e contas de
 * teste (elas também têm plano, mas não pagam).
 */
export function revenueModel(
  subscriptions: readonly SubscriptionRecord[],
  grants: readonly AccessGrant[],
  excluded: ReadonlySet<string>,
  now: Date = new Date(),
): RevenueModel {
  const byUser = new Map<string, PayingAccount>();
  for (const sub of subscriptions) {
    if (!sub.plan || !isActiveStatus(sub.status) || excluded.has(sub.userId)) continue;
    const plan = PLANS[sub.plan];
    const monthlyCents =
      sub.interval === "annual" ? Math.round(plan.annualCents / 12) : plan.monthlyCents;
    byUser.set(sub.userId, { userId: sub.userId, plan: sub.plan, source: "stripe", monthlyCents });
  }
  for (const grant of grants) {
    if (byUser.has(grant.userId) || excluded.has(grant.userId)) continue;
    if (!isGrantActive(grant, now)) continue;
    byUser.set(grant.userId, {
      userId: grant.userId,
      plan: grant.plan,
      source: "manual",
      monthlyCents: PLANS[grant.plan].monthlyCents,
    });
  }
  const accounts = [...byUser.values()];
  const total = (source: PayingAccount["source"]) => {
    const list = accounts.filter((account) => account.source === source);
    return {
      count: list.length,
      mrrCents: list.reduce((sum, account) => sum + account.monthlyCents, 0),
    };
  };
  const stripe = total("stripe");
  const manual = total("manual");
  return { accounts, mrrCents: stripe.mrrCents + manual.mrrCents, stripe, manual };
}

// ---------- custo variável e premissas ----------

/** Taxa do Stripe para cartão dos EUA: 2,9% + US$ 0,30 por cobrança. */
export const STRIPE_FEE_BPS = 290;
export const STRIPE_FEE_FIXED_CENTS = 30;

/**
 * Custo de IA por cliente pagante por mês quando ainda não há clientes para medir (estimativa:
 * um plano do mês para o Instagram, legendas e algumas mudanças no site, com os preços de
 * server/admin/costs.ts). ATUALIZAR quando houver uso real.
 */
export const DEFAULT_AI_COST_PER_CLIENT_CENTS = 50;

/** Teto do eixo de clientes do gráfico (e da projeção). */
export const MAX_PROJECTION_CLIENTS = 1000;

/** Taxa do Stripe sobre uma cobrança (nada cobrado = nada de taxa). */
export function stripeFeeCents(chargeCents: number): number {
  if (chargeCents <= 0) return 0;
  return Math.round((chargeCents * STRIPE_FEE_BPS) / 10_000) + STRIPE_FEE_FIXED_CENTS;
}

/** Valor em dólares vindo do endereço (?arpu=69 ou ?var=4.5) → centavos; vazio/inválido = `null`. */
export function parseMoneyParam(value: string | null | undefined): number | null {
  if (!value) return null;
  return parseDollars(value) ?? null;
}

/** Custo de IA medido: média dos últimos 30 dias por conta pagante (de uma amostra de contas). */
export type AiCostPerClient = { cents: number; sample: number };

export type FinanceAssumptions = {
  /** Receita média por cliente por mês (ARPU). */
  arpuCents: number;
  /** custom = do endereço; actual = MRR / clientes pagantes; pro_price = preço do Pro (sem clientes). */
  arpuSource: "custom" | "actual" | "pro_price";
  /** Taxa do Stripe sobre o ARPU. */
  stripeFeeCents: number;
  /** IA por cliente por mês. */
  aiCostCents: number;
  aiSource: "actual" | "default";
  /** Contas medidas para o custo de IA (0 = estimativa padrão). */
  aiSample: number;
  /** Custo variável por cliente por mês (o que entra na conta). */
  variableCents: number;
  /** custom = do endereço; computed = taxa do Stripe + IA. */
  variableSource: "custom" | "computed";
};

/**
 * Premissas do modelo. O admin pode trocar o ARPU (`?arpu=`) e o custo variável (`?var=`) pelo
 * endereço; sem isso: ARPU real (MRR / clientes) ou, sem clientes, o preço mensal do Pro; custo
 * variável = taxa do Stripe sobre o ARPU + IA por cliente (medida, ou a estimativa padrão).
 */
export function resolveAssumptions(input: {
  arpu: string | null | undefined;
  variable: string | null | undefined;
  revenue: Pick<RevenueModel, "mrrCents" | "accounts">;
  aiPerClient: AiCostPerClient | null;
}): FinanceAssumptions {
  const { revenue, aiPerClient } = input;
  const paying = revenue.accounts.length;
  const customArpu = parseMoneyParam(input.arpu);
  const actualArpu = paying > 0 ? Math.round(revenue.mrrCents / paying) : 0;
  const arpuCents = customArpu ?? (actualArpu > 0 ? actualArpu : PLANS.pro.monthlyCents);
  const arpuSource = customArpu !== null ? "custom" : actualArpu > 0 ? "actual" : "pro_price";

  const fee = stripeFeeCents(arpuCents);
  const ai = aiPerClient && aiPerClient.sample > 0 ? aiPerClient : null;
  const aiCostCents = ai ? ai.cents : DEFAULT_AI_COST_PER_CLIENT_CENTS;
  const customVariable = parseMoneyParam(input.variable);

  return {
    arpuCents,
    arpuSource,
    stripeFeeCents: fee,
    aiCostCents,
    aiSource: ai ? "actual" : "default",
    aiSample: ai ? ai.sample : 0,
    variableCents: customVariable ?? fee + aiCostCents,
    variableSource: customVariable !== null ? "custom" : "computed",
  };
}

// ---------- empate e projeção ----------

/**
 * Clientes pagantes para empatar: ⌈ fixo / (ARPU − variável) ⌉. Sem custo fixo, 0. `null` quando
 * cada cliente custa mais do que paga, ou tanto quanto paga com custo fixo a cobrir (nunca empata).
 */
export function breakEvenClients(
  fixedCents: number,
  arpuCents: number,
  variableCents: number,
): number | null {
  const margin = arpuCents - variableCents;
  if (margin < 0) return null;
  if (fixedCents <= 0) return 0;
  if (margin === 0) return null;
  return Math.ceil(fixedCents / margin);
}

/** Passo "redondo" (1, 2 ou 5 × 10ⁿ) perto de `raw`. */
export function niceStep(raw: number): number {
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
}

/** Marcas do eixo de 0 até um topo redondo que cobre `max` (cerca de `target` intervalos). */
export function axisTicks(max: number, target = 4, minStep = 0): number[] {
  const step = Math.max(minStep, niceStep(max / target));
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 1000; value += step) ticks.push(value);
  return ticks;
}

/**
 * Até onde a projeção vai: max(2 × empate, clientes atuais + 10, 20), arredondado para cima até
 * uma marca redonda do eixo (e no máximo MAX_PROJECTION_CLIENTS).
 */
export function projectionMaxClients(breakEven: number | null, current: number): number {
  const raw = Math.max(breakEven === null ? 0 : 2 * breakEven, current + 10, 20);
  const ticks = axisTicks(raw, 5, 1);
  return Math.min(MAX_PROJECTION_CLIENTS, ticks[ticks.length - 1] ?? raw);
}

export type ProjectionPoint = {
  clients: number;
  revenueCents: number;
  costCents: number;
  profitCents: number;
};

/** Receita, custo e lucro por mês para 0..`maxClients` clientes (um ponto por cliente). */
export function projectionSeries(
  fixedCents: number,
  arpuCents: number,
  variableCents: number,
  maxClients: number,
): ProjectionPoint[] {
  const last = Math.max(0, Math.min(MAX_PROJECTION_CLIENTS, Math.floor(maxClients)));
  return Array.from({ length: last + 1 }, (_, clients) => {
    const revenueCents = clients * arpuCents;
    const costCents = fixedCents + clients * variableCents;
    return { clients, revenueCents, costCents, profitCents: revenueCents - costCents };
  });
}

// ---------- resumo da página ----------

export type FinanceSummary = {
  today: string;
  fixedMonthlyCents: number;
  oneTimeSpentCents: number;
  /** Custos mensais/anuais valendo hoje. */
  activeRecurring: number;
  payingClients: number;
  mrrCents: number;
  assumptions: FinanceAssumptions;
  /** Lucro (ou prejuízo, negativo) do mês hoje: MRR − fixo − clientes × variável. */
  profitCents: number;
  /** ARPU − variável: quanto cada cliente novo paga dos custos fixos. */
  marginCents: number;
  breakEven: number | null;
  /** Clientes que faltam (0 = já empatou; `null` = nunca empata). */
  toGo: number | null;
  maxClients: number;
  projection: ProjectionPoint[];
};

/** Junta tudo o que a página mostra (conta pura: as leituras vêm de finance-data.ts). */
export function summarizeFinance(input: {
  expenses: readonly CompanyExpense[];
  today: string;
  revenue: RevenueModel;
  aiPerClient: AiCostPerClient | null;
  params: { arpu?: string | null; variable?: string | null };
}): FinanceSummary {
  const { expenses, today, revenue } = input;
  const fixed = monthlyFixedCents(expenses, today);
  const assumptions = resolveAssumptions({
    arpu: input.params.arpu,
    variable: input.params.variable,
    revenue,
    aiPerClient: input.aiPerClient,
  });
  const paying = revenue.accounts.length;
  const breakEven = breakEvenClients(fixed, assumptions.arpuCents, assumptions.variableCents);
  const maxClients = projectionMaxClients(breakEven, paying);
  return {
    today,
    fixedMonthlyCents: fixed,
    oneTimeSpentCents: oneTimeSpentCents(expenses, today),
    activeRecurring: expenses.filter(
      (expense) => expense.frequency !== "one_time" && isExpenseActiveOn(expense, today),
    ).length,
    payingClients: paying,
    mrrCents: revenue.mrrCents,
    assumptions,
    profitCents: revenue.mrrCents - fixed - paying * assumptions.variableCents,
    marginCents: assumptions.arpuCents - assumptions.variableCents,
    breakEven,
    toGo: breakEven === null ? null : Math.max(0, breakEven - paying),
    maxClients,
    projection: projectionSeries(
      fixed,
      assumptions.arpuCents,
      assumptions.variableCents,
      maxClients,
    ),
  };
}

// ---------- custos: ler e gravar ----------

/** Pedido válido no formato, mas que não fecha com o que já estava salvo (ex.: datas). */
export class ExpenseInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpenseInputError";
  }
}

const END_BEFORE_START = "The end date can't be before the start date.";

export function listExpenses(): Promise<CompanyExpense[]> {
  return getExpenseStore().list();
}

/** Cria o custo. Sem data de começo, vale de hoje; custo único não tem data de fim. */
export async function createExpense(
  input: CreateCompanyExpenseRequest,
  today: string = financeToday(),
): Promise<CompanyExpense> {
  const startsOn = input.startsOn ?? today;
  const endsOn = input.frequency === "one_time" ? null : (input.endsOn ?? null);
  if (!expenseDatesInOrder(startsOn, endsOn)) throw new ExpenseInputError(END_BEFORE_START);
  return getExpenseStore().insert({
    name: input.name,
    category: input.category,
    amountCents: input.amountCents,
    frequency: input.frequency,
    startsOn,
    endsOn,
    notes: input.notes ?? "",
  });
}

/** Muda só os campos enviados. `null` se o custo não existir. */
export async function updateExpense(
  id: string,
  input: UpdateCompanyExpenseRequest,
): Promise<CompanyExpense | null> {
  const store = getExpenseStore();
  const current = await store.get(id);
  if (!current) return null;
  const frequency = input.frequency ?? current.frequency;
  const startsOn = input.startsOn ?? current.startsOn;
  // Virou (ou é) único: a data de fim some.
  const endsOn =
    frequency === "one_time" ? null : input.endsOn !== undefined ? input.endsOn : current.endsOn;
  if (!expenseDatesInOrder(startsOn, endsOn)) throw new ExpenseInputError(END_BEFORE_START);
  const patch: ExpensePatch = { ...input, endsOn };
  return store.update(id, patch);
}

/** Apaga o custo. `false` se não existir. */
export function deleteExpense(id: string): Promise<boolean> {
  return getExpenseStore().remove(id);
}
