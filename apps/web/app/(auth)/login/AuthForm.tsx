"use client";

import { useActionState } from "react";
import { signIn, signUp, type AuthFormState } from "./actions";

const inputClass =
  "mt-1.5 block h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base font-normal text-ink placeholder:text-slate-500 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** Formulário de e-mail e senha. `mode` decide se entra (/login) ou cria a conta (/signup). */
export function AuthForm({
  mode,
  next,
  initialError,
}: {
  mode: "login" | "signup";
  next: string;
  initialError?: string;
}) {
  const isLogin = mode === "login";
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    isLogin ? signIn : signUp,
    { error: initialError },
  );

  return (
    <form action={action} className="space-y-4" aria-busy={pending}>
      <input type="hidden" name="next" value={next} />
      <label className="block text-sm font-semibold text-ink">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="you@yourbusiness.com"
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Password
        <input
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          minLength={8}
          maxLength={72}
          placeholder={isLogin ? "Your password" : "At least 8 characters"}
          className={inputClass}
        />
      </label>

      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`inline-flex h-12 w-full items-center justify-center rounded-lg bg-brand px-6 text-base font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px disabled:cursor-wait disabled:opacity-50 ${focusRing}`}
      >
        {pending
          ? isLogin
            ? "Logging in…"
            : "Creating account…"
          : isLogin
            ? "Log in"
            : "Create account"}
      </button>
    </form>
  );
}
