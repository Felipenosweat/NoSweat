"use client";

import {
  ApiError,
  GenerateSiteRequest,
  GenerateSiteResponse,
  type SiteSpec,
} from "@nosweat/schema";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  BUSINESS_KINDS,
  CHOICES_KEY,
  DRAFT_KEY,
  EMPTY_CHOICES,
  EMPTY_FIELDS,
  LANDING_BRIEF_KEY,
  LAYOUT_OPTIONS,
  LIMITS,
  PROMPT_LIMIT,
  STYLE_OPTIONS,
  US_STATES,
  composeBrief,
  formatLocation,
  parseChoices,
  parseDraft,
  slugBase,
  type BusinessKind,
  type CreateChoices,
  type CreateFields,
  type StoredDraft,
} from "./brief";
import { BUILD_STEPS, BuildingPanel, ReadyPanel } from "./Building";
import styles from "./create.module.css";
import { LocationFields } from "./LocationFields";
import { focusRing, inputClass, primaryButton, secondaryButton } from "./ui";
import { ColorPicker, LayoutPicker, SparkIcon } from "./WizardPickers";

// Fluxo /create: um cartão com o pedido ("Start with your idea.") e, ao criar, um assistente
// de 4 passos num <dialog> (pedido → layout → cores → revisão). O pedido vai no campo `what`
// do CreateFields (o `details` fica vazio); tudo vira UM texto para POST /api/sites/generate.

const STEPS = [
  {
    title: "What are we building?",
    lead: "Tell us about your business. You can change every word later.",
  },
  {
    title: "Style",
    lead: "How your homepage is laid out. Every layout works great on phones.",
  },
  {
    title: "Colors",
    lead: "Sets the colors, fonts and tone of voice. You can fine-tune them in the editor.",
  },
  {
    title: "Ready to start?",
    lead: "Check your request and create the first version.",
  },
] as const;

const LAST_STEP = STEPS.length - 1;

// Exemplos de pedido (limpeza primeiro, nicho inicial). Sem telefone nem nota inventados.
const PROMPT_EXAMPLES = [
  {
    label: "House cleaning",
    text: "House cleaning for busy families in Austin, TX. Weekly, biweekly and move-out cleans. We bring eco-friendly supplies. Open Mon–Sat, 8 AM – 6 PM.",
  },
  {
    label: "Plumbing",
    text: "Family-owned plumbing in Denver, CO. Emergency repairs, drain cleaning and water heater installs. Open 7 days a week.",
  },
  {
    label: "Hair salon",
    text: "Hair salon in Miami, FL. Balayage, keratin treatments and bridal styling. Open Tuesday to Saturday, walk-ins welcome.",
  },
  {
    label: "Restaurant",
    text: "Neighborhood taqueria in San Antonio, TX. Handmade tortillas, fish tacos and weekend brunch. Takeout and catering available.",
  },
];

// Tempo de cada etapa da construção enquanto a resposta não chega (a última espera a API).
const BUILD_STEP_DELAYS = [1400, 1800, 2200];

type FormError = { title: string; body: string; loginLink?: boolean; signupLink?: boolean };
type FieldErrors = Partial<Record<keyof CreateFields, string>>;
type Phase = "form" | "building" | "ready";
type Generated = { siteId: string; spec: SiteSpec };
type InitialState = StoredDraft & { choices: CreateChoices };

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

/** Erro do pedido (o mesmo teste do schema da API), ou `undefined` se está bom. */
function promptError(fields: CreateFields, choices: CreateChoices): string | undefined {
  if (fields.what.trim().length < 3) return "Tell us what you do in a few words.";
  const check = GenerateSiteRequest.safeParse({ brief: composeBrief(fields, choices) });
  return check.success ? undefined : check.error.issues[0]?.message;
}

function validateFirstStep(fields: CreateFields, choices: CreateChoices): FieldErrors {
  const errors: FieldErrors = {};
  const what = promptError(fields, choices);
  if (what) errors.what = what;
  if (fields.state.trim() && !US_STATES.has(fields.state.trim().toUpperCase())) {
    errors.state = "Use the two-letter code, like TX.";
  }
  return errors;
}

/** Lê o que dá para preencher: rascunho desta aba, ?brief= da landing ou sessionStorage. */
function initialState(initialBrief: string, canReadStorage: boolean): InitialState {
  const fromText = (text: string): InitialState => ({
    source: text,
    step: 0,
    fields: { ...EMPTY_FIELDS, what: text.slice(0, PROMPT_LIMIT) },
    choices: { ...EMPTY_CHOICES },
  });
  if (!canReadStorage) return fromText(initialBrief);
  let source = initialBrief;
  let draft: StoredDraft | null = null;
  let choices: CreateChoices = { ...EMPTY_CHOICES };
  try {
    if (!source) source = sessionStorage.getItem(LANDING_BRIEF_KEY)?.trim().slice(0, 2000) ?? "";
    draft = parseDraft(sessionStorage.getItem(DRAFT_KEY));
    choices = parseChoices(sessionStorage.getItem(CHOICES_KEY));
  } catch {
    // Armazenamento bloqueado (modo privado restrito): segue sem rascunho.
  }
  if (draft && draft.source === source) {
    // Rascunhos antigos (fluxo de 3 passos) tinham "what" e "details" separados.
    const prompt = [draft.fields.what.trim(), draft.fields.details.trim()]
      .filter(Boolean)
      .join("\n\n");
    return {
      ...draft,
      fields: { ...draft.fields, what: prompt.slice(0, PROMPT_LIMIT), details: "" },
      choices,
    };
  }
  return fromText(source);
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
  const [fields, setFields] = useState<CreateFields>(initial.fields);
  const [choices, setChoices] = useState<CreateChoices>(initial.choices);
  const [cardError, setCardError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Generated | null>(null);
  // A seção "nome e endereço" já começa aberta se o rascunho tinha algo nela.
  const [detailsInitiallyOpen] = useState(() =>
    Boolean(
      initial.fields.name ||
      initial.fields.city ||
      initial.fields.state ||
      initial.fields.serviceArea,
    ),
  );

  const headingRef = useRef<HTMLHeadingElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const moreRef = useRef<HTMLDetailsElement>(null);
  // Só move o foco depois de uma ação do usuário (nunca no primeiro carregamento).
  const shouldFocusHeading = useRef(false);

  // Abre/fecha o <dialog> nativo (showModal prende o foco e Esc fecha).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (wizardOpen && !dialog.open) dialog.showModal();
    else if (!wizardOpen && dialog.open) dialog.close();
  }, [wizardOpen, phase]);

  // Depois do showModal (acima): o título do passo só recebe foco com o diálogo aberto.
  useEffect(() => {
    if (!shouldFocusHeading.current) return;
    shouldFocusHeading.current = false;
    headingRef.current?.focus();
  }, [step, phase, wizardOpen]);

  // Guarda as respostas na aba (ex.: sessão expirou → login → volta com tudo preenchido).
  useEffect(() => {
    if (!canReadStorage) return;
    try {
      if (phase === "ready") {
        sessionStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem(CHOICES_KEY);
      } else {
        const draft: StoredDraft = { source: initial.source, step, fields };
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        sessionStorage.setItem(CHOICES_KEY, JSON.stringify(choices));
      }
    } catch {
      // Sem armazenamento: o fluxo continua funcionando, só não lembra as respostas.
    }
  }, [canReadStorage, initial.source, step, fields, choices, phase]);

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
    if (key === "what") setCardError(null);
  }

  function choose<K extends keyof CreateChoices>(key: K, value: CreateChoices[K]) {
    setChoices((current) => ({ ...current, [key]: value }));
  }

  function goTo(next: number) {
    setDirection(next > step ? "forward" : "back");
    setFieldErrors({});
    shouldFocusHeading.current = true;
    setStep(next);
  }

  /** Confere o passo 1; se houver erro, mostra e leva o foco ao campo. */
  function firstStepIsValid(): boolean {
    const errors = validateFirstStep(fields, choices);
    setFieldErrors(errors);
    if (errors.what) {
      document.getElementById("wizard-prompt")?.focus();
      return false;
    }
    if (errors.state) {
      if (moreRef.current) moreRef.current.open = true;
      document.getElementById("create-state")?.focus();
      return false;
    }
    return true;
  }

  function openWizard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = promptError(fields, choices);
    if (error) {
      setCardError(error);
      promptRef.current?.focus();
      return;
    }
    setCardError(null);
    setFieldErrors({});
    setDirection("forward");
    setStep(0);
    shouldFocusHeading.current = true;
    setWizardOpen(true);
  }

  function backToWizard(error: FormError) {
    setFormError(error);
    setDirection("back");
    setStep(LAST_STEP);
    shouldFocusHeading.current = true;
    setPhase("form");
    setWizardOpen(true);
  }

  async function generate() {
    const input = GenerateSiteRequest.safeParse({ brief: composeBrief(fields, choices) });
    if (!input.success) {
      setFormError(errorFor("invalid_request", input.error.issues[0]?.message ?? ""));
      return;
    }

    setFormError(null);
    setResult(null);
    setProgress(0);
    shouldFocusHeading.current = true;
    setWizardOpen(false);
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
        backToWizard(errorFor(code, message));
        return;
      }

      const { siteId, spec } = GenerateSiteResponse.parse(body);
      setResult({ siteId, spec });
    } catch {
      backToWizard(errorFor("network_error", ""));
    }
  }

  function handleWizardSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 0 && !firstStepIsValid()) return;
    if (step < LAST_STEP) {
      goTo(step + 1);
      return;
    }
    // Revisão: confere o pedido de novo (pode ter mudado) antes de gerar.
    const errors = validateFirstStep(fields, choices);
    if (errors.what || errors.state) {
      goTo(0);
      return;
    }
    void generate();
  }

  /** "Let AI decide the rest": layout e cores ficam com a No Sweat e vai direto à revisão. */
  function letAiDecide() {
    if (!firstStepIsValid()) return;
    setChoices((current) => ({ ...current, layout: "auto" }));
    update("style", "auto");
    goTo(LAST_STEP);
  }

  function applyExample(text: string, target: HTMLTextAreaElement | null) {
    const current = fields.what.trim();
    const replace = !current || PROMPT_EXAMPLES.some((example) => example.text === current);
    update("what", (replace ? text : `${current}\n${text}`).slice(0, PROMPT_LIMIT));
    requestAnimationFrame(() => target?.focus());
  }

  function submitOnModEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl + Enter envia; Enter sozinho quebra a linha (o pedido pode ter vários parágrafos).
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  if (phase === "building") {
    const slug = slugBase(fields.name) || "your-business";
    return <BuildingPanel progress={progress} slug={slug} headingRef={headingRef} />;
  }

  if (phase === "ready" && result) {
    return <ReadyPanel siteId={result.siteId} spec={result.spec} headingRef={headingRef} />;
  }

  const meta = STEPS[step] ?? STEPS[0];
  const kindLabel =
    BUSINESS_KINDS.find((option) => option.id === choices.kind)?.label ??
    "No Sweat detects it from your description";
  const layoutLabel =
    LAYOUT_OPTIONS.find((option) => option.id === choices.layout)?.label ?? "No Sweat chooses";
  const colorLabel =
    STYLE_OPTIONS.find((option) => option.id === fields.style)?.label ?? "No Sweat chooses";
  const location = formatLocation(fields.city, fields.state);
  const nameAndPlace = [
    fields.name.trim(),
    location,
    fields.serviceArea.trim() && `serving ${fields.serviceArea.trim()}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-[44rem] pt-4 sm:pt-12 lg:pt-16">
      {/* ---------- Cartão do pedido ---------- */}
      <h1 className="font-display text-[2rem] leading-[1.08] font-bold tracking-[-0.035em] text-balance text-ink sm:text-[2.75rem]">
        Start with your idea.
      </h1>
      <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.6] text-pretty text-slate-600 sm:text-[17px]">
        Describe your business in a sentence or two: what you do and where. We&rsquo;ll build the
        first draft.
      </p>

      <form onSubmit={openWizard} noValidate className="mt-8">
        <div
          className={`rounded-2xl border bg-white shadow-[0_1px_2px_rgb(7_27_51/.04),0_12px_32px_-12px_rgb(7_27_51/.14)] transition-[border-color,box-shadow] duration-150 focus-within:ring-4 motion-reduce:transition-none ${
            cardError
              ? "border-red-400 focus-within:ring-red-100"
              : "border-slate-200 focus-within:border-slate-300 focus-within:ring-brand/10"
          }`}
        >
          <label htmlFor="create-prompt" className="sr-only">
            Describe your business
          </label>
          <textarea
            id="create-prompt"
            ref={promptRef}
            rows={4}
            value={fields.what}
            maxLength={PROMPT_LIMIT}
            onChange={(event) => update("what", event.target.value)}
            onKeyDown={submitOnModEnter}
            aria-invalid={cardError ? true : undefined}
            aria-describedby={cardError ? "create-prompt-error" : "create-prompt-hint"}
            placeholder="House cleaning for busy families in Austin, TX. Weekly and move-out cleans, eco-friendly supplies."
            className="block max-h-[50vh] min-h-32 w-full resize-none rounded-t-2xl bg-transparent px-5 pt-5 pb-2 text-base leading-[1.6] text-ink [field-sizing:content] placeholder:text-slate-400 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-3 px-3 pb-3 sm:pl-5">
            <p id="create-prompt-hint" className="min-w-0 text-[13px] text-slate-500">
              <span className="hidden sm:inline">Your draft stays private until you publish.</span>
            </p>
            <button
              type="submit"
              className={`${primaryButton} h-11 shrink-0 px-4 max-sm:flex-1 sm:px-5`}
            >
              <ArrowIcon direction="forward" />
              Create website
            </button>
          </div>
        </div>
        {cardError && (
          <p
            id="create-prompt-error"
            role="alert"
            className="mt-3 flex gap-1.5 text-[13px] text-red-700"
          >
            <AlertIcon small />
            {cardError}
          </p>
        )}
      </form>

      <div className="mt-5">
        <p id="prompt-examples-label" className="sr-only">
          Start from an example
        </p>
        <div
          role="group"
          aria-labelledby="prompt-examples-label"
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {PROMPT_EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => applyExample(example.text, promptRef.current)}
              className={`min-h-11 shrink-0 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-medium whitespace-nowrap text-slate-600 transition-colors duration-150 hover:border-slate-300 hover:text-ink active:translate-y-px motion-reduce:transition-none sm:min-h-9 ${focusRing}`}
            >
              <span className="sr-only">Use example: </span>
              {example.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-slate-500 sm:hidden">
          Your draft stays private until you publish.
        </p>
      </div>

      {/* ---------- Assistente de 4 passos ---------- */}
      <dialog
        ref={dialogRef}
        aria-labelledby="create-step-heading"
        onClose={() => setWizardOpen(false)}
        onClick={(event) => {
          // Clique no fundo escuro (fora da caixa) fecha.
          if (event.target === event.currentTarget) setWizardOpen(false);
        }}
        className="m-0 mt-auto max-h-[92dvh] w-full max-w-none flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white p-0 text-ink shadow-[0_1px_2px_rgb(7_27_51/.06),0_24px_48px_-12px_rgb(7_27_51/.25)] backdrop:bg-ink/30 open:flex sm:m-auto sm:max-h-[min(46rem,calc(100dvh-4rem))] sm:w-[calc(100%-3rem)] sm:max-w-[40rem] sm:rounded-2xl motion-safe:transition-[opacity,translate] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(.2,.8,.2,1)] motion-safe:starting:open:translate-y-4 motion-safe:starting:open:opacity-0"
      >
        {wizardOpen && (
          <form onSubmit={handleWizardSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 px-5 pt-2 sm:px-8 sm:pt-5">
              <div aria-hidden="true" className="flex justify-center pb-2 sm:hidden">
                <span className="h-1 w-9 rounded-full bg-slate-300" />
              </div>
              <div className="flex items-center gap-3">
                <p className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                  <Image
                    src="/brand/nosweat-mark-64.png"
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 shrink-0"
                  />
                  Create website
                </p>
                <p className="text-[13px] text-slate-500 tabular-nums">
                  Step {step + 1} of {STEPS.length}
                </p>
                <button
                  type="button"
                  onClick={() => setWizardOpen(false)}
                  aria-label="Close"
                  className={`-mr-3 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors duration-150 hover:bg-slate-50 hover:text-ink ${focusRing}`}
                >
                  <CloseIcon />
                </button>
              </div>
              <ol aria-hidden="true" className="mt-2 grid grid-cols-4 gap-1.5">
                {STEPS.map((item, index) => (
                  <li
                    key={item.title}
                    className={`h-1 rounded-full transition-colors duration-200 motion-reduce:transition-none ${
                      index <= step ? "bg-brand" : "bg-slate-200"
                    }`}
                  />
                ))}
              </ol>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-6 pb-6 sm:px-8">
              <div
                key={step}
                className={direction === "forward" ? styles.stepForward : styles.stepBack}
              >
                <h2
                  id="create-step-heading"
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-display text-[1.5rem] leading-[1.15] font-bold tracking-[-0.03em] text-balance text-ink outline-none sm:text-[1.75rem]"
                >
                  {meta.title}
                </h2>
                <p className="mt-1.5 text-[15px] leading-[1.6] text-pretty text-slate-600">
                  {meta.lead}
                </p>

                <div className="mt-6 space-y-5">
                  {step === 0 && (
                    <>
                      <Field
                        id="wizard-prompt"
                        label="Your request"
                        error={fieldErrors.what}
                        hint={`${fields.what.length.toLocaleString("en-US")} / ${PROMPT_LIMIT.toLocaleString("en-US")}`}
                      >
                        {(describedBy) => (
                          <textarea
                            id="wizard-prompt"
                            rows={4}
                            value={fields.what}
                            maxLength={PROMPT_LIMIT}
                            onChange={(event) => update("what", event.target.value)}
                            onKeyDown={submitOnModEnter}
                            aria-describedby={describedBy}
                            aria-invalid={fieldErrors.what ? true : undefined}
                            className={`${inputClass(Boolean(fieldErrors.what))} max-h-64 min-h-28 resize-none py-3 leading-[1.55] [field-sizing:content]`}
                          />
                        )}
                      </Field>

                      <Field id="wizard-kind" label="Type of business" optional>
                        {(describedBy) => (
                          <div className="relative">
                            <select
                              id="wizard-kind"
                              value={choices.kind}
                              onChange={(event) =>
                                choose("kind", event.target.value as BusinessKind)
                              }
                              aria-describedby={describedBy}
                              className={`${inputClass(false)} h-12 cursor-pointer appearance-none pr-11`}
                            >
                              <option value="auto">
                                No Sweat detects it from your description
                              </option>
                              {BUSINESS_KINDS.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <ChevronIcon className="pointer-events-none absolute top-1/2 right-4 mt-1 size-4 -translate-y-1/2 text-slate-500" />
                          </div>
                        )}
                      </Field>

                      <details className="group/examples">
                        <summary
                          className={`inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-xl text-[13px] font-medium text-slate-600 hover:text-ink [&::-webkit-details-marker]:hidden ${focusRing}`}
                        >
                          <ChevronIcon className="size-4 -rotate-90 transition-transform duration-150 group-open/examples:rotate-0 motion-reduce:transition-none" />
                          See examples
                        </summary>
                        <ul className="mt-1 space-y-2">
                          {PROMPT_EXAMPLES.map((example) => (
                            <li key={example.label}>
                              <button
                                type="button"
                                onClick={() =>
                                  applyExample(
                                    example.text,
                                    document.getElementById(
                                      "wizard-prompt",
                                    ) as HTMLTextAreaElement | null,
                                  )
                                }
                                className={`block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors duration-150 hover:border-slate-300 hover:bg-surface motion-reduce:transition-none ${focusRing}`}
                              >
                                <span className="block text-[13px] font-semibold text-ink">
                                  <span className="sr-only">Use example: </span>
                                  {example.label}
                                </span>
                                <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-slate-500">
                                  {example.text}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </details>

                      <details
                        ref={moreRef}
                        open={detailsInitiallyOpen}
                        className="group/more rounded-xl border border-slate-200"
                      >
                        <summary
                          className={`flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-xl px-4 text-[15px] font-medium text-ink [&::-webkit-details-marker]:hidden ${focusRing}`}
                        >
                          <span className="flex-1">
                            Business name and location
                            <span className="font-normal text-slate-500"> (optional)</span>
                          </span>
                          <ChevronIcon className="size-4 text-slate-500 transition-transform duration-150 group-open/more:rotate-180 motion-reduce:transition-none" />
                        </summary>
                        <div className="space-y-5 border-t border-slate-200 px-4 pt-4 pb-5">
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
                          <LocationFields
                            fields={fields}
                            update={update}
                            stateError={fieldErrors.state}
                          />
                        </div>
                      </details>
                    </>
                  )}

                  {step === 1 && (
                    <LayoutPicker
                      value={choices.layout}
                      onChange={(value) => choose("layout", value)}
                      labelledBy="create-step-heading"
                    />
                  )}

                  {step === 2 && (
                    <ColorPicker
                      value={fields.style}
                      onChange={(value) => update("style", value)}
                      labelledBy="create-step-heading"
                    />
                  )}

                  {step === LAST_STEP && (
                    <>
                      {formError && (
                        <div
                          role="alert"
                          className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                        >
                          <AlertIcon />
                          <p>
                            <strong className="font-semibold">{formError.title}</strong>{" "}
                            {formError.body}
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
                      <dl className="divide-y divide-slate-200 border-y border-slate-200">
                        <SummaryRow label="Your request" onChange={() => goTo(0)}>
                          <span className="line-clamp-4 whitespace-pre-line">
                            {fields.what.trim()}
                          </span>
                        </SummaryRow>
                        {nameAndPlace && (
                          <SummaryRow label="Name and place" onChange={() => goTo(0)}>
                            {nameAndPlace}
                          </SummaryRow>
                        )}
                        <SummaryRow label="Business type" onChange={() => goTo(0)}>
                          {kindLabel}
                        </SummaryRow>
                        <SummaryRow label="Style" onChange={() => goTo(1)}>
                          {layoutLabel}
                        </SummaryRow>
                        <SummaryRow label="Colors" onChange={() => goTo(2)}>
                          {colorLabel}
                        </SummaryRow>
                        <SummaryRow label="Level of detail">Balanced</SummaryRow>
                      </dl>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Rodapé: no celular respeita a área segura do iPhone. */}
            <div className="flex shrink-0 items-center gap-3 border-t border-slate-200 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-4">
              {step === 0 ? (
                <button
                  type="button"
                  onClick={letAiDecide}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-1 text-[13px] font-semibold text-brand hover:text-brand-dark sm:text-[15px] ${focusRing}`}
                >
                  <SparkIcon />
                  Let AI decide the rest
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  className={`${secondaryButton} h-11 px-4`}
                >
                  Back
                </button>
              )}
              <button type="submit" className={`${primaryButton} ml-auto h-11 px-5`}>
                <ArrowIcon direction="forward" />
                {step === LAST_STEP ? "Create website" : "Continue"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}

/** Linha da revisão: rótulo, valor e "Change" (volta ao passo). */
function SummaryRow({
  label,
  onChange,
  children,
}: {
  label: string;
  onChange?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-start gap-x-3 py-2 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
      <dt className="pt-2.5 text-[13px] text-slate-500">{label}</dt>
      <dd className="pt-2 text-[15px] leading-[1.5] break-words text-ink">{children}</dd>
      <dd>
        {onChange && (
          <button
            type="button"
            onClick={onChange}
            className={`inline-flex min-h-11 items-center rounded-xl px-1 text-[13px] font-semibold text-brand hover:text-brand-dark ${focusRing}`}
          >
            Change<span className="sr-only"> {label.toLowerCase()}</span>
          </button>
        )}
      </dd>
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
  onChange: (value: string) => void;
};

function TextField({
  value,
  maxLength,
  placeholder,
  autoComplete,
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

function ChevronIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      aria-hidden="true"
      className="size-5"
    >
      <path d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
