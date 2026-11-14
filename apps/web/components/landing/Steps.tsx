import type { CSSProperties } from "react";
import { h2Class, h3Class, shell } from "./type";

// "How it works" (#story): os quatro passos numa lista parada, todos à vista. Um fio ink em cima
// da lista e, em cada passo, o número grande em azul, o título e uma linha de texto. No celular
// cada passo é uma linha (número à esquerda); a partir de sm, colunas (2, depois 4).
// Movimento (landing.css, .lp-rule): quando a lista entra na tela o fio se desenha da esquerda
// para a direita uma vez e os quatro passos aparecem em sequência. Só o que o produto faz hoje.

const STEPS = [
  {
    title: "Answer a few questions",
    body: "What you do and where. About a minute.",
  },
  {
    title: "Get your first draft",
    body: "Pages, words and a contact form, set up for your business.",
  },
  {
    title: "Change anything",
    body: "Click to edit, or ask the AI in plain words.",
  },
  {
    title: "Go live",
    body: "A free nosweatfd.com address, or your own domain on Pro.",
  },
];

export function Steps() {
  return (
    <section id="story" aria-labelledby="story-title" className={`${shell} pt-24 lg:pt-32`}>
      <h2 id="story-title" className={`lp-reveal ${h2Class}`}>
        From a few answers to a live site.
      </h2>
      <ol className="lp-rule relative mt-10 grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8 lg:mt-14 lg:grid-cols-4">
        {STEPS.map(({ title, body }, index) => (
          <li
            key={title}
            className="lp-rule-item grid grid-cols-[3.5rem_1fr] items-start gap-x-2 border-b border-slate-200 py-6 last:border-b-0 sm:block sm:border-b-0 sm:pt-6 sm:pb-4"
            style={{ "--i": index } as CSSProperties}
          >
            {/* O número é enfeite: o <ol> já numera para quem usa leitor de tela. */}
            <span
              aria-hidden="true"
              className="font-display text-5xl leading-none font-extrabold tracking-[-0.04em] text-brand tabular-nums sm:text-[4rem]"
            >
              {index + 1}
            </span>
            <div className="sm:mt-5">
              <h3 className={h3Class}>{title}</h3>
              <p className="mt-2 max-w-[30ch] text-[17px] leading-[1.6] text-pretty text-slate-600">
                {body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
