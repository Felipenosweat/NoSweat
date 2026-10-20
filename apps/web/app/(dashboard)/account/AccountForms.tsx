"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { focusRing, primaryButton } from "@/components/DashboardUi";
import { PASSWORD_MAX, PASSWORD_RULES } from "@/lib/signup-rules";
import { changePassword, updateProfile, type PasswordState, type ProfileState } from "./actions";

// Formulários da página /account (nome e senha). Com JavaScript, o envio passa pelo onSubmit
// (sem o reset automático do <form>), então nada do que foi digitado se perde num erro.

const inputClass = `mt-1.5 block h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-normal text-ink placeholder:text-slate-500 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 aria-invalid:border-red-400`;

const labelClass = "block text-sm font-semibold text-ink";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-red-700">
      {message}
    </p>
  );
}

/** Resultado do envio: erro (vermelho) ou sucesso (verde). */
function FormStatus({ error, saved }: { error?: string; saved?: string }) {
  if (error) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {error}
      </p>
    );
  }
  if (saved) {
    return (
      <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {saved}
      </p>
    );
  }
  return null;
}

/** Envia pelo startTransition (sem resetar o formulário). */
function submitWith(action: (formData: FormData) => void, pending: boolean) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
}

export function ProfileForm({
  firstName,
  lastName,
  readOnly,
}: {
  firstName: string;
  lastName: string;
  /** Modo "ver como" do admin ou login desligado: só mostra. */
  readOnly: boolean;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  const errors = state.fieldErrors ?? {};
  const invalid = (field: "firstName" | "lastName") =>
    errors[field] ? { "aria-invalid": true, "aria-describedby": `account-${field}-error` } : {};

  return (
    <form
      action={action}
      onSubmit={submitWith(action, pending)}
      noValidate
      aria-busy={pending}
      className="mt-5 grid gap-4"
    >
      <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Your name</legend>
        <div>
          <label className={labelClass}>
            First name
            <input
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              maxLength={60}
              defaultValue={state.values?.firstName ?? firstName}
              className={inputClass}
              {...invalid("firstName")}
            />
          </label>
          <FieldError id="account-firstName-error" message={errors.firstName} />
        </div>
        <div>
          <label className={labelClass}>
            Last name
            <input
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              maxLength={60}
              defaultValue={state.values?.lastName ?? lastName}
              className={inputClass}
              {...invalid("lastName")}
            />
          </label>
          <FieldError id="account-lastName-error" message={errors.lastName} />
        </div>
      </fieldset>

      {!pending && <FormStatus error={state.error} saved={state.saved} />}

      <div>
        <button type="submit" disabled={pending || readOnly} className={primaryButton}>
          {pending ? "Saving…" : "Save name"}
        </button>
      </div>
    </form>
  );
}

/** Campos da senha. Remontam (e ficam vazios) depois de cada troca bem-sucedida. */
function PasswordFields({
  state,
  pending,
  readOnly,
}: {
  state: PasswordState;
  pending: boolean;
  readOnly: boolean;
}) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [shown, setShown] = useState(false);
  const errors = state.fieldErrors ?? {};
  const invalid = (field: "password" | "passwordConfirm") =>
    errors[field] ? { "aria-invalid": true, "aria-describedby": `account-${field}-error` } : {};

  return (
    <fieldset disabled={readOnly} className="grid gap-4">
      <legend className="sr-only">New password</legend>
      <div>
        <label className={labelClass}>
          New password
          <input
            name="password"
            type={shown ? "text" : "password"}
            autoComplete="new-password"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={PASSWORD_MAX}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            {...invalid("password")}
          />
        </label>
        <ul
          aria-label="Password requirements"
          className="mt-2.5 grid gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-2"
        >
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li key={rule.id} className={met ? "text-emerald-700" : "text-slate-600"}>
                <span aria-hidden="true">{met ? "✓ " : "· "}</span>
                {rule.label}
                <span className="sr-only">{met ? " (done)" : " (missing)"}</span>
              </li>
            );
          })}
        </ul>
        <FieldError id="account-password-error" message={errors.password} />
      </div>

      <div>
        <label className={labelClass}>
          Confirm new password
          <input
            name="passwordConfirm"
            type={shown ? "text" : "password"}
            autoComplete="new-password"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={PASSWORD_MAX}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className={inputClass}
            {...invalid("passwordConfirm")}
          />
        </label>
        <FieldError id="account-passwordConfirm-error" message={errors.passwordConfirm} />
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={shown}
          onChange={(e) => setShown(e.target.checked)}
          className="size-5 shrink-0 cursor-pointer rounded border-slate-300 accent-brand"
        />
        Show passwords
      </label>

      {!pending && <FormStatus error={state.error} saved={state.saved} />}
      {!pending && state.needsReset && (
        <p className="text-sm text-slate-600">
          <Link
            href="/forgot-password"
            className={`rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`}
          >
            Send me a password reset link
          </Link>
        </p>
      )}
    </fieldset>
  );
}

export function PasswordForm({ readOnly }: { readOnly: boolean }) {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, {});

  return (
    <form
      action={action}
      onSubmit={submitWith(action, pending)}
      noValidate
      aria-busy={pending}
      className="mt-5 grid gap-4"
    >
      <PasswordFields
        key={state.savedCount ?? 0}
        state={state}
        pending={pending}
        readOnly={readOnly}
      />
      <div>
        <button type="submit" disabled={pending || readOnly} className={primaryButton}>
          {pending ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
