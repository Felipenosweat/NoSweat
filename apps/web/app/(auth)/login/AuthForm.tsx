"use client";

import { useActionState, useState } from "react";
import { Turnstile } from "@/components/auth/Turnstile";
import { latestBirthDate, PASSWORD_MAX } from "@/lib/signup-rules";
import { signIn, type AuthFormState } from "./actions";

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
    <form action={action} className="space-y-4" aria-busy={pending}>
      <input type="hidden" name="next" value={next} />
      <LoginFields />

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
  );
}

function LoginFields() {
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
          placeholder="you@yourbusiness.com"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={PASSWORD_MAX}
          placeholder="Your password"
          className={inputClass}
        />
      </label>
    </>
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
