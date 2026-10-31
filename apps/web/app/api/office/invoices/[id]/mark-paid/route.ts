import { InvoiceResponse } from "@nosweat/schema";
import { jsonResponse, notFound } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { markInvoicePaid } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/office/invoices/[id]/mark-paid (sem corpo): lança o saldo que falta como pagamento
 * "Other · Marked paid" e devolve a fatura (paga). Sem saldo: devolve como está; anulada: 409.
 */
export async function POST(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/invoices/[id]/mark-paid", async (user) => {
    const { id } = await params;
    const invoice = await markInvoicePaid(user.id, id);
    if (!invoice) return notFound("Invoice");
    return jsonResponse(InvoiceResponse, { invoice });
  });
}
