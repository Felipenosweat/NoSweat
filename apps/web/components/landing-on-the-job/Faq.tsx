import type { ReactNode } from "react";
import type { Faq as FaqItem } from "@/components/marketing/faqs";
import { FAQ_TITLE } from "./content";

// 6. "O que mais eu preciso saber?" Seis perguntas de faqs.ts em <details> (abre e fecha sem JS,
// com teclado). Computador: título à esquerda, preso ao rolar, e a lista à direita.
// O JSON-LD da página usa exatamente esta lista (page.tsx).

export function Faq({ faqs, contact }: { faqs: FaqItem[]; contact: ReactNode }) {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="otj-grid otj-faq scroll-mt-16 bg-surface py-16 md:py-24 lg:py-28"
    >
      <div className="col-[2/14] lg:col-[2/6]">
        <div className="lg:sticky lg:top-28">
          <h2 id="faq-title" className="otj-display otj-h2 max-w-[12ch] text-ink">
            {FAQ_TITLE}
          </h2>
          <p className="mt-5 max-w-[34ch] text-[16px] leading-[1.6] text-slate-600">{contact}</p>
        </div>
      </div>
      <div className="col-[2/14] mt-10 lg:col-[7/14] lg:mt-0">
        <div className="border-b border-slate-300">
          {faqs.map((faq) => (
            <details key={faq.question} name="otj-faq" className="border-t border-slate-300">
              <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-6 rounded-sm py-4 text-[18px] leading-snug font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:text-[19px]">
                {faq.question}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  className="otj-plus size-6 shrink-0 text-slate-500"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p className="max-w-[62ch] pb-6 text-[17px] leading-[1.6] text-pretty text-slate-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
