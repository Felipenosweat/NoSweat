"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { PASSWORD_MAX, PASSWORD_RULES } from "@/lib/signup-rules";
import { FieldError, inputClass, labelClass } from "../login/AuthForm";
import { updatePassword, type ResetPasswordState } from "./actions";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * Senha nova + confirmação, com os mesmos requisitos do cadastro (lib/signup-rules), checados
 * ao vivo aqui e de verdade no servidor. Os campos são controlados e, com JavaScript, o envio
 * passa pelo onSubmit (sem o reset automático do formulário): nada se perde num erro.
 */
export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(updatePassword, {});
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [shown, setShown] = useState(false);
  const errors = state.fieldErrors ?? {};
  const invalid = (field: "password" | "passwordConfirm") =>
    errors[field] ? { "aria-invalid": true, "aria-describedby": `rp-${field}-error` } : {};

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={pending}>
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
        <FieldError id="rp-password-error" message={errors.password} />
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
        <FieldError id="rp-passwordConfirm-error" message={errors.passwordConfirm} />
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
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
