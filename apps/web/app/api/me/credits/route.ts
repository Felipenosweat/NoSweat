import { CreditsResponse } from "@nosweat/schema";
import { handle, jsonResponse, unauthorized } from "@/server/http";
import { dailyLimit, guestLimits, remainingUses } from "@/server/quota";
import { getActor } from "@/server/sites";

/**
 * GET /api/me/credits → quantos pedidos à IA a conta (ou o visitante) ainda pode fazer hoje.
 * TODO: trocar "trial" pelo plano da assinatura quando o Stripe entrar.
 */
export async function GET(): Promise<Response> {
  return handle(async () => {
    const actor = await getActor();
    if (!actor) return unauthorized();
    const remaining = await remainingUses(actor, "ai_edit");
    const limit = actor.kind === "guest" ? guestLimits("ai_edit").perGuest : dailyLimit("ai_edit");
    return jsonResponse(CreditsResponse, {
      remaining: remaining ?? limit,
      plan: "trial",
    });
  }, "/api/me/credits");
}
