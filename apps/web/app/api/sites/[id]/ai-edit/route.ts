import { AiEditRequest, AiEditResponse } from "@nosweat/schema";
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
import { refundUse, reserveUse } from "@/server/quota";
import { requireSiteAccess } from "@/server/sites";
import { getSiteStore } from "@/server/store";

// A IA pode levar alguns segundos para aplicar a mudança.
export const maxDuration = 300;

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/sites/[id]/ai-edit: { instruction } → { siteId, spec, summary, updatedAt }
 * Aplica um pedido em linguagem natural ao RASCUNHO (vira uma versão "ai_edit").
 * O site no ar só muda quando o dono publica. Gasta créditos (conta) ou respeita o limite do
 * visitante; se a IA falhar, os créditos voltam.
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
    // Modo modelo (produção sem chave de IA): não há IA para mudar o site. Responde antes de
    // gastar crédito ou salvar versão (o editor já esconde o pedido, ver aiEnabled()).
    if (!generator.usesAi) {
      return errorResponse(
        503,
        "ai_unavailable",
        "AI changes aren't switched on yet. You can edit every text, color and photo yourself.",
      );
    }
    const overLimit = await reserveUse(actor, "ai_edit", site.id);
    if (overLimit) return overLimit;

    let result: Awaited<ReturnType<typeof editSiteSpec>>;
    try {
      result = await editSiteSpec(site.spec, input.data.instruction, generator);
    } catch (error) {
      console.error("[api] ai edit failed", error);
      // A IA falhou: os créditos voltam para a conta.
      await refundUse(actor, "ai_edit");
      return errorResponse(
        502,
        "generation_failed",
        "We couldn't apply that change right now. Please try again or rephrase your request.",
      );
    }

    // Se o dono pediu outra foto do topo (imageQuery mudou), busca uma nova. Nunca falha.
    const spec = await resolveHeroImage(result.spec, { previous: site.spec });

    // A IA não mudou nada (pedido fora do que o site permite, ex.: formato do botão): nada é
    // salvo e o crédito volta. O editor mostra o resumo sem "Saved" nem "Undo".
    if (!result.changed) {
      await refundUse(actor, "ai_edit");
      return jsonResponse(AiEditResponse, {
        siteId: site.id,
        spec: site.spec,
        summary: result.summary,
        updatedAt: site.updatedAt,
        changed: false,
      });
    }

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
