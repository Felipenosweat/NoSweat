import { SiteSpec, UpdateSiteRequest } from "@nosweat/schema";
import { z } from "zod";
import { ModelSummary } from "@/lib/model-studio";
import { handle, jsonResponse, notFound, readJson } from "@/server/http";
import { getModel, resetModel, saveModel, summarize } from "@/server/models";
import { requireAdminApi, studioErrorResponse } from "@/server/models/http";

type Context = { params: Promise<{ slug: string }> };

/**
 * Resposta do salvamento. Tem o mesmo formato do UpdateSiteResponse (siteId = slug), para o
 * editor de sites (SiteEditor, modo modelo) usar a rota sem mudar a leitura da resposta.
 */
const SaveModelResponse = z.object({
  siteId: z.string(),
  spec: SiteSpec,
  updatedAt: z.string().optional(),
  model: ModelSummary,
});

const ModelDetailResponse = z.object({ model: ModelSummary, spec: SiteSpec });

const ResetModelResponse = z.object({
  deleted: z.boolean(),
  model: ModelSummary.nullable(),
});

/** GET /api/admin/models/[slug] → { model, spec } (a versão do estúdio, se houver). */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const { slug } = await params;
    const model = await getModel(slug);
    if (!model) return notFound("Model");
    return jsonResponse(ModelDetailResponse, { model: summarize(model), spec: model.spec });
  }, "/api/admin/models/[slug]");
}

/**
 * PATCH (ou PUT) /api/admin/models/[slug]: { spec, baseUpdatedAt? } → { siteId, spec, updatedAt, model }
 * Salva a edição como RASCUNHO (precisa aprovar de novo para valer na geração). 409 "conflict"
 * se outra aba salvou depois de `baseUpdatedAt`.
 */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const { slug } = await params;
    const input = await readJson(request, UpdateSiteRequest);
    if (!input.ok) return input.response;
    try {
      const model = await saveModel(slug, input.data.spec, {
        userId: admin.user.id,
        baseUpdatedAt: input.data.baseUpdatedAt,
      });
      if (!model) return notFound("Model");
      return jsonResponse(SaveModelResponse, {
        siteId: model.slug,
        spec: model.spec,
        updatedAt: model.updatedAt ?? undefined,
        model: summarize(model),
      });
    } catch (error) {
      return studioErrorResponse(error);
    }
  }, "/api/admin/models/[slug]");
}

export const PUT = PATCH;

/**
 * DELETE /api/admin/models/[slug] → { deleted, model }
 * Modelo do código: volta ao original (apaga a versão do estúdio; deleted = false, model = o
 * original). Modelo criado no estúdio: apaga (deleted = true, model = null).
 */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const { slug } = await params;
    const result = await resetModel(slug);
    if (!result) return notFound("Model");
    if ("deleted" in result)
      return jsonResponse(ResetModelResponse, { deleted: true, model: null });
    return jsonResponse(ResetModelResponse, { deleted: false, model: summarize(result) });
  }, "/api/admin/models/[slug]");
}
