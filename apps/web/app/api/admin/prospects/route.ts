import { z } from "zod";
import { ProspectView } from "@/lib/prospects";
import { handle, jsonResponse } from "@/server/http";
import { requireAdminApi } from "@/server/models/http";
import { toView } from "@/server/prospects/service";
import { getProspectStore } from "@/server/prospects/store";

const ProspectsResponse = z.object({ prospects: z.array(ProspectView) });

/** GET /api/admin/prospects → { prospects } (só admins; os outros recebem 404). */
export async function GET(): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const prospects = await getProspectStore().list();
    return jsonResponse(ProspectsResponse, { prospects: prospects.map(toView) });
  }, "/api/admin/prospects");
}
