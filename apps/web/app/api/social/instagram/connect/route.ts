import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { socialBlocked } from "@/server/billing";
import { canAutoPublish, getInstagramClient } from "@/server/social/config";
import { socialCryptoConfigured } from "@/server/social/crypto";
import { createOAuthState, OAUTH_STATE_COOKIE, OAUTH_STATE_TTL_S } from "@/server/social/oauth";
import { getSocialStore } from "@/server/social/store";

/**
 * Botão "Connect Instagram": confere conta, plano e liberação, grava o `state` num cookie e manda
 * o navegador para a tela de autorização do Instagram (no modo de mentira, direto para o callback).
 */
export async function GET(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;
  const go = (path: string) => NextResponse.redirect(new URL(path, origin), 302);
  try {
    const user = await getCurrentUser();
    if (!user) return go("/login?next=/social");
    if (await socialBlocked(user)) return go("/billing?from=social");

    const client = getInstagramClient();
    if (!client || !socialCryptoConfigured()) return go("/social?error=not_available");
    const settings = await getSocialStore().getSettings(user.id);
    if (!(await canAutoPublish(user, settings))) return go("/social?error=not_available");

    const { state, cookieValue } = createOAuthState(user.id);
    const response = NextResponse.redirect(new URL(client.authorizeUrl(state), origin), 302);
    response.cookies.set(OAUTH_STATE_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: OAUTH_STATE_TTL_S,
      path: "/api/social/instagram",
    });
    return response;
  } catch (error) {
    console.error("[social] could not start the Instagram connection", error);
    return go("/social?error=instagram");
  }
}
