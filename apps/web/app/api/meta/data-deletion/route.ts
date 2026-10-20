import { randomBytes } from "node:crypto";
import { errorResponse, handle } from "@/server/http";
import { appOrigin } from "@/server/notify";
import { readSignedRequest } from "@/server/social/meta-signed-request";
import { getSocialStore } from "@/server/social/store";

/**
 * Pedido de exclusão de dados da Meta (Data Deletion Callback). Apaga na hora o token, os posts e
 * a conta ligados a esse usuário do Instagram, registra o pedido e responde no formato exigido
 * pela Meta: { url, confirmation_code } (a URL mostra o status em /data-deletion).
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const payload = await readSignedRequest(request);
    if (!payload) return errorResponse(400, "invalid_request", "Invalid signed request.");

    const store = getSocialStore();
    const accounts = await store.findAccountsByAppScopedId("instagram", payload.user_id);
    for (const account of accounts) {
      // Primeiro some o token (se algo falhar depois, o acesso já foi apagado).
      await store.updateAccount(account.id, {
        accessTokenEnc: null,
        tokenKeyVersion: null,
        status: "revoked",
        revokedAt: new Date().toISOString(),
      });
      await store.deletePostsByAccount(account.id);
      await store.deleteAccount(account.id);
      await store.logEvent({
        ownerId: account.ownerId,
        action: "deletion_request",
        detail: { provider: account.provider },
      });
    }

    const code = randomBytes(9).toString("hex");
    await store.createDeletionRequest({
      provider: "instagram",
      externalUserId: payload.user_id,
      confirmationCode: code,
      status: "completed",
      completedAt: new Date().toISOString(),
    });
    return Response.json({
      url: `${appOrigin(request.url)}/data-deletion?code=${code}`,
      confirmation_code: code,
    });
  }, "/api/meta/data-deletion");
}
