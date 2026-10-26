import {
  CreateEstimateRequest,
  EstimateResponse,
  EstimateStatus,
  EstimatesResponse,
} from "@nosweat/schema";
import { jsonResponse, readJson } from "@/server/http";
import { ownerRoute, queryParam } from "@/server/office/api";
import { createEstimate, listEstimates } from "@/server/office/service";

/** GET /api/office/estimates?status=&clientId=: orçamentos, mais novos primeiro. */
export async function GET(request: Request): Promise<Response> {
  return ownerRoute("/api/office/estimates", async (user) => {
    const params = new URL(request.url).searchParams;
    const estimates = await listEstimates(user.id, {
      status: queryParam(params, "status", EstimateStatus),
      clientId: params.get("clientId") || undefined,
    });
    return jsonResponse(EstimatesResponse, { estimates });
  });
}

/** POST /api/office/estimates: orçamento novo (rascunho; totais calculados aqui). */
export async function POST(request: Request): Promise<Response> {
  return ownerRoute("/api/office/estimates", async (user) => {
    const input = await readJson(request, CreateEstimateRequest);
    if (!input.ok) return input.response;
    const estimate = await createEstimate(user.id, input.data);
    return jsonResponse(EstimateResponse, { estimate }, 201);
  });
}
