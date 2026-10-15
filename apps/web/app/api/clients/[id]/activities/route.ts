import { ClientActivityResponse, CreateClientActivityRequest } from "@nosweat/schema";
import { getCurrentUser } from "@/server/auth/session";
import { addClientActivity } from "@/server/clients/service";
import { handle, jsonResponse, notFound, readJson, unauthorized } from "@/server/http";

type Context = { params: Promise<{ id: string }> };

/** POST /api/clients/[id]/activities: nota ou serviço feito (o valor só vale para serviço). */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const input = await readJson(request, CreateClientActivityRequest);
    if (!input.ok) return input.response;
    const result = await addClientActivity(user.id, id, input.data);
    if (!result) return notFound("Client");
    return jsonResponse(ClientActivityResponse, result, 201);
  });
}
