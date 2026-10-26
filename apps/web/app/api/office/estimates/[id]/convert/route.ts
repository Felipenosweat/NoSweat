import { ConvertEstimateRequest, ConvertEstimateResponse } from "@nosweat/schema";
import { jsonResponse, notFound, readJson } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { convertEstimate } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/office/estimates/[id]/convert { createJob?, createInvoice? }: orçamento aprovado →
 * job e/ou fatura (409 se não aprovado). Repetir devolve o que já existe, sem duplicar.
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/estimates/[id]/convert", async (user) => {
    const { id } = await params;
    const input = await readJson(request, ConvertEstimateRequest);
    if (!input.ok) return input.response;
    const result = await convertEstimate(user.id, id, input.data);
    if (!result) return notFound("Estimate");
    return jsonResponse(ConvertEstimateResponse, result);
  });
}
