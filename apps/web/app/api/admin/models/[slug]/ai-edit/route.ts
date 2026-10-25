import { AiEditRequest, AiEditResponse, type AiEditResult } from "@nosweat/schema";
import { editSiteSpec, getSiteGenerator } from "@/server/ai";
import { errorResponse, handle, jsonResponse, notFound, readJson } from "@/server/http";
import { resolveHeroImage } from "@/server/images";
import { getModel, saveModel } from "@/server/models";
import { requireAdminApi, studioErrorResponse } from "@/server/models/http";
import { getSiteStore } from "@/server/store";

// A IA pode levar alguns segundos para aplicar a mudança.
export const maxDuration = 300;

type Context = { params: Promise<{ slug: string }> };

/**
 * POST /api/admin/models/[slug]/ai-edit: { instruction } → { siteId, spec, summary, updatedAt }
 * Mesmo formato do /api/sites/[id]/ai-edit (o editor usa os dois). A mudança vira um RASCUNHO do
 * modelo. Admins não têm limite; o uso fica registrado em ai_usage (custo estimado do /admin).
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const { slug } = await params;
    const model = await getModel(slug);
    if (!model) return notFound("Model");

    const input = await readJson(request, AiEditRequest);
    if (!input.ok) return input.response;

    const generator = getSiteGenerator();
    let result: AiEditResult;
    try {
      result = await editSiteSpec(model.spec, input.data.instruction, generator);
    } catch (error) {
      console.error("[api] model ai edit failed", error);
      return errorResponse(
        502,
        "generation_failed",
        "We couldn't apply that change right now. Please try again or rephrase your request.",
      );
    }
    // Só para o custo estimado do /admin; uma falha aqui não desfaz a mudança.
    await getSiteStore()
      .recordAiUsage(admin.user.id, "ai_edit")
      .catch((error: unknown) => console.error("[api] could not record model ai usage", error));

    const spec = await resolveHeroImage(result.spec, { previous: model.spec });
    try {
      const saved = await saveModel(slug, spec, { userId: admin.user.id });
      if (!saved) return notFound("Model");
      return jsonResponse(AiEditResponse, {
        siteId: saved.slug,
        spec: saved.spec,
        summary: result.summary,
        updatedAt: saved.updatedAt ?? undefined,
      });
    } catch (error) {
      return studioErrorResponse(error);
    }
  }, "/api/admin/models/[slug]/ai-edit");
}
