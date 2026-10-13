import { NextResponse } from "next/server";
import { safeNextPath } from "@/server/auth/config";
import { createSupabaseServerClient } from "@/server/auth/session";

/** Destino do link de confirmação de e-mail: troca o `code` por uma sessão e segue para `next`. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=confirm", url.origin));
}
