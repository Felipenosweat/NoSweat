import { InvoiceResponse } from "@nosweat/schema";
import { jsonResponse, notFound } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { duplicateInvoice } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/office/invoices/[id]/duplicate (sem corpo): cópia da fatura (qualquer status) como
 * rascunho novo, com número e link novos, sem job, orçamento nem pagamentos; emissão hoje e
 * vencimento pelas configurações. Mesma resposta do POST /api/office/invoices (201).
 */
export async function POST(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/invoices/[id]/duplicate", async (user) => {
    const { id } = await params;
    const invoice = await duplicateInvoice(user.id, id);
    if (!invoice) return notFound("Invoice");
    return jsonResponse(InvoiceResponse, { invoice }, 201);
  });
}
