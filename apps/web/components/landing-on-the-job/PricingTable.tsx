"use client";

import Link from "next/link";
import { useState } from "react";
import { renewalTerms } from "@/components/marketing/PricingPlans";
import type { PlanCard } from "./content";

// Tabela de preços da landing "On the job" (componente de cliente só por causa da escolha
// mensal/anual). Os dados chegam prontos do server component (Pricing.tsx → content.ts →
// server/billing/plans.ts e server/credits/pricing.ts). Os botões, as regras de renovação e o
// aviso da venda manual são os mesmos de PricingPlans (renewalTerms, /create, /terms#renewal,
// /billing). Começa no anual, como PricingPlans.

type Billing = "monthly" | "annual";

const ringDark = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function PricingTable({
  plans,
  checkout,
  offerName,
  yearlyNote,
}: {
  plans: PlanCard[];
  checkout: boolean;
  offerName: string;
  yearlyNote: string | null;
}) {
  const [billing, setBilling] = useState<Billing>("annual");
  const annual = billing === "annual";
  const options: { value: Billing; label: string; note: string | null }[] = [
    { value: "monthly", label: "Monthly", note: null },
    { value: "annual", label: "Yearly", note: yearlyNote },
  ];

  return (
    <div>
      {/* Radios nativos dentro do radiogroup: setas do teclado e estado vêm de graça. */}
      <div
        role="radiogroup"
        aria-label="Billing"
        className="inline-flex max-w-full flex-wrap rounded-full border border-slate-300 bg-white p-1"
      >
        {options.map((option) => (
          <label key={option.value} className="relative cursor-pointer">
            <input
              type="radio"
              name="otj-billing"
              value={option.value}
              checked={billing === option.value}
              onChange={() => setBilling(option.value)}
              className="peer sr-only"
            />
            <span className="flex min-h-11 items-center gap-2 rounded-full px-5 text-[15px] font-semibold text-slate-600 transition-colors duration-150 peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink hover:text-ink peer-checked:hover:text-white motion-reduce:transition-none">
              {option.label}
              {option.note && <span className="font-normal">{option.note}</span>}
            </span>
          </label>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">
        {annual ? "Showing yearly prices." : "Showing monthly prices."}
      </p>

      <ul className="mt-10 grid grid-cols-1 border-y border-slate-200 lg:grid-cols-3">
        {plans.map((plan, index) => {
          const starter = plan.note !== null;
          // Linha de 1px entre colunas; ao lado do Starter (contorno ink de 2px) não precisa.
          const afterStarter = index > 0 && (plans[index - 1]?.note ?? null) !== null;
          return (
            <li
              key={plan.id}
              aria-labelledby={`otj-plan-${plan.id}`}
              className={`relative flex min-w-0 flex-col px-5 py-8 sm:px-8 lg:py-10 ${
                starter
                  ? "z-10 -my-px rounded-xl outline-2 -outline-offset-2 outline-ink"
                  : afterStarter || index === 0
                    ? ""
                    : "border-t border-slate-200 lg:border-t-0 lg:border-l"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3
                  id={`otj-plan-${plan.id}`}
                  className="otj-display text-[1.5rem] font-semibold text-ink"
                >
                  {plan.name}
                </h3>
                {plan.note && <p className="text-[14px] font-medium text-slate-600">{plan.note}</p>}
              </div>

              {plan.regular && (
                <p className="mt-5 text-[14px] text-slate-600 tabular-nums">
                  <span className="font-semibold text-ink">{offerName}</span> · Regular{" "}
                  <s>
                    {annual ? plan.regular.annual : plan.regular.monthly}
                    {annual ? "/yr" : "/mo"}
                  </s>
                </p>
              )}
              <p
                className={`otj-display flex flex-wrap items-baseline gap-1 text-ink ${plan.regular ? "mt-2" : "mt-5"}`}
              >
                <span className="text-[3rem] leading-none font-bold tabular-nums">
                  {annual ? plan.annual : plan.monthly}
                </span>
                <span className="text-[17px] font-normal text-slate-600">
                  {annual ? "/yr" : "/mo"}
                </span>
              </p>
              <p className="mt-2 min-h-5 text-[14px] text-slate-600 tabular-nums">
                {annual
                  ? `${plan.annualPerMonth}/mo, billed yearly`
                  : "Billed monthly, no contract"}
              </p>

              <ul className="mt-7 flex-1 space-y-3">
                {plan.limits.map((limit) => (
                  <li key={limit} className="flex gap-3 text-[16px] leading-snug text-ink">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 size-4 shrink-0 text-slate-500"
                    >
                      <path d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span className="tabular-nums">{limit}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/create"
                aria-describedby={`otj-renewal-${plan.id}`}
                className={`mt-8 inline-flex h-12 w-full items-center justify-center rounded-full px-6 text-[16px] font-semibold transition-colors duration-150 active:translate-y-px ${ringDark} ${
                  starter
                    ? "bg-brand text-white hover:bg-brand-dark"
                    : "border border-ink text-ink hover:bg-ink hover:text-white"
                }`}
              >
                Build my website<span className="sr-only">, {plan.name} plan</span>
              </Link>
              {/* Regras de renovação junto do botão (mesmo texto de PricingPlans). */}
              <p
                id={`otj-renewal-${plan.id}`}
                className="mt-3 text-[13px] leading-relaxed text-pretty text-slate-600"
              >
                {renewalTerms(plan, annual, checkout)}{" "}
                <Link
                  href="/terms#renewal"
                  className={`rounded-sm underline underline-offset-2 hover:text-ink ${ringDark}`}
                >
                  Renewal terms
                </Link>
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 max-w-[68ch] text-[15px] leading-relaxed text-pretty text-slate-600">
        Already built your site?{" "}
        <Link
          href="/billing"
          className={`rounded-sm font-semibold text-ink underline underline-offset-4 ${ringDark}`}
        >
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
