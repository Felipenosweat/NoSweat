"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BILLING_OPTIONS,
  DISPLAY_PLANS,
  planLimits,
  regularOf,
  renewalTerms,
  type Billing,
} from "@/components/marketing/PricingPlans";
import { focusRing, primaryButton } from "@/components/marketing/styles";

// Preço da landing "Showroom". Mesma venda do <PricingPlans> (/pricing): o botão de cada plano
// leva para /create, as regras de renovação ficam junto do botão (aria-describedby) e quem já
// fez o site vai para /billing. Só muda o desenho: no celular, linhas empilhadas; no computador,
// três colunas com o Starter em destaque (anel ink, o único botão azul). Textos e números vêm de
// PricingPlans.tsx (que lê server/billing/plans.ts).

const STARTER = "starter";

// Link de texto em ink (o azul da marca fica só no botão principal).
const inkLink = `rounded-sm font-semibold text-ink underline underline-offset-4 hover:text-slate-600 ${focusRing}`;

const inkOutlineButton = `inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-ink bg-white px-6 font-semibold text-ink transition-colors duration-150 hover:bg-ink hover:text-white active:translate-y-px motion-reduce:transition-none ${focusRing}`;

export function ShowroomPricing({
  checkout,
  promo = false,
  offerName = "Launch price",
}: {
  checkout: boolean;
  promo?: boolean;
  /** Nome da oferta do momento, de `currentOffer()`. */
  offerName?: string;
}) {
  // Anual por padrão (2 meses grátis), como no <PricingPlans>.
  const [billing, setBilling] = useState<Billing>("annual");
  const annual = billing === "annual";
  const starterRegular = regularOf(STARTER);

  return (
    <div>
      {promo && starterRegular.percentOff > 0 && (
        <p className="max-w-[60ch] text-[17px] leading-snug text-pretty text-ink">
          <strong className="font-semibold">{offerName}:</strong> Starter is{" "}
          {starterRegular.percentOff}% off its regular price of {starterRegular.monthly} a month.
        </p>
      )}

      {/* Radios nativos: setas do teclado, nome acessível e estado vêm de graça. */}
      <fieldset className="mt-8">
        <legend className="sr-only">Billing</legend>
        <div className="inline-flex max-w-full flex-wrap rounded-lg border border-slate-300 bg-white p-1">
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
              <span className="flex min-h-11 items-center gap-2 rounded-lg px-4 text-[15px] font-semibold text-slate-600 transition-colors duration-150 peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand hover:text-ink peer-checked:hover:text-white motion-reduce:transition-none">
                {option.label}
                {option.note && <span className="font-normal">{option.note}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p aria-live="polite" className="sr-only">
        {annual ? "Showing annual prices." : "Showing monthly prices."}
      </p>

      <ul className="mt-8 border-t border-slate-200 lg:mt-10 lg:grid lg:grid-cols-3 lg:gap-6 lg:border-t-0">
        {DISPLAY_PLANS.map((plan) => {
          const starter = plan.id === STARTER;
          const regular = regularOf(plan.id);
          const struck = promo && regular.percentOff > 0;
          return (
            <li
              key={plan.id}
              aria-labelledby={`sr-plan-${plan.id}`}
              className={`flex min-w-0 flex-col border-b border-slate-200 py-8 lg:rounded-xl lg:border-b-0 lg:p-8 ${
                starter ? "lg:ring-2 lg:ring-ink" : "lg:ring-1 lg:ring-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3
                  id={`sr-plan-${plan.id}`}
                  className="font-display text-xl font-semibold tracking-[-0.015em] text-ink"
                >
                  {plan.name}
                </h3>
                {starter && (
                  <span className="text-sm font-semibold text-slate-600">
                    A good place to start
                  </span>
                )}
              </div>

              <p className="mt-4 flex flex-wrap items-baseline gap-x-2 font-display text-ink">
                <span className="text-[2.75rem] leading-none font-bold tracking-[-0.035em] tabular-nums">
                  {annual ? plan.annual : plan.monthly}
                </span>
                <span className="text-base font-normal text-slate-600">
                  {annual ? "/yr" : "/mo"}
                </span>
                {struck && (
                  <span className="text-base font-normal text-slate-600 tabular-nums">
                    <span className="sr-only">Regular price </span>
                    <s>
                      {annual ? regular.annual : regular.monthly}
                      {annual ? "/yr" : "/mo"}
                    </s>
                  </span>
                )}
              </p>
              <p className="mt-2 min-h-5 text-sm text-slate-600 tabular-nums">
                {annual
                  ? `${plan.annualPerMonth}/mo, billed yearly`
                  : "Billed monthly, no contract"}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {planLimits(plan.id).map((limit) => (
                  <li key={limit} className="flex gap-3 text-[15px] leading-snug text-slate-600">
                    <span aria-hidden="true" className="mt-[9px] h-px w-3 shrink-0 bg-slate-400" />
                    {limit}
                  </li>
                ))}
              </ul>

              <Link
                href="/create"
                aria-describedby={`sr-renewal-${plan.id}`}
                className={`mt-8 w-full ${starter ? primaryButton : inkOutlineButton}`}
              >
                Start my website<span className="sr-only">, {plan.name} plan</span>
              </Link>
              {/* Regras de renovação junto do botão (leis de renovação automática e a regra
                  "click to cancel" da FTC), as mesmas do <PricingPlans>. */}
              <p
                id={`sr-renewal-${plan.id}`}
                className="mt-3 text-[13px] leading-relaxed text-pretty text-slate-600"
              >
                {renewalTerms(plan, annual, checkout)}{" "}
                <Link href="/terms#renewal" className="underline underline-offset-2 hover:text-ink">
                  Renewal terms
                </Link>
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 max-w-[70ch] text-[15px] leading-relaxed text-pretty text-slate-600">
        Already built your site?{" "}
        <Link href="/billing" className={inkLink}>
          Choose your plan
        </Link>
        . Full plan details are on the{" "}
        <Link href="/pricing" className={inkLink}>
          pricing page
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
