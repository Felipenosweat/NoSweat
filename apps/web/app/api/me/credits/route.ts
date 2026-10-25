import { CreditsResponse } from "@nosweat/schema";
import { creditPlan, getBalance } from "@/server/credits";
import { handle, jsonResponse, unauthorized } from "@/server/http";
import { dailyLimit, guestLimits, remainingUses } from "@/server/quota";
import { getActor } from "@/server/sites";

/**
 * GET /api/me/credits → saldo de créditos da IA da conta (cota do mês + créditos comprados) e
 * quantas mudanças por IA ainda cabem agora. Visitante: só `remaining` (limites GUEST_*), sem
 * créditos (`credits: null`).
 */
export async function GET(): Promise<Response> {
  return handle(async () => {
    const actor = await getActor();
    if (!actor) return unauthorized();
    const remaining = await remainingUses(actor, "ai_edit");
    if (actor.kind === "guest") {
      return jsonResponse(CreditsResponse, {
        remaining: remaining ?? guestLimits("ai_edit").perGuest,
        plan: "trial",
        credits: null,
      });
    }
    const [credits, plan] = await Promise.all([getBalance(actor.user), creditPlan(actor.user)]);
    return jsonResponse(CreditsResponse, {
      remaining: remaining ?? dailyLimit("ai_edit"),
      plan: plan ?? "trial",
      credits,
    });
  }, "/api/me/credits");
}
