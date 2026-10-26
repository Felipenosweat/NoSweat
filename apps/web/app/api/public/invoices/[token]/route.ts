import { PublicInvoiceResponse } from "@nosweat/schema";
import { jsonResponse, notFound } from "@/server/http";
import { officeHandle } from "@/server/office/api";
import { getPublicInvoice } from "@/server/office/service";
import { isPublicToken } from "@/server/office/tokens";

type Context = { params: Promise<{ token: string }> };

/**
 * GET /api/public/invoices/[token]: a fatura como o cliente final vê (página /i/[token]).
 * Público, sem conta. Rascunho, anulada ou token desconhecido = 404.
 */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return officeHandle("/api/public/invoices/[token]", async () => {
    const { token } = await params;
    if (!isPublicToken(token)) return notFound("Invoice");
    const invoice = await getPublicInvoice(token);
    if (!invoice) return notFound("Invoice");
    return jsonResponse(PublicInvoiceResponse, { invoice });
  });
}
