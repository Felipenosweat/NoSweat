import { EstimateResponse } from "@nosweat/schema";
import { jsonResponse, notFound } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { reopenEstimate } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/office/estimates/[id]/reopen (sem corpo): desfaz a resposta que o dono marcou à mão
 * (aprovado/recusado → enviado). Resposta do cliente pelo link, job ligado ou fatura não anulada
 * criada dele → 409 com o motivo.
 */
export async function POST(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/estimates/[id]/reopen", async (user) => {
    const { id } = await params;
    const estimate = await reopenEstimate(user.id, id);
    if (!estimate) return notFound("Estimate");
    return jsonResponse(EstimateResponse, { estimate });
  });
}
