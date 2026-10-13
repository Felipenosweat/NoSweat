"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Turnstile } from "@/components/auth/Turnstile";
import { latestBirthDate, PASSWORD_MAX, PASSWORD_RULES } from "@/lib/signup-rules";
import { signIn, signUp, type AuthFormState } from "./actions";

export const inputClass =
  "mt-1.5 block h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base font-normal text-ink placeholder:text-slate-500 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none aria-invalid:border-red-400";

export const labelClass = "block text-sm font-semibold text-ink";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export const textLink = `rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`;

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

  // Depois de um envio, o React limpa o formulário; o `key` remonta os campos com os valores
  // que o servidor devolveu (nunca as senhas).
  return (
    <form
      key={state.attempt ?? 0}
      action={action}
      noValidate={!isLogin}
      className="space-y-4"
      aria-busy={pending}
    >
      <input type="hidden" name="next" value={next} />
      {isLogin ? <LoginFields /> : <SignUpFields state={state} />}

      <Turnstile action={mode} resetKey={state.attempt} />

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

function SignUpFields({ state }: { state: AuthFormState }) {
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const invalid = (field: string) =>
    errors[field] ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {};

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          First name
          <input
            name="firstName"
            autoComplete="given-name"
            required
            maxLength={60}
            defaultValue={values.firstName}
            className={inputClass}
            {...invalid("firstName")}
          />
          <FieldError id="firstName-error" message={errors.firstName} />
        </label>
        <label className={labelClass}>
          Last name
          <input
            name="lastName"
            autoComplete="family-name"
            required
            maxLength={60}
            defaultValue={values.lastName}
            className={inputClass}
            {...invalid("lastName")}
          />
          <FieldError id="lastName-error" message={errors.lastName} />
        </label>
      </div>

      <BirthDateField defaultValue={values.birthDate} error={errors.birthDate} />

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
          placeholder="you@yourbusiness.com"
          defaultValue={values.email}
          className={inputClass}
          {...invalid("email")}
        />
        <FieldError id="email-error" message={errors.email} />
      </label>
      <label className={labelClass}>
        Confirm email
        <input
          name="emailConfirm"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          defaultValue={values.emailConfirm}
          className={inputClass}
          {...invalid("emailConfirm")}
        />
        <FieldError id="emailConfirm-error" message={errors.emailConfirm} />
      </label>

      <div>
        <div className="flex items-end justify-between gap-3">
          <label htmlFor="signup-password" className={labelClass}>
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-pressed={showPassword}
            aria-controls="signup-password signup-password-confirm"
            className={`-my-2 inline-flex min-h-11 items-center px-1 text-sm font-semibold text-slate-600 hover:text-ink ${focusRing}`}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <input
          id="signup-password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          maxLength={PASSWORD_MAX}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="password-rules"
          className={inputClass}
          {...(errors.password ? { "aria-invalid": true } : {})}
        />
        {/* Requisitos ao vivo: cada um fica verde quando a senha cumpre. */}
        <ul id="password-rules" className="mt-2 grid gap-1 text-[13px] sm:grid-cols-2">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li
                key={rule.id}
                className={`flex items-center gap-1.5 ${met ? "text-emerald-700" : "text-slate-500"}`}
              >
                <span aria-hidden="true" className="w-3 text-center">
                  {met ? "✓" : "•"}
                </span>
                {rule.label}
                <span className="sr-only">{met ? " (done)" : " (missing)"}</span>
              </li>
            );
          })}
        </ul>
        <FieldError id="password-error" message={errors.password} />
      </div>
      <label className={labelClass}>
        Confirm password
        <input
          id="signup-password-confirm"
          name="passwordConfirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          maxLength={PASSWORD_MAX}
          className={inputClass}
          {...invalid("passwordConfirm")}
        />
        <FieldError id="passwordConfirm-error" message={errors.passwordConfirm} />
      </label>

      {/* Campo-isca: invisível para pessoas; robô que preenche é recusado. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label>
          Company website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="space-y-3 pt-1">
        <Checkbox name="marketing" defaultChecked={values.marketing ?? true}>
          Email me about the No Sweat launch and product news. Unsubscribe anytime.
        </Checkbox>
        <Checkbox name="terms" required defaultChecked={values.terms} error={errors.terms}>
          I’m 18 or older and I agree to the{" "}
          <Link href="/terms" target="_blank" className={textLink}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className={textLink}>
            Privacy Policy
          </Link>
          .
        </Checkbox>
      </div>
    </>
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
