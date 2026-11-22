"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { primaryButton } from "@/components/marketing/styles";
import { briefFrom, CITY_LIMIT, createHref, NAME_LIMIT } from "./personalize";
import { useYourName } from "./YourNameContext";

// O campo do topo. O título da página (<h1>) é o rótulo do nome (htmlFor="yn-name").
// Sem JS: GET nativo para /create?brief=<nome> (a cidade não tem `name`, só vai com JS).
// Com JS: /create?brief=<nome in cidade>, e o mesmo texto no sessionStorage `ns-brief`, que o
// /create lê se a aba recarregar sem o parâmetro (como o PromptForm). Não começa sozinho: o
// visitante continua descrevendo o negócio no primeiro passo.

const STORAGE_KEY = "ns-brief";

export function NameForm({ priceLine }: { priceLine: string }) {
  const router = useRouter();
  const { typed, setTyped } = useYourName();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const brief = briefFrom(typed.name, typed.city);
    try {
      if (brief) sessionStorage.setItem(STORAGE_KEY, brief);
    } catch {
      // Armazenamento bloqueado: o parâmetro da URL basta.
    }
    router.push(createHref(typed.name, typed.city));
  };

  return (
    <form action="/create" method="get" onSubmit={onSubmit} className="mt-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-3">
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-300 transition-shadow duration-150 focus-within:ring-2 focus-within:ring-brand motion-reduce:transition-none lg:flex lg:flex-1">
          <input
            id="yn-name"
            name="brief"
            type="text"
            value={typed.name}
            onChange={(event) => setTyped({ name: event.target.value })}
            maxLength={NAME_LIMIT}
            autoComplete="organization"
            autoCapitalize="words"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="Rivera Plumbing"
            aria-describedby="yn-preview-note"
            className="block h-16 w-full min-w-0 bg-white px-5 font-display text-[1.625rem] font-semibold tracking-[-0.02em] text-ink outline-none placeholder:font-normal placeholder:text-slate-500 focus:bg-surface lg:h-16 lg:flex-1 lg:px-6 lg:text-[1.75rem]"
          />
          <div className="flex items-center gap-3 border-t border-slate-200 has-[input:focus]:bg-surface lg:w-72 lg:border-t-0 lg:border-l">
            <label
              htmlFor="yn-city"
              className="shrink-0 cursor-text pl-5 text-[15px] font-semibold text-slate-600 lg:pl-6"
            >
              City
            </label>
            <input
              id="yn-city"
              type="text"
              value={typed.city}
              onChange={(event) => setTyped({ city: event.target.value })}
              maxLength={CITY_LIMIT}
              autoComplete="address-level2"
              autoCapitalize="words"
              enterKeyHint="go"
              placeholder="Optional"
              className="block h-12 w-full min-w-0 bg-transparent pr-5 lg:h-16 text-base text-ink outline-none placeholder:text-slate-500"
            />
          </div>
        </div>
        <button type="submit" className={`w-full lg:h-auto lg:w-auto lg:px-8 ${primaryButton}`}>
          Start my website
        </button>
      </div>
      <p className="mt-4 text-[15px] leading-snug text-pretty text-slate-600">{priceLine}</p>
    </form>
  );
}
