import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { signOut } from "@/app/(auth)/login/actions";
import { GlassBackdrop, GlassButton, GlassCard, Notice } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { requireAdminRole } from "@/server/admin";
import { adminMfaRequired, currentAal } from "@/server/admin/mfa";
import { createSupabaseServerClient } from "@/server/auth/session";
import { ChallengeForm, EnrollFlow } from "./MfaForms";

export const metadata: Metadata = { title: "Two-step verification · Admin", robots: "noindex" };

// /admin/mfa: segundo passo do admin. Fica num grupo de rotas próprio, fora do layout do /admin
// (que exige AAL2 e mandaria para cá de novo). Sem autenticador: cadastra (QR + segredo + código).
// Com autenticador e sessão AAL1: pede o código. Já em AAL2: avisa e volta para o painel.

type Step = "no-supabase" | "done" | "challenge" | "enroll" | "error";

async function currentStep(): Promise<Step> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return "no-supabase";
  // A decisão de segurança usa a claim `aal` do JWT validado (currentAal). Aqui o
  // getAuthenticatorAssuranceLevel só escolhe a tela: cadastrar (nextLevel aal1 = sem
  // autenticador verificado) ou pedir o código (nextLevel aal2).
  if ((await currentAal()) === "aal2") return "done";
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return "error";
  return data.nextLevel === "aal2" ? "challenge" : "enroll";
}

export default async function AdminMfaPage() {
  await connection();
  await requireAdminRole();
  const step = await currentStep();
  const enforced = adminMfaRequired();

  return (
    <div className="relative isolate flex min-h-screen items-start justify-center bg-surface px-4 pt-16 pb-24 text-(--glass-fg) sm:pt-24">
      <GlassBackdrop />
      <main id="main" className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Logo />
          <span className="glass-edge rounded-full bg-amber-300/90 px-2.5 py-0.5 text-[11px] font-bold tracking-[0.06em] text-ink">
            ADMIN
          </span>
        </div>
        <GlassCard as="section" aria-labelledby="mfa-heading">
          <h1
            id="mfa-heading"
            className="font-display text-[22px] leading-7 font-semibold tracking-[-0.01em]"
          >
            Two-step verification
          </h1>

          {step === "no-supabase" && (
            <p className="mt-2 text-[15px] leading-[1.6] text-(--glass-fg-muted)">
              Login is off in local development, so there is no second step. The admin panel works
              as before.
            </p>
          )}

          {step === "done" && (
            <>
              <p className="mt-2 text-[15px] leading-[1.6] text-(--glass-fg-muted)">
                This session is verified with your authenticator app.
              </p>
              <GlassButton href="/admin" variant="primary" className="mt-5">
                Open the admin panel
              </GlassButton>
            </>
          )}

          {step === "challenge" && (
            <>
              <p className="mt-2 text-[15px] leading-[1.6] text-(--glass-fg-muted)">
                Enter the 6-digit code from your authenticator app to open the admin panel.
              </p>
              <ChallengeForm />
            </>
          )}

          {step === "enroll" && (
            <>
              <p className="mt-2 text-[15px] leading-[1.6] text-(--glass-fg-muted)">
                Admin access needs a second step. Set up an authenticator app (1Password, Google
                Authenticator, Authy…) once; after that you&rsquo;ll type a code when you log in.
              </p>
              <EnrollFlow />
            </>
          )}

          {step === "error" && (
            <Notice tone="error" className="mt-4">
              We couldn&rsquo;t check your session. Reload the page or log in again.
            </Notice>
          )}

          {!enforced && step !== "no-supabase" && step !== "done" && (
            <Notice tone="warning" size="sm" className="mt-5">
              Not enforced yet (ADMIN_REQUIRE_MFA=false). Set it up now, then turn it on.{" "}
              <Link href="/admin" className="font-semibold underline underline-offset-4">
                Skip for now
              </Link>
            </Notice>
          )}
        </GlassCard>

        <form action={signOut} className="mt-4 flex justify-center">
          <GlassButton type="submit" variant="ghost">
            Log out
          </GlassButton>
        </form>
      </main>
    </div>
  );
}
