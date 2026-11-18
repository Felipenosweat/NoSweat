"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { LANDING_BRIEF_KEY, LANDING_NAME_KEY } from "@/app/(dashboard)/create/brief";
import { focusRing, primaryButton } from "@/components/marketing/styles";
import { heroBrief, heroCreateUrl, KIND_PICKED_EVENT, KINDS } from "./hero-brief";

// As perguntas do topo, uma de cada vez (forma do averaks.com): que tipo de negócio, onde, o
// nome e, se quiser, um detalhe. No fim viram uma frase (o mesmo `brief` do campo antigo) e
// vão para /create?brief=…&name=…&start=1, que monta o site na hora. O nome vai à parte (é um
// fato do dono, ver hero-brief.ts). Texto e nome também ficam no sessionStorage (`ns-brief` e
// `ns-brief-name`).
// Sem JavaScript: o <noscript> leva direto para o /create.
// Um evento `ns:preset-kind` (de qualquer botão da página) preenche a primeira pergunta.
// Ao escolher o tipo de negócio, avisa a página com `ns:kind-picked` (o celular do lado, HeroPhone,
// troca para um exemplo do mesmo ramo). Só aviso: nada da lógica depende dele.

/** Avisa quem estiver ouvindo (HeroPhone) qual tipo de negócio foi escolhido. */
function announceKind(label: string) {
  window.dispatchEvent(new CustomEvent(KIND_PICKED_EVENT, { detail: label }));
}

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
      announceKind(label);
    };
    window.addEventListener("ns:preset-kind", onPreset);
    return () => window.removeEventListener("ns:preset-kind", onPreset);
  }, []);

  const pickKind = (label: string) => {
    setKind(label);
    setError("");
    announceKind(label);
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
    const answers = { kind, where, name, details };
    const { brief, name: businessName } = heroBrief(answers);
    try {
      sessionStorage.setItem(LANDING_BRIEF_KEY, brief);
      if (businessName) sessionStorage.setItem(LANDING_NAME_KEY, businessName);
      else sessionStorage.removeItem(LANDING_NAME_KEY);
    } catch {
      // Modo privado: o parâmetro da URL já basta.
    }
    router.push(heroCreateUrl(answers));
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
    <div className="flex flex-wrap items-center gap-2">
      {step === "details" ? (
        <button type="submit" className={primaryButton}>
          Build my website
        </button>
      ) : (
        step !== "kind" && (
          <button type="submit" className={primaryButton}>
            Next
          </button>
        )
      )}
      {index > 0 && (
        <button
          type="button"
          onClick={back}
          className={`inline-flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-ink ${focusRing}`}
        >
          Back
        </button>
      )}
    </div>
  );

  const field = `w-full rounded-lg border border-slate-300 bg-white px-4 text-ink transition-colors duration-150 placeholder:text-slate-500 hover:border-slate-400 focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`;
  const question =
    "block font-display text-[22px] leading-tight font-semibold tracking-[-0.02em] text-ink lg:text-2xl";

  return (
    <div className="w-full">
      <form
        onSubmit={submit}
        noValidate
        className="min-h-[372px] w-full sm:min-h-[300px]"
        aria-label="Tell us about your business"
      >
        {/* Progresso: 4 segmentos, os já feitos em tinta. */}
        <div aria-hidden="true">
          <p className="text-[13px] text-slate-600 tabular-nums">
            Question {index + 1} of {STEPS.length}
          </p>
          <div className="mt-2 flex max-w-[320px] gap-1">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`h-1 flex-1 transition-colors duration-150 ${i <= index ? "bg-ink" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>

        <fieldset key={step} className="lp-step mt-5">
          <legend className="sr-only">
            Question {index + 1} of {STEPS.length}
          </legend>

          {/* O que já foi respondido: cada resposta é um botão que volta àquela pergunta. */}
          {answered.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2" aria-live="polite">
              {answered.map((a) => (
                <button
                  key={a.step}
                  type="button"
                  onClick={() => goTo(a.step)}
                  aria-label={`Change: ${a.value}`}
                  className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-surface px-3 text-[14px] text-ink transition-colors duration-150 hover:border-slate-400 ${focusRing}`}
                >
                  <span className="truncate">{a.value}</span>
                  <span aria-hidden="true" className="text-[13px] text-slate-600 underline">
                    Edit
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === "kind" ? (
            <p className={question}>{prompt.title}</p>
          ) : (
            <label htmlFor="hero-field" className={question}>
              {prompt.title}
            </label>
          )}
          <p id="hero-hint" className="mt-1 max-w-[52ch] text-[15px] text-slate-600">
            {prompt.hint}
          </p>

          {step === "kind" && (
            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:max-w-[640px] sm:flex-wrap">
              {KINDS.map((k, i) => (
                <button
                  key={k.label}
                  type="button"
                  aria-pressed={kind === k.label}
                  data-first-chip={i === 0 ? "" : undefined}
                  onClick={() => pickKind(k.label)}
                  className={`flex min-h-12 items-center rounded-lg border px-4 text-left text-[16px] leading-tight font-medium transition-colors duration-150 active:translate-y-px ${focusRing} ${
                    k.label === "Something else" ? "col-span-2" : ""
                  } ${
                    kind === k.label
                      ? "border-ink bg-ink text-white"
                      : "border-slate-300 bg-white text-ink hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          )}

          {step === "where" && (
            <input
              id="hero-field"
              ref={fieldRef}
              value={where}
              onChange={(e) => setWhere(e.target.value)}
              autoComplete="address-level2"
              enterKeyHint="next"
              placeholder="Austin, TX"
              aria-describedby="hero-hint"
              aria-invalid={error ? true : undefined}
              className={`mt-4 h-14 max-w-[420px] text-[18px] ${field}`}
            />
          )}

          {step === "name" && (
            <input
              id="hero-field"
              ref={fieldRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="organization"
              enterKeyHint="next"
              placeholder="Business name"
              aria-describedby="hero-hint"
              className={`mt-4 h-14 max-w-[420px] text-[18px] ${field}`}
            />
          )}

          {step === "details" && (
            <textarea
              id="hero-field"
              ref={fieldRef}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              maxLength={1500}
              placeholder="Family-owned since 2009. Open Mon to Sat. Call (512) 555-0142."
              aria-describedby="hero-hint"
              className={`mt-4 max-w-[560px] resize-none py-3 text-[16px] leading-relaxed ${field}`}
            />
          )}

          <p role="alert" className="mt-2 min-h-5 text-[14px] text-[#b42318]">
            {error}
          </p>
          {step !== "kind" && <div className="mt-2">{buttons}</div>}
          {step === "details" && (
            <p className="mt-3 text-[13px] text-slate-600">
              Free to create. No account or credit card needed.
            </p>
          )}
        </fieldset>
      </form>
      <noscript>
        <p className="mt-4 text-[15px]">
          <a href="/create" className="font-semibold text-ink underline underline-offset-4">
            Describe your business and build your site
          </a>
        </p>
      </noscript>
    </div>
  );
}
