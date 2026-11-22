import Image from "next/image";
import Link from "next/link";
import {
  FEATURED_EXAMPLE,
  MORE_EXAMPLES,
  TERMS_QUOTES,
  contactEmail,
  monthsFreeYearly,
  priceFacts,
} from "./facts";
import { captionClass, focusRing, frameClass } from "./ui";

// As provas de cada resposta. Regras de honestidade: preço só do plans.ts; capturas reais
// (sites de exemplo = negócio inventado, dito na legenda; tela do app = clientes inventados);
// Termos citados palavra por palavra; nenhum número, nota ou depoimento inventado.

/** Seta "abre outra página" (traço 1.5, como os ícones de components/marketing/icons.tsx). */
function ArrowUpRight({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

/* ---------- 1. Preço ---------- */

export function PriceProof({ promo, offerName }: { promo: boolean; offerName: string }) {
  const struck = promo && priceFacts.starterDiscounted;
  return (
    <div className={`${frameClass} p-6 sm:p-10`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-display text-xl font-semibold tracking-[-0.015em] text-ink">Starter</p>
        {struck && (
          <p className="text-sm text-slate-600 tabular-nums">
            {offerName} price. Regular <s>{priceFacts.starterRegular}/mo</s>
          </p>
        )}
      </div>
      <p className="mt-4 flex items-baseline gap-2 font-display text-ink">
        <span className="text-[5rem] leading-[0.85] font-bold tracking-[-0.05em] tabular-nums sm:text-[6.5rem] lg:text-[7rem]">
          {priceFacts.starterMonthly}
        </span>
        <span className="text-xl font-semibold tracking-[-0.015em] text-slate-600">a month</span>
      </p>
      <ul className="mt-8 space-y-2 text-base leading-snug text-slate-600">
        {priceFacts.starterLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div className="mt-8 grid grid-cols-1 gap-y-4 border-t border-slate-200 pt-6 sm:grid-cols-2 sm:gap-x-8">
        {priceFacts.others.map((plan) => (
          <div key={plan.id}>
            <p className="flex items-baseline gap-2 font-display text-ink">
              <span className="text-base font-semibold">{plan.name}</span>
              <span className="text-2xl font-bold tracking-[-0.03em] tabular-nums">
                {plan.monthly}
              </span>
              <span className="text-sm text-slate-600">/mo</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">{plan.sites}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-slate-600">
        Pay yearly and get {monthsFreeYearly} months free. No setup fee.
      </p>
    </div>
  );
}

/* ---------- 2. Site de exemplo ---------- */

export function ExampleSiteProof() {
  const site = FEATURED_EXAMPLE;
  return (
    <figure id="looks" className="scroll-mt-20">
      <Link
        href={`/examples/${site.slug}`}
        className={`group block rounded-xl ${focusRing}`}
        aria-label={`Open the example site for ${site.name}, a made-up business`}
      >
        <div
          className={`${frameClass} overflow-hidden p-2 transition-colors duration-150 group-hover:border-slate-400 sm:p-3`}
        >
          {/* Celular: a captura de celular (a de computador fica pequena demais). */}
          <Image
            src={`/landing/signature/${site.slug}-m.webp`}
            alt={`Phone view of the ${site.name} example website: the business name in big type, a short intro and a call button.`}
            width={640}
            height={1385}
            sizes="(min-width: 640px) 1px, calc(100vw - 56px)"
            className="aspect-[4/5] w-full rounded-lg object-cover object-top sm:hidden"
          />
          <Image
            src={`/landing/signature/${site.slug}-d.webp`}
            alt={`Desktop view of the ${site.name} example website: the business name in big type, a short intro and buttons to call or ask for a quote.`}
            width={1600}
            height={1000}
            sizes="(min-width: 1280px) 780px, (min-width: 640px) 90vw, 1px"
            className="hidden w-full rounded-lg sm:block"
          />
        </div>
      </Link>
      <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="text-base text-slate-600">
          <span className="font-semibold text-ink">{site.name}</span>, {site.kind.toLowerCase()} in{" "}
          {site.place}. Made-up business.
        </span>
        <Link
          href={`/examples/${site.slug}`}
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm font-semibold text-ink underline decoration-slate-300 underline-offset-4 hover:decoration-ink ${focusRing}`}
        >
          Open this example <ArrowUpRight />
        </Link>
      </figcaption>
      <div className="mt-6 border-t border-slate-200 pt-4">
        <p className={captionClass}>More example sites, all made-up businesses</p>
        <ul className="mt-1 flex flex-wrap gap-x-6">
          {MORE_EXAMPLES.map((example) => (
            <li key={example.slug}>
              <Link
                href={`/examples/${example.slug}`}
                className={`inline-flex min-h-11 items-center gap-1 rounded-sm text-[15px] font-medium text-ink hover:underline hover:underline-offset-4 ${focusRing}`}
              >
                {example.name}
                <span className="sr-only">
                  , {example.kind.toLowerCase()} in {example.place}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

/* ---------- 3. Tela de clientes ---------- */

export function ClientsProof() {
  return (
    <figure>
      <div className={`${frameClass} bg-white p-2 sm:p-3`}>
        {/* Celular: recorte ampliado da mesma captura (título, contadores e os nomes), senão o
            texto da tela fica ilegível. Do sm para cima, a tela inteira. */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg sm:hidden">
          <Image
            src="/landing/real/clients-2.webp"
            alt="The Clients screen in No Sweat: new requests with each person’s name, phone number and email, and tabs for New, Contacted, Quoted, Won and Lost."
            width={2400}
            height={1500}
            sizes="(min-width: 640px) 1px, 300vw"
            className="absolute top-[-3%] left-[-72%] w-[300%] max-w-none"
          />
        </div>
        <Image
          src="/landing/real/clients-2.webp"
          alt="The Clients screen in No Sweat: five new requests, each with a name, phone number, email and a Reply button, and tabs for New, Contacted, Quoted, Won and Lost."
          width={2400}
          height={1500}
          sizes="(min-width: 1280px) 820px, (min-width: 640px) 90vw, 1px"
          className="hidden w-full rounded-lg sm:block"
        />
      </div>
      <figcaption className={`mt-4 ${captionClass}`}>
        Real No Sweat screen. The customers are made up.
      </figcaption>
    </figure>
  );
}

/* ---------- 4. Termos ---------- */

export function TermsProof({ checkout }: { checkout: boolean }) {
  const quote = checkout ? TERMS_QUOTES.checkout : TERMS_QUOTES.direct;
  return (
    <figure className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-x-4 border-b border-slate-200 px-6 py-3 sm:px-8">
        <p className="text-sm font-semibold text-ink">Terms of Service, Renewal</p>
        <p className="text-[13px] text-slate-500">nosweatfd.com/terms</p>
      </div>
      <blockquote
        cite="/terms#renewal"
        className="px-6 py-8 text-lg leading-[1.6] text-pretty text-slate-700 sm:px-8 sm:py-10 lg:text-xl"
      >
        <p>
          <strong className="font-semibold text-ink">{quote.lead}</strong>
          {quote.rest}
        </p>
      </blockquote>
      <figcaption className="border-t border-slate-200 px-6 sm:px-8">
        <Link
          href="/terms#renewal"
          className={`inline-flex min-h-12 items-center gap-1.5 rounded-sm text-sm font-semibold text-ink underline decoration-slate-300 underline-offset-4 hover:decoration-ink ${focusRing}`}
        >
          Read the renewal terms <ArrowUpRight />
        </Link>
      </figcaption>
    </figure>
  );
}

/* ---------- 5. Contato ---------- */

export function ContactProof({ whatsapp }: { whatsapp: string | null }) {
  return (
    <div className={`${frameClass} p-6 sm:p-10`}>
      <p className="text-sm font-semibold text-ink">Email</p>
      <a
        href={`mailto:${contactEmail}`}
        className={`mt-3 block rounded-sm font-display text-[1.625rem] leading-tight font-semibold tracking-[-0.03em] break-words text-ink underline decoration-slate-300 decoration-2 underline-offset-[6px] transition-colors duration-150 hover:decoration-ink sm:text-[2.75rem] lg:text-[3.25rem] ${focusRing}`}
      >
        {contactEmail}
      </a>
      {whatsapp && (
        <>
          <p className="mt-8 text-sm font-semibold text-ink">WhatsApp</p>
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-sm text-lg font-semibold text-ink underline decoration-slate-300 underline-offset-4 hover:decoration-ink ${focusRing}`}
          >
            Message us on WhatsApp <ArrowUpRight />
          </a>
        </>
      )}
      <p className="mt-8 border-t border-slate-200 pt-6 text-base leading-relaxed text-slate-600">
        Stuck connecting your domain? Send a screenshot and we’ll tell you exactly where to click.
      </p>
    </div>
  );
}
