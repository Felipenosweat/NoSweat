import type { CompanyExpense } from "@nosweat/schema";
import { getSiteStore } from "../store";
import { adminCached } from "./cache";
import { estimateAiCostUsd } from "./costs";
import { loadAccountsData } from "./data";
import {
  financeToday,
  listExpenses,
  revenueModel,
  summarizeFinance,
  type AiCostPerClient,
  type FinanceSummary,
  type RevenueModel,
} from "./finance";
import { DAY_MS, orNull, usageSince } from "./metrics";

// Leitura da página /admin/finance: custos (direto do banco, poucos e sempre frescos depois de
// uma mudança), contas e planos (as mesmas leituras com cache do /admin) e o uso da IA das
// contas pagantes. Quem chama já passou por requireAdmin().

/**
 * Contas medidas para o custo de IA por cliente. Cada conta são 4 contagens no banco (uma por
 * tipo de uso): a amostra mantém a página leve mesmo com muitos clientes.
 */
export const AI_SAMPLE_LIMIT = 12;

/**
 * Custo de IA ESTIMADO (preço fixo por uso, costs.ts) por conta pagante nos últimos 30 dias:
 * média de uma amostra de até AI_SAMPLE_LIMIT contas. `null` sem contas ou se a leitura falhar.
 */
async function loadAiCostPerClient(userIds: string[]): Promise<AiCostPerClient | null> {
  if (userIds.length === 0) return null;
  const sample = [...userIds].sort().slice(0, AI_SAMPLE_LIMIT);
  const store = getSiteStore();
  const read = adminCached(`finance-ai-30d:${sample.join(",")}`, async () => {
    const since = new Date(Date.now() - 30 * DAY_MS).toISOString();
    const costs = await Promise.all(
      sample.map(async (userId) =>
        estimateAiCostUsd(
          await usageSince(since, (kind, sinceIso) => store.countAiUsage(userId, kind, sinceIso)),
        ),
      ),
    );
    return costs.reduce((sum, usd) => sum + usd, 0);
  });
  const totalUsd = await orNull("AI usage of paying accounts", read());
  if (totalUsd === null) return null;
  return { cents: Math.round((totalUsd * 100) / sample.length), sample: sample.length };
}

export type FinanceView = {
  expenses: CompanyExpense[];
  summary: FinanceSummary;
  revenue: RevenueModel;
  /** As assinaturas do Stripe não puderam ser lidas: a receita mostra só os acessos manuais. */
  subscriptionsFailed: boolean;
};

/** Tudo o que a página das finanças mostra. `params` = premissas do endereço (?arpu=&var=). */
export async function loadFinance(params: {
  arpu?: string | null;
  variable?: string | null;
}): Promise<FinanceView> {
  const [expenses, data] = await Promise.all([listExpenses(), loadAccountsData()]);
  // Admins e contas de teste podem ter plano liberado, mas não pagam: ficam fora da receita.
  const excluded = new Set<string>(data.adminIds);
  for (const account of data.accounts) if (account.testAccount) excluded.add(account.id);

  const revenue = revenueModel(data.subscriptions ?? [], data.grants, excluded, data.now);
  const aiPerClient = await loadAiCostPerClient(revenue.accounts.map((account) => account.userId));
  const summary = summarizeFinance({
    expenses,
    today: financeToday(data.now),
    revenue,
    aiPerClient,
    params,
  });
  return { expenses, summary, revenue, subscriptionsFailed: data.subscriptions === null };
}
