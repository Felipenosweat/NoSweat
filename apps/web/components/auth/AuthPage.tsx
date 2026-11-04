import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/ForgotPasswordForm";
import { AuthForm } from "@/app/(auth)/login/AuthForm";
import { SignUpForm } from "@/app/(auth)/login/SignUpForm";
import { Logo } from "@/components/Logo";
import { safeNextPath } from "@/server/auth/config";
import { getEnabledProviders } from "@/server/auth/providers";
import { createSupabaseServerClient, getCurrentUser } from "@/server/auth/session";
import { ProviderButtons } from "./ProviderButtons";

export type AuthSearchParams = Promise<{ next?: string; error?: string }>;

const ERRORS: Record<string, string> = {
  confirm:
    "That link is invalid or has expired. If you already confirmed your email, just log in below.",
  oauth: "We couldn't sign you in with that provider. Please try again.",
  expired: "That reset link is invalid or has expired. Enter your email to get a new one.",
};

type AuthMode = "login" | "signup" | "forgot";

const COPY = {
  signup: {
    heading: "Create your account",
    intro: "Accounts are free. You’ll need one to publish your website.",
    switchPrompt: "Already have an account?",
    switchLabel: "Log in",
    switchPath: "/login",
  },
  login: {
    heading: "Log in",
    intro: "Welcome back. Pick up where you left off.",
    switchPrompt: "Don’t have an account?",
    switchLabel: "Sign up",
    switchPath: "/signup",
  },
  forgot: {
    heading: "Reset your password",
    intro: "Enter the email you use for No Sweat and we’ll send you a link to choose a new one.",
    switchPrompt: "Remembered it?",
    switchLabel: "Log in",
    switchPath: "/login",
  },
} as const;

const textLink =
  "font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand rounded-sm";

function withNext(path: string, next: string): string {
  return next === "/dashboard" ? path : `${path}?next=${encodeURIComponent(next)}`;
}

/**
 * Tela inteira de /login, /signup e /forgot-password. Se o login estiver desligado (dev local
 * sem Supabase) ou a pessoa já estiver logada, segue direto para `next` (em /forgot-password,
 * quem está logado também pode pedir o link).
 */
export async function AuthPage({
  mode,
  searchParams,
}: {
  mode: AuthMode;
  searchParams: AuthSearchParams;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  const supabase = await createSupabaseServerClient();
  if (!supabase || (mode !== "forgot" && (await getCurrentUser()))) redirect(next);

  // Pedir nova senha não tem Google/Apple (quem entra por eles não tem senha aqui).
  const providers =
    mode === "forgot" ? { google: false, apple: false } : await getEnabledProviders();
  const hasProviders = providers.google || providers.apple;
  const copy = COPY[mode];
  // Object.hasOwn: "?error=constructor" não pode pegar coisas do protótipo do objeto.
  const initialError =
    params.error && Object.hasOwn(ERRORS, params.error) ? ERRORS[params.error] : undefined;

  const heading = (
    <>
      <h1 className="text-center font-display text-[2rem] leading-tight font-bold tracking-[-0.03em] text-ink sm:text-[2.5rem]">
        {copy.heading}
      </h1>
      <p className="mt-3 text-center text-base leading-relaxed text-slate-600">{copy.intro}</p>
      <p className="mt-1 text-center text-sm text-slate-600">
        {copy.switchPrompt}{" "}
        <Link href={withNext(copy.switchPath, next)} className={textLink}>
          {copy.switchLabel}
        </Link>
      </p>
      {mode !== "forgot" && <ProviderButtons providers={providers} next={next} from={mode} />}
    </>
  );

  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-3 lg:bg-slate-100 lg:p-3">
      <main
        id="main"
        className="flex min-h-dvh flex-col bg-white px-5 pt-5 pb-12 sm:px-10 sm:pt-8 lg:min-h-[calc(100dvh-1.5rem)] lg:rounded-2xl"
      >
        <header className="flex items-center justify-center lg:justify-start">
          <Logo />
        </header>

        <div className="flex flex-1 justify-center pt-10 sm:pt-14 lg:items-center lg:py-14">
          <div className="ns-enter w-full max-w-[440px]">
            {mode === "signup" ? (
              <SignUpForm
                next={next}
                initialError={initialError}
                intro={heading}
                after={
                  // O formulário de e-mail tem a própria caixa de aceite; este aviso é do login social.
                  hasProviders && (
                    <p className="mt-6 text-sm leading-relaxed text-(--glass-fg-muted)">
                      Signing up with Google or Apple? You’ll add your name and date of birth next.
                      By continuing, you agree to our{" "}
                      <Link href="/terms" className={textLink}>
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className={textLink}>
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  )
                }
              />
            ) : mode === "forgot" ? (
              <>
                {heading}
                <div className="mt-8">
                  <ForgotPasswordForm initialError={initialError} />
                </div>
              </>
            ) : (
              <>
                {heading}
                <div className={hasProviders ? "mt-6" : "mt-8"}>
                  <AuthForm next={next} initialError={initialError} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Painel de foto de canto a canto, com uma frase na pílula (referência do fundador). O site
          de exemplo é de um negócio fictício, avisado na legenda. */}
      <aside
        aria-label="About No Sweat"
        className="ns-enter-slow relative hidden overflow-hidden rounded-2xl bg-[#040d1c] lg:block"
      >
        <Image
          src="/landing/signature/still-water-spa-d.webp"
          alt="Example website for Still Water Spa, with a full-width photo and the spa’s name in large type."
          fill
          sizes="(min-width: 1024px) 45vw"
          className="object-cover object-[30%_top]"
          priority
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[#040d1c]/35" />
        <div className="absolute right-6 bottom-6 left-6 flex items-end justify-between gap-4">
          <p className="max-w-[26ch] rounded-2xl bg-[#040d1c]/80 px-5 py-4 font-display text-lg leading-snug font-semibold tracking-[-0.01em] text-white ring-1 ring-white/15 backdrop-blur-md">
            Describe your business in one sentence. We build the first draft.
          </p>
          <p className="text-right text-[12px] text-white/75">
            Example site, fictional business.
            <br />
            Made with No Sweat.
          </p>
        </div>
      </aside>
    </div>
  );
}
