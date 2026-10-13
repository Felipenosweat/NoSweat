import { NextResponse } from "next/server";
import { hasCompleteProfile } from "@/lib/signup-rules";
import { safeNextPath } from "@/server/auth/config";
import { createSupabaseServerClient } from "@/server/auth/session";
import { claimGuestSites } from "@/server/guest";
import { joinLaunchListLater, marketingFromMetadata } from "@/server/marketing";

/**
 * Volta do link de confirmação de e-mail e do login social (Google/Apple): troca o `code` por
 * uma sessão, passa para a conta os sites feitos sem conta e segue para `next`.
 * Quem entrou pelo Google/Apple ainda não deu nome e data de nascimento: vai para /welcome.
 * Quem marcou "Email me about the launch" entra na lista aqui (e-mail já confirmado).
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
      const metadata = data.user?.user_metadata;
      if (data.user && hasCompleteProfile(metadata)) {
        joinLaunchListLater({
          userId: data.user.id,
          email: data.user.email ?? null,
          ...marketingFromMetadata(metadata),
          origin: url.origin,
        });
        return NextResponse.redirect(new URL(next, url.origin));
      }
      return NextResponse.redirect(
        new URL(`/welcome?next=${encodeURIComponent(next)}`, url.origin),
      );
    }
  }
  // O provedor social também pode voltar com ?error=... (ex.: a pessoa cancelou).
  const reason = url.searchParams.get("error") ? "oauth" : "confirm";
  return NextResponse.redirect(
    new URL(`/login?error=${reason}&next=${encodeURIComponent(next)}`, url.origin),
  );
}
