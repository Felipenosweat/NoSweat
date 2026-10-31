import {
  CompanyExpenseResponse,
  DeleteCompanyExpenseResponse,
  UpdateCompanyExpenseRequest,
} from "@nosweat/schema";
import { revalidateAdmin } from "@/server/admin/cache";
import { ExpenseInputError, deleteExpense, updateExpense } from "@/server/admin/finance";
import { errorResponse, handle, jsonResponse, notFound, readJson } from "@/server/http";
import { requireAdminApi } from "@/server/models/http";

type Context = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/finance/expenses/[id]: só os campos que mudam → { expense }
 * `endsOn: null` tira a data de fim. 404 se o custo não existir.
 */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const { id } = await params;
    const input = await readJson(request, UpdateCompanyExpenseRequest);
    if (!input.ok) return input.response;
    try {
      const expense = await updateExpense(id, input.data);
      if (!expense) return notFound("Expense");
      console.info(`[admin] ${admin.user.id} updated company expense ${id}`);
      revalidateAdmin();
      return jsonResponse(CompanyExpenseResponse, { expense });
    } catch (error) {
      if (error instanceof ExpenseInputError) {
        return errorResponse(400, "invalid_request", error.message);
      }
      throw error;
    }
  }, "/api/admin/finance/expenses/[id]");
}

/** DELETE /api/admin/finance/expenses/[id] → { deleted: true }. 404 se não existir. */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const { id } = await params;
    if (!(await deleteExpense(id))) return notFound("Expense");
    console.info(`[admin] ${admin.user.id} deleted company expense ${id}`);
    revalidateAdmin();
    return jsonResponse(DeleteCompanyExpenseResponse, { deleted: true });
  }, "/api/admin/finance/expenses/[id]");
}
