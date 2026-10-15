import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { connectInstagramAccount, SocialConnectError } from "@/server/social/accounts";
import { InstagramError } from "@/server/social/client";
import { getInstagramClient } from "@/server/social/config";
import { OAUTH_STATE_COOKIE, verifyOAuthState } from "@/server/social/oauth";

/**
 * Volta da tela de autorização do Instagram. Erros voltam como /social?error=<code>:
 * cancelled, state, not_available, missing_permission, not_business, account_in_use,
 * instagram_auth, instagram.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const go = (path: string) => {
    const response = NextResponse.redirect(new URL(path, url.origin), 302);
    // O state vale uma vez só.
    response.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/api/social/instagram",
    });
    return response;
  };

  // A pessoa cancelou (ou o Instagram recusou) na tela de autorização.
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    const denied =
      oauthError === "access_denied" || url.searchParams.get("error_reason") === "user_denied";
    return go(`/social?error=${denied ? "cancelled" : "instagram"}`);
  }

  try {
    const user = await getCurrentUser();
    if (!user) return go("/login?next=/social");

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookie = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
    if (!code || !verifyOAuthState(state, cookie, user.id)) return go("/social?error=state");

    const client = getInstagramClient();
    if (!client) return go("/social?error=not_available");

    await connectInstagramAccount({ user, client, code });
    return go("/social?connected=1");
  } catch (error) {
    if (error instanceof SocialConnectError) return go(`/social?error=${error.code}`);
    if (error instanceof InstagramError) {
      return go(`/social?error=${error.kind === "auth" ? "instagram_auth" : "instagram"}`);
    }
    console.error("[social] Instagram connection failed", error);
    return go("/social?error=instagram");
  }
}
