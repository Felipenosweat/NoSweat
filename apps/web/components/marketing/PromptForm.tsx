"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, type FormEvent } from "react";
import { focusRing, primaryButton } from "./styles";

// Campo de descrição REAL da landing. Envia para /create?brief=… (GET nativo, funciona sem JS)
// e também guarda o texto em sessionStorage `ns-brief`, que o /create usa para preencher o passo 1.

const STORAGE_KEY = "ns-brief";
const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;
// Altura máxima do campo ao crescer (em px); depois disso ele rola.
const MAX_HEIGHT = 192;

// Mesmos textos dos exemplos do /create, para a entrada combinar com a saída.
const EXAMPLES = [
  {
    label: "Plumbing",
    text: "Family-owned plumbing company in Austin, TX. 24/7 emergency repairs and water heaters.",
  },
  {
    label: "House cleaning",
    text: "Family-owned house cleaning service in Worcester, MA. Weekly, biweekly and move-out cleans with eco-friendly products.",
  },
  {
    label: "Hair salon",
    text: "Hair salon in Miami specializing in balayage, keratin treatments, and bridal styling.",
  },
];

// Frases que o placeholder "digita" sozinho no tema escuro (só com movimento permitido).
const TYPED = [
  "Family-owned plumbing in Austin, TX…",
  "House cleaning in Worcester, MA. Weekly and move-out…",
  "Hair salon in Miami. Balayage and bridal styling…",
  "Mexican restaurant in San Diego. Family recipes…",
  "Landscaping in Tampa, FL. Mowing, hedges, cleanups…",
];

export function PromptForm({
  examples = true,
  caption = "Free to create and preview. Pick a plan when you go live.",
  tone = "light",
}: {
  /** Mostra os chips de exemplo que preenchem o campo. */
  examples?: boolean;
  caption?: string;
  /** "dark": versão para fundo escuro (hero da landing): campo branco sólido e o placeholder
   * se digitando. */
  tone?: "light" | "dark";
}) {
  const id = useId();
  const router = useRouter();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const dark = tone === "dark";

  // Placeholder que se digita (efeito "máquina de escrever"). Para quando o campo tem texto ou
  // foco, e não roda com prefers-reduced-motion. O placeholder fixo é o primeiro exemplo.
  useEffect(() => {
    const field = fieldRef.current;
    if (!dark || !field || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let phrase = 0;
    let chars = 0;
    let deleting = false;
    let timer = 0;
    const tick = () => {
      const text = TYPED[phrase] ?? "";
      const busy = field.value.length > 0 || document.activeElement === field;
      if (!busy) {
        chars += deleting ? -1 : 1;
        field.placeholder = text.slice(0, Math.max(chars, 0)) || " ";
      }
      let delay = deleting ? 22 : 48;
      if (!deleting && chars >= text.length) {
        deleting = true;
        delay = 1800;
      } else if (deleting && chars <= 0) {
        deleting = false;
        phrase = (phrase + 1) % TYPED.length;
        delay = 350;
      }
      timer = window.setTimeout(tick, busy ? 600 : delay);
    };
    timer = window.setTimeout(tick, 1400);
    return () => window.clearTimeout(timer);
  }, [dark]);

  // Cresce com o texto (2 linhas no mínimo). JS porque `field-sizing` não existe no Safari.
  const resize = () => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, MAX_HEIGHT)}px`;
  };

  const fill = (text: string) => {
    const field = fieldRef.current;
    if (!field) return;
    field.value = text;
    field.setCustomValidity("");
    resize();
    field.focus();
    field.setSelectionRange(text.length, text.length);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const brief = fieldRef.current?.value.trim() ?? "";
    event.preventDefault();
    if (brief.length < MIN_LENGTH) {
      // Mesma mensagem do schema da API (GenerateSiteRequest).
      fieldRef.current?.setCustomValidity(
        "Tell us a bit more about your business (at least 10 characters).",
      );
      fieldRef.current?.reportValidity();
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, brief);
    } catch {
      // Modo privado/armazenamento cheio: o parâmetro da URL já basta.
    }
    router.push(`/create?brief=${encodeURIComponent(brief)}`);
  };

  return (
    <div>
      <form
        action="/create"
        method="get"
        onSubmit={onSubmit}
        className={`rounded-2xl border p-2 transition-colors duration-150 focus-within:ring-4 ${
          dark
            ? "border-white bg-white focus-within:ring-white/40"
            : "border-slate-300 bg-white focus-within:border-brand focus-within:ring-brand/15 hover:border-slate-400 focus-within:hover:border-brand"
        }`}
      >
        <label htmlFor={`${id}-brief`} className="sr-only">
          Describe your business
        </label>
        <textarea
          ref={fieldRef}
          id={`${id}-brief`}
          name="brief"
          rows={2}
          required
          minLength={MIN_LENGTH}
          maxLength={MAX_LENGTH}
          onInput={(event) => {
            event.currentTarget.setCustomValidity("");
            resize();
          }}
          aria-describedby={`${id}-caption`}
          placeholder="Family-owned plumbing in Austin, TX…"
          className="block w-full resize-none bg-transparent px-3 py-2.5 text-base leading-[1.55] text-ink placeholder:text-slate-500 focus:outline-none"
        />
        <div className="flex justify-end px-1 pb-1">
          <button type="submit" className={`w-full sm:w-auto ${primaryButton}`}>
            Build my website
          </button>
        </div>
      </form>

      {examples && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className={`mr-1 text-[13px] ${dark ? "text-slate-300" : "text-slate-500"}`}>
            Try an example:
          </p>
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => fill(example.text)}
              className={`inline-flex h-11 items-center rounded-lg border px-3 text-sm font-medium transition-colors duration-150 active:translate-y-px ${
                dark
                  ? "border-white/20 bg-ink/40 text-slate-100 backdrop-blur-sm hover:border-white/40 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  : `border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-ink ${focusRing}`
              }`}
            >
              <span className="sr-only">Use example: </span>
              {example.label}
            </button>
          ))}
        </div>
      )}

      <p
        id={`${id}-caption`}
        className={`mt-4 text-[13px] ${dark ? "text-slate-300" : "text-slate-500"}`}
      >
        {caption}
      </p>
    </div>
  );
}
