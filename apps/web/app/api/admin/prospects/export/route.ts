import { errorResponse, handle } from "@/server/http";
import { requireAdminApi } from "@/server/models/http";
import { appOrigin } from "@/server/notify";
import { exportRows, prospectsToCsv, type ExportKind } from "@/server/prospects/csv";
import { ensureFresh } from "@/server/prospects/service";
import { getProspectStore } from "@/server/prospects/store";

// Renovar no Places o que passou de 30 dias pode levar alguns segundos.
export const maxDuration = 120;

/**
 * GET /api/admin/prospects/export?kind=email|calls → CSV (anexo).
 * - email: e-mail, empresa, ramo, cidade, estado, link da prévia, status do site (para a
 *   ferramenta de e-mail frio). Só quem tem e-mail e não é "do not contact".
 * - calls: nome, telefone, cidade, link da prévia de quem não tem e-mail.
 * Antes de exportar, os dados do Places com mais de 30 dias são renovados (ver service.ts).
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const raw = new URL(request.url).searchParams.get("kind") ?? "email";
    if (raw !== "email" && raw !== "calls") {
      return errorResponse(400, "invalid_request", "Use kind=email or kind=calls.");
    }
    const kind: ExportKind = raw;
    const all = await getProspectStore().list();
    // Renovar pode mudar o status (empresa que sumiu do Google vira "do not contact"): filtra de novo.
    const fresh = await ensureFresh(exportRows(all, kind));
    // O link da prévia aponta para o endereço oficial em produção (NEXT_PUBLIC_SITE_URL).
    const origin = process.env.NEXT_PUBLIC_SITE_URL || appOrigin(request.url);
    const csv = prospectsToCsv(fresh, kind, origin);
    const day = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="prospects-${kind}-${day}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }, "/api/admin/prospects/export");
}
