import { CaptionRequest, CaptionResponse } from "@nosweat/schema";
import { errorResponse, handle, jsonResponse, readJson } from "@/server/http";
import { refundUse, reserveUse } from "@/server/quota";
import { requireSocialUser } from "@/server/social/api";
import { SocialAiError, getPostPlanner } from "@/server/social/ai";
import { buildBusinessContext } from "@/server/social/context";
import { getSocialStore } from "@/server/social/store";

export const maxDuration = 60;

/** POST /api/social/caption: a IA escreve a legenda a partir de uma ideia, ou reescreve a atual. */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const input = await readJson(request, CaptionRequest);
    if (!input.ok) return input.response;
    const req = input.data;
    if (req.action === "write" && !req.idea?.trim() && !req.currentCaption?.trim()) {
      return errorResponse(400, "invalid_request", "Tell us what the post is about.");
    }
    if (req.action !== "write" && !req.currentCaption?.trim()) {
      return errorResponse(400, "invalid_request", "Write a caption first.");
    }

    const settings = await getSocialStore().getSettings(user.id);
    const ctx = await buildBusinessContext(user.id, req.siteId ?? settings.defaultSiteId);
    if (!ctx) {
      return errorResponse(
        400,
        "invalid_request",
        "Create your website first: we use it to write your posts.",
      );
    }

    const actor = { kind: "user" as const, user };
    const limited = await reserveUse(actor, "social_caption", ctx.siteId);
    if (limited) return limited;

    try {
      return jsonResponse(CaptionResponse, await getPostPlanner().writeCaption(ctx, req));
    } catch (error) {
      // A IA falhou: os créditos voltam para a conta.
      await refundUse(actor, "social_caption");
      if (error instanceof SocialAiError) {
        return errorResponse(
          502,
          "social_error",
          "We couldn't write this caption right now. Please try again.",
        );
      }
      throw error;
    }
  }, "/api/social/caption");
}
