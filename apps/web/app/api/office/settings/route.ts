import { OfficeSettingsResponse, UpdateOfficeSettingsRequest } from "@nosweat/schema";
import { jsonResponse, readJson } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { getSettings, updateSettings } from "@/server/office/service";

/** GET /api/office/settings: configurações da empresa (criadas na primeira leitura). */
export async function GET(): Promise<Response> {
  return ownerRoute("/api/office/settings", async (user) => {
    const settings = await getSettings(user.id);
    return jsonResponse(OfficeSettingsResponse, { settings });
  });
}

/** PUT /api/office/settings: muda só os campos enviados. */
export async function PUT(request: Request): Promise<Response> {
  return ownerRoute("/api/office/settings", async (user) => {
    const input = await readJson(request, UpdateOfficeSettingsRequest);
    if (!input.ok) return input.response;
    const settings = await updateSettings(user.id, input.data);
    return jsonResponse(OfficeSettingsResponse, { settings });
  });
}
