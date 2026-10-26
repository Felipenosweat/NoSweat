import { OfficeSummary } from "@nosweat/schema";
import { jsonResponse } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { getOfficeSummary } from "@/server/office/service";

/** GET /api/office/summary: números do painel ("hoje" e "este mês" no fuso da empresa). */
export async function GET(): Promise<Response> {
  return ownerRoute("/api/office/summary", async (user) => {
    const summary = await getOfficeSummary(user.id);
    return jsonResponse(OfficeSummary, summary);
  });
}
