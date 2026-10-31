import { z } from "zod";
import { isCalendarDate } from "./office";

// Contrato das finanças da No Sweat (painel do admin, /admin/finance): os custos da própria
// empresa (hospedagem, banco, IA, e-mail...), únicos, mensais ou anuais. Só admins usam.
// Rotas: GET/POST /api/admin/finance/expenses   PATCH/DELETE /api/admin/finance/expenses/[id]
// Tabela: company_expenses (migration 0024). Dinheiro sempre em centavos de dólar.

/** Tipo do custo (só para agrupar e mostrar; não muda nenhuma conta). */
export const ExpenseCategory = z.enum([
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
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategory>;

/**
 * Frequência do custo:
 * - one_time: pago uma vez em `startsOn` (fica fora do custo mensal; aparece como "gasto até agora");
 * - monthly: todo mês, de `startsOn` até `endsOn` (inclusive; `null` = sem fim);
 * - yearly: uma vez por ano; no custo mensal entra o valor / 12.
 */
export const ExpenseFrequency = z.enum(["one_time", "monthly", "yearly"]);
export type ExpenseFrequency = z.infer<typeof ExpenseFrequency>;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Data sem hora "AAAA-MM-DD" que existe no calendário. */
const ExpenseDate = z
  .string()
  .regex(DATE_ONLY, "Use the YYYY-MM-DD format.")
  .refine(isCalendarDate, "That date doesn't exist.");

/** Até US$ 1 milhão por custo (o resto é erro de digitação). */
const ExpenseAmount = z
  .number({ error: "Enter the amount." })
  .int("Enter the amount in cents.")
  .nonnegative("The amount can't be negative.")
  .max(100_000_000, "That amount is too large.");

const ExpenseName = z
  .string()
  .trim()
  .min(1, "Give the cost a name.")
  .max(120, "Keep the name under 120 characters.");

const ExpenseNotes = z.string().trim().max(1000, "Keep the notes under 1,000 characters.");

export const CompanyExpense = z.object({
  id: z.string(),
  name: z.string(),
  category: ExpenseCategory,
  amountCents: z.number().int().nonnegative(),
  frequency: ExpenseFrequency,
  /** Começo (mensal/anual) ou dia do pagamento (único). */
  startsOn: z.string(),
  /** Último dia em que o custo vale (inclusive). `null` = continua. */
  endsOn: z.string().nullable(),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CompanyExpense = z.infer<typeof CompanyExpense>;

/** O fim não pode vir antes do começo (datas "AAAA-MM-DD" comparam como texto). */
export function expenseDatesInOrder(startsOn: string, endsOn: string | null): boolean {
  return endsOn === null || endsOn >= startsOn;
}

const END_BEFORE_START = {
  message: "The end date can't be before the start date.",
  path: ["endsOn"],
};

/** POST /api/admin/finance/expenses. Sem `startsOn`, o servidor usa hoje. */
export const CreateCompanyExpenseRequest = z
  .object({
    name: ExpenseName,
    category: ExpenseCategory,
    amountCents: ExpenseAmount,
    frequency: ExpenseFrequency,
    startsOn: ExpenseDate.optional(),
    endsOn: ExpenseDate.nullable().optional(),
    notes: ExpenseNotes.optional(),
  })
  .refine(
    (value) =>
      value.startsOn === undefined ||
      value.endsOn === undefined ||
      expenseDatesInOrder(value.startsOn, value.endsOn),
    END_BEFORE_START,
  );
export type CreateCompanyExpenseRequest = z.infer<typeof CreateCompanyExpenseRequest>;

/**
 * PATCH /api/admin/finance/expenses/[id]: só os campos que mudam. `endsOn: null` tira a data de
 * fim. A ordem das datas é conferida de novo no servidor, junto com o que já estava salvo.
 */
export const UpdateCompanyExpenseRequest = z
  .object({
    name: ExpenseName.optional(),
    category: ExpenseCategory.optional(),
    amountCents: ExpenseAmount.optional(),
    frequency: ExpenseFrequency.optional(),
    startsOn: ExpenseDate.optional(),
    endsOn: ExpenseDate.nullable().optional(),
    notes: ExpenseNotes.optional(),
  })
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "Nothing to update.",
  })
  .refine(
    (value) =>
      value.startsOn === undefined ||
      value.endsOn === undefined ||
      expenseDatesInOrder(value.startsOn, value.endsOn),
    END_BEFORE_START,
  );
export type UpdateCompanyExpenseRequest = z.infer<typeof UpdateCompanyExpenseRequest>;

export const CompanyExpenseResponse = z.object({ expense: CompanyExpense });
export type CompanyExpenseResponse = z.infer<typeof CompanyExpenseResponse>;

export const CompanyExpensesResponse = z.object({ expenses: z.array(CompanyExpense) });
export type CompanyExpensesResponse = z.infer<typeof CompanyExpensesResponse>;

export const DeleteCompanyExpenseResponse = z.object({ deleted: z.literal(true) });
export type DeleteCompanyExpenseResponse = z.infer<typeof DeleteCompanyExpenseResponse>;
