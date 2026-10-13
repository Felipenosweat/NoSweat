"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  BirthDateField,
  Checkbox,
  FieldError,
  inputClass,
  labelClass,
  textLink,
} from "../login/AuthForm";
import { completeProfile, type ProfileFormState } from "./actions";

/** Formulário de /welcome (perfil de quem entrou pelo Google/Apple ou tem conta antiga). */
export function ProfileForm({
  next,
  defaults,
}: {
  next: string;
  defaults: { firstName?: string; lastName?: string };
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(completeProfile, {
    values: { ...defaults, marketing: true },
  });
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};
  const invalid = (field: string) =>
    errors[field] ? { "aria-invalid": true, "aria-describedby": `${field}-error` } : {};

  return (
    <form
      key={state.attempt ?? 0}
      action={action}
      noValidate
      className="space-y-4"
      aria-busy={pending}
    >
      <input type="hidden" name="next" value={next} />
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
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-brand px-6 text-base font-semibold text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
