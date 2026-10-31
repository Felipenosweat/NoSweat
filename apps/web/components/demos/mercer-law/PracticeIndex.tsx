"use client";

import { useState } from "react";
import { MATTERS, type Matter } from "./content";

// A assinatura da página: os serviços como o sumário de um livro (§ 2.1 ... preço, com
// pontilhado), em três grupos. Escolher uma linha abre a "ficha" do serviço: no computador ela
// fica presa à direita enquanto o índice rola; no celular abre logo abaixo da linha (acordeão).
// "Ask about this" leva ao pedido de consulta com o serviço já marcado (evento mercer:matter).

const GROUPS = ["Planning ahead", "After a death", "Marriage and divorce"] as const;

export function chooseMatter(id: string) {
  window.dispatchEvent(new CustomEvent("mercer:matter", { detail: id }));
}

function Sheet({
  matter,
  id,
  inline = false,
  className = "",
}: {
  matter: Matter;
  id: string;
  /** No celular a ficha abre logo abaixo da linha: o nome já está ali, então o título é só para leitor de tela. */
  inline?: boolean;
  className?: string;
}) {
  return (
    <div id={id} className={className}>
      <div key={matter.id} className="m-swap">
        <p className={`m-label text-[var(--m-ox)] ${inline ? "sr-only" : ""}`}>
          §&nbsp;{matter.no} · {matter.group}
        </p>
        <h3 className={inline ? "sr-only" : "m-display mt-4 text-[clamp(2rem,3.2vw,2.9rem)]"}>
          {matter.name}
        </h3>
        <p className={`max-w-[46ch] text-[18px] leading-[1.6] ${inline ? "" : "mt-5"}`}>
          {matter.description}
        </p>
        <dl className="mt-7 grid grid-cols-2 border-t border-[var(--m-rule-strong)]">
          <div className="border-r border-[var(--m-rule)] py-4 pr-4">
            <dt className="m-label text-[11px] text-[var(--m-muted)]">Fee</dt>
            <dd className="m-display m-num mt-2 text-[clamp(1.6rem,2.4vw,2.1rem)] text-[var(--m-ox)]">
              {matter.price}
            </dd>
          </div>
          <div className="py-4 pl-4">
            <dt className="m-label text-[11px] text-[var(--m-muted)]">Good to know</dt>
            <dd className="mt-2 text-[16px] leading-snug">{matter.detail}</dd>
          </div>
        </dl>
        <a
          href="#book"
          onClick={() => chooseMatter(matter.id)}
          className="m-btn m-btn-ox mt-6 w-full sm:w-auto"
        >
          Ask about this <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}

export function PracticeIndex() {
  const [active, setActive] = useState(MATTERS[0]?.id ?? "");
  const chosen = MATTERS.find((matter) => matter.id === active) ?? MATTERS[0];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7">
        {GROUPS.map((group) => (
          <div key={group} className="mb-8 last:mb-0">
            <p className="m-label border-b border-[var(--m-ink)] pb-2 text-[var(--m-muted)]">
              {group}
            </p>
            <ul>
              {MATTERS.filter((matter) => matter.group === group).map((matter) => {
                const open = matter.id === active;
                return (
                  <li key={matter.id} className="border-b border-[var(--m-rule)]">
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={`m-sheet m-sheet-${matter.id}`}
                      onClick={() => setActive(matter.id)}
                      className="m-index-row relative flex w-full items-baseline py-4 text-left"
                    >
                      <span className="m-num w-11 shrink-0 text-[14px] text-[var(--m-muted)]">
                        {matter.no}
                      </span>
                      <span className="m-index-name m-display [text-wrap:balance] text-[clamp(1.3rem,2.1vw,1.85rem)] leading-tight">
                        {matter.name}
                      </span>
                      <span aria-hidden="true" className="m-leader hidden sm:block" />
                      <span className="m-num ml-auto shrink-0 pl-3 text-[16px] whitespace-nowrap sm:ml-0 sm:pl-0">
                        {matter.price}
                      </span>
                    </button>
                    {open && (
                      <Sheet
                        matter={matter}
                        id={`m-sheet-${matter.id}`}
                        inline
                        className="pb-8 pl-11 lg:hidden"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="hidden lg:col-span-5 lg:block">
        <div className="sticky top-10 border-t-[3px] border-double border-[var(--m-ink)] bg-[var(--m-paper-2)] p-8">
          {chosen && <Sheet matter={chosen} id="m-sheet" />}
        </div>
      </div>
    </div>
  );
}
