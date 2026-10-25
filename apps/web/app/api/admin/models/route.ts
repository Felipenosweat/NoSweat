import { CreateModelRequest, ModelListResponse, ModelResponse } from "@/lib/model-studio";
import { handle, jsonResponse, readJson } from "@/server/http";
import { createModel, listModels, summarize } from "@/server/models";
import { requireAdminApi, studioErrorResponse } from "@/server/models/http";

/** GET /api/admin/models → { models }: todos os sites-modelo (código + estúdio). Só admins. */
export async function GET(): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const models = await listModels();
    return jsonResponse(ModelListResponse, { models: models.map(summarize) });
  }, "/api/admin/models");
}

/**
 * POST /api/admin/models: { category, fromSlug, slug? } → 201 { model }
 * Cria um modelo novo (rascunho) copiando outro. Só entra na geração depois de aprovado.
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const input = await readJson(request, CreateModelRequest);
    if (!input.ok) return input.response;
    try {
      const model = await createModel(input.data.category, input.data.fromSlug, {
        slug: input.data.slug,
        userId: admin.user.id,
      });
      return jsonResponse(ModelResponse, { model: summarize(model) }, 201);
    } catch (error) {
      return studioErrorResponse(error);
    }
  }, "/api/admin/models");
}
