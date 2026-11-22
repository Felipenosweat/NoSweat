import { SHORT_FAQS } from "./facts";
import { focusRing, shell } from "./ui";

// Dúvidas curtas, depois do CTA: as que as cinco respostas grandes não cobriram. No computador,
// o título fica preso à esquerda e a lista ocupa 8 colunas. <details> com o mesmo `name`: abrir
// uma fecha as outras; a altura anima pelo .ns-faq (marketing.css), parado com movimento reduzido.

export function AnswersFaq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 bg-white py-20 lg:py-28">
      <div className={`${shell} lg:grid lg:grid-cols-12 lg:gap-x-10`}>
        <div className="lg:col-span-4">
          <h2
            id="faq-title"
            className="font-display text-[2rem] leading-[1.05] font-bold tracking-[-0.035em] text-balance text-ink lg:sticky lg:top-28 lg:text-[3rem]"
          >
            Other things people ask
          </h2>
        </div>
        <div className="mt-10 border-b border-slate-200 lg:col-span-8 lg:mt-0">
          {SHORT_FAQS.map((faq) => (
            <details
              key={faq.question}
              name="faq"
              className="ns-faq group border-t border-slate-200"
            >
              <summary
                className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-5 font-display text-lg font-semibold tracking-[-0.015em] text-ink lg:text-xl [&::-webkit-details-marker]:hidden ${focusRing}`}
              >
                {faq.question}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  className="size-5 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p className="max-w-[62ch] pb-6 text-[17px] leading-[1.65] text-pretty text-slate-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
