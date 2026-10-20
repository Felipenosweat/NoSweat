"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Turnstile } from "@/components/auth/Turnstile";
import { requestPasswordReset, type EmailFormState } from "../login/actions";
import { inputClass, labelClass, textLink } from "../login/AuthForm";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * Formulário de /forgot-password: pede o link para escolher uma senha nova. A resposta é
 * sempre a mesma (não revela se o e-mail tem conta); o formulário continua na tela para
 * pedir de novo.
 */
export function ForgotPasswordForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState<EmailFormState, FormData>(requestPasswordReset, {
    error: initialError,
  });

  return (
    <>
      <form key={state.attempt ?? 0} action={action} className="space-y-4" aria-busy={pending}>
        <label className={labelClass}>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={254}
            defaultValue={state.values?.email}
            placeholder="you@yourbusiness.com"
            className={inputClass}
          />
        </label>

        <Turnstile action="reset" resetKey={state.attempt} />

        {state.message && !pending && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-900"
          >
            <p className="font-semibold">{state.message}</p>
            <p className="mt-1">
              The link works for a limited time. Not there after a few minutes? Check your spam
              folder, or send it again.
            </p>
          </div>
        )}
        {state.error && !pending && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={`inline-flex h-12 w-full items-center justify-center rounded-lg bg-brand px-6 text-base font-semibold text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px disabled:cursor-wait disabled:opacity-50 ${focusRing}`}
        >
          {pending ? "Sending…" : state.message ? "Send the link again" : "Send me a reset link"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        <Link href="/login" className={`inline-flex min-h-11 items-center ${textLink}`}>
          Back to log in
        </Link>
      </p>
    </>
  );
}
