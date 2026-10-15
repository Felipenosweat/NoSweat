import { SocialPostResponse } from "@nosweat/schema";
import { after } from "next/server";
import { errorResponse, handle, jsonResponse } from "@/server/http";
import { approvePosts, requireSocialUser } from "@/server/social/api";
import { publishOne } from "@/server/social/publisher";
import { toPublicPost } from "@/server/social/service";

type Context = { params: Promise<{ id: string }> };

/** Publica logo depois da resposta (fora de um request do Next, como nos testes, já dispara). */
function publishSoon(postId: string): void {
  const task = async () => {
    try {
      await publishOne(postId);
    } catch (error) {
      console.error("[social] publish-now failed", error);
    }
  };
  try {
    after(task);
  } catch {
    void task();
  }
}

/**
 * POST /api/social/posts/[id]/publish-now: aprova e publica agora. O publicador "pega" o post de
 * forma atômica, então o cron do minuto nunca publica o mesmo post de novo.
 */
export async function POST(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const { id } = await params;
    const result = await approvePosts(user, [id], { publishNow: true });
    if ("response" in result) return result.response;
    const post = result.posts[0];
    if (!post)
      return errorResponse(409, "invalid_request", "This post changed. Reload and try again.");
    publishSoon(post.id);
    return jsonResponse(SocialPostResponse, { post: toPublicPost(post) });
  });
}
