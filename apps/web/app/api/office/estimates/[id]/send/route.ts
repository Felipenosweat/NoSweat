import { SendDocumentResponse } from "@nosweat/schema";
import { jsonResponse, notFound } from "@/server/http";
import { appOrigin } from "@/server/notify";
import { ownerRoute } from "@/server/office/api";
import { sendEstimate } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/office/estimates/[id]/send (sem corpo): rascunho → enviado e devolve o link público
 * completo (`url`, ex.: https://nosweatfd.com/q/<token>) para copiar, SMS ou e-mail.
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/estimates/[id]/send", async (user) => {
    const { id } = await params;
    const result = await sendEstimate(user.id, id, appOrigin(request.url));
    if (!result) return notFound("Estimate");
    return jsonResponse(SendDocumentResponse, result);
  });
}
