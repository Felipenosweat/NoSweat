"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PillArrow } from "./Pill";

// As perguntas do topo, uma de cada vez (forma do averaks.com): que tipo de negócio, onde, o
// nome e, se quiser, um detalhe. No fim viram uma frase (o mesmo `brief` do campo antigo) e
// vão para /create?brief=…&start=1, que monta o site na hora. O texto também fica no
// sessionStorage `ns-brief`, como no PromptForm.
// Sem JavaScript: o <noscript> leva direto para o /create.
// Um evento `ns:preset-kind` (de qualquer botão da página) preenche a primeira pergunta.
// Cada chip de ramo leva `data-kind`: o HeroPreview ouve (por delegação) para trocar a captura.

const STORAGE_KEY = "ns-brief";

export const KINDS = [
  { label: "Home services", phrase: "Home services business" },
  { label: "Food & drink", phrase: "Restaurant or food business" },
  { label: "Beauty & wellness", phrase: "Beauty and wellness business" },
  { label: "Health & fitness", phrase: "Health and fitness business" },
  { label: "Professional services", phrase: "Professional services firm" },
  { label: "Shop & retail", phrase: "Local shop" },
  { label: "Something else", phrase: "Local business" },
] as const;

const STEPS = ["kind", "where", "name", "details"] as const;
type Step = (typeof STEPS)[number];

const PROMPTS: Record<Step, { title: string; hint: string }> = {
  kind: { title: "What kind of business is it?", hint: "Pick the closest fit." },
  where: { title: "Where are you based?", hint: "City and state. It helps people find you." },
  name: { title: "What’s it called?", hint: "Optional. Leave it blank and we’ll suggest one." },
  details: {
    title: "Anything we should know?",
    hint: "Optional. Services, hours, a phone number. Whatever you’d tell a customer.",
  },
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

// Campos de uma linha: pílula branca com borda visível (3:1) e o contorno azul no foco.
const field = `h-12 w-full max-w-[380px] rounded-full border border-slate-500 bg-white px-6 text-center text-lg font-medium text-ink transition-colors duration-200 placeholder:text-slate-500 hover:border-ink lg:text-left ${focusRing}`;

export function HeroStepper() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [kind, setKind] = useState("");
  const [where, setWhere] = useState("");
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const step = STEPS[index] ?? "kind";

  // Foco no campo de cada passo (no computador; no celular o teclado cobriria a tela).
  useEffect(() => {
    if (index === 0 || !window.matchMedia("(min-width: 640px)").matches) return;
    const timer = window.setTimeout(() => fieldRef.current?.focus({ preventScroll: true }), 300);
    return () => window.clearTimeout(timer);
  }, [index]);

  // Os chips de "Website" (mais abaixo na página) respondem a primeira pergunta.
  useEffect(() => {
    const onPreset = (event: Event) => {
      const label = (event as CustomEvent<string>).detail;
      if (!KINDS.some((k) => k.label === label)) return;
      setKind(label);
      setError("");
      setIndex(1);
    };
    window.addEventListener("ns:preset-kind", onPreset);
    return () => window.removeEventListener("ns:preset-kind", onPreset);
  }, []);

  const pickKind = (label: string) => {
    setKind(label);
    setError("");
    window.setTimeout(() => setIndex(1), 220);
  };

  const next = () => {
    if (step === "where" && where.trim().length < 2) {
      setError("Add your city, like Austin, TX.");
      return;
    }
    setError("");
    setIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };

  const back = () => {
    setError("");
    setIndex((i) => Math.max(i - 1, 0));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step !== "details") {
      if (step !== "kind") next();
      return;
    }
    const phrase = KINDS.find((k) => k.label === kind)?.phrase ?? "Local business";
    const brief = [
      name.trim() && `${name.trim()}.`,
      `${phrase} in ${where.trim()}.`,
      details.trim(),
    ]
      .filter(Boolean)
      .join(" ");
    try {
      sessionStorage.setItem(STORAGE_KEY, brief);
    } catch {
      // Modo privado: o parâmetro da URL já basta.
    }
    router.push(`/create?brief=${encodeURIComponent(brief)}&start=1`);
  };

  const prompt = PROMPTS[step];
  const answered = [
    { step: 0, value: kind },
    { step: 1, value: where.trim() },
    { step: 2, value: name.trim() },
  ].filter((a) => a.step < index && a.value);
  const goTo = (i: number) => {
    setError("");
    setIndex(i);
  };
  const buttons = (
    <div className="mt-2 flex items-center justify-center gap-5 lg:justify-start">
      {index > 0 && (
        <button
          type="button"
          onClick={back}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-ink lg:-ml-3 ${focusRing}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M13 8H3M7 4 3 8l4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      )}
      {step === "details" ? (
        <button type="submit" className={`lp-pill lp-pill-blue ${focusRing}`}>
          Build my website
          <PillArrow />
        </button>
      ) : (
        step !== "kind" && (
          <button type="submit" className={`lp-pill ${focusRing}`}>
            Next
            <PillArrow />
          </button>
        )
      )}
    </div>
  );

  return (
    <div className="lp-rise w-full" style={{ "--i": 2 } as React.CSSProperties}>
      {/* O que já foi respondido: cada resposta é um chip que leva de volta àquela pergunta. */}
      <div
        className="mt-8 flex min-h-11 flex-wrap items-center justify-center gap-2 lg:justify-start"
        aria-live="polite"
      >
        {answered.map((a) => (
          <button
            key={a.step}
            type="button"
            onClick={() => goTo(a.step)}
            aria-label={`Change: ${a.value}`}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-500 bg-white px-4 text-sm text-ink transition-colors duration-200 hover:border-ink ${focusRing}`}
          >
            {/* O quadrado azul da página (nunca redondo, nunca piscando). */}
            <span className="size-1.5 shrink-0 bg-brand" aria-hidden="true" />
            {a.value}
            <span aria-hidden="true" className="text-slate-600">
              Edit
            </span>
          </button>
        ))}
        {answered.length === 0 && (
          <span className="text-sm text-slate-600">Four quick questions. About a minute.</span>
        )}
      </div>
      <form
        onSubmit={submit}
        noValidate
        className="mx-auto mt-6 min-h-[230px] w-full max-w-[820px] lg:mx-0"
        aria-label="Tell us about your business"
      >
        <fieldset key={step} className="lp-step flex flex-col items-center gap-4 lg:items-start">
          <legend className="sr-only">
            Question {index + 1} of {STEPS.length}
          </legend>
          <p className="font-display text-xl leading-[1.3] font-semibold tracking-[-0.02em] text-ink lg:text-[1.375rem]">
            <span className="mr-2 align-middle font-sans text-sm font-semibold tracking-normal text-slate-600 tabular-nums">
              {index + 1}/{STEPS.length}
            </span>
            {prompt.title}
          </p>
          <p className="max-w-[60ch] text-sm text-pretty text-slate-600">{prompt.hint}</p>

          {step === "kind" && (
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:max-w-[680px] sm:flex-wrap sm:justify-center sm:gap-2.5 lg:justify-start">
              {KINDS.map((k, i) => (
                <button
                  key={k.label}
                  type="button"
                  data-kind={k.label}
                  aria-pressed={kind === k.label}
                  onClick={() => pickKind(k.label)}
                  className={`lp-chip min-h-12 px-3 text-[15px] leading-tight sm:px-6 sm:text-base ${
                    i === KINDS.length - 1 ? "col-span-2" : ""
                  } ${focusRing}`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          )}

          {step === "where" && (
            <input
              ref={fieldRef}
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              autoComplete="address-level2"
              enterKeyHint="next"
              placeholder="Austin, TX"
              aria-label="City and state"
              className={field}
            />
          )}

          {step === "name" && (
            <input
              ref={fieldRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="organization"
              enterKeyHint="next"
              placeholder="Business name"
              aria-label="Business name, optional"
              className={field}
            />
          )}

          {step === "details" && (
            <textarea
              ref={fieldRef}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              maxLength={1500}
              placeholder="Family-owned since 2009. Open Mon to Sat. Call (512) 555-0142."
              aria-label="Anything else, optional"
              className={`w-full max-w-[560px] resize-none rounded-xl border border-slate-500 bg-white px-5 py-3.5 text-left text-base leading-relaxed text-ink transition-colors duration-200 placeholder:text-slate-500 hover:border-ink ${focusRing}`}
            />
          )}

          <p role="alert" className="min-h-5 text-sm text-[#b42318]">
            {error}
          </p>
          {buttons}
          {step === "details" && (
            <p className="text-sm text-slate-600">
              Free to create. No account or credit card needed.
            </p>
          )}
        </fieldset>
      </form>
      <noscript>
        <p>
          <a
            href="/create"
            className={`inline-flex min-h-11 items-center rounded-sm text-base font-semibold text-brand-dark underline ${focusRing}`}
          >
            Describe your business and build your site
          </a>
        </p>
      </noscript>
    </div>
  );
}
