import { ClientResponse, ClientSmsOptOutRequest } from "@nosweat/schema";
import { getCurrentUser } from "@/server/auth/session";
import { setSmsOptOut } from "@/server/clients/service";
import { handle, jsonResponse, notFound, readJson, unauthorized } from "@/server/http";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/clients/[id]/sms-opt-out { optedOut } → { client }: o cliente respondeu STOP aos textos
 * (`true`) ou o dono desfez (`false`). Só o dono do cliente (sem login = 401; cliente de outra
 * pessoa = 404). Marca o cliente com a data e guarda uma nota no histórico; a partir daí ele não
 * aparece mais na lista de lembretes por texto. No modo "ver como" do admin o proxy recusa (403).
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const input = await readJson(request, ClientSmsOptOutRequest);
    if (!input.ok) return input.response;
    const client = await setSmsOptOut(user.id, id, input.data.optedOut);
    if (!client) return notFound("Client");
    return jsonResponse(ClientResponse, { client });
  }, "/api/clients/[id]/sms-opt-out");
}
