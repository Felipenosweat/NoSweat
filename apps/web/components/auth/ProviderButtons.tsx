"use client";

import { useFormStatus } from "react-dom";
import { signInWithProvider } from "@/app/(auth)/login/actions";
import type { EnabledProviders, OAuthProvider } from "@/server/auth/providers";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

// Logo oficial do Google ("G" de 4 cores), exigido pelas regras de marca do botão do Google.
function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.29A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.29v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 shrink-0" fill="currentColor">
      <path d="M16.37 12.74c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-2.99-.79a4.42 4.42 0 0 0-3.74 2.27c-1.6 2.77-.41 6.86 1.15 9.11.76 1.1 1.67 2.33 2.86 2.29 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.22a9.8 9.8 0 0 0 1.25-2.57 3.97 3.97 0 0 1-2.41-3.64ZM14.1 6c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.27Z" />
    </svg>
  );
}

const LABELS: Record<OAuthProvider, string> = {
  google: "Continue with Google",
  apple: "Continue with Apple",
};

function ProviderSubmit({ provider }: { provider: OAuthProvider }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-6 text-base font-semibold text-ink transition-colors duration-150 hover:border-slate-400 hover:bg-surface active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${focusRing}`}
    >
      {provider === "google" ? <GoogleLogo /> : <AppleLogo />}
      {pending ? "Redirecting…" : LABELS[provider]}
    </button>
  );
}

/**
 * Botões de login social, só dos provedores ligados no Supabase, mais o divisor "or".
 * Não renderiza nada quando nenhum provedor está ligado.
 */
export function ProviderButtons({
  providers,
  next,
  from,
}: {
  providers: EnabledProviders;
  next: string;
  from: "login" | "signup";
}) {
  const enabled = (["google", "apple"] as const).filter((provider) => providers[provider]);
  if (enabled.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="space-y-3">
        {enabled.map((provider) => (
          <form key={provider} action={signInWithProvider}>
            <input type="hidden" name="provider" value={provider} />
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="from" value={from} />
            <ProviderSubmit provider={provider} />
          </form>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-4" role="separator" aria-label="or">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}
