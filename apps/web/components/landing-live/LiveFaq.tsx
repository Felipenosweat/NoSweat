import { CONTACT_EMAIL } from "@/components/marketing/legal/contact";
import { salesWhatsappUrl } from "@/components/marketing/SiteChrome";
import { LIVE_FAQS } from "./content";
import { focusOnWhite } from "./styles";

// Dúvidas (bloco branco): lista editorial em duas colunas, tudo aberto (sem sanfona). Pergunta
// em Bricolage 500 de 22px, resposta em Inter embaixo. As 6 perguntas vêm de faqs.ts (via
// content.ts) e são as mesmas do JSON-LD da página.

const link = `rounded-sm font-semibold text-ink underline underline-offset-4 ${focusOnWhite}`;

export function LiveFaq() {
  // WhatsApp de vendas (SALES_WHATSAPP). Sem a variável, o link não aparece.
  const whatsapp = salesWhatsappUrl();
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-4 bg-white">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-12 lg:items-end">
          <h2
            id="faq-title"
            className="live-d text-[clamp(2.5rem,5.6vw,5.25rem)] leading-[0.95] font-extrabold tracking-[-0.04em] text-balance text-ink lg:col-span-7"
          >
            Asked before anyone signs up.
          </h2>
          <p className="max-w-[40ch] text-[17px] leading-relaxed text-pretty text-slate-600 lg:col-span-5 lg:pb-2">
            Something else on your mind? Write to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={`whitespace-nowrap ${link}`}>
              {CONTACT_EMAIL}
            </a>
            {whatsapp && (
              <>
                {" "}
                or{" "}
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={link}>
                  message us on WhatsApp
                </a>
              </>
            )}
            . A real person writes back.
          </p>
        </div>

        <dl className="mt-14 grid gap-x-16 border-t border-slate-200 md:grid-cols-2 lg:mt-20">
          {LIVE_FAQS.map((faq) => (
            <div key={faq.question} className="border-b border-slate-200 py-8">
              <dt className="live-d text-[22px] leading-snug font-medium tracking-[-0.015em] text-ink">
                {faq.question}
              </dt>
              <dd className="mt-3 max-w-[56ch] text-[17px] leading-[1.6] text-pretty text-slate-600">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
