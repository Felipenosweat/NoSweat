import { SocialStateResponse } from "@nosweat/schema";
import { handle, jsonResponse } from "@/server/http";
import { getSocialState, requireSocialUser } from "@/server/social/api";

/** GET /api/social/state: conta ligada, preferências, o que dá para fazer, uso do plano e da IA. */
export async function GET(): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    return jsonResponse(SocialStateResponse, await getSocialState(user));
  });
}
