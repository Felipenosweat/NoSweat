import { PlanMonthRequest, PlanMonthResponse } from "@nosweat/schema";
import { handle, jsonResponse, readJson } from "@/server/http";
import { requireSocialUser } from "@/server/social/api";
import { planMonthForOwner } from "@/server/social/plan";
import { toPublicPost } from "@/server/social/service";

// A IA pode levar até ~1 min para montar o mês.
export const maxDuration = 300;

/**
 * POST /api/social/plan { month, postsPerWeek, siteId? }: a IA monta os posts do mês a partir do
 * site do dono. Tudo vira RASCUNHO: nada é aprovado nem publicado sem o dono. O Piloto automático
 * usa o mesmo caminho (`planMonthForOwner`), com os mesmos créditos.
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const input = await readJson(request, PlanMonthRequest);
    if (!input.ok) return input.response;
    const result = await planMonthForOwner(user, input.data, { via: "button" });
    if (!result.ok) return result.response;
    return jsonResponse(PlanMonthResponse, { posts: result.posts.map(toPublicPost) }, 201);
  }, "/api/social/plan");
}
