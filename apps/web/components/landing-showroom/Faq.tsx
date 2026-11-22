import { LANDING_FAQS } from "@/components/marketing/faqs";
import { focusRing } from "@/components/marketing/styles";

// Dúvidas da landing "Showroom": no computador o título fica preso à esquerda (sticky) e a lista
// à direita. <details name="faq">: abrir uma fecha as outras, sem JS.

const inkLink = `rounded-sm font-semibold text-ink underline underline-offset-4 hover:text-slate-600 ${focusRing}`;

export function Faq({ whatsapp }: { whatsapp: string | null }) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 bg-white px-5 sm:px-8">
      <div className="mx-auto grid w-full max-w-[1280px] gap-8 border-t border-slate-200 py-16 lg:grid-cols-12 lg:gap-x-8 lg:py-24">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <h2
              id="faq-title"
              className="max-w-[14ch] font-display text-[2rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance text-ink lg:text-[3rem]"
            >
              Questions before you start
            </h2>
            <p className="mt-5 max-w-[36ch] text-[15px] leading-relaxed text-pretty text-slate-600">
              Still wondering? Write to{" "}
              <a href="mailto:hello@nosweatfd.com" className={inkLink}>
                hello@nosweatfd.com
              </a>
              {whatsapp && (
                <>
                  {" "}
                  or{" "}
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={inkLink}>
                    message us on WhatsApp
                  </a>
                </>
              )}
              . A real person writes back.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-200 lg:col-span-8">
          {LANDING_FAQS.map((faq) => (
            <details key={faq.question} name="faq" className="group border-b border-slate-200">
              <summary
                className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-4 font-display text-[17px] font-semibold tracking-[-0.01em] text-ink lg:text-lg [&::-webkit-details-marker]:hidden ${focusRing}`}
              >
                {faq.question}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  className="size-4 shrink-0 text-slate-500"
                >
                  <path d="M3 8h10" />
                  <path d="M8 3v10" className="group-open:hidden" />
                </svg>
              </summary>
              <p className="max-w-[62ch] pb-5 text-base leading-[1.65] text-pretty text-slate-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
