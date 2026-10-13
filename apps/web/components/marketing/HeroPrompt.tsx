"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRightIcon } from "./icons";

/** Chave do sessionStorage que liga a caixa da landing ao /create (ver CreateForm). */
export const HERO_BRIEF_KEY = "ns:hero-brief";

// Caixa de descrição do hero (estilo "prompt"): o visitante escreve ali mesmo e vai para
// /create?brief=..., onde a geração começa sozinha. Sem JS, o <form> GET faz o mesmo caminho.

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

// Exemplos clicáveis: limpeza primeiro (nicho inicial). São textos de exemplo, não clientes.
const EXAMPLES = [
  {
    label: "House cleaning",
    text: "House cleaning in Orlando, FL. Deep cleans, move-out cleans and weekly service. Family-owned since 2015.",
  },
  {
    label: "Landscaping",
    text: "Lawn care and landscaping in Charlotte, NC. Weekly mowing, mulching, hedge trimming and spring cleanups.",
  },
  {
    label: "Hair salon",
    text: "Hair salon in Miami, FL specializing in balayage, keratin treatments and bridal styling.",
  },
  {
    label: "Handyman",
    text: "Handyman service in Columbus, OH. Drywall repair, furniture assembly, TV mounting and small home repairs.",
  },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function HeroPrompt() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = brief.trim();
    if (text.length < MIN_LENGTH) {
      setError("Tell us a bit more: what you do and where (at least 10 characters).");
      textareaRef.current?.focus();
      return;
    }
    setError(null);
    setPending(true);
    // "Recibo" de que o pedido saiu daqui (mesma origem): só assim o /create começa a gerar
    // sozinho. Um link de outro site para /create?brief=... apenas preenche o texto.
    try {
      sessionStorage.setItem(HERO_BRIEF_KEY, text);
    } catch {
      // Navegação privada sem storage: o /create mostra o texto e a pessoa clica em gerar.
    }
    router.push(`/create?brief=${encodeURIComponent(text)}`);
  }

  // Enter envia (como num chat); Shift+Enter quebra a linha. Ignora durante composição (IME).
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function applyExample(text: string) {
    setBrief(text);
    setError(null);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      // Cursor no fim, para o visitante continuar escrevendo (ex.: o telefone).
      requestAnimationFrame(() => textarea.setSelectionRange(text.length, text.length));
    }
  }

  const invalid = error !== null;

  return (
    <div>
      <form action="/create" method="get" onSubmit={handleSubmit} aria-busy={pending}>
        <div
          className={`rounded-2xl border bg-white p-2 shadow-[0_1px_2px_rgb(7_27_51/0.06),0_16px_40px_-16px_rgb(7_27_51/0.22)] motion-safe:transition-[border-color,box-shadow] motion-safe:duration-200 sm:p-3 ${
            invalid
              ? "border-red-500 ring-4 ring-red-100"
              : "border-slate-300 focus-within:border-brand focus-within:shadow-[0_0_0_4px_rgb(0_102_255/0.14),0_20px_48px_-16px_rgb(0_102_255/0.35)] hover:border-slate-400 focus-within:hover:border-brand"
          }`}
        >
          <label htmlFor="hero-brief" className="sr-only">
            Describe your business
          </label>
          <textarea
            ref={textareaRef}
            id="hero-brief"
            name="brief"
            rows={3}
            maxLength={MAX_LENGTH}
            value={brief}
            onChange={(event) => {
              setBrief(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={pending}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "hero-brief-hint hero-brief-error" : "hero-brief-hint"}
            placeholder="Describe your business… e.g. House cleaning in Orlando, FL. Deep cleans, move-out cleans and weekly service. Family-owned since 2015."
            className="block min-h-32 w-full resize-none bg-transparent px-3 pt-3 pb-2 text-lg leading-relaxed text-ink placeholder:text-slate-500 focus:outline-none disabled:opacity-60 sm:min-h-28 sm:text-xl"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1 sm:px-2">
            <p id="hero-brief-hint" className="hidden text-[13px] text-slate-500 sm:block">
              Press Enter to build. Shift+Enter for a new line.
            </p>
            <button
              type="submit"
              disabled={pending}
              className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand px-6 font-semibold text-white transition-colors hover:bg-brand-dark active:translate-y-px disabled:cursor-wait disabled:hover:bg-brand sm:ml-auto sm:w-auto ${focusRing}`}
            >
              {pending ? (
                <>
                  <span
                    aria-hidden="true"
                    className="size-4 rounded-full border-2 border-white/30 border-t-white motion-safe:animate-spin"
                  />
                  Opening…
                </>
              ) : (
                <>
                  Build my website
                  <ArrowRightIcon className="size-4" strokeWidth={2} />
                </>
              )}
            </button>
          </div>
        </div>

        <p
          id="hero-brief-error"
          aria-live="polite"
          className="mt-2 min-h-5 text-left text-sm text-red-700"
        >
          {error}
        </p>
      </form>

      <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <p id="hero-examples-label" className="text-sm text-slate-500">
          Try an example:
        </p>
        <div
          role="group"
          aria-labelledby="hero-examples-label"
          className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-center"
        >
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              disabled={pending}
              onClick={() => applyExample(example.text)}
              title={example.text}
              className={`min-h-11 rounded-lg border border-slate-200 bg-white/80 px-4 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-white hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            >
              <span className="sr-only">Use example: </span>
              {example.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
