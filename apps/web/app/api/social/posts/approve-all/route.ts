import { ApproveAllDraftsRequest, ApproveAllDraftsResponse } from "@nosweat/schema";
import { handle, jsonResponse, readJson } from "@/server/http";
import { approveAllDrafts, requireSocialUser } from "@/server/social/api";
import { toPublicPost } from "@/server/social/service";

/**
 * POST /api/social/posts/approve-all { month }: o dono aprova de uma vez os rascunhos prontos do
 * mês (Pro e Premium). O que não dá para aprovar fica como rascunho e vem contado na resposta.
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const input = await readJson(request, ApproveAllDraftsRequest);
    if (!input.ok) return input.response;
    const outcome = await approveAllDrafts(user, input.data.month);
    if ("response" in outcome) return outcome.response;
    return jsonResponse(ApproveAllDraftsResponse, {
      posts: outcome.result.posts.map(toPublicPost),
      leftAsDrafts: outcome.result.leftAsDrafts,
    });
  }, "/api/social/posts/approve-all");
}
