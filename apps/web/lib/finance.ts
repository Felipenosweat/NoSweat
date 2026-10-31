import type { ExpenseCategory, ExpenseFrequency } from "@nosweat/schema";

// Peças puras das finanças do admin (/admin/finance), sem React e sem servidor: rótulos,
// ordem dos grupos e dinheiro. Servem para server e client components. As contas (custo fixo,
// receita, empate) ficam em server/admin/finance.ts.

/** Fuso do "hoje" das finanças (a empresa é dos EUA; custos começam/acabam em datas locais). */
export const FINANCE_TIME_ZONE = "America/New_York";

/** Ordem das categorias no seletor. */
export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  "hosting",
  "database",
  "ai",
  "email",
  "payments",
  "domain",
  "software",
  "marketing",
  "legal_accounting",
  "payroll",
  "other",
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  hosting: "Hosting",
  database: "Database",
  ai: "AI",
  email: "Email",
  payments: "Payments",
  domain: "Domains",
  software: "Software",
  marketing: "Marketing",
  legal_accounting: "Legal & accounting",
  payroll: "Payroll",
  other: "Other",
};

/** Ordem dos grupos na lista e no seletor. */
export const EXPENSE_FREQUENCIES: readonly ExpenseFrequency[] = ["monthly", "yearly", "one_time"];

export const EXPENSE_FREQUENCY_LABELS: Record<ExpenseFrequency, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  one_time: "One-time",
};

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Centavos → "$1,250" (dólar redondo) ou "$69.50". Negativo sai com o sinal de menos de verdade
 * ("−$120"), que o leitor de tela lê como "minus".
 */
export function formatMoney(cents: number): string {
  const abs = Math.abs(Math.round(cents));
  const text = abs % 100 === 0 ? usdWhole.format(abs / 100) : usdCents.format(abs / 100);
  return cents < 0 && abs > 0 ? `−${text}` : text;
}

/** Centavos → "$1.2K" (eixos do gráfico). */
export function formatMoneyCompact(cents: number): string {
  return usdCompact.format(cents / 100);
}

/** Centavos → texto para o campo de valor ("69.5" → "69.50"; redondo: "69"). */
export function centsToDollarsInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}
