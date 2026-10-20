import { NextResponse } from "next/server";
import { hasCompleteProfile } from "@/lib/signup-rules";
import { safeNextPath } from "@/server/auth/config";
import { createSupabaseServerClient } from "@/server/auth/session";
import { claimGuestSitesForUser } from "@/server/guest";
import { joinLaunchListLater, marketingFromMetadata } from "@/server/marketing";

// Tipos de link de e-mail aceitos no `?type=` (verificação por token_hash).
const OTP_TYPES = ["email", "signup", "recovery", "email_change"] as const;
type OtpType = (typeof OTP_TYPES)[number];

const isOtpType = (value: string | null): value is OtpType =>
  value !== null && (OTP_TYPES as readonly string[]).includes(value);

// Erros que querem dizer "o link do e-mail não vale mais" (venceu, já foi usado ou foi aberto em
// outro navegador). Qualquer outro `?error=` vem do login social (ex.: a pessoa cancelou).
const LINK_ERRORS = new Set([
  "otp_expired",
  "otp_disabled",
  "flow_state_expired",
  "flow_state_not_found",
]);

/** Usuário do Supabase Auth (só o que importa aqui). */
type CallbackUser = {
  id: string;
  email?: string | undefined;
  user_metadata?: unknown;
  app_metadata?: unknown;
};

/**
 * Volta dos links de e-mail (confirmação do cadastro, nova senha) e do login social
 * (Google/Apple). Dois jeitos de provar quem é:
 * - `token_hash` + `type` (modelo de e-mail do Supabase com {{ .TokenHash }}): funciona em
 *   qualquer navegador, inclusive no do app de e-mail do celular;
 * - `code` (PKCE, login social e o modelo padrão): só no navegador que começou o fluxo.
 * Depois: passa para a conta os sites feitos sem conta e segue para `next`. Quem entrou pelo
 * Google/Apple ainda não deu nome e data de nascimento: vai para /welcome. Quem marcou o
 * opt-in de e-mails entra na lista aqui (e-mail já confirmado).
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeNextPath(url.searchParams.get("next"));
  const recovery = type === "recovery" || next.startsWith("/reset-password");

  const supabase = await createSupabaseServerClient();
  let user: CallbackUser | null = null;
  let failedCode: string | undefined;

  if (supabase && tokenHash && isOtpType(type)) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) failedCode = error.code ?? "otp_expired";
    else user = data.user;
  } else if (supabase && code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) failedCode = error.code ?? "flow_state_not_found";
    else user = data.user;
  }

  if (user) {
    // Nunca lança: uma falha ao passar os sites não bloqueia o login.
    await claimGuestSitesForUser(user);
    const metadata = user.user_metadata;
    if (hasCompleteProfile(metadata)) {
      joinLaunchListLater({
        userId: user.id,
        email: user.email ?? null,
        ...marketingFromMetadata(metadata),
        origin: url.origin,
      });
      return redirectTo(next, url.origin);
    }
    return redirectTo(`/welcome?next=${encodeURIComponent(next)}`, url.origin);
  }

  if (failedCode) console.error("[auth] callback failed", failedCode);

  // Link de nova senha que não vale mais: volta para pedir outro.
  if (recovery) return redirectTo("/forgot-password?error=expired", url.origin);

  const errorParam = url.searchParams.get("error");
  const errorCode = url.searchParams.get("error_code") ?? failedCode ?? "";
  const reason = !errorParam || LINK_ERRORS.has(errorCode) ? "confirm" : "oauth";
  return redirectTo(`/login?error=${reason}&next=${encodeURIComponent(next)}`, url.origin);
}

/** Redireciona só para um caminho deste mesmo site (nunca para outro domínio). */
function redirectTo(path: string, origin: string): Response {
  const target = new URL(path, origin);
  return NextResponse.redirect(target.origin === origin ? target : new URL("/dashboard", origin));
}
