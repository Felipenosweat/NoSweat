"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, type FormEvent } from "react";
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

export function PromptForm({
  examples = true,
  caption = "Free to create and preview. Pick a plan when you go live.",
}: {
  /** Mostra os chips de exemplo que preenchem o campo. */
  examples?: boolean;
  caption?: string;
}) {
  const id = useId();
  const router = useRouter();
  const fieldRef = useRef<HTMLTextAreaElement>(null);

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
        className="rounded-xl border border-slate-300 bg-white p-2 transition-colors duration-150 focus-within:border-brand hover:border-slate-400 focus-within:hover:border-brand"
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
          <p className="mr-1 text-[13px] text-slate-500">Try an example:</p>
          {EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => fill(example.text)}
              className={`inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-ink active:translate-y-px ${focusRing}`}
            >
              <span className="sr-only">Use example: </span>
              {example.label}
            </button>
          ))}
        </div>
      )}

      <p id={`${id}-caption`} className="mt-4 text-[13px] text-slate-500">
        {caption}
      </p>
    </div>
  );
}
