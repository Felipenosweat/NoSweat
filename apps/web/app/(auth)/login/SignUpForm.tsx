"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Turnstile } from "@/components/auth/Turnstile";
import {
  latestBirthDate,
  PASSWORD_MAX,
  PASSWORD_RULES,
  SIGN_UP_FIELDS,
  signUpFieldErrors,
  type SignUpDraft,
  type SignUpField,
} from "@/lib/signup-rules";
import { signUp, type AuthFormState } from "./actions";
import { ResendConfirmationForm } from "./AuthForm";

// Cadastro por e-mail (/signup). As regras são as do servidor (lib/signup-rules), checadas
// também aqui: o erro de um campo só aparece depois que a pessoa mexeu nele e saiu, ou ao
// enviar. Os campos são controlados, então nada se perde num erro (nem as senhas).
// Com JavaScript, o envio passa pelo onSubmit (valida antes e evita clique duplo); sem
// JavaScript, o `action` do formulário continua funcionando como antes.

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const fieldClass =
  "block h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-base text-ink placeholder:text-slate-500 transition-[border-color,box-shadow] duration-150 ease-out hover:border-slate-400 focus:border-brand focus:ring-4 focus:ring-brand/15 focus:outline-none aria-invalid:border-red-600 aria-invalid:focus:ring-red-600/15 motion-reduce:transition-none";

const labelText = "block text-sm font-semibold text-ink";

const link = `rounded-sm font-semibold text-brand underline decoration-brand/30 underline-offset-4 transition-colors duration-150 hover:decoration-brand ${focusRing}`;

const inputId = (field: string) => `su-${field}`;
const errorId = (field: string) => `su-${field}-error`;

function draftFrom(state: AuthFormState): SignUpDraft {
  const v = state.values ?? {};
  return {
    firstName: v.firstName ?? "",
    lastName: v.lastName ?? "",
    birthDate: v.birthDate ?? "",
    email: v.email ?? "",
    emailConfirm: v.emailConfirm ?? "",
    password: "",
    passwordConfirm: "",
    marketing: v.marketing ?? true,
    terms: v.terms ?? false,
  };
}

export function SignUpForm({
  next,
  initialError,
  intro,
  after,
}: {
  next: string;
  initialError?: string;
  /** Título, texto e botões Google/Apple: somem quando o cadastro dá certo. */
  intro: ReactNode;
  /** Aviso do login social, embaixo do formulário. */
  after?: ReactNode;
}) {
  const [state, dispatch, pending] = useActionState<AuthFormState, FormData>(signUp, {
    error: initialError,
  });
  const [draft, setDraft] = useState<SignUpDraft>(() => draftFrom(state));
  const [touched, setTouched] = useState<Partial<Record<SignUpField, boolean>>>({});
  const [dirty, setDirty] = useState<Partial<Record<SignUpField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [dismissed, setDismissed] = useState<number | undefined>(undefined);

  // Erros que o servidor devolveu: valem até a pessoa mexer no campo.
  const [serverErrors, setServerErrors] = useState(state.fieldErrors ?? {});
  const [seenAttempt, setSeenAttempt] = useState(state.attempt);
  if (state.attempt !== seenAttempt) {
    setSeenAttempt(state.attempt);
    setServerErrors(state.fieldErrors ?? {});
  }

  const clientErrors = signUpFieldErrors(draft);
  const errorFor = (field: SignUpField): string | undefined =>
    serverErrors[field] ?? (submitted || touched[field] ? clientErrors[field] : undefined);

  const success = Boolean(state.message) && !state.error && dismissed !== state.attempt;

  const successRef = useRef<HTMLHeadingElement>(null);

  // Depois de cada resposta do servidor: sucesso → foco no título "Check your inbox";
  // erro em campo → foco no primeiro campo com erro.
  useEffect(() => {
    if (state.attempt === undefined) return;
    if (state.message && !state.error) {
      successRef.current?.focus();
      return;
    }
    const first = SIGN_UP_FIELDS.find((field) => state.fieldErrors?.[field]);
    if (first) document.getElementById(inputId(first))?.focus();
  }, [state]);

  function update<K extends keyof SignUpDraft>(field: K, value: SignUpDraft[K]) {
    setDraft((d) => ({ ...d, [field]: value }));
    if (field === "marketing") return;
    setDirty((d) => ({ ...d, [field]: true }));
    if (serverErrors[field as SignUpField]) {
      setServerErrors((errors) => {
        const rest = { ...errors };
        delete rest[field as SignUpField];
        return rest;
      });
    }
  }

  // Sair de um campo que a pessoa já preencheu mostra o erro dele (campo vazio só ao enviar).
  const blur = (field: SignUpField) => () => {
    if (dirty[field]) setTouched((t) => ({ ...t, [field]: true }));
  };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setSubmitted(true);
    const first = SIGN_UP_FIELDS.find((field) => clientErrors[field]);
    if (first) {
      document.getElementById(inputId(first))?.focus();
      return;
    }
    setSentTo(draft.email.trim());
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  function startOver() {
    setDismissed(state.attempt);
    setDraft((d) => ({ ...d, email: "", emailConfirm: "", password: "", passwordConfirm: "" }));
    setTouched({});
    setDirty({});
    setSubmitted(false);
    requestAnimationFrame(() => document.getElementById(inputId("email"))?.focus());
  }

  if (success) {
    return (
      <div className="ns-enter" role="status">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand"
        >
          <MailIcon />
        </span>
        <h1
          ref={successRef}
          tabIndex={-1}
          className="mt-6 font-display text-[2rem] leading-tight font-bold tracking-[-0.03em] text-ink outline-none sm:text-[2.5rem]"
        >
          Check your inbox
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          We sent a confirmation link to{" "}
          {sentTo ? (
            <strong className="block font-semibold [overflow-wrap:anywhere] text-ink">
              {sentTo}
            </strong>
          ) : (
            "your email. "
          )}
          Open it to finish creating your account.
        </p>
        <ul className="mt-6 space-y-2 border-t border-slate-200 pt-6 text-sm leading-relaxed text-slate-600">
          <li>The email can take a minute or two to arrive.</li>
          <li>Not there? Check your spam or promotions folder.</li>
        </ul>
        {/* Sem o e-mail (envio sem JavaScript), o próprio formulário pede o endereço. */}
        <ResendConfirmationForm email={sentTo} next={next} className="mt-6" />
        <button
          type="button"
          onClick={startOver}
          className={`mt-8 inline-flex min-h-11 items-center ${link}`}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <>
      {intro}
      <form
        action={dispatch}
        onSubmit={onSubmit}
        noValidate
        aria-busy={pending}
        className="mt-8 space-y-8"
      >
        <input type="hidden" name="next" value={next} />

        <Group legend="About you">
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <TextField
              field="firstName"
              label="First name"
              autoComplete="given-name"
              maxLength={60}
              value={draft.firstName}
              onChange={(v) => update("firstName", v)}
              onBlur={blur("firstName")}
              error={errorFor("firstName")}
            />
            <TextField
              field="lastName"
              label="Last name"
              autoComplete="family-name"
              maxLength={60}
              value={draft.lastName}
              onChange={(v) => update("lastName", v)}
              onBlur={blur("lastName")}
              error={errorFor("lastName")}
            />
          </div>
          <BirthDate
            value={draft.birthDate}
            onChange={(v) => update("birthDate", v)}
            onBlur={blur("birthDate")}
            error={errorFor("birthDate")}
          />
        </Group>

        <Group legend="Your login">
          <TextField
            field="email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@yourbusiness.com"
            maxLength={254}
            value={draft.email}
            onChange={(v) => update("email", v)}
            onBlur={blur("email")}
            error={errorFor("email")}
          />
          <TextField
            field="emailConfirm"
            label="Confirm email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            value={draft.emailConfirm}
            onChange={(v) => update("emailConfirm", v)}
            onBlur={blur("emailConfirm")}
            error={errorFor("emailConfirm")}
          />
          <PasswordField
            field="password"
            label="Password"
            value={draft.password}
            onChange={(v) => update("password", v)}
            onBlur={blur("password")}
            error={errorFor("password")}
            describedBy="su-password-rules"
          >
            <PasswordRules password={draft.password} />
          </PasswordField>
          <PasswordField
            field="passwordConfirm"
            label="Confirm password"
            value={draft.passwordConfirm}
            onChange={(v) => update("passwordConfirm", v)}
            onBlur={blur("passwordConfirm")}
            error={errorFor("passwordConfirm")}
          />
        </Group>

        {/* Campo-isca: invisível para pessoas; robô que preenche é recusado. */}
        <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
          <label>
            Company website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div className="space-y-4">
          <CheckRow
            field="marketing"
            checked={draft.marketing}
            onChange={(v) => update("marketing", v)}
          >
            Email me product news and tips from No Sweat. Unsubscribe anytime.
          </CheckRow>
          <CheckRow
            field="terms"
            checked={draft.terms}
            onChange={(v) => {
              update("terms", v);
              setTouched((t) => ({ ...t, terms: true }));
            }}
            error={errorFor("terms")}
          >
            I’m 18 or older and I agree to the{" "}
            <Link href="/terms" target="_blank" className={link}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className={link}>
              Privacy Policy
            </Link>
            .
          </CheckRow>
        </div>

        <div className="space-y-4">
          <Turnstile action="signup" resetKey={state.attempt} />

          {state.error && !pending && (
            <p
              role="alert"
              className="ns-enter flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800"
            >
              <AlertIcon className="mt-0.5 size-4 shrink-0" />
              <span>
                {state.error}
                {state.error.includes("already exists") && (
                  <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                    <Link
                      href={
                        next === "/dashboard" ? "/login" : `/login?next=${encodeURIComponent(next)}`
                      }
                      className={link}
                    >
                      Log in instead
                    </Link>
                    <Link href="/forgot-password" className={link}>
                      Forgot password?
                    </Link>
                  </span>
                )}
              </span>
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className={`inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-brand px-6 text-base font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-dark active:scale-[0.99] disabled:cursor-wait disabled:bg-brand-dark motion-reduce:transition-none ${focusRing}`}
          >
            {pending && <Spinner />}
            {pending ? "Creating your account…" : "Create account"}
          </button>
        </div>
      </form>
      {after}
    </>
  );
}

/** Grupo de campos com título discreto e uma linha fina até a borda. */
function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 space-y-5">
      <legend className="mb-5 w-full">
        <span className="flex items-center gap-3 text-[13px] font-semibold text-slate-500 after:h-px after:flex-1 after:bg-slate-200">
          {legend}
        </span>
      </legend>
      {children}
    </fieldset>
  );
}

type InputProps = {
  field: SignUpField;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
};

/** Liga o campo à mensagem de erro (só quando há erro) e a uma dica opcional. */
function describedBy(field: SignUpField, error: string | undefined, extra?: string) {
  const ids = [extra, error ? errorId(field) : undefined].filter(Boolean).join(" ");
  return ids || undefined;
}

function TextField({
  field,
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  maxLength,
}: InputProps & {
  type?: "text" | "email";
  autoComplete: string;
  inputMode?: "email";
  placeholder?: string;
  maxLength: number;
}) {
  const isEmail = type === "email";
  return (
    <div className="min-w-0">
      <label htmlFor={inputId(field)} className={labelText}>
        {label}
      </label>
      <input
        id={inputId(field)}
        name={field}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        autoCapitalize={isEmail ? "none" : "words"}
        spellCheck={false}
        required
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(field, error)}
        className={`mt-1.5 ${fieldClass}`}
      />
      <FieldMessage id={errorId(field)} message={error} />
    </div>
  );
}

function BirthDate({ value, onChange, onBlur, error }: Omit<InputProps, "field" | "label">) {
  // Data máxima calculada uma vez por montagem (no navegador, com a data de hoje).
  const [max] = useState(() => latestBirthDate());
  return (
    <div>
      <label htmlFor={inputId("birthDate")} className={labelText}>
        Date of birth
      </label>
      <p id="su-birthDate-hint" className="mt-0.5 text-[13px] text-slate-500">
        You need to be 18 or older.
      </p>
      <input
        id={inputId("birthDate")}
        name="birthDate"
        type="date"
        autoComplete="bday"
        required
        min="1900-01-01"
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy("birthDate", error, "su-birthDate-hint")}
        className={`mt-1.5 appearance-none ${fieldClass} sm:max-w-[16rem]`}
      />
      <FieldMessage id={errorId("birthDate")} message={error} />
    </div>
  );
}

/** Senha com botão de olho dentro do campo. O tipo muda, mas o autocomplete continua
 *  "new-password", então gerenciadores de senha e o colar funcionam igual. */
function PasswordField({
  field,
  label,
  value,
  onChange,
  onBlur,
  error,
  describedBy: hint,
  children,
}: InputProps & { describedBy?: string; children?: ReactNode }) {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <label htmlFor={inputId(field)} className={labelText}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={inputId(field)}
          name={field}
          type={shown ? "text" : "password"}
          autoComplete="new-password"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={PASSWORD_MAX}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(field, error, hint)}
          className={`${fieldClass} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={`Show ${label.toLowerCase()}`}
          aria-pressed={shown}
          aria-controls={inputId(field)}
          className={`absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-slate-500 transition-colors duration-150 hover:text-ink ${focusRing} focus-visible:outline-offset-[-4px]`}
        >
          {shown ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {children}
      <FieldMessage id={errorId(field)} message={error} />
    </div>
  );
}

/** Requisitos da senha, ao vivo. Cada um ganha um ✓ quando a senha cumpre. */
function PasswordRules({ password }: { password: string }) {
  return (
    <ul
      id="su-password-rules"
      aria-label="Password requirements"
      className="mt-2.5 grid gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-2"
    >
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-2 transition-colors duration-150 motion-reduce:transition-none ${met ? "text-emerald-700" : "text-slate-600"}`}
          >
            <span
              aria-hidden="true"
              className={`flex size-4 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color] duration-150 motion-reduce:transition-none ${
                met ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"
              }`}
            >
              {met && <CheckIcon />}
            </span>
            {rule.label}
            <span className="sr-only">{met ? " (done)" : " (missing)"}</span>
          </li>
        );
      })}
    </ul>
  );
}

function CheckRow({
  field,
  checked,
  onChange,
  error,
  children,
}: {
  field: "marketing" | "terms";
  checked: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  children: ReactNode;
}) {
  const errorRef = field === "terms" ? errorId("terms") : undefined;
  return (
    <div>
      <div className="flex items-start gap-3 text-sm leading-relaxed text-slate-600">
        <input
          id={inputId(field)}
          type="checkbox"
          name={field}
          value="on"
          required={field === "terms"}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorRef : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-slate-300 accent-brand"
        />
        <label htmlFor={inputId(field)} className="cursor-pointer">
          {children}
        </label>
      </div>
      {errorRef && <FieldMessage id={errorRef} message={error} className="pl-8" />}
    </div>
  );
}

/**
 * Mensagem de erro que abre e fecha suave (altura + opacidade, 180ms). Guarda o último texto
 * para a animação de saída não ficar vazia.
 */
function FieldMessage({
  id,
  message,
  className = "",
}: {
  id: string;
  message?: string;
  className?: string;
}) {
  const [last, setLast] = useState(message);
  if (message && message !== last) setLast(message);
  const open = Boolean(message);
  return (
    <div
      aria-hidden={!open}
      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        <p id={id} className={`flex gap-1.5 pt-2 text-sm text-red-700 ${className}`}>
          <AlertIcon className="mt-[3px] size-3.5 shrink-0" />
          <span>{open ? message : last}</span>
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 animate-spin motion-reduce:animate-[spin_1.6s_linear_infinite]"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".3"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function EyeIcon() {
  return (
    <svg {...iconProps} className="size-5">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...iconProps} className="size-5">
      <path d="M10.6 5.6A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.5M6.6 6.6C3.9 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.7 0 3.2-.5 4.4-1.2" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...iconProps} strokeWidth={3} className="size-2.5">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function AlertIcon({ className }: { className: string }) {
  return (
    <svg {...iconProps} strokeWidth={2} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...iconProps} className="size-6">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}
