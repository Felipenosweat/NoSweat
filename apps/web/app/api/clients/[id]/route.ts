import { ClientDetailResponse, ClientResponse, UpdateClientRequest } from "@nosweat/schema";
import { getCurrentUser } from "@/server/auth/session";
import { deleteClient, getClientDetail, updateClient } from "@/server/clients/service";
import { handle, jsonResponse, notFound, readJson, unauthorized } from "@/server/http";

type Context = { params: Promise<{ id: string }> };

/** GET /api/clients/[id]: cliente + histórico (cliente de outra pessoa = 404). */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const detail = await getClientDetail(user.id, id);
    if (!detail) return notFound("Client");
    return jsonResponse(ClientDetailResponse, detail);
  });
}

/** PATCH /api/clients/[id]: muda dados, etapa ou retorno. Mudança de etapa entra no histórico. */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const input = await readJson(request, UpdateClientRequest);
    if (!input.ok) return input.response;
    const client = await updateClient(user.id, id, input.data);
    if (!client) return notFound("Client");
    return jsonResponse(ClientResponse, { client });
  });
}

/** DELETE /api/clients/[id] → { ok: true }. Apaga o cliente e o histórico dele. */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    if (!(await deleteClient(user.id, id))) return notFound("Client");
    return Response.json({ ok: true });
  });
}
