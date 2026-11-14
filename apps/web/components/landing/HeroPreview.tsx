"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// A moldura do meio da vitrine do topo: um navegador simples (cartão branco com a legenda no
// lugar da barra) com a captura de um site de exemplo de verdade. Passar o mouse, focar ou
// escolher um ramo na primeira pergunta troca para o exemplo daquele ramo (e fica: não volta ao
// sair). As capturas extras só entram na página na primeira intenção; a troca só acontece depois
// que a nova imagem carregou (se falhar, fica a anterior) e é uma fusão de 200 ms. A legenda é
// texto de verdade e sempre diz que o negócio é inventado.
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

export function HeroPreview() {
  const [mounted, setMounted] = useState<Example[]>([DEFAULT]);
  const [shown, setShown] = useState<Example>(DEFAULT);
  const wanted = useRef(DEFAULT.slug);
  const loaded = useRef(new Set<string>());

  const want = useCallback((example: Example) => {
    wanted.current = example.slug;
    if (loaded.current.has(example.slug)) setShown(example);
    else
      setMounted((list) => (list.some((e) => e.slug === example.slug) ? list : [...list, example]));
  }, []);

  const onLoad = (example: Example) => {
    loaded.current.add(example.slug);
    if (wanted.current === example.slug) setShown(example);
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
    <figure className="lp-show w-full max-w-[780px] shrink-0 rounded-t-2xl bg-white px-2 pt-2 text-left sm:px-2.5 sm:pt-2.5 md:w-[64vw] lg:w-[52vw]">
      <figcaption className="px-1.5 pb-2 text-[13px] leading-normal text-slate-600">
        {shown.name}, an example site. The business is made up.
      </figcaption>
      {/* Canto de dentro = canto de fora (16) menos a borda da moldura (10). */}
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-md bg-slate-100">
        {mounted.map((example) => {
          const active = example.slug === shown.slug;
          const first = example.slug === DEFAULT.slug;
          return (
            <Image
              key={example.slug}
              src={`/landing/signature/${example.slug}-d.webp`}
              width={1600}
              height={1000}
              alt={active ? `The ${example.name} example site made with No Sweat.` : ""}
              aria-hidden={!active}
              sizes="(min-width: 1500px) 760px, (min-width: 1024px) 52vw, (min-width: 768px) 64vw, 100vw"
              loading="eager"
              fetchPriority={first ? "high" : "auto"}
              onLoad={() => onLoad(example)}
              className={`absolute inset-0 size-full object-cover object-top transition-opacity duration-200 motion-reduce:transition-none ${
                active ? "opacity-100" : "opacity-0"
              }`}
            />
          );
        })}
      </div>
    </figure>
  );
}
