import { AiEditRequest, AiEditResponse, type AiEditResult } from "@nosweat/schema";
import { editSiteSpec, getSiteGenerator } from "@/server/ai";
import {
  errorResponse,
  handle,
  jsonResponse,
  notFound,
  readJson,
  unauthorized,
} from "@/server/http";
import { resolveHeroImage } from "@/server/images";
import { reserveUse } from "@/server/quota";
import { requireSiteAccess } from "@/server/sites";
import { getSiteStore } from "@/server/store";

// A IA pode levar alguns segundos para aplicar a mudança.
export const maxDuration = 300;

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/sites/[id]/ai-edit: { instruction } → { siteId, spec, summary, updatedAt }
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

    // Monta o gerador ANTES de gastar um crédito: erro de configuração (ex.: falta a chave da
    // IA) vira 500 sem descontar nada do cliente.
    const generator = getSiteGenerator();
    const overLimit = await reserveUse(actor, "ai_edit");
    if (overLimit) return overLimit;

    let result: AiEditResult;
    try {
      result = await editSiteSpec(site.spec, input.data.instruction, generator);
    } catch (error) {
      console.error("[api] ai edit failed", error);
      return errorResponse(
        502,
        "generation_failed",
        "We couldn't apply that change right now. Please try again or rephrase your request.",
      );
    }

    // Se o dono pediu outra foto do topo (imageQuery mudou), busca uma nova. Nunca falha.
    const spec = await resolveHeroImage(result.spec, { previous: site.spec });

    const updated = await getSiteStore().update(site.id, spec, "ai_edit");
    if (!updated) return notFound();
    return jsonResponse(AiEditResponse, {
      siteId: updated.id,
      spec: updated.spec,
      summary: result.summary,
      updatedAt: updated.updatedAt,
    });
  }, "/api/sites/[id]/ai-edit");
}
