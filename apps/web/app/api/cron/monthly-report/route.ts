import { isCronAuthorized } from "@/server/cron";
import { errorResponse, handle } from "@/server/http";
import { reportError } from "@/server/notify/alert";
import { sendMonthlyReports } from "@/server/visits/report";

const ROUTE = "/api/cron/monthly-report";

// Muitas contas = muitos e-mails em sequência.
export const maxDuration = 300;

/**
 * GET /api/cron/monthly-report: no dia 1, manda para cada dono o resumo do mês que acabou
 * (visitas, pedidos e marcações; server/visits/report.ts). Roda pelo Cron da Vercel
 * (vercel.json), que manda `Authorization: Bearer CRON_SECRET`. Sem CRON_SECRET, recusa tudo.
 * Rodar de novo no mesmo mês não repete e-mail (tabela monthly_reports).
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    if (!isCronAuthorized(request)) return errorResponse(401, "unauthorized", "Not allowed.");
    const summary = await sendMonthlyReports();
    if (summary.failed > 0) {
      await reportError({
        route: ROUTE,
        message: `${summary.failed} monthly report email(s) failed for ${summary.month}.`,
      });
    }
    return Response.json(summary);
  }, ROUTE);
}
