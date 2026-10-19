import type { AiUsageKind } from "../store/types";

// Custo ESTIMADO da IA, em dólares por uso, para o painel do admin. Não é a fatura do provedor:
// é uma média aproximada de quanto cada chamada gasta (tokens de entrada + saída).
// ATUALIZAR quando o preço do provedor (Anthropic/OpenAI), o modelo ou o tamanho dos prompts mudar.
export const AI_COST_PER_USE_USD: Record<AiUsageKind, number> = {
  // Média ponderada: quase todo site sai pelo caminho barato (site-modelo + ModelFill no Haiku,
  // ~US$0,005) e alguns voltam para o caminho completo (Sonnet, ~US$0,06). Ver server/ai/anthropic.ts.
  generate: 0.012,
  ai_edit: 0.01,
  social_plan: 0.03,
  social_caption: 0.002,
};

/** Todos os tipos de uso da IA, na ordem em que aparecem no painel. */
export const AI_USAGE_KINDS: AiUsageKind[] = [
  "generate",
  "ai_edit",
  "social_plan",
  "social_caption",
];

export const AI_USAGE_LABELS: Record<AiUsageKind, string> = {
  generate: "New websites",
  ai_edit: "AI website changes",
  social_plan: "AI month plans",
  social_caption: "AI captions",
};

export type AiUsageCounts = Partial<Record<AiUsageKind, number>>;

/** Milésimos de dólar por uso (conta com inteiros para não somar erro de arredondamento). */
function millsPerUse(kind: AiUsageKind): number {
  return Math.round(AI_COST_PER_USE_USD[kind] * 1000);
}

/** Custo estimado (USD) de `count` usos de um tipo. */
export function estimateKindCostUsd(kind: AiUsageKind, count: number): number {
  return (Math.max(0, Math.floor(count)) * millsPerUse(kind)) / 1000;
}

/** Custo estimado (USD) de um conjunto de usos. Tipos que faltam contam como zero. */
export function estimateAiCostUsd(counts: AiUsageCounts): number {
  let mills = 0;
  for (const kind of AI_USAGE_KINDS) {
    mills += Math.max(0, Math.floor(counts[kind] ?? 0)) * millsPerUse(kind);
  }
  return mills / 1000;
}

/** Soma dos usos de todos os tipos. */
export function totalUses(counts: AiUsageCounts): number {
  return AI_USAGE_KINDS.reduce((sum, kind) => sum + Math.max(0, counts[kind] ?? 0), 0);
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdFine = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

/** "$1.23"; valores entre zero e um centavo viram "<$0.01" (nunca "$0.00" para algo que custou). */
export function formatUsd(value: number): string {
  if (value > 0 && value < 0.01) return "<$0.01";
  return usd.format(value);
}

/** Preço por uso com 3 casas ("$0.002"), para a tabela de custos. */
export function formatUsdPerUse(value: number): string {
  return usdFine.format(value);
}
