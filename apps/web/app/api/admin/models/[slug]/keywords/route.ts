import { ModelResponse, UpdateModelKeywordsRequest } from "@/lib/model-studio";
import { handle, jsonResponse, notFound, readJson } from "@/server/http";
import { setKeywords, summarize } from "@/server/models";
import { requireAdminApi } from "@/server/models/http";

type Context = { params: Promise<{ slug: string }> };

/**
 * PUT /api/admin/models/[slug]/keywords: { keywords } → { model }
 * Palavras do ramo que fazem a geração escolher este modelo dentro da categoria.
 */
export async function PUT(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const { slug } = await params;
    const input = await readJson(request, UpdateModelKeywordsRequest);
    if (!input.ok) return input.response;
    const model = await setKeywords(slug, input.data.keywords, admin.user.id);
    if (!model) return notFound("Model");
    return jsonResponse(ModelResponse, { model: summarize(model) });
  }, "/api/admin/models/[slug]/keywords");
}
