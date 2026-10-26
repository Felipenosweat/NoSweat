"use client";

import { useState } from "react";
import { SUITES } from "./content";
import { Photo } from "./ui";

// As suítes como uma fileira de arcos (as portas de uma enfilada). No computador, o arco
// escolhido (passar o mouse, foco do teclado ou clique) se abre e os outros viram faixas com o
// nome na vertical. No celular e no tablet, cada suíte é um cartão em arco que o dedo passa
// de lado. Todo o conteúdo fica no HTML (o painel fechado só esconde visualmente).

export function Suites() {
  const [active, setActive] = useState(0);
  return (
    <>
      {/* Computador: acordeão de arcos. */}
      <div className="hidden h-[min(78vh,760px)] gap-3 lg:flex">
        {SUITES.map((suite, index) => {
          const on = index === active;
          return (
            <article
              key={suite.id}
              data-on={on || undefined}
              onMouseEnter={() => setActive(index)}
              className="a-suite group relative min-w-0 overflow-hidden rounded-t-full"
              style={{ flexGrow: on ? 4.2 : 1 }}
            >
              <Photo
                photo={suite.photo}
                sizes="(min-width: 1024px) 60vw, 100vw"
                ratio={0.9}
                className="a-suite-img absolute inset-0 size-full object-cover"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--a-night)] via-[var(--a-night)]/30 to-transparent" />
              <button
                type="button"
                onClick={() => setActive(index)}
                onFocus={() => setActive(index)}
                aria-expanded={on}
                aria-controls={`suite-${suite.id}`}
                className="a-focus absolute inset-0 z-10"
              >
                <span className="sr-only">{suite.name}</span>
              </button>
              <p
                aria-hidden="true"
                className="a-suite-tab a-display pointer-events-none absolute bottom-10 left-1/2 origin-bottom-left text-2xl whitespace-nowrap text-[var(--a-ivory)] italic"
              >
                {suite.short}
              </p>
              <div
                id={`suite-${suite.id}`}
                className="a-suite-body pointer-events-none absolute inset-x-0 bottom-0 z-20 p-10"
              >
                <p className="a-caps text-[11px] text-[var(--a-gold)]">
                  {String(index + 1).padStart(2, "0")} · From {suite.from} a night
                </p>
                <h3 className="a-display mt-3 text-[clamp(2.2rem,3.2vw,3.4rem)] leading-[0.95] text-[var(--a-ivory)]">
                  {suite.name}
                </h3>
                <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-[var(--a-ivory)]/80">
                  {suite.body}
                </p>
                <dl className="mt-6 flex gap-8 border-t border-[var(--a-gold)]/30 pt-4 text-[13px] text-[var(--a-ivory)]/85">
                  <div>
                    <dt className="a-caps text-[10px] text-[var(--a-gold)]">Size</dt>
                    <dd className="mt-1">{suite.size}</dd>
                  </div>
                  <div>
                    <dt className="a-caps text-[10px] text-[var(--a-gold)]">View</dt>
                    <dd className="mt-1">{suite.view}</dd>
                  </div>
                  <div>
                    <dt className="a-caps text-[10px] text-[var(--a-gold)]">Guests</dt>
                    <dd className="mt-1">{suite.guests}</dd>
                  </div>
                </dl>
              </div>
            </article>
          );
        })}
      </div>

      {/* Celular e tablet: cartões em arco que passam de lado. */}
      <ul
        tabIndex={0}
        aria-label="Suites, scroll sideways"
        className="a-focus -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-10 sm:scroll-px-10 sm:px-10 lg:hidden"
      >
        {SUITES.map((suite, index) => (
          <li key={suite.id} className="w-[82vw] max-w-[380px] shrink-0 snap-start">
            <div className="overflow-hidden rounded-t-full">
              <Photo
                photo={suite.photo}
                sizes="82vw"
                ratio={0.78}
                className="aspect-[0.78] w-full object-cover"
                alt=""
              />
            </div>
            <p className="a-caps mt-5 text-[11px] text-[var(--a-gold)]">
              {String(index + 1).padStart(2, "0")} · From {suite.from} a night
            </p>
            <h3 className="a-display mt-2 text-[2rem] leading-none text-[var(--a-ivory)]">
              {suite.name}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--a-ivory)]/80">
              {suite.body}
            </p>
            <p className="mt-4 text-[13px] text-[var(--a-ivory)]/70">
              {suite.size} · {suite.view} · {suite.guests}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
