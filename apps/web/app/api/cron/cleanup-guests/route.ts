import { sendAccessReminders, type ReminderSummary } from "@/server/billing/reminders";
import { isCronAuthorized } from "@/server/cron";
import { errorResponse, handle } from "@/server/http";
import { reportError } from "@/server/notify/alert";
import { getSiteStore } from "@/server/store";

// O cookie do visitante dura 30 dias: depois disso ninguém mais consegue abrir o site.
const GUEST_SITE_MAX_AGE_DAYS = 30;
const ROUTE = "/api/cron/cleanup-guests";

/** Resumo curto das falhas dos lembretes (`null` = nada falhou). */
function reminderFailures(reminders: ReminderSummary | { error: string }): string | null {
  if ("error" in reminders) return reminders.error;
  const problems: string[] = [];
  if (reminders.failed > 0) problems.push(`${reminders.failed} access reminder email(s) failed`);
  if (reminders.digest === "failed") problems.push("the digest email to SALES_EMAIL failed");
  return problems.length > 0 ? `${problems.join("; ")}.` : null;
}

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
    const failures = reminderFailures(reminders);
    if (failures) await reportError({ route: ROUTE, message: failures });
    return Response.json({ deleted, reminders });
  }, ROUTE);
}
