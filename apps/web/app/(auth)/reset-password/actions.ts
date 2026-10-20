"use server";

import { redirect } from "next/navigation";
import { PASSWORD_MAX, passwordProblems } from "@/lib/signup-rules";
import { createSupabaseServerClient } from "@/server/auth/session";

export type ResetPasswordState = {
  error?: string;
  fieldErrors?: { password?: string; passwordConfirm?: string };
  /** Conta os envios (troca o `key` do formulário). */
  attempt?: number;
};

/**
 * Grava a senha nova de quem chegou pelo link de "Forgot password?" (a sessão de recuperação
 * vem do /auth/callback). Depois, encerra as sessões dos outros aparelhos e vai para o painel.
 */
export async function updatePassword(
  prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/dashboard"); // login desligado no dev local

  const attempt = (prev.attempt ?? 0) + 1;
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  const fieldErrors: NonNullable<ResetPasswordState["fieldErrors"]> = {};
  const problems = passwordProblems(password);
  if (!password) fieldErrors.password = "Please create a password.";
  else if (password.length > PASSWORD_MAX)
    fieldErrors.password = `Password must be at most ${PASSWORD_MAX} characters.`;
  else if (problems.length > 0)
    fieldErrors.password = `Your password needs: ${problems.join(", ").toLowerCase()}.`;
  if (!passwordConfirm) fieldErrors.passwordConfirm = "Please type your password again.";
  else if (password !== passwordConfirm) fieldErrors.passwordConfirm = "The passwords don’t match.";
  if (fieldErrors.password || fieldErrors.passwordConfirm) {
    return { attempt, fieldErrors, error: "Please fix the highlighted fields." };
  }

  // O link venceu ou a pessoa saiu da conta no meio do caminho: pede outro link.
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/forgot-password?error=expired");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    switch (error.code) {
      case "same_password":
        return {
          attempt,
          fieldErrors: { password: "Please choose a password you haven’t used here before." },
          error: "Please fix the highlighted fields.",
        };
      case "weak_password":
        return {
          attempt,
          fieldErrors: {
            password: "That password is too easy to guess or has appeared in a data breach.",
          },
          error: "Please choose a different password.",
        };
      case "reauthentication_needed":
      case "session_not_found":
      case "session_expired":
        return redirect("/forgot-password?error=expired");
      case "over_request_rate_limit":
        return {
          attempt,
          error: "Too many attempts. Please wait a few minutes and try again.",
        };
      default:
        console.error("[auth] password update failed", error.code ?? "no_code", error.status);
        return { attempt, error: "Something went wrong. Please try again in a minute." };
    }
  }

  // A senha mudou: quem estiver logado em outro aparelho (talvez quem descobriu a senha antiga)
  // sai. Esta sessão continua.
  const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
  if (signOutError) console.error("[auth] could not sign out other sessions", signOutError.code);
  redirect("/dashboard");
}
