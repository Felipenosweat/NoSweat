import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createSupabaseServerClient } from "@/server/auth/session";
import { ResetPasswordForm } from "./ResetPasswordForm";

// "Choose a new password": a pessoa chega aqui pelo link do e-mail de "Forgot password?"
// (/auth/callback com type=recovery já abriu a sessão). Sem sessão, o link venceu: pede outro.
// Não usa o AuthPage, que manda quem está logado direto para o painel.

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/dashboard"); // login desligado no dev local

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/forgot-password?error=expired");
  const email = typeof claims.email === "string" ? claims.email : null;

  return (
    <div className="flex min-h-dvh flex-col bg-white px-5 py-6 sm:px-10 sm:py-8">
      <header className="flex items-center justify-between gap-4">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-center justify-center py-12 sm:py-16">
        <div className="ns-enter w-full max-w-[400px]">
          <h1 className="font-display text-[2rem] leading-tight font-bold tracking-[-0.03em] text-ink sm:text-[2.5rem]">
            Choose a new password
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            {email ? (
              <>
                For{" "}
                <strong className="font-semibold [overflow-wrap:anywhere] text-ink">{email}</strong>
                . You’ll stay logged in on this device; other devices are logged out.
              </>
            ) : (
              "You’ll stay logged in on this device; other devices are logged out."
            )}
          </p>
          <div className="mt-8">
            <ResetPasswordForm />
          </div>
        </div>
      </main>
    </div>
  );
}
