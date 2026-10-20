import { ClientResponse, ClientStage, ClientsResponse, CreateClientRequest } from "@nosweat/schema";
import { getCurrentUser } from "@/server/auth/session";
import { createClient, listClients } from "@/server/clients/service";
import { errorResponse, handle, jsonResponse, readJson, unauthorized } from "@/server/http";

/** GET /api/clients?stage=&q=: clientes do dono (pedidos novos do site entram antes). */
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

    // O e-mail da conta separa o pedido de teste do próprio dono (não vira cliente).
    const clients = await listClients(user.id, { stage, q, ownerEmail: user.email });
    return jsonResponse(ClientsResponse, { clients });
  }, "/api/clients");
}

/** POST /api/clients: cadastro manual de um cliente. */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const input = await readJson(request, CreateClientRequest);
    if (!input.ok) return input.response;
    const client = await createClient(user.id, input.data);
    return jsonResponse(ClientResponse, { client }, 201);
  }, "/api/clients");
}
