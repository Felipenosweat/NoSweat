import { isCronAuthorized } from "@/server/cron";
import { errorResponse, handle } from "@/server/http";
import { reportError } from "@/server/notify/alert";
import { publishDuePosts } from "@/server/social/publisher";

// O publicador tem um limite de tempo próprio (240 s) abaixo deste.
export const maxDuration = 300;

const ROUTE = "/api/cron/social-publish";

/**
 * GET /api/cron/social-publish: publica no Instagram os posts aprovados que chegaram na hora.
 * Chamada a cada minuto pelo pg_cron do Supabase (o Cron da Vercel no plano Hobby só roda 1x por
 * dia, como reserva). Os dois mandam `Authorization: Bearer CRON_SECRET`.
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    if (!isCronAuthorized(request)) return errorResponse(401, "unauthorized", "Not allowed.");
    const summary = await publishDuePosts();
    // Post que falhou avisa a equipe (o dono já recebe o próprio e-mail). Nunca lança.
    if (summary.failed > 0) {
      await reportError({
        route: ROUTE,
        message: `${summary.failed} Instagram post(s) failed to publish (claimed ${summary.claimed}, published ${summary.published}, retried ${summary.retried}, paused ${summary.paused}, missed ${summary.missed}).`,
      });
    }
    return Response.json(summary);
  }, ROUTE);
}
