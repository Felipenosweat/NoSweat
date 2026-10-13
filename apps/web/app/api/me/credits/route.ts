import { CreditsResponse } from "@nosweat/schema";
import { getCurrentUser } from "@/server/auth/session";
import { handle, jsonResponse, unauthorized } from "@/server/http";
import { dailyLimit, remainingUses } from "@/server/quota";

/**
 * GET /api/me/credits → quantos pedidos à IA a conta ainda pode fazer hoje.
 * TODO: trocar "trial" pelo plano da assinatura quando o Stripe entrar.
 */
export async function GET(): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const remaining = await remainingUses(user, "ai_edit");
    return jsonResponse(CreditsResponse, {
      remaining: remaining ?? dailyLimit("ai_edit"),
      plan: "trial",
    });
  });
}
