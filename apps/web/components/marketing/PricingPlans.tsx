"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon } from "./icons";
import { primaryButton, secondaryButton, textLink } from "./styles";

// Tabela de planos da landing: três cartões rounded-xl com linhas de recibo; o recomendado tem
// o anel azul (ring-2 ring-brand), o único destaque de cor da seção.
// Único componente de cliente da seção: só guarda a escolha mensal/anual.
// Preços combinados com o fundador (2026-10-13). Anual = 10× o mensal ("2 months free" é exato).
// Nada de preço riscado, "mais popular" ou desconto inventado.
// "Up to N websites" = sites publicados ao mesmo tempo (`publishedSitesLimit` em
// server/billing/plans.ts). Sem números de edições da IA nem de posts por plano: o fundador
// ainda não decidiu (créditos virão depois; ver o TODO em plans.ts).
// `checkout`: o Stripe Checkout está ligado (`checkoutReady()` de server/billing, lido pela
// página, que é server component). Sem ele a venda é manual (WhatsApp/e-mail + acesso liberado
// pelo admin por X dias): pago adiantado e SEM renovação automática, então o texto muda.
// Nenhum dos dois modos promete e-mail de lembrete: hoje nenhum código manda esse e-mail.

type Billing = "monthly" | "annual";

type Plan = {
  id: string;
  name: string;
  summary: string;
  monthly: string;
  annual: string;
  /** Equivalente mensal do plano anual (anual ÷ 12). */
  annualPerMonth: string;
  /** Taxa de implantação no plano mensal; `null` = o plano não tem. */
  setupMonthly: string | null;
  recommended?: boolean;
  intro?: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    summary: "A complete site on a free No Sweat address.",
    monthly: "$39",
    annual: "$390",
    annualPerMonth: "$32.50",
    setupMonthly: "$249",
    features: [
      "Up to 3 websites",
      "Free nosweatfd.com/s/ address",
      "Editor with live preview",
      "Photo uploads and a photo gallery",
      "Contact form with messages in your dashboard",
      "Clients area",
      "Instagram post calendar",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    summary: "Your own domain and more live websites.",
    monthly: "$69",
    annual: "$690",
    annualPerMonth: "$57.50",
    setupMonthly: "$249",
    recommended: true,
    intro: "Everything in Starter, plus:",
    features: ["Up to 5 websites", "Connect your own domain", "More Instagram posts each month"],
  },
  {
    id: "premium",
    name: "Premium",
    summary: "The most live websites and Instagram posts.",
    monthly: "$129",
    annual: "$1,290",
    annualPerMonth: "$107.50",
    setupMonthly: null,
    intro: "Everything in Pro, plus:",
    features: ["Up to 10 websites", "The most Instagram posts each month"],
  },
];

const BILLING_OPTIONS: { value: Billing; label: string; note?: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual", note: "2 months free" },
];

const captionClass = "text-[13px] text-slate-500";

export function PricingPlans({ checkout }: { checkout: boolean }) {
  // Anual por padrão: sem taxa de implantação e 2 meses grátis.
  const [billing, setBilling] = useState<Billing>("annual");
  const annual = billing === "annual";

  return (
    <div>
      {/* Radios nativos: setas do teclado, nome acessível e estado vêm de graça. */}
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Billing</legend>
        <div className="mt-3 inline-flex max-w-full flex-wrap rounded-lg border border-slate-300 bg-white p-1">
          {BILLING_OPTIONS.map((option) => (
            <label key={option.value} className="relative cursor-pointer">
              <input
                type="radio"
                name="billing"
                value={option.value}
                checked={billing === option.value}
                onChange={() => setBilling(option.value)}
                className="peer sr-only"
              />
              <span className="flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-600 transition-colors duration-150 peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand hover:text-ink peer-checked:hover:text-white">
                {option.label}
                {option.note && <span className="font-normal tabular-nums">{option.note}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p aria-live="polite" className="sr-only">
        {annual ? "Showing annual prices." : "Showing monthly prices."}
      </p>

      <ul className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {PLANS.map((plan) => (
          <li
            key={plan.id}
            aria-labelledby={`plan-${plan.id}`}
            className={`flex min-w-0 flex-col rounded-xl bg-white p-6 sm:p-8 ${
              plan.recommended ? "ring-2 ring-brand" : "border border-slate-200"
            }`}
          >
            <div className="flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <h3
                id={`plan-${plan.id}`}
                className="font-display text-lg font-semibold tracking-[-0.015em] text-ink lg:text-xl"
              >
                {plan.name}
              </h3>
              {plan.recommended && (
                <span className="inline-flex h-7 items-center rounded-lg bg-white px-2.5 text-[13px] font-semibold text-brand ring-1 ring-brand/30">
                  Recommended
                </span>
              )}
            </div>
            <p className="mt-1 text-base leading-snug text-pretty text-slate-600">{plan.summary}</p>

            <p className="mt-6 flex flex-wrap items-baseline gap-1 font-display text-ink">
              <span className="text-[2.5rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                {annual ? plan.annual : plan.monthly}
              </span>
              <span className="text-base font-normal text-slate-500">{annual ? "/yr" : "/mo"}</span>
            </p>
            <p className={`mt-2 min-h-5 tabular-nums ${captionClass}`}>
              {annual ? `${plan.annualPerMonth}/mo, billed yearly` : "Billed monthly · no contract"}
            </p>

            {/* Linhas do recibo, com a linha pontilhada até o valor. */}
            <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              <ReceiptLine
                label="Setup, one time"
                value={plan.setupMonthly === null ? "None" : annual ? "Waived" : plan.setupMonthly}
              />
              <ReceiptLine label="AI edits" value="Included" />
            </dl>

            <div className="mt-6 flex-1">
              {plan.intro && <p className="text-sm font-semibold text-ink">{plan.intro}</p>}
              <ul className={`grid grid-cols-1 gap-y-3 ${plan.intro ? "mt-3" : ""}`}>
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-base leading-snug text-slate-600">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-slate-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/create"
              aria-describedby={`renewal-${plan.id}`}
              className={`mt-8 w-full ${plan.recommended ? primaryButton : secondaryButton}`}
            >
              Build my website<span className="sr-only">, {plan.name} plan</span>
            </Link>
            {/* Regras de renovação junto do botão (leis de renovação automática dos EUA, como a
                da Califórnia, e a regra "click to cancel" da FTC): valor, frequência, se
                renova sozinho e como cancelar, antes de qualquer cobrança. */}
            <p
              id={`renewal-${plan.id}`}
              className="mt-3 text-[13px] leading-relaxed text-pretty text-slate-500"
            >
              {renewalTerms(plan, annual, checkout)}{" "}
              <Link href="/terms#renewal" className="underline underline-offset-2 hover:text-ink">
                Renewal terms
              </Link>
            </p>
          </li>
        ))}
      </ul>

      {/* Quem já criou o site e volta para comprar vai direto para /billing (pede login). */}
      <p className="mt-8 max-w-[70ch] text-sm leading-relaxed text-pretty text-slate-600">
        Already built your site?{" "}
        <Link href="/billing" className={textLink}>
          Choose your plan
        </Link>
        .
        {!checkout && (
          <>
            {" "}
            When you’re ready to go live, we finish the payment with you by WhatsApp or email, and
            your site goes live as soon as it’s confirmed.
          </>
        )}
      </p>
    </div>
  );
}

/**
 * Texto curto das regras de renovação, mostrado embaixo do botão de cada plano.
 * `checkout` = Stripe ligado (renova sozinho, cancela na conta). Sem ele (padrão seguro), a
 * venda é manual: pago adiantado, sem renovação automática.
 */
export function renewalTerms(
  plan: Pick<Plan, "monthly" | "annual" | "setupMonthly">,
  annual: boolean,
  checkout = false,
): string {
  if (!checkout) {
    const manual =
      "Paid up front for the month or year you choose. It does not renew automatically; you can renew before it ends.";
    if (annual || !plan.setupMonthly) return manual;
    return `${manual} A one-time ${plan.setupMonthly} setup fee is added to the first payment.`;
  }
  if (annual) {
    return `Renews automatically every year at ${plan.annual} until you cancel. Cancel anytime in your account; you keep your plan until the end of the year you paid for.`;
  }
  const setup = plan.setupMonthly
    ? ` A one-time ${plan.setupMonthly} setup fee is added to the first bill.`
    : "";
  return `Renews automatically every month at ${plan.monthly} until you cancel.${setup} Cancel anytime in your account; you keep your plan until the end of the month you paid for.`;
}

/** Linha do recibo. A linha pontilhada é um ::after do <dt> (dentro do <dl> só cabem dt/dd). */
function ReceiptLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 py-3">
      <dt className="flex min-w-0 flex-1 items-baseline gap-3 text-sm text-slate-600 after:min-w-4 after:flex-1 after:border-b-2 after:border-dotted after:border-slate-300 after:content-['']">
        {label}
      </dt>
      <dd className="shrink-0 font-display text-base font-semibold text-ink tabular-nums">
        {value}
      </dd>
    </div>
  );
}
