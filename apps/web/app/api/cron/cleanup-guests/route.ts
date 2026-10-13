import { timingSafeEqual } from "node:crypto";
import { errorResponse, handle } from "@/server/http";
import { getSiteStore } from "@/server/store";

// O cookie do visitante dura 30 dias: depois disso ninguém mais consegue abrir o site.
const GUEST_SITE_MAX_AGE_DAYS = 30;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * GET /api/cron/cleanup-guests: apaga sites criados sem conta e abandonados (mais de 30 dias).
 * Roda todo dia pelo Cron da Vercel (vercel.json), que manda `Authorization: Bearer CRON_SECRET`.
 * Sem a variável CRON_SECRET configurada, a rota recusa tudo.
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    if (!authorized(request)) return errorResponse(401, "unauthorized", "Not allowed.");
    const before = new Date(Date.now() - GUEST_SITE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    const deleted = await getSiteStore().deleteAbandonedGuestSites(before.toISOString());
    return Response.json({ deleted });
  });
}
