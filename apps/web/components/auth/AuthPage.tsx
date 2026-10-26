import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/ForgotPasswordForm";
import { AuthForm } from "@/app/(auth)/login/AuthForm";
import { SignUpForm } from "@/app/(auth)/login/SignUpForm";
import { Logo } from "@/components/Logo";
import { CheckIcon } from "@/components/marketing/icons";
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
      <h1 className="font-display text-[2rem] leading-tight font-bold tracking-[-0.03em] text-ink sm:text-[2.5rem]">
        {copy.heading}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">{copy.intro}</p>
      {mode !== "forgot" && <ProviderButtons providers={providers} next={next} from={mode} />}
    </>
  );

  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <main id="main" className="flex min-h-dvh flex-col px-5 pt-5 pb-12 sm:px-10 sm:pt-8">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          {/* Quem já tem conta acha o login logo no topo, sem rolar o formulário. */}
          <p className="text-sm text-slate-600">
            <span className="hidden sm:inline">{copy.switchPrompt} </span>
            <Link
              href={withNext(copy.switchPath, next)}
              className={`inline-flex min-h-11 items-center px-1 ${textLink}`}
            >
              {copy.switchLabel}
            </Link>
          </p>
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
                    <p className="mt-6 text-sm leading-relaxed text-slate-500">
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

      {/* O fundo escuro ocupa a coluna inteira; o conteúdo fica parado enquanto o formulário rola. */}
      <div className="hidden bg-[#040d1c] lg:block">
        <aside
          aria-label="How No Sweat works"
          className="ns-enter-slow sticky top-0 flex h-dvh flex-col gap-8 overflow-hidden px-12 py-12 text-white xl:px-16"
        >
          <p className="max-w-[12ch] font-display text-[clamp(2.5rem,4vw,3.75rem)] leading-[1.02] font-bold tracking-[-0.035em] text-balance">
            Your business, online by <span className="text-[#4da3ff]">lunch.</span>
          </p>

          {/* Um site de exemplo de verdade (negócio fictício), sem moldura de enfeite. */}
          <figure className="flex min-h-0 max-w-[34rem] flex-1 flex-col">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
              <Image
                src="/landing/signature/still-water-spa-d.webp"
                alt="Example website for Still Water Spa, with a full-width photo and the spa’s name in large type."
                fill
                sizes="(min-width: 1280px) 34rem, 40vw"
                className="object-cover object-top"
                priority
              />
            </div>
            <figcaption className="mt-3 text-[13px] text-slate-400">
              Example site for a fictional business, built with No Sweat.
            </figcaption>
          </figure>

          <ol className="max-w-[34rem] space-y-3 border-t border-white/10 pt-6">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-4 text-[15px] leading-relaxed">
                <span aria-hidden="true" className="w-5 font-semibold text-[#4da3ff] tabular-nums">
                  {index + 1}
                </span>
                <span className="text-slate-300">{step}</span>
              </li>
            ))}
          </ol>

          <p className="flex max-w-[34rem] items-start gap-3 text-sm leading-relaxed text-slate-400">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-[#4da3ff]" />
            Started a site before making an account? It moves into your account when you sign in on
            this device.
          </p>
        </aside>
      </div>
    </div>
  );
}
