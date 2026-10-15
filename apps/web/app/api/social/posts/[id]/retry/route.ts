import { SocialPostResponse } from "@nosweat/schema";
import { errorResponse, handle, jsonResponse, notFound } from "@/server/http";
import { approvePosts, requireSocialUser } from "@/server/social/api";
import { toPublicPost } from "@/server/social/service";
import { getSocialStore } from "@/server/social/store";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/social/posts/[id]/retry: tenta de novo um post que falhou ou ficou pausado. Se a hora
 * já passou, o dono precisa escolher outra (PATCH) antes.
 */
export async function POST(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const { id } = await params;
    const post = await getSocialStore().getPost(user.id, id);
    if (!post) return notFound("Post");
    if (post.status !== "failed" && post.status !== "paused") {
      return errorResponse(409, "invalid_request", "Only failed or paused posts can be retried.");
    }
    const result = await approvePosts(user, [id]);
    if ("response" in result) return result.response;
    const updated = result.posts[0];
    if (!updated)
      return errorResponse(409, "invalid_request", "This post changed. Reload and try again.");
    return jsonResponse(SocialPostResponse, { post: toPublicPost(updated) });
  });
}
