import { ProspectStatusRequest, ProspectStatusResponse } from "@/lib/prospects";
import { recordAdminAction } from "@/server/admin/audit";
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
    // Uma linha por pedido (os atalhos em massa mandam muitos ids de uma vez).
    await recordAdminAction({
      adminId: admin.user.id,
      action: "prospects.status",
      targetType: "prospect",
      targetId: input.data.ids.length === 1 ? (input.data.ids[0] ?? null) : null,
      metadata: { status: input.data.status, ids: input.data.ids.slice(0, 100), updated },
    });
    return jsonResponse(ProspectStatusResponse, { updated });
  }, "/api/admin/prospects/status");
}
