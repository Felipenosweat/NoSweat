import type { SiteSpec } from "@nosweat/schema";
import Image from "next/image";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import type { Faq } from "@/components/marketing/faqs";
import { focusRing, primaryButton } from "@/components/marketing/styles";
import { StyleSwitcher } from "./StyleSwitcher";
import { StartLink, TypedName } from "./YourNameContext";
import { body, container, h2, lead } from "./type";

// Seções abaixo do topo da landing "Your name on it": estilos → o escritório → como o site de
// verdade é feito → preço → dúvidas → fim (o único bloco escuro). Só afirmações que o produto
// cumpre hoje; nada de números, logos, notas ou depoimentos inventados.

/** O mesmo nome em três composições. Continua o fundo cinza da prévia do topo. */
export function Styles({ base }: { base: SiteSpec }) {
  return (
    <section id="styles" aria-labelledby="styles-title" className="scroll-mt-16 bg-surface">
      <div className={`${container} pt-20 pb-20 lg:pt-28 lg:pb-28`}>
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-x-10">
          <h2 id="styles-title" className={`${h2} max-w-[16ch] lg:col-span-7`}>
            Three ways <TypedName fallback="your business" /> could look
          </h2>
          <p className={`${lead} max-w-[48ch] lg:col-span-5 lg:self-end`}>
            We pick a layout that fits your kind of business. You can switch to another one anytime,
            and your name, phone number, text and photos come along.
          </p>
        </div>
        <div className="mt-12 lg:mt-16">
          <StyleSwitcher base={base} />
        </div>
        <p className="mt-6 text-[15px] leading-snug text-slate-600 lg:text-right">
          Real No Sweat layouts. The business behind them is made up.
        </p>
      </div>
    </section>
  );
}

const OFFICE: { term: string; detail: string }[] = [
  {
    term: "Requests and clients",
    detail:
      "Every message from your contact form becomes a client. Move each one from New to Won, add notes and log the jobs you did.",
  },
  {
    term: "Online booking",
    detail:
      "Customers pick an open time from your hours and services, and the job lands on your schedule.",
  },
  {
    term: "Estimates and invoices",
    detail: "Send an estimate the customer can approve, then the invoice when the job is done.",
  },
  {
    term: "Google review requests",
    detail: "Ask happy customers for a review by text, email or a QR code.",
  },
  {
    term: "Instagram post calendar",
    detail: "AI drafts posts from your website. Nothing goes out until you approve it.",
  },
];

/** O escritório: o que acontece depois que alguém preenche o formulário. */
export function Office() {
  return (
    <section id="office" aria-labelledby="office-title" className="scroll-mt-16">
      <div className={`${container} grid gap-12 py-20 lg:grid-cols-12 lg:gap-x-10 lg:py-28`}>
        <div className="lg:col-span-5">
          <h2 id="office-title" className={`${h2} max-w-[14ch]`}>
            The requests land in your own office
          </h2>
          <p className={`${body} mt-5 max-w-[46ch]`}>
            Every No Sweat website comes with the place where its work shows up. When someone fills
            out your form, you see them here, ready to call, text or quote.
          </p>
          <dl className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {OFFICE.map((item) => (
              <div key={item.term} className="py-4">
                <dt className="font-display text-[17px] font-semibold tracking-[-0.01em] text-ink">
                  {item.term}
                </dt>
                <dd className="mt-1 text-[15px] leading-relaxed text-pretty text-slate-600">
                  {item.detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <figure className="lg:col-span-7 lg:pt-2">
          <div className="rounded-xl bg-surface p-2 ring-1 ring-slate-200 sm:p-3">
            <Image
              src="/landing/real/clients-2.webp"
              alt="The Clients screen in No Sweat: five new requests with name, phone, email and a Reply button."
              width={2400}
              height={1500}
              sizes="(min-width: 1200px) 680px, (min-width: 1024px) 56vw, 100vw"
              className="h-auto w-full rounded-lg shadow-[0_1px_2px_rgb(7_27_51/.06),0_12px_32px_-16px_rgb(7_27_51/.22)]"
            />
          </div>
          <figcaption className="mt-4 text-[15px] leading-snug text-slate-600">
            Real No Sweat screen. The customers are made up.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

/** Como o site de verdade é feito, com a regra dos créditos (números de server/credits). */
export function HowItsBuilt({ creditsLine }: { creditsLine: string }) {
  return (
    <section aria-labelledby="built-title">
      <div className={container}>
        <div className="grid gap-6 border-t border-slate-200 py-16 lg:grid-cols-12 lg:gap-x-10 lg:py-20">
          <h2
            id="built-title"
            className="font-display text-2xl leading-tight font-bold tracking-[-0.025em] text-balance text-ink lg:col-span-5 lg:text-[2rem]"
          >
            How your real site gets built
          </h2>
          <div className="lg:col-span-7">
            <p className={`${body} max-w-[62ch]`}>
              On the next screen you tell us what you do and where, in your own words, and answer a
              few quick questions. No Sweat picks a layout for your kind of business and writes the
              site from what you said: headline, services, hours, service area, FAQ and a contact
              form, with your phone number one tap away. You look it over in a private preview,
              change anything, and publish when it’s right.
            </p>
            <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-pretty text-slate-600">
              {creditsLine}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Preço: o mesmo componente do /pricing (variante "plain"), com o mesmo checkout. */
export function Pricing({
  checkout,
  promo,
  offerName,
  intro,
}: {
  checkout: boolean;
  promo: boolean;
  offerName: string;
  intro: string;
}) {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-16 bg-surface">
      <div className={`${container} py-20 lg:py-28`}>
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-x-10">
          <h2 id="pricing-title" className={`${h2} max-w-[14ch] lg:col-span-7`}>
            Free to describe. Pay when you build.
          </h2>
          <p className={`${lead} max-w-[46ch] lg:col-span-5 lg:self-end`}>{intro}</p>
        </div>
        <div className="mt-12">
          <PricingPlans checkout={checkout} promo={promo} offerName={offerName} variant="plain" />
        </div>
      </div>
    </section>
  );
}

const inlineLink = `rounded-sm font-semibold text-ink underline decoration-slate-300 underline-offset-4 transition-colors duration-150 hover:decoration-ink ${focusRing}`;

/** Dúvidas: título preso à esquerda no computador; abrir uma fecha as outras. */
export function FaqSection({ faqs, whatsapp }: { faqs: Faq[]; whatsapp: string | null }) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16">
      <div className={`${container} grid gap-10 py-20 lg:grid-cols-12 lg:gap-x-10 lg:py-28`}>
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <h2 id="faq-title" className={`${h2} max-w-[12ch]`}>
              Questions owners ask
            </h2>
            <p className="mt-5 max-w-[34ch] text-[15px] leading-relaxed text-pretty text-slate-600">
              Still wondering? Write to{" "}
              <a href="mailto:hello@nosweatfd.com" className={inlineLink}>
                hello@nosweatfd.com
              </a>
              {whatsapp && (
                <>
                  {" "}
                  or{" "}
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={inlineLink}
                  >
                    message us on WhatsApp
                  </a>
                </>
              )}
              . A real person writes back.
            </p>
          </div>
        </div>
        <div className="lg:col-span-8">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              name="faq"
              className={`ns-faq group border-b border-slate-200 ${index === 0 ? "border-t" : ""}`}
            >
              <summary
                className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-6 rounded-sm py-4 font-display text-[17px] font-semibold tracking-[-0.01em] text-ink lg:text-lg [&::-webkit-details-marker]:hidden ${focusRing}`}
              >
                {faq.question}
                <PlusIcon />
              </summary>
              <p className="max-w-[62ch] pb-6 text-base leading-[1.65] text-pretty text-slate-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Fim: o único bloco escuro da página, com o nome digitado e um botão só. */
export function FinalCta({ priceLine }: { priceLine: string }) {
  return (
    <section aria-labelledby="final-title" data-hide-mobile-cta className="bg-ink text-white">
      <div className={`${container} py-20 lg:py-28`}>
        <h2
          id="final-title"
          className="max-w-[18ch] font-display text-[2rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance lg:text-[3.5rem]"
        >
          Ready to put <TypedName fallback="your business" /> online?
        </h2>
        <p className="mt-5 max-w-[52ch] text-lg leading-[1.6] text-pretty text-slate-300">
          Telling us what you do and where is free, and so are the quick questions after it. You
          pick a plan when you want the site built.
        </p>
        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <StartLink className={`w-full sm:w-auto ${primaryButton} focus-visible:outline-white`}>
            Start my website
          </StartLink>
          <p className="text-[15px] text-slate-300">{priceLine}</p>
        </div>
      </div>
    </section>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      className="size-5 shrink-0 text-slate-500 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}
