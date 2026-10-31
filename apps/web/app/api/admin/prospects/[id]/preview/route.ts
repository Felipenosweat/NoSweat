import { ProspectPreviewResponse } from "@/lib/prospects";
import { errorResponse, handle, jsonResponse } from "@/server/http";
import { requireAdminApi } from "@/server/models/http";
import { ProspectError, createPreview, toView } from "@/server/prospects/service";

// A IA leva de segundos a dezenas de segundos por site.
export const maxDuration = 300;

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/prospects/[id]/preview → { prospect }
 * Cria UM site de prévia (rascunho do admin) e o link /p/<token>. A tela chama uma vez por
 * prospect, em sequência, até 10 por clique (custo da IA).
 */
export async function POST(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const { id } = await params;
    try {
      const prospect = await createPreview(admin.user, id);
      return jsonResponse(ProspectPreviewResponse, { prospect: toView(prospect) });
    } catch (error) {
      if (!(error instanceof ProspectError)) throw error;
      return errorResponse(error.status, error.code, error.message);
    }
  }, "/api/admin/prospects/[id]/preview");
}
