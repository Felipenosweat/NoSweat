"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

// As perguntas do topo, uma de cada vez (forma do averaks.com): que tipo de negócio, onde, o
// nome e, se quiser, um detalhe. No fim viram uma frase (o mesmo `brief` do campo antigo) e
// vão para /create?brief=…&start=1, que monta o site na hora. O texto também fica no
// sessionStorage `ns-brief`, como no PromptForm.
// Sem JavaScript: o <noscript> leva direto para o /create.
// Os chips de "Website" mais abaixo preenchem a primeira pergunta (evento `ns:preset-kind`).

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
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0066ff]";

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
  const buttons = (
    <div className="mt-2 flex items-center justify-center gap-5">
      {index > 0 && (
        <button
          type="button"
          onClick={back}
          className={`rounded-md px-1 py-2 text-sm text-[#6e6e73] transition-colors hover:text-[#071b33] ${focusRing}`}
        >
          ← Back
        </button>
      )}
      {step === "details" ? (
        <button type="submit" className={`lp-btn lp-btn-blue px-7 py-3 text-[17px] ${focusRing}`}>
          Build my website
        </button>
      ) : (
        step !== "kind" && (
          <button type="submit" className={`lp-btn px-7 py-3 text-[17px] ${focusRing}`}>
            Next
          </button>
        )
      )}
    </div>
  );

  return (
    <div className="lp-rise w-full" style={{ "--i": 2 } as React.CSSProperties}>
      <div aria-hidden="true" className="mt-8 flex justify-center gap-2">
        {STEPS.map((s, i) => (
          <i key={s} className="lp-dot" data-on={i <= index ? "" : undefined} />
        ))}
      </div>
      <form
        onSubmit={submit}
        noValidate
        className="mx-auto mt-8 min-h-[230px] w-full max-w-[820px]"
        aria-label="Tell us about your business"
      >
        <fieldset key={step} className="lp-step flex flex-col items-center gap-4">
          <legend className="sr-only">
            Question {index + 1} of {STEPS.length}
          </legend>
          <p className="text-[clamp(1.3rem,2.5vw,1.75rem)] font-semibold tracking-[-0.022em]">
            {prompt.title}
          </p>
          <p className="max-w-[52ch] text-[13px] text-[#6e6e73]">{prompt.hint}</p>

          {step === "kind" && (
            <div className="flex max-w-[680px] flex-wrap justify-center gap-2.5">
              {KINDS.map((k) => (
                <button
                  key={k.label}
                  type="button"
                  aria-pressed={kind === k.label}
                  onClick={() => pickKind(k.label)}
                  className={`lp-chip px-6 py-3 text-[16px] sm:px-7 sm:py-3.5 sm:text-[17px] ${focusRing}`}
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
              className="lp-field w-[min(380px,92%)] px-6 py-3 text-center text-[19px] font-medium placeholder:text-[#aeaeb4]"
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
              className="lp-field w-[min(380px,92%)] px-6 py-3 text-center text-[19px] font-medium placeholder:text-[#aeaeb4]"
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
              className="lp-field w-[min(560px,96%)] resize-none rounded-[22px] px-6 py-3.5 text-[16px] leading-relaxed placeholder:text-[#aeaeb4]"
            />
          )}

          <p role="alert" className="min-h-5 text-[13px] text-[#b42318]">
            {error}
          </p>
          {buttons}
          {step === "details" && (
            <p className="text-[12.5px] text-[#6e6e73]">
              Free to create. No account or credit card needed.
            </p>
          )}
        </fieldset>
      </form>
      <noscript>
        <p className="text-center text-sm">
          <a href="/create" className="font-semibold text-[#0066ff] underline">
            Describe your business and build your site
          </a>
        </p>
      </noscript>
    </div>
  );
}
