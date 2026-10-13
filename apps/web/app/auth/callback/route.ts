import { NextResponse } from "next/server";
import { safeNextPath } from "@/server/auth/config";
import { createSupabaseServerClient } from "@/server/auth/session";
import { claimGuestSites } from "@/server/guest";

/**
 * Volta do link de confirmação de e-mail e do login social (Google/Apple): troca o `code` por
 * uma sessão, passa para a conta os sites feitos sem conta e segue para `next`.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  if (code && supabase) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user) {
        try {
          await claimGuestSites(data.user.id);
        } catch (claimError) {
          // Nunca bloqueia o login por causa disso.
          console.error("Could not move guest sites to the account", claimError);
        }
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  // O provedor social também pode voltar com ?error=... (ex.: a pessoa cancelou).
  const reason = url.searchParams.get("error") ? "oauth" : "confirm";
  return NextResponse.redirect(
    new URL(`/login?error=${reason}&next=${encodeURIComponent(next)}`, url.origin),
  );
}
