import { isCronAuthorized } from "@/server/cron";
import { errorResponse, handle } from "@/server/http";
import { reportError } from "@/server/notify/alert";
import { runAutopilot } from "@/server/social/autopilot";

// Planejar o mês com a IA leva ~1 min por dono; o Piloto automático para antes de 240 s.
export const maxDuration = 300;

const ROUTE = "/api/cron/social-autopilot";

/**
 * GET /api/cron/social-autopilot: Piloto automático do Instagram (Premium). Aprova os rascunhos
 * avisados que chegaram perto da hora, manda o e-mail de aviso do dia e, do dia 25 em diante,
 * planeja o mês seguinte. Chamada a cada 15 min pelo pg_cron do Supabase (migration 0035); o
 * Cron da Vercel roda 1x por dia como reserva. Os dois mandam `Authorization: Bearer CRON_SECRET`.
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    if (!isCronAuthorized(request)) return errorResponse(401, "unauthorized", "Not allowed.");
    const summary = await runAutopilot();
    if (summary.errors > 0) {
      await reportError({
        route: ROUTE,
        message: `Autopilot failed for ${summary.errors} owner(s) (owners ${summary.owners}, approved ${summary.approved}, digests ${summary.digests}, planned ${summary.planned}).`,
      });
    }
    return Response.json(summary);
  }, ROUTE);
}
