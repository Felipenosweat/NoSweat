"use client";

import type { PlanId } from "@nosweat/schema";
import Link from "next/link";
import { useState } from "react";
import { createHrefForPlan } from "@/lib/chosen-plan";
import { GUARANTEE_LINE } from "./legal/policy";
import { CheckIcon } from "./icons";
import type { PlanPrice, PricingCredits } from "./pricing-data";
import { primaryButton, secondaryButton, textLink } from "./styles";

// Tabela de planos da landing: três cartões rounded-xl com linhas de recibo; o recomendado tem
// o anel azul (ring-2 ring-brand), o único destaque de cor da seção.
// Único componente de cliente da seção: só guarda a escolha mensal/anual.
// Preços combinados com o fundador (2026-10-13). Anual = 10× o mensal ("2 months free" é exato).
// Nada de preço riscado, "mais popular" ou desconto inventado.
// Os NÚMEROS vêm por props das fontes únicas (components/marketing/pricing-data.ts lê
// server/billing/plans.ts e server/credits/pricing.ts): preço, sites no ar, créditos da IA por
// mês, custo de cada ação e pacotes avulsos. Aqui ficam só os textos de cada plano.
// "Up to N websites" = sites publicados ao mesmo tempo (`publishedSitesLimit`).
// A IA gasta créditos (auditoria J9): nada de "AI edits: Included".
// `checkout`: o Stripe Checkout está ligado (`checkoutReady()` de server/billing, lido pela
// página, que é server component). Sem ele a venda é manual (WhatsApp/e-mail + acesso liberado
// pelo admin por X dias): pago adiantado e SEM renovação automática, então o texto muda.
// Nenhum dos dois modos promete e-mail de lembrete: hoje nenhum código manda esse e-mail.
// Cada botão leva o plano para o /create (?plan=), e o /billing destaca o mesmo plano depois.

type Billing = "monthly" | "annual";

type Plan = {
  id: PlanId;
  name: string;
  summary: string;
  recommended?: boolean;
  intro?: string;
  /** Recursos além de "Up to N websites" (que vem de plans.ts). */
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    summary: "A complete site on your own domain.",
    features: [
      "Connect your own domain, or use a free nosweatfd.com/s/ address",
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
    summary: "More live websites and Instagram posts.",
    recommended: true,
    intro: "Everything in Starter, plus:",
    features: ["More Instagram posts each month"],
  },
  {
    id: "premium",
    name: "Premium",
    summary: "The most live websites and Instagram posts.",
    intro: "Everything in Pro, plus:",
    features: ["The most Instagram posts each month"],
  },
];

const BILLING_OPTIONS: { value: Billing; label: string; note?: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual", note: "2 months free" },
];

const captionClass = "text-[13px] text-(--glass-fg-muted)";

const count = (n: number) => n.toLocaleString("en-US");

export function PricingPlans({
  checkout,
  prices,
  credits,
}: {
  checkout: boolean;
  /** Preços de server/billing/plans.ts (ver pricing-data.ts). */
  prices: Record<PlanId, PlanPrice>;
  /** Créditos da IA de server/credits/pricing.ts (ver pricing-data.ts). */
  credits: PricingCredits;
}) {
  // Anual por padrão: 2 meses grátis.
  const [billing, setBilling] = useState<Billing>("annual");
  const annual = billing === "annual";
  // "100 for $5 or 300 for $12" (pacotes avulsos de server/credits/pricing.ts).
  const packs = credits.packs
    .map((pack) => `${count(pack.credits)} for ${pack.price}`)
    .join(" or ");

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
        {PLANS.map((plan) => {
          const price = prices[plan.id];
          const features = [`Up to ${price.publishedSitesLimit} websites`, ...plan.features];
          return (
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
              <p className="mt-1 text-base leading-snug text-pretty text-slate-600">
                {plan.summary}
              </p>

              <p className="mt-6 flex flex-wrap items-baseline gap-1 font-display text-ink">
                <span className="text-[2.5rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                  {annual ? price.annual : price.monthly}
                </span>
                <span className="text-base font-normal text-(--glass-fg-muted)">
                  {annual ? "/yr" : "/mo"}
                </span>
              </p>
              <p className={`mt-2 min-h-5 tabular-nums ${captionClass}`}>
                {annual
                  ? `${price.annualPerMonth}/mo, billed yearly`
                  : "Billed monthly · no contract"}
              </p>

              {/* Linhas do recibo, com a linha pontilhada até o valor. */}
              <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                <ReceiptLine
                  label="Setup, one time"
                  value={
                    price.setupMonthly === null ? "None" : annual ? "Waived" : price.setupMonthly
                  }
                />
                <ReceiptLine
                  label="AI credits each month"
                  value={count(credits.monthly[plan.id])}
                />
              </dl>

              <div className="mt-6 flex-1">
                {plan.intro && <p className="text-sm font-semibold text-ink">{plan.intro}</p>}
                <ul className={`grid grid-cols-1 gap-y-3 ${plan.intro ? "mt-3" : ""}`}>
                  {features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-base leading-snug text-slate-600">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-slate-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={createHrefForPlan(plan.id)}
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
                className="mt-3 text-[13px] leading-relaxed text-pretty text-(--glass-fg-muted)"
              >
                {renewalTerms(price, annual, checkout)}{" "}
                <Link href="/terms#renewal" className="underline underline-offset-2 hover:text-ink">
                  Renewal terms
                </Link>
              </p>
            </li>
          );
        })}
      </ul>

      {/* Créditos da IA: o que cada ação custa (de server/credits/pricing.ts), em uma faixa
          clara embaixo dos cartões. Editar à mão é grátis; a cota do mês não acumula. */}
      <section
        aria-labelledby="ai-credits-title"
        className="mt-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <div className="grid gap-x-8 gap-y-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h3
              id="ai-credits-title"
              className="font-display text-lg font-semibold tracking-[-0.015em] text-ink"
            >
              How AI credits work
            </h3>
            <p className="mt-2 text-base leading-relaxed text-pretty text-slate-600">
              Each plan comes with AI credits every month. Editing your website by hand is always
              free. Unused monthly credits don’t roll over.
              {packs && ` Need more? Buy extra credits anytime (${packs}); they never expire.`}
            </p>
          </div>
          <dl className="divide-y divide-slate-200 border-y border-slate-200 lg:col-span-7">
            {credits.costs.map((cost) => (
              <ReceiptLine
                key={cost.label}
                label={cost.label}
                value={`${cost.credits} ${cost.credits === 1 ? "credit" : "credits"}`}
              />
            ))}
          </dl>
        </div>
      </section>

      {/* Garantia de devolução (decisão do fundador): uma linha, com o link da política. */}
      <p className="mt-8 max-w-[70ch] text-sm leading-relaxed text-pretty text-slate-600">
        <strong className="font-semibold text-ink">{GUARANTEE_LINE}</strong>{" "}
        <Link href="/refund" className={textLink}>
          Refund policy
        </Link>
      </p>

      {/* Quem já criou o site e volta para comprar vai direto para /billing (pede login). */}
      <p className="mt-3 max-w-[70ch] text-sm leading-relaxed text-pretty text-slate-600">
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
  plan: Pick<PlanPrice, "monthly" | "annual" | "setupMonthly">,
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
