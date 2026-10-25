import { ModelResponse, SetModelStatusRequest } from "@/lib/model-studio";
import { handle, jsonResponse, notFound, readJson } from "@/server/http";
import { setStatus, summarize } from "@/server/models";
import { requireAdminApi } from "@/server/models/http";

type Context = { params: Promise<{ slug: string }> };

/**
 * POST /api/admin/models/[slug]/status: { status: "approved" | "draft" } → { model }
 * Aprovado = a geração passa a usar esta versão (em até 1 minuto, cache de loadModelPool).
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const { slug } = await params;
    const input = await readJson(request, SetModelStatusRequest);
    if (!input.ok) return input.response;
    const model = await setStatus(slug, input.data.status, admin.user.id);
    if (!model) return notFound("Model");
    return jsonResponse(ModelResponse, { model: summarize(model) });
  }, "/api/admin/models/[slug]/status");
}
