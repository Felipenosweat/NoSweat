import { AssistantSettingsRequest, AssistantSettingsResponse } from "@nosweat/schema";
import { assistantOverview, setAssistantEnabled } from "@/server/assistant/service";
import { ownerHasFeature } from "@/server/billing";
import {
  errorResponse,
  handle,
  jsonResponse,
  notFound,
  readJson,
  unauthorized,
} from "@/server/http";
import { requireOwnedSite } from "@/server/sites";

type Context = { params: Promise<{ id: string }> };

/** GET /api/sites/[id]/assistant → ligado?, plano inclui?, últimas 30 conversas (só o dono). */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();
    return jsonResponse(AssistantSettingsResponse, await assistantOverview(site));
  }, "/api/sites/[id]/assistant");
}

/**
 * PUT /api/sites/[id]/assistant { enabled } → liga/desliga o atendente de IA do site. Ligar
 * exige o plano com o atendente (Premium); desligar sempre pode.
 */
export async function PUT(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();

    const input = await readJson(request, AssistantSettingsRequest);
    if (!input.ok) return input.response;

    if (input.data.enabled) {
      const allowed = site.ownerId ? await ownerHasFeature(site.ownerId, "aiAssistant") : false;
      if (!allowed) {
        return errorResponse(
          402,
          "payment_required",
          "The AI assistant is part of the Premium plan. Upgrade in Plans and billing to turn it on.",
        );
      }
    }
    await setAssistantEnabled(site, input.data.enabled);
    return jsonResponse(AssistantSettingsResponse, await assistantOverview(site));
  }, "/api/sites/[id]/assistant");
}
