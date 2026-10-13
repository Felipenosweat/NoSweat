"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthFormState } from "./actions";

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 focus:outline-none";

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
      <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1 text-sm font-semibold">
        {(["login", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-full py-2 transition ${
              mode === value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
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
        <label className="block text-sm font-medium text-slate-700">
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
        <label className="block text-sm font-medium text-slate-700">
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
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {state.error}
          </p>
        )}
        {state.message && (
          <p
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-slate-900 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Please wait..." : isLogin ? "Log in" : "Create my account"}
        </button>
      </form>
    </div>
  );
}
