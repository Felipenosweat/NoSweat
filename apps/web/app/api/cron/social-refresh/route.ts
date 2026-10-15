import { isCronAuthorized } from "@/server/cron";
import { errorResponse, handle } from "@/server/http";
import { refreshExpiringTokens } from "@/server/social/refresh";

export const maxDuration = 300;

/**
 * GET /api/cron/social-refresh: renova os tokens do Instagram que vencem em até 15 dias e
 * recriptografa os salvos com chave antiga. Roda uma vez por dia pelo Cron da Vercel.
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    if (!isCronAuthorized(request)) return errorResponse(401, "unauthorized", "Not allowed.");
    const summary = await refreshExpiringTokens();
    return Response.json(summary);
  });
}
