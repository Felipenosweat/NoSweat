import { InvoiceResponse } from "@nosweat/schema";
import { jsonResponse, notFound } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { deletePayment } from "@/server/office/service";

type Context = { params: Promise<{ id: string; paymentId: string }> };

/**
 * DELETE /api/office/invoices/[id]/payments/[paymentId]: apaga um pagamento lançado errado e
 * devolve a fatura atualizada (paga com saldo de novo volta a "sent").
 */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/invoices/[id]/payments/[paymentId]", async (user) => {
    const { id, paymentId } = await params;
    const invoice = await deletePayment(user.id, id, paymentId);
    if (!invoice) return notFound("Invoice");
    return jsonResponse(InvoiceResponse, { invoice });
  });
}
