import { AiEditRequest, AiEditResponse, type AiEditResult } from "@nosweat/schema";
import { editSiteSpec } from "@/server/ai";
import {
  errorResponse,
  handle,
  jsonResponse,
  notFound,
  readJson,
  unauthorized,
} from "@/server/http";
import { quotaExceeded, recordUse } from "@/server/quota";
import { requireSiteAccess } from "@/server/sites";
import { getSiteStore } from "@/server/store";

// A IA pode levar alguns segundos para aplicar a mudança.
export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/sites/[id]/ai-edit: { instruction } → { siteId, spec, summary }
 * Aplica um pedido em linguagem natural ao RASCUNHO (vira uma versão "ai_edit").
 * O site no ar só muda quando o dono publica. Respeita o limite diário (conta ou visitante).
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { actor, site } = await requireSiteAccess(id);
    if (!actor) return unauthorized();
    if (!site) return notFound();

    const input = await readJson(request, AiEditRequest);
    if (!input.ok) return input.response;

    const overLimit = await quotaExceeded(actor, "ai_edit");
    if (overLimit) return overLimit;

    let result: AiEditResult;
    try {
      result = await editSiteSpec(site.spec, input.data.instruction);
    } catch (error) {
      console.error("[api] ai edit failed", error);
      return errorResponse(
        502,
        "generation_failed",
        "We couldn't apply that change right now. Please try again or rephrase your request.",
      );
    }
    await recordUse(actor, "ai_edit");

    const updated = await getSiteStore().update(site.id, result.spec, "ai_edit");
    if (!updated) return notFound();
    return jsonResponse(AiEditResponse, {
      siteId: updated.id,
      spec: updated.spec,
      summary: result.summary,
    });
  });
}
