import { EstimateResponse, UpdateEstimateRequest } from "@nosweat/schema";
import { jsonResponse, notFound, readJson } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { deleteEstimate, getEstimate, updateEstimate } from "@/server/office/service";

type Context = { params: Promise<{ id: string }> };

/** GET /api/office/estimates/[id] (de outra pessoa = 404). */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/estimates/[id]", async (user) => {
    const { id } = await params;
    const estimate = await getEstimate(user.id, id);
    if (!estimate) return notFound("Estimate");
    return jsonResponse(EstimateResponse, { estimate });
  });
}

/**
 * PATCH /api/office/estimates/[id]: linhas e textos (só rascunho/enviado; senão 409) ou a
 * resposta marcada pelo dono (`status: approved | declined`).
 */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/estimates/[id]", async (user) => {
    const { id } = await params;
    const input = await readJson(request, UpdateEstimateRequest);
    if (!input.ok) return input.response;
    const estimate = await updateEstimate(user.id, id, input.data);
    if (!estimate) return notFound("Estimate");
    return jsonResponse(EstimateResponse, { estimate });
  });
}

/** DELETE /api/office/estimates/[id] → { ok: true }. Job e fatura criados dele continuam. */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return ownerRoute("/api/office/estimates/[id]", async (user) => {
    const { id } = await params;
    if (!(await deleteEstimate(user.id, id))) return notFound("Estimate");
    return Response.json({ ok: true });
  });
}
