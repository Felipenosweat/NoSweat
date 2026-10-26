import { InvoiceResponse, UpdateInvoiceRequest } from "@nosweat/schema";
import { jsonResponse, notFound, readJson } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { deleteInvoice, getInvoice, updateInvoice } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/** GET /api/office/invoices/[id] (de outra pessoa = 404), com os pagamentos. */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/invoices/[id]", async (user) => {
    const { id } = await params;
    const invoice = await getInvoice(user.id, id);
    if (!invoice) return notFound("Invoice");
    return jsonResponse(InvoiceResponse, { invoice });
  });
}

/**
 * PATCH /api/office/invoices/[id]: linhas só sem pagamento; `status: "void"` anula (só sem
 * pagamento). Regra quebrada → 409.
 */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/invoices/[id]", async (user) => {
    const { id } = await params;
    const input = await readJson(request, UpdateInvoiceRequest);
    if (!input.ok) return input.response;
    const invoice = await updateInvoice(user.id, id, input.data);
    if (!invoice) return notFound("Invoice");
    return jsonResponse(InvoiceResponse, { invoice });
  });
}

/** DELETE /api/office/invoices/[id] → { ok: true }. Com pagamentos: 409 (apague-os antes). */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/invoices/[id]", async (user) => {
    const { id } = await params;
    if (!(await deleteInvoice(user.id, id))) return notFound("Invoice");
    return Response.json({ ok: true });
  });
}
