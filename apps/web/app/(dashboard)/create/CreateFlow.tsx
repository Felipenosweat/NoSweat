"use client";

import {
  ApiError,
  GenerateSiteRequest,
  GenerateSiteResponse,
  type SiteSpec,
} from "@nosweat/schema";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  DRAFT_KEY,
  LANDING_BRIEF_KEY,
  LIMITS,
  US_STATES,
  composeBrief,
  fieldsFromBrief,
  parseDraft,
  slugBase,
  type CreateFields,
  type StoredDraft,
} from "./brief";
import { BUILD_STEPS, BuildingPanel, ReadyPanel } from "./Building";
import styles from "./create.module.css";
import { LocationFields } from "./LocationFields";
import { StylePicker } from "./StylePicker";
import { focusRing, inputClass, primaryButton, secondaryButton } from "./ui";

const STEPS = [
  {
    title: "What’s your business called, and what do you do?",
    lead: "Two quick answers. You can change every word later.",
  },
  {
    title: "Where do you work?",
    lead: "Customers want to know you serve their area. Leave it blank if you work online.",
  },
  {
    title: "Anything else?",
    lead: "Optional. Services, hours, a phone number, or what makes you different.",
  },
] as const;

const LAST_STEP = STEPS.length - 1;

// Exemplos de detalhes (limpeza primeiro, nicho inicial). Sem telefone inventado.
const DETAIL_EXAMPLES = [
  {
    label: "House cleaning",
    text: "Weekly, biweekly and move-out cleans. We bring eco-friendly supplies. Open Mon–Sat, 8 AM – 6 PM.",
  },
  {
    label: "Plumbing",
    text: "Emergency repairs, drain cleaning and water heater installs. Open 7 days a week.",
  },
  {
    label: "Hair salon",
    text: "Balayage, keratin treatments and bridal styling. Open Tuesday to Saturday, walk-ins welcome.",
  },
  {
    label: "Restaurant",
    text: "Handmade tortillas, fish tacos and weekend brunch. Takeout and catering available.",
  },
];

// Tempo de cada etapa da construção enquanto a resposta não chega (a última espera a API).
const BUILD_STEP_DELAYS = [1400, 1800, 2200];

type FormError = { title: string; body: string; loginLink?: boolean; signupLink?: boolean };
type FieldErrors = Partial<Record<keyof CreateFields, string>>;
type Phase = "form" | "building" | "ready";
type Generated = { siteId: string; spec: SiteSpec };

/** Mensagens amigáveis para cada `error.code` da API. */
function errorFor(code: string, fallback: string): FormError {
  switch (code) {
    case "invalid_request":
      return {
        title: "Please tell us a bit more.",
        body: fallback || "Add a few words about your business and try again.",
      };
    case "unauthorized":
      return {
        title: "Your session expired.",
        body: "Log in again to continue. Your answers are saved in this tab.",
        loginLink: true,
      };
    case "quota_exceeded":
      // Limite de uso da IA (visitante sem conta ou limite diário da conta).
      return {
        title: "You’ve reached today’s limit.",
        body: fallback || "Please try again tomorrow.",
        signupLink: true,
      };
    case "generation_failed":
      return {
        title: "We couldn’t build your site this time.",
        body: "Your answers are still here, so try again in a moment.",
      };
    case "network_error":
      return {
        title: "We couldn’t reach No Sweat.",
        body: "Check your connection and try again.",
      };
    default:
      return {
        title: "Something went wrong on our end.",
        body: "Your answers are still here, so please try again.",
      };
  }
}

function validateStep(step: number, fields: CreateFields): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 0) {
    if (fields.what.trim().length < 3) {
      errors.what = "Tell us what you do in a few words.";
    } else {
      const check = GenerateSiteRequest.safeParse({ brief: composeBrief(fields) });
      if (!check.success) errors.what = check.error.issues[0]?.message;
    }
  }
  if (step === 1 && fields.state.trim() && !US_STATES.has(fields.state.trim().toUpperCase())) {
    errors.state = "Use the two-letter code, like TX.";
  }
  return errors;
}

/** Lê o que dá para preencher: rascunho desta aba, ?brief= da landing ou sessionStorage. */
function initialState(initialBrief: string, canReadStorage: boolean): StoredDraft {
  if (!canReadStorage)
    return { source: initialBrief, step: 0, fields: fieldsFromBrief(initialBrief) };
  let source = initialBrief;
  let draft: StoredDraft | null = null;
  try {
    if (!source) source = sessionStorage.getItem(LANDING_BRIEF_KEY)?.trim().slice(0, 2000) ?? "";
    draft = parseDraft(sessionStorage.getItem(DRAFT_KEY));
  } catch {
    // Armazenamento bloqueado (modo privado restrito): segue sem rascunho.
  }
  if (draft && draft.source === source) return draft;
  return { source, step: 0, fields: fieldsFromBrief(source) };
}

const noopSubscribe = () => () => {};

/**
 * O servidor desenha o formulário só com o ?brief=. Depois da hidratação o fluxo é montado
 * de novo (key diferente) já lendo o sessionStorage, sem setState dentro de efeito.
 */
export function CreateFlow({ initialBrief }: { initialBrief: string }) {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  return (
    <Flow
      key={hydrated ? "client" : "server"}
      initialBrief={initialBrief}
      canReadStorage={hydrated}
    />
  );
}

function Flow({ initialBrief, canReadStorage }: { initialBrief: string; canReadStorage: boolean }) {
  const [initial] = useState(() => initialState(initialBrief, canReadStorage));
  const [step, setStep] = useState(initial.step);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [fields, setFields] = useState<CreateFields>(initial.fields);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Generated | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  // Só move o foco depois de uma ação do usuário (nunca no primeiro carregamento).
  const shouldFocusHeading = useRef(false);

  useEffect(() => {
    if (!shouldFocusHeading.current) return;
    shouldFocusHeading.current = false;
    headingRef.current?.focus();
  }, [step, phase]);

  // Guarda as respostas na aba (ex.: sessão expirou → login → volta com tudo preenchido).
  useEffect(() => {
    if (!canReadStorage) return;
    try {
      if (phase === "ready") sessionStorage.removeItem(DRAFT_KEY);
      else {
        const draft: StoredDraft = { source: initial.source, step, fields };
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
    } catch {
      // Sem armazenamento: o fluxo continua funcionando, só não lembra as respostas.
    }
  }, [canReadStorage, initial.source, step, fields, phase]);

  // Avança as etapas da construção; a última só termina quando a resposta da API chega.
  useEffect(() => {
    if (phase !== "building") return;
    if (progress >= BUILD_STEPS.length) {
      const timer = setTimeout(() => {
        shouldFocusHeading.current = true;
        setPhase("ready");
      }, 450);
      return () => clearTimeout(timer);
    }
    if (!result && progress >= BUILD_STEPS.length - 1) return;
    const delay = result ? 220 : (BUILD_STEP_DELAYS[progress] ?? 1800);
    const timer = setTimeout(() => setProgress((value) => value + 1), delay);
    return () => clearTimeout(timer);
  }, [phase, progress, result]);

  function update<K extends keyof CreateFields>(key: K, value: CreateFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function goTo(next: number) {
    setDirection(next > step ? "forward" : "back");
    setFieldErrors({});
    shouldFocusHeading.current = true;
    setStep(next);
  }

  function backToForm(error: FormError) {
    setFormError(error);
    setDirection("back");
    setStep(LAST_STEP);
    shouldFocusHeading.current = true;
    setPhase("form");
  }

  async function generate() {
    const input = GenerateSiteRequest.safeParse({ brief: composeBrief(fields) });
    if (!input.success) {
      setFormError(errorFor("invalid_request", input.error.issues[0]?.message ?? ""));
      return;
    }

    setFormError(null);
    setResult(null);
    setProgress(0);
    shouldFocusHeading.current = true;
    setPhase("building");

    try {
      const res = await fetch("/api/sites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.data),
      });
      const body: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const apiError = ApiError.safeParse(body);
        const code = apiError.success ? apiError.data.error.code : "internal_error";
        const message = apiError.success ? apiError.data.error.message : "";
        backToForm(errorFor(code, message));
        return;
      }

      const { siteId, spec } = GenerateSiteResponse.parse(body);
      setResult({ siteId, spec });
    } catch {
      backToForm(errorFor("network_error", ""));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateStep(step, fields);
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) {
      setFieldErrors(errors);
      document.getElementById(`create-${firstInvalid}`)?.focus();
      return;
    }
    if (step < LAST_STEP) {
      goTo(step + 1);
      return;
    }
    void generate();
  }

  function applyExample(text: string) {
    const current = fields.details.trim();
    const replace = !current || DETAIL_EXAMPLES.some((example) => example.text === current);
    update("details", (replace ? text : `${current}\n${text}`).slice(0, LIMITS.details));
  }

  if (phase === "building") {
    const slug = slugBase(fields.name) || "your-business";
    return <BuildingPanel progress={progress} slug={slug} headingRef={headingRef} />;
  }

  if (phase === "ready" && result) {
    return <ReadyPanel siteId={result.siteId} spec={result.spec} headingRef={headingRef} />;
  }

  const meta = STEPS[step] ?? STEPS[0];

  return (
    <div className="mx-auto max-w-[42rem]">
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-labelledby="create-step-heading"
        className="pb-4 sm:rounded-xl sm:border sm:border-slate-200 sm:bg-white sm:p-10 sm:pb-10"
      >
        <div className="flex items-center gap-3">
          <ol aria-hidden="true" className="flex items-center gap-1.5">
            {STEPS.map((item, index) => (
              <li
                key={item.title}
                className={`size-2 rounded-full transition-colors duration-200 ${
                  index === step ? "bg-brand" : index < step ? "bg-slate-500" : "bg-slate-300"
                }`}
              />
            ))}
          </ol>
          <p className="text-[13px] font-medium text-slate-500">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        <div key={step} className={direction === "forward" ? styles.stepForward : styles.stepBack}>
          <h1
            id="create-step-heading"
            ref={headingRef}
            tabIndex={-1}
            className="mt-4 font-display text-[1.75rem] leading-[1.1] font-bold tracking-[-0.03em] text-balance text-ink outline-none sm:text-[2.25rem]"
          >
            {meta.title}
          </h1>
          <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.6] text-pretty text-slate-600 sm:text-base">
            {meta.lead}
          </p>

          <div className="mt-8 space-y-6">
            {step === 0 && (
              <>
                <TextField
                  id="create-name"
                  label="Business name"
                  optional
                  hint="No name yet? Leave it blank and we’ll suggest one."
                  value={fields.name}
                  maxLength={LIMITS.name}
                  autoComplete="organization"
                  placeholder="Sparkle & Shine Cleaning"
                  onChange={(value) => update("name", value)}
                />
                <Field
                  id="create-what"
                  label="What do you do?"
                  hint="One line is plenty."
                  error={fieldErrors.what}
                >
                  {(describedBy) => (
                    <textarea
                      id="create-what"
                      rows={2}
                      value={fields.what}
                      maxLength={LIMITS.what}
                      onChange={(event) => update("what", event.target.value)}
                      onKeyDown={(event) => {
                        // Campo de uma linha: Enter avança (Shift+Enter ainda quebra a linha).
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      aria-describedby={describedBy}
                      aria-invalid={fieldErrors.what ? true : undefined}
                      placeholder="House cleaning for busy families, weekly or one-time"
                      className={`${inputClass(Boolean(fieldErrors.what))} min-h-[4.5rem] resize-none py-3 leading-[1.5] [field-sizing:content]`}
                    />
                  )}
                </Field>
              </>
            )}

            {step === 1 && (
              <LocationFields fields={fields} update={update} stateError={fieldErrors.state} />
            )}

            {step === 2 && (
              <>
                {formError && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  >
                    <AlertIcon />
                    <p>
                      <strong className="font-semibold">{formError.title}</strong> {formError.body}
                      {formError.signupLink && (
                        <>
                          {" "}
                          <Link
                            href="/signup?next=/create"
                            className={`font-semibold text-red-800 underline underline-offset-4 ${focusRing}`}
                          >
                            Create a free account
                          </Link>
                        </>
                      )}
                      {formError.loginLink && (
                        <>
                          {" "}
                          <Link
                            href="/login?next=/create"
                            className={`font-semibold text-red-800 underline underline-offset-4 ${focusRing}`}
                          >
                            Log in
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                )}
                <div>
                  <Field
                    id="create-details"
                    label="Details"
                    optional
                    hint="Services, hours, phone, what makes you different."
                  >
                    {(describedBy) => (
                      <textarea
                        id="create-details"
                        rows={3}
                        value={fields.details}
                        maxLength={LIMITS.details}
                        onChange={(event) => update("details", event.target.value)}
                        aria-describedby={describedBy}
                        className={`${inputClass(false)} min-h-24 resize-y py-3 leading-[1.5]`}
                      />
                    )}
                  </Field>
                  <div className="mt-3">
                    <p id="examples-label" className="text-[13px] text-slate-500">
                      Need ideas? Start from an example:
                    </p>
                    <div
                      role="group"
                      aria-labelledby="examples-label"
                      className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
                    >
                      {DETAIL_EXAMPLES.map((example) => (
                        <button
                          key={example.label}
                          type="button"
                          onClick={() => applyExample(example.text)}
                          className={`min-h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-sm whitespace-nowrap text-slate-700 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 active:translate-y-px ${focusRing}`}
                        >
                          <span className="sr-only">Use example details: </span>
                          {example.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <StylePicker value={fields.style} onChange={(value) => update("style", value)} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ações: no celular ficam presas embaixo (com a área segura do iPhone). */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:static sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <div className="mx-auto flex max-w-[42rem] items-center gap-3">
            {step > 0 && (
              <button type="button" onClick={() => goTo(step - 1)} className={secondaryButton}>
                <ArrowIcon direction="back" />
                Back
              </button>
            )}
            {step === LAST_STEP && (
              <p className="hidden text-[13px] text-slate-500 sm:block">
                Your draft stays private until you publish.
              </p>
            )}
            <button type="submit" className={`${primaryButton} flex-1 sm:ml-auto sm:flex-none`}>
              {step === LAST_STEP ? "Build my website" : "Continue"}
              {step < LAST_STEP && <ArrowIcon direction="forward" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: (describedBy: string | undefined) => ReactNode;
};

/** Rótulo, campo, dica e erro ligados por id (aria-describedby). */
function Field({ id, label, optional, hint, error, children }: FieldProps) {
  const describedBy =
    [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-slate-500"> (optional)</span>}
      </label>
      {children(describedBy)}
      {error && (
        <p id={`${id}-error`} className="mt-2 flex gap-1.5 text-[13px] text-red-700">
          <AlertIcon small />
          {error}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-2 text-[13px] text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<FieldProps, "children"> & {
  value: string;
  maxLength: number;
  placeholder?: string;
  autoComplete?: string;
  autoCapitalize?: string;
  spellCheck?: boolean;
  onChange: (value: string) => void;
};

function TextField({
  value,
  maxLength,
  placeholder,
  autoComplete,
  autoCapitalize,
  spellCheck,
  onChange,
  ...field
}: TextFieldProps) {
  return (
    <Field {...field}>
      {(describedBy) => (
        <input
          id={field.id}
          type="text"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          spellCheck={spellCheck}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={describedBy}
          aria-invalid={field.error ? true : undefined}
          className={`${inputClass(Boolean(field.error))} h-12`}
        />
      )}
    </Field>
  );
}

function AlertIcon({ small = false }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={small ? "mt-px size-4 shrink-0" : "mt-0.5 size-5 shrink-0 text-red-700"}
    >
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6.25v4.5M10 13.5v.25" />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "forward" | "back" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      <path d={direction === "forward" ? "M3 8h10M9 4l4 4-4 4" : "M13 8H3M7 4 3 8l4 4"} />
    </svg>
  );
}
