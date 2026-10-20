import { sendAccessReminders, type ReminderSummary } from "@/server/billing/reminders";
import { isCronAuthorized } from "@/server/cron";
import { errorResponse, handle } from "@/server/http";
import { getSiteStore } from "@/server/store";

// O cookie do visitante dura 30 dias: depois disso ninguém mais consegue abrir o site.
const GUEST_SITE_MAX_AGE_DAYS = 30;

/**
 * GET /api/cron/cleanup-guests: a faxina diária. Apaga sites criados sem conta e abandonados
 * (mais de 30 dias) e manda os lembretes de vencimento do acesso manual (server/billing/reminders.ts).
 * Roda todo dia pelo Cron da Vercel (vercel.json), que manda `Authorization: Bearer CRON_SECRET`.
 * Sem a variável CRON_SECRET configurada, a rota recusa tudo.
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    if (!isCronAuthorized(request)) return errorResponse(401, "unauthorized", "Not allowed.");
    const before = new Date(Date.now() - GUEST_SITE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    const deleted = await getSiteStore().deleteAbandonedGuestSites(before.toISOString());
    // Uma falha nos lembretes não desfaz a faxina: vai para o log e para o resumo.
    let reminders: ReminderSummary | { error: string };
    try {
      reminders = await sendAccessReminders();
    } catch (error) {
      console.error("[cron] access reminders failed", error);
      reminders = { error: "Access reminders failed. See the server log." };
    }
    return Response.json({ deleted, reminders });
  });
}
