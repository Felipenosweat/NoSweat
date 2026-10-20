import { isCronAuthorized } from "@/server/cron";
import { errorResponse, handle } from "@/server/http";
import { reportError } from "@/server/notify/alert";
import { refreshExpiringTokens } from "@/server/social/refresh";

export const maxDuration = 300;

const ROUTE = "/api/cron/social-refresh";

/**
 * GET /api/cron/social-refresh: renova os tokens do Instagram que vencem em até 15 dias e
 * recriptografa os salvos com chave antiga. Roda uma vez por dia pelo Cron da Vercel.
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    if (!isCronAuthorized(request)) return errorResponse(401, "unauthorized", "Not allowed.");
    const summary = await refreshExpiringTokens();
    if (summary.failed > 0) {
      await reportError({
        route: ROUTE,
        message: `${summary.failed} Instagram token refresh(es) failed (checked ${summary.checked}, refreshed ${summary.refreshed}, needs reconnect ${summary.needsReconnect}).`,
      });
    }
    return Response.json(summary);
  }, ROUTE);
}
