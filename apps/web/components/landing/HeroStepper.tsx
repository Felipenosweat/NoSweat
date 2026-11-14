"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { focusRing, primaryButton } from "@/components/marketing/styles";
import { Arrow } from "./Arrow";
import { arrowShift } from "./type";

// As perguntas do topo, uma de cada vez (forma do averaks.com): que tipo de negócio, onde, o
// nome e, se quiser, um detalhe. No fim viram uma frase (o mesmo `brief` do campo antigo) e
// vão para /create?brief=…&start=1, que monta o site na hora. O texto também fica no
// sessionStorage `ns-brief`, como no PromptForm.
// Sem JavaScript: o <noscript> leva direto para o /create.
// Visual: um cartão branco de 16 px sobre o ink do topo (ver Hero.tsx); as quatro perguntas usam
// a mesma estrutura (título + "n of 4", dica, campo, e o rodapé com o aviso e os botões).
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

// Campos de uma linha: pílula branca com borda visível (3:1) e o contorno azul no foco.
const field = `h-12 w-full max-w-[26rem] rounded-full border border-slate-500 bg-white px-5 text-lg font-medium text-ink transition-colors duration-200 placeholder:text-slate-500 hover:border-ink ${focusRing}`;

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
    <div className="ml-auto flex items-center gap-3">
      {index > 0 && (
        <button
          type="button"
          onClick={back}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-[15px] font-medium text-slate-600 transition-colors duration-200 hover:text-ink ${focusRing}`}
        >
          <Arrow className="rotate-180" />
          Back
        </button>
      )}
      {step === "details" ? (
        <button type="submit" className={`group ${primaryButton}`}>
          Build my website
          <Arrow className={arrowShift} />
        </button>
      ) : (
        step !== "kind" && (
          <button
            type="submit"
            className={`group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 font-semibold text-white transition-colors duration-150 hover:bg-black active:translate-y-px ${focusRing}`}
          >
            Next
            <Arrow className={arrowShift} />
          </button>
        )
      )}
    </div>
  );

  return (
    // O cartão branco sobre o ink do topo. Altura mínima fixa: trocar de pergunta não empurra a
    // vitrine de baixo. Tudo alinhado à esquerda; o rodapé do cartão (aviso + botões) fica parado.
    <div
      className="lp-rise mt-9 flex min-h-[25.5rem] w-full max-w-[780px] flex-col rounded-2xl bg-white p-5 text-left text-ink sm:min-h-[21rem] sm:p-7"
      style={{ "--i": 2 } as React.CSSProperties}
    >
      {/* O que já foi respondido: cada resposta é um chip que leva de volta àquela pergunta. */}
      <div className="flex flex-wrap items-center gap-2 not-empty:mb-5" aria-live="polite">
        {answered.map((a) => (
          <button
            key={a.step}
            type="button"
            onClick={() => goTo(a.step)}
            aria-label={`Change: ${a.value}`}
            className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-full bg-slate-100 px-3.5 text-sm sm:px-4 font-medium text-ink transition-colors duration-200 hover:bg-slate-200 ${focusRing}`}
          >
            <span className="truncate">{a.value}</span>
            <span aria-hidden="true" className="hidden font-normal text-slate-600 sm:inline">
              Edit
            </span>
          </button>
        ))}
      </div>
      <form
        onSubmit={submit}
        noValidate
        className="flex flex-1 flex-col"
        aria-label="Tell us about your business"
      >
        <fieldset key={step} className="lp-step min-w-0">
          <legend className="sr-only">
            Question {index + 1} of {STEPS.length}
          </legend>
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-display text-[1.375rem] leading-[1.25] font-bold tracking-[-0.02em] text-ink">
              {prompt.title}
            </p>
            {/* Enfeite: a legenda acima já diz "Question 1 of 4" para leitores de tela. */}
            <p aria-hidden="true" className="shrink-0 text-sm text-slate-600 tabular-nums">
              {index + 1} of {STEPS.length}
            </p>
          </div>
          <p className="mt-1 max-w-[60ch] text-[15px] text-pretty text-slate-600">{prompt.hint}</p>

          <div className="mt-5">
            {step === "kind" && (
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
                {KINDS.map((k, i) => (
                  <button
                    key={k.label}
                    type="button"
                    data-kind={k.label}
                    aria-pressed={kind === k.label}
                    onClick={() => pickKind(k.label)}
                    className={`lp-chip min-h-12 px-3 text-[15px] leading-tight font-medium sm:px-[1.125rem] sm:text-base ${
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
                className={`block w-full resize-none rounded-2xl border border-slate-500 bg-white px-5 py-3.5 text-left text-base leading-relaxed text-ink transition-colors duration-200 placeholder:text-slate-500 hover:border-ink ${focusRing}`}
              />
            )}
          </div>

          <p role="alert" className="mt-2 min-h-5 text-sm text-[#b42318]">
            {error}
          </p>
        </fieldset>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-3 pt-4">
          <p className="text-sm text-slate-600">
            Free to create. No account or credit card needed.
          </p>
          {buttons}
        </div>
      </form>
      <noscript>
        <p className="mt-3">
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
