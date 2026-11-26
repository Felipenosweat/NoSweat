import { WalkInRequest, WalkInResponse } from "@nosweat/schema";
import { jsonResponse, readJson } from "@/server/http";
import { ownerRoute } from "@/server/office/api";
import { createWalkIn } from "@/server/office/walk-in";

/** POST /api/office/walk-in: cliente sem hora marcada. Cria o serviço que bloqueia o horário. */
export async function POST(request: Request): Promise<Response> {
  return ownerRoute("/api/office/walk-in", async (user) => {
    const input = await readJson(request, WalkInRequest);
    if (!input.ok) return input.response;
    const job = await createWalkIn(user.id, input.data);
    return jsonResponse(WalkInResponse, { job }, 201);
  });
}
