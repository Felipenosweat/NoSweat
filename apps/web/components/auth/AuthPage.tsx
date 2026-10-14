import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
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

  const heading = (
    <>
      <h1 className="font-display text-[2rem] leading-tight font-bold tracking-[-0.03em] text-ink sm:text-[2.5rem]">
        {copy.heading}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">{copy.intro}</p>
      <ProviderButtons providers={providers} next={next} from={mode} />
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
          <p className="max-w-[12ch] font-[family-name:var(--ns-font-landing-display)] text-[clamp(3rem,4.6vw,4.5rem)] leading-[0.9] font-extrabold tracking-[-0.01em]">
            Your business, online by <span className="text-[#4da3ff]">lunch.</span>
          </p>

          {/* Um site de exemplo de verdade (negócio fictício), sem moldura de enfeite. */}
          <figure className="flex min-h-0 max-w-[34rem] flex-1 flex-col">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
              <Image
                src="/landing/wall/joes-plumbing-top.webp"
                alt="Example website for Joe’s Plumbing, showing a headline, a call button and services."
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
