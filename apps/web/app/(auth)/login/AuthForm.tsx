"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthFormState } from "./actions";

const inputClass =
  "mt-1.5 block h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-normal text-ink placeholder:text-slate-500 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function AuthForm({ next, initialError }: { next: string; initialError?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState<AuthFormState, FormData>(signIn, {
    error: initialError,
  });
  const [signupState, signupAction, signupPending] = useActionState<AuthFormState, FormData>(
    signUp,
    {},
  );

  const isLogin = mode === "login";
  const state = isLogin ? loginState : signupState;
  const pending = isLogin ? loginPending : signupPending;

  return (
    <div className="mt-8">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-sm font-semibold">
        {(["login", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={`min-h-11 rounded-lg transition-colors duration-150 ${focusRing} ${
              mode === value
                ? "bg-white text-ink ring-1 ring-slate-200"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            {value === "login" ? "Log in" : "Create account"}
          </button>
        ))}
      </div>

      <form
        action={isLogin ? loginAction : signupAction}
        className="mt-6 space-y-4"
        aria-busy={pending}
      >
        <input type="hidden" name="next" value={next} />
        <label className="block text-[13px] font-medium text-ink">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@yourbusiness.com"
            className={inputClass}
          />
        </label>
        <label className="block text-[13px] font-medium text-ink">
          Password
          <input
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={8}
            placeholder={isLogin ? "Your password" : "At least 8 characters"}
            className={inputClass}
          />
        </label>

        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state.message && (
          <p
            role="status"
            className="flex gap-2.5 rounded-lg bg-white px-3 py-2 text-sm text-ink ring-1 ring-slate-200"
          >
            <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand" />
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={`inline-flex h-12 w-full items-center justify-center rounded-lg bg-brand px-6 text-base font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px disabled:cursor-wait disabled:bg-slate-100 disabled:text-slate-400 disabled:active:translate-y-0 ${focusRing}`}
        >
          {pending
            ? isLogin
              ? "Logging in…"
              : "Creating account…"
            : isLogin
              ? "Log in"
              : "Create my account"}
        </button>
      </form>
    </div>
  );
}
