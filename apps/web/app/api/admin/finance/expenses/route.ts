import {
  CompanyExpenseResponse,
  CompanyExpensesResponse,
  CreateCompanyExpenseRequest,
} from "@nosweat/schema";
import { recordAdminAction } from "@/server/admin/audit";
import { revalidateAdmin } from "@/server/admin/cache";
import { ExpenseInputError, createExpense, listExpenses } from "@/server/admin/finance";
import { errorResponse, handle, jsonResponse, readJson } from "@/server/http";
import { requireAdminApi } from "@/server/models/http";

// Custos da No Sweat (painel /admin/finance). Só admins: sem login 401; quem não é admin
// recebe 404 (não fica sabendo que a rota existe), como as rotas /api/admin/models/*.

/** GET /api/admin/finance/expenses → { expenses } (começo mais antigo primeiro). */
export async function GET(): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    return jsonResponse(CompanyExpensesResponse, { expenses: await listExpenses() });
  }, "/api/admin/finance/expenses");
}

/**
 * POST /api/admin/finance/expenses:
 * { name, category, amountCents, frequency, startsOn?, endsOn?, notes? } → 201 { expense }
 * Sem `startsOn`, o custo vale de hoje. Custo único (`one_time`) não guarda data de fim.
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const input = await readJson(request, CreateCompanyExpenseRequest);
    if (!input.ok) return input.response;
    try {
      const expense = await createExpense(input.data);
      await recordAdminAction({
        adminId: admin.user.id,
        action: "expense.create",
        targetType: "expense",
        targetId: expense.id,
        metadata: {
          name: expense.name,
          amountCents: expense.amountCents,
          frequency: expense.frequency,
        },
      });
      revalidateAdmin();
      return jsonResponse(CompanyExpenseResponse, { expense }, 201);
    } catch (error) {
      if (error instanceof ExpenseInputError) {
        return errorResponse(400, "invalid_request", error.message);
      }
      throw error;
    }
  }, "/api/admin/finance/expenses");
}
