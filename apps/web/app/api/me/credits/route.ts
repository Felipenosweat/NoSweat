import { CreditsResponse } from "@nosweat/schema";
import { handle, jsonResponse } from "@/server/http";

// TODO(back): ler créditos e plano do usuário logado (Supabase). Por enquanto é fixo.
export async function GET(): Promise<Response> {
  return handle(async () => jsonResponse(CreditsResponse, { remaining: 10, plan: "trial" }));
}
