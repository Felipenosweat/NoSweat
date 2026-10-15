import { ApproveSocialPostsRequest, SocialPostsResponse } from "@nosweat/schema";
import { handle, jsonResponse, readJson } from "@/server/http";
import { approvePosts, requireSocialUser } from "@/server/social/api";
import { toPublicPost } from "@/server/social/service";

/**
 * POST /api/social/posts/approve { ids }: o dono aprova um ou vários posts. Com o Instagram
 * conectado eles entram na fila; sem, ficam prontos para postar à mão.
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const input = await readJson(request, ApproveSocialPostsRequest);
    if (!input.ok) return input.response;
    const result = await approvePosts(user, input.data.ids);
    if ("response" in result) return result.response;
    return jsonResponse(SocialPostsResponse, { posts: result.posts.map(toPublicPost) });
  });
}
