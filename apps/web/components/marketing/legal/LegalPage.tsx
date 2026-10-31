import type { ReactNode } from "react";
import { container, textLink } from "@/components/marketing/styles";
import { CONTACT_EMAIL } from "./contact";

// Esqueleto das páginas legais (/terms e /privacy): título, data, aviso de rascunho,
// sumário fixo na lateral (só em telas grandes) e seções numeradas com âncoras.

export type LegalSection = {
  /** Âncora da seção (vira o id do <h2> e o link do sumário). */
  id: string;
  title: string;
  content: ReactNode;
};

type LegalPageProps = {
  title: string;
  intro: ReactNode;
  /** Data no formato ISO (AAAA-MM-DD), para o <time>. */
  updatedIso: string;
  /** Data por extenso, como aparece na tela. */
  updatedLabel: string;
  sections: LegalSection[];
};

// Estilo do texto corrido das seções, aplicado nos filhos para o conteúdo ficar só com JSX simples.
const proseClass =
  "mt-4 space-y-4 text-base leading-[1.7] text-pretty text-slate-600 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:marker:text-slate-400";

export function LegalPage({ title, intro, updatedIso, updatedLabel, sections }: LegalPageProps) {
  return (
    <div className="bg-white">
      <header className="border-b border-slate-200 bg-surface">
        <div className={`${container} pt-12 pb-10 lg:pt-20 lg:pb-14`}>
          <p className="font-display text-sm font-semibold text-(--glass-fg-muted)">
            Last updated: <time dateTime={updatedIso}>{updatedLabel}</time>
          </p>
          <h1 className="mt-3 max-w-[18ch] font-display text-[2.5rem] leading-[1.05] font-bold tracking-[-0.03em] text-balance text-ink lg:text-6xl">
            {title}
          </h1>
          <div className="mt-6 max-w-[62ch] text-lg leading-relaxed text-pretty text-slate-600">
            {intro}
          </div>
          <p
            role="note"
            className="mt-8 max-w-[62ch] rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700"
          >
            <span className="font-semibold text-ink">Draft.</span> This is a draft and may change
            before paid plans launch.
          </p>
        </div>
      </header>

      <div className={`${container} grid py-12 lg:grid-cols-12 lg:gap-x-8 lg:py-20`}>
        <aside className="hidden lg:col-span-3 lg:block">
          <nav aria-label="On this page" className="sticky top-24">
            <p className="font-display text-sm font-semibold text-ink">On this page</p>
            <ol className="mt-3 border-l border-slate-200 text-sm">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px flex gap-2 border-l border-transparent py-1.5 pl-4 leading-snug text-slate-600 transition-colors hover:border-slate-400 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="w-5 shrink-0 text-(--glass-fg-muted) tabular-nums">
                      {index + 1}.
                    </span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="max-w-[70ch] lg:col-span-8 lg:col-start-5">
          {sections.map((section, index) => (
            <section
              key={section.id}
              aria-labelledby={section.id}
              className="border-t border-slate-200 pt-8 pb-10 first:border-t-0 first:pt-0"
            >
              <h2
                id={section.id}
                className="flex scroll-mt-24 gap-3 font-display text-2xl leading-tight font-bold tracking-[-0.02em] text-balance text-ink"
              >
                <span className="text-(--glass-fg-muted) tabular-nums">{index + 1}.</span>
                {section.title}
              </h2>
              <div className={proseClass}>{section.content}</div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

/** Link mailto para o e-mail de contato, com o estilo de link da marca. */
export function ContactEmailLink() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className={`break-all ${textLink}`}>
      {CONTACT_EMAIL}
    </a>
  );
}
