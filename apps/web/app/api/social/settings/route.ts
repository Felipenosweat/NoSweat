import { SocialSettingsResponse, UpdateSocialSettingsRequest } from "@nosweat/schema";
import { errorResponse, handle, jsonResponse, readJson } from "@/server/http";
import { requireSocialUser, toPublicSettings } from "@/server/social/api";
import { isValidTimeZone } from "@/server/social/service";
import { getSocialStore } from "@/server/social/store";
import { getSiteStore } from "@/server/store";

/** PATCH /api/social/settings: fuso, site usado pela IA, dias e hora padrão dos posts. */
export async function PATCH(request: Request): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const input = await readJson(request, UpdateSocialSettingsRequest);
    if (!input.ok) return input.response;
    const patch = input.data;

    if (patch.timezone !== undefined && !isValidTimeZone(patch.timezone)) {
      return errorResponse(400, "invalid_request", "Please pick a valid time zone.");
    }
    if (patch.defaultSiteId) {
      const site = await getSiteStore().get(patch.defaultSiteId);
      if (!site || site.ownerId !== user.id) {
        return errorResponse(404, "not_found", "Site not found.");
      }
    }
    const postDays = patch.postDays ? [...new Set(patch.postDays)].sort() : undefined;
    const settings = await getSocialStore().upsertSettings(user.id, { ...patch, postDays });
    return jsonResponse(SocialSettingsResponse, { settings: toPublicSettings(settings) });
  }, "/api/social/settings");
}
