"use client";

import { useEffect, useState } from "react";
import { focusRingOnDark } from "@/components/marketing/styles";

// Índice preso dos capítulos de "The office" (só no computador). O capítulo que está no meio da
// tela ganha um fio branco de 2px à esquerda (e aria-current). Sem JavaScript, é só uma lista de
// links para os capítulos. Funciona igual com "reduzir movimento" (nada anima).

export function OfficeIndex({
  chapters,
  className = "",
}: {
  chapters: { id: string; title: string }[];
  className?: string;
}) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const targets = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((el): el is HTMLElement => el !== null);
    // Faixa fina no meio da tela: quem cruza a faixa é o capítulo da vez.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [chapters]);

  return (
    <nav aria-label="The office, step by step" className={className}>
      <ol>
        {chapters.map((chapter, index) => {
          const on = chapter.id === current;
          return (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                aria-current={on ? "step" : undefined}
                className={`flex min-h-11 items-baseline gap-3 border-l-2 py-2 pl-4 text-[15px] leading-snug transition-colors duration-150 ${focusRingOnDark} ${
                  on
                    ? "border-white text-white"
                    : "border-transparent text-slate-300 hover:text-white"
                }`}
              >
                <span className="text-[13px] font-semibold tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {chapter.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
