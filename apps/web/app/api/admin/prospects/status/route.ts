import { ProspectStatusRequest, ProspectStatusResponse } from "@/lib/prospects";
import { handle, jsonResponse, readJson } from "@/server/http";
import { requireAdminApi } from "@/server/models/http";
import { setProspectStatus } from "@/server/prospects/service";

/**
 * POST /api/admin/prospects/status: { ids, status } → { updated }
 * Atalhos em massa ("Mark contacted", "Do not contact") e o status de cada linha.
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const input = await readJson(request, ProspectStatusRequest);
    if (!input.ok) return input.response;
    const updated = await setProspectStatus(input.data.ids, input.data.status);
    return jsonResponse(ProspectStatusResponse, { updated });
  }, "/api/admin/prospects/status");
}
