import { ClientStage } from "@nosweat/schema";
import { dateKeyIn, isClientSort, sortClients } from "@/lib/clients";
import { getCurrentUser } from "@/server/auth/session";
import { clientsToCsv } from "@/server/clients/csv";
import { clientsTimeZone, listClients } from "@/server/clients/service";
import { errorResponse, handle, unauthorized } from "@/server/http";

/**
 * GET /api/clients/export?stage=&q=&sort= → CSV com os clientes do dono (anexo para baixar).
 * Só os clientes da conta logada (a página esconde o botão no modo "ver como" do admin).
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const params = new URL(request.url).searchParams;
    const rawStage = params.get("stage");
    let stage: ClientStage | undefined;
    if (rawStage) {
      const parsed = ClientStage.safeParse(rawStage);
      if (!parsed.success) return errorResponse(400, "invalid_request", "Invalid stage.");
      stage = parsed.data;
    }
    const q = params.get("q")?.slice(0, 200) || undefined;
    const rawSort = params.get("sort") ?? "";
    const sort = isClientSort(rawSort) ? rawSort : "recent";

    const [timeZone, clients] = await Promise.all([
      clientsTimeZone(user.id),
      listClients(user.id, { stage, q, ownerEmail: user.email }),
    ]);
    const csv = clientsToCsv(sortClients(clients, sort), timeZone);
    const filename = `clients-${dateKeyIn(timeZone, new Date())}.csv`;
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }, "/api/clients/export");
}
