import type { Faq } from "./faqs";
import { focusRing } from "./styles";

// Lista de dúvidas da landing e de /pricing (o mesmo desenho nas duas). <details> nativo: abre
// sem JavaScript. Com `name`, abrir uma fecha as outras. Linhas de 48px; o sinal + vira −
// (.faq-fx em app/(marketing)/marketing.css).

export function FaqList({ faqs, name }: { faqs: readonly Faq[]; name?: string }) {
  return (
    <div className="divide-y divide-slate-200 border-y border-slate-200">
      {faqs.map((faq) => (
        <details key={faq.question} name={name}>
          <summary
            className={`flex min-h-12 cursor-pointer list-none items-center gap-6 rounded-sm py-4 text-[17px] leading-snug font-semibold text-ink transition-colors duration-150 hover:text-slate-700 ${focusRing} [&::-webkit-details-marker]:hidden`}
          >
            {faq.question}
            <span aria-hidden="true" className="faq-fx" />
          </summary>
          <p className="max-w-[62ch] pr-10 pb-6 text-base leading-[1.65] text-pretty text-slate-600">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
