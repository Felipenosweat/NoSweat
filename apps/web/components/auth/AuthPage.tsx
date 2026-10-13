import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/app/(auth)/login/AuthForm";
import { Logo } from "@/components/Logo";
import { CheckIcon } from "@/components/marketing/icons";
import { safeNextPath } from "@/server/auth/config";
import { getEnabledProviders } from "@/server/auth/providers";
import { createSupabaseServerClient, getCurrentUser } from "@/server/auth/session";
import { ProviderButtons } from "./ProviderButtons";

export type AuthSearchParams = Promise<{ next?: string; error?: string }>;

const ERRORS: Record<string, string> = {
  confirm: "That confirmation link is invalid or has expired. Please log in or sign up again.",
  oauth: "We couldn't sign you in with that provider. Please try again.",
};

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
} as const;

// Só o que o produto faz hoje (mesma lista da landing). Nada de números ou depoimentos.
const STEPS = [
  "Describe your business in a sentence or two.",
  "We build the first draft: layout, headline, services and FAQ.",
  "Edit it with a live preview, then publish on a free address or your own domain.",
];

const textLink =
  "font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand rounded-sm";

function withNext(path: string, next: string): string {
  return next === "/dashboard" ? path : `${path}?next=${encodeURIComponent(next)}`;
}

/**
 * Tela inteira de /login e /signup. Se o login estiver desligado (dev local sem Supabase) ou a
 * pessoa já estiver logada, segue direto para `next`.
 */
export async function AuthPage({
  mode,
  searchParams,
}: {
  mode: "login" | "signup";
  searchParams: AuthSearchParams;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);

  const supabase = await createSupabaseServerClient();
  if (!supabase || (await getCurrentUser())) redirect(next);

  const providers = await getEnabledProviders();
  const hasProviders = providers.google || providers.apple;
  const copy = COPY[mode];
  // Object.hasOwn: "?error=constructor" não pode pegar coisas do protótipo do objeto.
  const initialError =
    params.error && Object.hasOwn(ERRORS, params.error) ? ERRORS[params.error] : undefined;

  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
      <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 sm:py-8">
        <header>
          <Logo />
        </header>

        <div className="flex flex-1 items-center justify-center py-12 sm:py-16">
          <div className="w-full max-w-[400px]">
            <h1 className="font-display text-[2rem] leading-tight font-bold tracking-[-0.03em] text-ink sm:text-[2.5rem]">
              {copy.heading}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600">{copy.intro}</p>

            <ProviderButtons providers={providers} next={next} from={mode} />

            <div className={hasProviders ? "mt-6" : "mt-8"}>
              <AuthForm mode={mode} next={next} initialError={initialError} />
            </div>

            {/* O formulário de e-mail tem a própria caixa de aceite; este aviso é para o login social. */}
            {mode === "signup" && hasProviders && (
              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                Signing up with Google or Apple? You’ll add your name and date of birth next. By
                continuing, you agree to our{" "}
                <Link href="/terms" className={textLink}>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className={textLink}>
                  Privacy Policy
                </Link>
                .
              </p>
            )}

            <p className="mt-8 border-t border-slate-200 pt-6 text-center text-[0.9375rem] text-slate-600">
              {copy.switchPrompt}{" "}
              <Link
                href={withNext(copy.switchPath, next)}
                className={`inline-flex min-h-11 items-center ${textLink}`}
              >
                {copy.switchLabel}
              </Link>
            </p>
          </div>
        </div>
      </main>

      <aside
        aria-label="How NoSweat works"
        className="sticky top-0 hidden h-dvh flex-col justify-between overflow-hidden bg-ink px-12 py-12 text-white lg:flex xl:px-16"
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          How it works
        </p>

        <div className="max-w-[30rem]">
          <p className="font-display text-[2rem] leading-[1.15] font-bold tracking-[-0.03em] xl:text-[2.5rem]">
            A website for your business, without the sweat.
          </p>
          <ol className="mt-10 space-y-5">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="font-display text-sm font-bold text-slate-400 tabular-nums"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed text-slate-200">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="flex max-w-[30rem] items-start gap-3 border-t border-white/10 pt-6 text-sm leading-relaxed text-slate-300">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-accent" />
          Started a site before making an account? It moves into your account when you sign in on
          this device.
        </p>
      </aside>
    </div>
  );
}
