import { InvoiceResponse, RecordPaymentRequest } from "@nosweat/schema";
import { jsonResponse, notFound, readJson } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { recordPayment } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/office/invoices/[id]/payments: registra um pagamento recebido (até o saldo; acima
 * dele, 400). Devolve a fatura atualizada (paga quando o saldo zera).
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/invoices/[id]/payments", async (user) => {
    const { id } = await params;
    const input = await readJson(request, RecordPaymentRequest);
    if (!input.ok) return input.response;
    const invoice = await recordPayment(user.id, id, input.data);
    if (!invoice) return notFound("Invoice");
    return jsonResponse(InvoiceResponse, { invoice }, 201);
  });
}
