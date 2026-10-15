import { isCronAuthorized } from "@/server/cron";
import { errorResponse, handle } from "@/server/http";
import { publishDuePosts } from "@/server/social/publisher";

// O publicador tem um limite de tempo próprio (240 s) abaixo deste.
export const maxDuration = 300;

/**
 * GET /api/cron/social-publish: publica no Instagram os posts aprovados que chegaram na hora.
 * Roda a cada minuto pelo Cron da Vercel (vercel.json), com `Authorization: Bearer CRON_SECRET`.
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    if (!isCronAuthorized(request)) return errorResponse(401, "unauthorized", "Not allowed.");
    const summary = await publishDuePosts();
    return Response.json(summary);
  });
}
