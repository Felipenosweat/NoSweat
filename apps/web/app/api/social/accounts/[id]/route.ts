import { SocialStateResponse } from "@nosweat/schema";
import { handle, jsonResponse, notFound } from "@/server/http";
import { disconnectAccount } from "@/server/social/accounts";
import { getSocialState, requireSocialUser } from "@/server/social/api";
import { getSocialStore } from "@/server/social/store";

type Context = { params: Promise<{ id: string }> };

/** DELETE /api/social/accounts/[id]: desconecta (apaga o token e pausa os posts na fila). */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const { id } = await params;
    const account = await getSocialStore().getAccount(id);
    if (!account || account.ownerId !== user.id) return notFound("Account");
    if (account.status !== "revoked") await disconnectAccount(account, user.id, "disconnect");
    return jsonResponse(SocialStateResponse, await getSocialState(user));
  });
}
