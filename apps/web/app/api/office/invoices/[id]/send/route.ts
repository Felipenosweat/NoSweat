import { SendDocumentResponse } from "@nosweat/schema";
import { jsonResponse, notFound } from "@/server/http";
import { appOrigin } from "@/server/notify";
import { ownerRoute } from "@/server/office/api";
import { sendInvoice } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/office/invoices/[id]/send (sem corpo): rascunho → enviada e devolve o link público
 * completo (`url`, ex.: https://nosweatfd.com/i/<token>).
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/invoices/[id]/send", async (user) => {
    const { id } = await params;
    const result = await sendInvoice(user.id, id, appOrigin(request.url));
    if (!result) return notFound("Invoice");
    return jsonResponse(SendDocumentResponse, result);
  });
}
