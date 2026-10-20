"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Turnstile } from "@/components/auth/Turnstile";
import { latestBirthDate, PASSWORD_MAX } from "@/lib/signup-rules";
import { resendConfirmation, signIn, type AuthFormState, type EmailFormState } from "./actions";

export const inputClass =
  "mt-1.5 block h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base font-normal text-ink placeholder:text-slate-500 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none aria-invalid:border-red-400";

export const labelClass = "block text-sm font-semibold text-ink";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const textLink = `rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`;

/** Formulário de login (/login). O cadastro tem o próprio formulário (SignUpForm). */
export function AuthForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signIn, {
    error: initialError,
  });

  return (
    <>
      {/* `key` muda a cada envio: o e-mail volta preenchido (defaultValue) depois de um erro. */}
      <form key={state.attempt ?? 0} action={action} className="space-y-4" aria-busy={pending}>
        <input type="hidden" name="next" value={next} />
        <LoginFields email={state.values?.email} />

        <Turnstile action="login" resetKey={state.attempt} />

        {state.error && (
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
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      {/* Fora do formulário de login (formulário dentro de formulário não vale em HTML). */}
      {state.unconfirmedEmail && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-sm leading-relaxed text-slate-600">
            Didn’t get the email, or the link expired? We can send a new one to{" "}
            <strong className="font-semibold [overflow-wrap:anywhere] text-ink">
              {state.unconfirmedEmail}
            </strong>
            .
          </p>
          <ResendConfirmationForm email={state.unconfirmedEmail} next={next} className="mt-3" />
        </div>
      )}
    </>
  );
}

function LoginFields({ email }: { email?: string }) {
  return (
    <>
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
          defaultValue={email}
          placeholder="you@yourbusiness.com"
          className={inputClass}
        />
      </label>
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="login-password" className={labelClass}>
            Password
          </label>
          <Link href="/forgot-password" className={`text-sm ${textLink}`}>
            Forgot password?
          </Link>
        </div>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={PASSWORD_MAX}
          placeholder="Your password"
          className={inputClass}
        />
      </div>
    </>
  );
}

/** Espera entre dois reenvios do link (o Supabase também limita do lado dele). */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * "Resend the link": manda de novo o e-mail de confirmação do cadastro. Usado no login (conta
 * ainda não confirmada) e na tela "Check your inbox". Sem `email`, pede o e-mail.
 * Depois de um envio, o botão espera 60 segundos.
 */
export function ResendConfirmationForm({
  email,
  next,
  className = "",
}: {
  email?: string;
  next: string;
  className?: string;
}) {
  const [state, action, pending] = useActionState<EmailFormState, FormData>(resendConfirmation, {});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [seenAttempt, setSeenAttempt] = useState(state.attempt);
  if (state.attempt !== seenAttempt) {
    setSeenAttempt(state.attempt);
    if (state.message) setSecondsLeft(RESEND_COOLDOWN_SECONDS);
  }

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const waiting = secondsLeft > 0;

  return (
    <form action={action} className={`space-y-3 ${className}`} aria-busy={pending}>
      <input type="hidden" name="next" value={next} />
      {email ? (
        <input type="hidden" name="email" value={email} />
      ) : (
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
            defaultValue={state.values?.email}
            placeholder="you@yourbusiness.com"
            className={inputClass}
          />
        </label>
      )}

      <Turnstile action="resend" resetKey={state.attempt} />

      {state.message && !pending && (
        <p role="status" className="text-sm leading-relaxed text-emerald-800">
          {state.message}
        </p>
      )}
      {state.error && !pending && (
        <p role="alert" className="text-sm leading-relaxed text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || waiting}
        className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
      >
        {pending ? "Sending…" : waiting ? `Resend the link (${secondsLeft}s)` : "Resend the link"}
      </button>
    </form>
  );
}

/** Erro de um campo, ligado ao input por aria-describedby. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-700">
      {message}
    </p>
  );
}

export function BirthDateField({ defaultValue, error }: { defaultValue?: string; error?: string }) {
  // Data máxima calculada uma vez por montagem (no navegador, com a data de hoje).
  const [max] = useState(() => latestBirthDate());
  return (
    <label className={labelClass}>
      Date of birth
      <span className="mt-0.5 block text-[13px] font-normal text-slate-500">
        You must be 18 or older to use No Sweat.
      </span>
      <input
        name="birthDate"
        type="date"
        autoComplete="bday"
        required
        min="1900-01-01"
        max={max}
        defaultValue={defaultValue}
        className={`${inputClass} appearance-none`}
        {...(error ? { "aria-invalid": true, "aria-describedby": "birthDate-error" } : {})}
      />
      <FieldError id="birthDate-error" message={error} />
    </label>
  );
}

export function Checkbox({
  name,
  children,
  required,
  defaultChecked,
  error,
}: {
  name: string;
  children: React.ReactNode;
  required?: boolean;
  defaultChecked?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-600">
        <input
          type="checkbox"
          name={name}
          value="on"
          required={required}
          defaultChecked={defaultChecked}
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-slate-300 accent-brand"
          {...(error ? { "aria-invalid": true, "aria-describedby": `${name}-error` } : {})}
        />
        <span>{children}</span>
      </label>
      <FieldError id={`${name}-error`} message={error} />
    </div>
  );
}
