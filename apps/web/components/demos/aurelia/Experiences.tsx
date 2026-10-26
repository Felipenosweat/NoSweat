"use client";

import { useEffect, useRef, useState } from "react";
import { EXPERIENCES } from "./content";
import { Photo } from "./ui";

// Experiências: no computador, a foto fica presa à esquerda dentro de um arco e troca (com uma
// dissolução lenta) quando o capítulo da direita chega ao meio da tela. No celular, cada
// capítulo traz a própria foto. O capítulo ativo vem do IntersectionObserver (sem rolagem
// presa, sem cálculo por quadro) e é marcado pelo fio de ouro, não por apagar os outros
// (texto esmaecido não passaria no contraste).

export function Experiences() {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = items.current.indexOf(entry.target as HTMLElement);
          if (index >= 0) setActive(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const item of items.current) if (item) observer.observe(item);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
      <div className="hidden lg:col-span-5 lg:block">
        <div className="sticky top-28 aspect-[0.8] overflow-hidden rounded-t-full">
          {EXPERIENCES.map((experience, index) => (
            <Photo
              key={experience.id}
              photo={experience.photo}
              sizes="40vw"
              ratio={0.8}
              alt=""
              className={`absolute inset-0 size-full object-cover transition-[opacity,scale] duration-[1400ms] ease-[cubic-bezier(.16,1,.3,1)] ${
                index === active ? "scale-100 opacity-100" : "scale-[1.06] opacity-0"
              }`}
            />
          ))}
          <p className="a-caps absolute right-6 bottom-6 left-6 text-[11px] text-[var(--a-ivory)]">
            <span className="text-[var(--a-gold-bright)]">{EXPERIENCES[active]?.numeral}</span> ·{" "}
            {EXPERIENCES[active]?.name}
          </p>
        </div>
      </div>

      <ol className="flex flex-col lg:col-span-6 lg:col-start-7">
        {EXPERIENCES.map((experience, index) => (
          <li
            key={experience.id}
            ref={(node) => {
              items.current[index] = node;
            }}
            className={`border-t border-[var(--a-ink)]/15 py-12 transition-colors duration-700 lg:min-h-[70vh] lg:py-20 lg:last:min-h-0 ${
              index === active ? "lg:border-[var(--a-gold)]" : ""
            }`}
          >
            <div className="mx-auto mb-8 max-w-[460px] overflow-hidden rounded-t-full lg:hidden">
              <Photo
                photo={experience.photo}
                sizes="100vw"
                ratio={0.9}
                className="aspect-[0.9] w-full object-cover"
              />
            </div>
            <p className="a-display text-[2rem] text-[var(--a-claret)] italic">
              {experience.numeral}
            </p>
            <h3 className="a-display mt-3 text-[clamp(2.4rem,4.2vw,4rem)] leading-[0.95] text-[var(--a-ink)]">
              {experience.name}
            </h3>
            <p className="mt-6 max-w-[44ch] text-[17px] leading-[1.7] text-[var(--a-ink)]/75">
              {experience.body}
            </p>
            <ul className="mt-8 flex flex-col gap-2">
              {experience.details.map((detail) => (
                <li
                  key={detail}
                  className="a-caps flex items-center gap-3 text-[11px] text-[var(--a-ink)]/70"
                >
                  <span aria-hidden="true" className="h-px w-6 bg-[var(--a-gold)]" />
                  {detail}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
