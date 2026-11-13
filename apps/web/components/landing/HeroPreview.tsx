"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { frameShadow } from "@/components/marketing/styles";

// Vitrine ao lado das perguntas (só no computador, ≥ lg): uma moldura de navegador com a captura
// de um site de exemplo de verdade e a versão de celular por cima do canto. Passar o mouse, focar
// ou escolher um ramo na primeira pergunta troca para o exemplo daquele ramo (e fica: não volta ao
// sair). As capturas extras só entram na página na primeira intenção; a troca só acontece depois
// que a nova imagem carregou (se falhar, fica a anterior). A moldura é enfeite (inert +
// aria-hidden); a legenda é texto de verdade e sempre diz que o negócio é inventado.
// Os chips são do HeroStepper (outro componente de cliente): aqui só ouvimos, por delegação em
// #start, os botões com `data-kind`, e o evento `ns:preset-kind` da página.

type Example = { slug: string; name: string };

const DEFAULT: Example = { slug: "greenline-landscaping", name: "Greenline Landscaping" };

// "Health & fitness" não tem exemplo do ramo: mantém o que estiver aparecendo.
const BY_KIND: Record<string, Example> = {
  "Home services": DEFAULT,
  "Food & drink": { slug: "smoke-and-rail-bbq", name: "Smoke & Rail BBQ" },
  "Beauty & wellness": { slug: "still-water-spa", name: "Still Water Spa" },
  "Professional services": { slug: "mercer-law", name: "Mercer Law" },
  "Shop & retail": { slug: "sunrise-bakery", name: "Sunrise Bakery" },
  "Something else": { slug: "hollis-interiors", name: "Hollis Interiors" },
};

// Cada exemplo tem duas capturas (computador e celular); só troca quando as duas carregaram.
const SHOTS_PER_EXAMPLE = 2;

const shot = "absolute inset-0 size-full object-cover object-top transition-opacity duration-200";

export function HeroPreview() {
  const [mounted, setMounted] = useState<Example[]>([DEFAULT]);
  const [shown, setShown] = useState<Example>(DEFAULT);
  const wanted = useRef(DEFAULT.slug);
  const loaded = useRef(new Map<string, number>());

  const want = useCallback((example: Example) => {
    wanted.current = example.slug;
    if ((loaded.current.get(example.slug) ?? 0) >= SHOTS_PER_EXAMPLE) setShown(example);
    else
      setMounted((list) => (list.some((e) => e.slug === example.slug) ? list : [...list, example]));
  }, []);

  const onLoad = (example: Example) => {
    const count = (loaded.current.get(example.slug) ?? 0) + 1;
    loaded.current.set(example.slug, count);
    if (count >= SHOTS_PER_EXAMPLE && wanted.current === example.slug) setShown(example);
  };

  useEffect(() => {
    const section = document.getElementById("start");
    const pick = (label: string | undefined | null) => {
      const example = label ? BY_KIND[label] : undefined;
      if (example) want(example);
    };
    const onIntent = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      pick(event.target.closest<HTMLElement>("[data-kind]")?.dataset.kind);
    };
    const onPreset = (event: Event) => pick((event as CustomEvent<string>).detail);
    section?.addEventListener("pointerover", onIntent);
    section?.addEventListener("focusin", onIntent);
    section?.addEventListener("click", onIntent);
    window.addEventListener("ns:preset-kind", onPreset);
    return () => {
      section?.removeEventListener("pointerover", onIntent);
      section?.removeEventListener("focusin", onIntent);
      section?.removeEventListener("click", onIntent);
      window.removeEventListener("ns:preset-kind", onPreset);
    };
  }, [want]);

  return (
    // Entrada sem opacidade (lp-rise-solid): este bloco some e volta com `hidden lg:block`, e uma
    // animação recomeça quando o elemento volta a aparecer; assim ele nunca fica invisível.
    <figure className="lp-rise-solid hidden pl-6 lg:col-span-5 lg:block">
      <div inert aria-hidden="true" className="relative mb-6">
        <div
          className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${frameShadow}`}
        >
          <div className="flex h-7 items-center border-b border-slate-200 px-3 text-[13px] leading-none text-slate-600">
            {shown.name}
          </div>
          <div className="relative aspect-[16/10] bg-slate-100">
            {mounted.map((example) => (
              <Image
                key={example.slug}
                src={`/landing/signature/${example.slug}-d.webp`}
                width={1600}
                height={1000}
                alt=""
                sizes="(min-width: 1024px) 520px, 1px"
                onLoad={() => onLoad(example)}
                className={`${shot} motion-reduce:transition-none ${
                  example.slug === shown.slug ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>
        </div>
        {/* Celular: 150×240 na largura cheia; encolhe junto com a moldura em telas menores. */}
        <div
          className={`absolute -bottom-6 -left-6 aspect-[5/8] w-[34%] max-w-[150px] overflow-hidden rounded-xl border border-slate-200 bg-white ${frameShadow}`}
        >
          {mounted.map((example) => (
            <Image
              key={example.slug}
              src={`/landing/signature/${example.slug}-m.webp`}
              width={640}
              height={1385}
              alt=""
              sizes="150px"
              onLoad={() => onLoad(example)}
              className={`${shot} motion-reduce:transition-none ${
                example.slug === shown.slug ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </div>
      <figcaption className="mt-4 text-sm leading-normal text-slate-600">
        Example site: {shown.name}. The business is made up.
      </figcaption>
    </figure>
  );
}
