import { EstimateResponse } from "@nosweat/schema";
import { jsonResponse, notFound } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { duplicateEstimate } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/office/estimates/[id]/duplicate (sem corpo): cópia do orçamento (qualquer status) como
 * rascunho novo, com número e link novos, sem job e sem resposta. Mesma resposta do POST
 * /api/office/estimates (201).
 */
export async function POST(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/estimates/[id]/duplicate", async (user) => {
    const { id } = await params;
    const estimate = await duplicateEstimate(user.id, id);
    if (!estimate) return notFound("Estimate");
    return jsonResponse(EstimateResponse, { estimate }, 201);
  });
}
