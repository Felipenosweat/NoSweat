import { errorResponse, handle } from "@/server/http";
import { disconnectAccount } from "@/server/social/accounts";
import { readSignedRequest } from "@/server/social/meta-signed-request";
import { getSocialStore } from "@/server/social/store";

/**
 * Aviso da Meta: a pessoa tirou o acesso da No Sweat no Instagram. Apaga o token, marca a conta
 * como revogada e pausa os posts (igual a "Disconnect").
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const payload = await readSignedRequest(request);
    if (!payload) return errorResponse(400, "invalid_request", "Invalid signed request.");

    const store = getSocialStore();
    const accounts = await store.findAccountsByAppScopedId("instagram", payload.user_id);
    for (const account of accounts) {
      if (account.status === "revoked") continue;
      await disconnectAccount(account, null, "deauthorize");
    }
    if (accounts.length === 0) {
      await store.logEvent({ ownerId: null, action: "deauthorize", detail: { matched: 0 } });
    }
    return Response.json({ ok: true });
  });
}
