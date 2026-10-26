import { PublicEstimateResponse } from "@nosweat/schema";
import { jsonResponse, notFound } from "@/server/http";
import { officeHandle } from "@/server/office/api";
import { getPublicEstimate } from "@/server/office/service";
import { isPublicToken } from "@/server/office/tokens";

type Context = { params: Promise<{ token: string }> };

/**
 * GET /api/public/estimates/[token]: o orçamento como o cliente final vê (página /q/[token]).
 * Público, sem conta. Rascunho ou token desconhecido = 404.
 */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return officeHandle("/api/public/estimates/[token]", async () => {
    const { token } = await params;
    if (!isPublicToken(token)) return notFound("Estimate");
    const estimate = await getPublicEstimate(token);
    if (!estimate) return notFound("Estimate");
    return jsonResponse(PublicEstimateResponse, { estimate });
  });
}
