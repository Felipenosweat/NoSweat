"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon } from "./icons";
import { primaryButton, secondaryButton } from "./styles";

// Tabela de planos da landing, em formato de recibo (mesmo sistema visual do resto da página).
// Único componente de cliente da seção: só guarda a escolha mensal/anual.
// Preços combinados com o fundador (2026-10-13). Anual = 10× o mensal ("2 months free" é exato).
// Nada de preço riscado, "mais popular" ou desconto inventado.

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
  aiEdits: string;
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
    aiEdits: "30",
    features: [
      "1 website",
      "Free nosweatfd.com/s/ address",
      "Editor with live preview",
      "Contact form with messages in your dashboard",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    summary: "Your own domain and your own photos.",
    monthly: "$69",
    annual: "$690",
    annualPerMonth: "$57.50",
    setupMonthly: "$249",
    aiEdits: "150",
    recommended: true,
    intro: "Everything in Starter, plus:",
    features: ["Connect your own domain", "Photo uploads and a photo gallery"],
  },
  {
    id: "premium",
    name: "Premium",
    summary: "More AI edits and a person checking your site.",
    monthly: "$129",
    annual: "$1,290",
    annualPerMonth: "$107.50",
    setupMonthly: null,
    aiEdits: "500",
    intro: "Everything in Pro, plus:",
    features: ["Priority support", "A human review of your site before launch"],
  },
];

const BILLING_OPTIONS: { value: Billing; label: string; note?: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual", note: "2 months free" },
];

const captionClass = "text-[13px] text-slate-500";

export function PricingPlans() {
  // Anual por padrão: sem taxa de implantação e 2 meses grátis.
  const [billing, setBilling] = useState<Billing>("annual");
  const annual = billing === "annual";

  return (
    <div>
      {/* Radios nativos: setas do teclado, nome acessível e estado vêm de graça. */}
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Billing</legend>
        <div className="mt-3 inline-flex rounded-lg border border-slate-300 bg-white p-1">
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
              <span className="flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold whitespace-nowrap text-slate-600 transition-colors peer-checked:bg-ink peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand hover:text-ink peer-checked:hover:text-white">
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

      {/* Um só painel dividido em três colunas (não três cartões soltos). */}
      <ul className="mt-8 grid divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {PLANS.map((plan) => (
          <li
            key={plan.id}
            className={`flex flex-col p-6 sm:p-8 ${plan.recommended ? "bg-surface" : ""}`}
          >
            <div className="flex min-h-7 flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <h3
                id={`plan-${plan.id}`}
                className="font-display text-lg font-semibold tracking-[-0.01em] text-ink lg:text-xl"
              >
                {plan.name}
              </h3>
              {plan.recommended && (
                <span className="inline-flex h-7 items-center rounded-lg bg-ink px-2.5 text-[13px] font-semibold text-white">
                  Recommended
                </span>
              )}
            </div>
            <p className="mt-1 text-base leading-snug text-pretty text-slate-600">{plan.summary}</p>

            <p className="mt-6 flex items-baseline gap-1 font-display text-ink">
              <span className="text-[2.5rem] leading-none font-bold tracking-[-0.03em] tabular-nums">
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
              <ReceiptLine label="AI edits a month" value={plan.aiEdits} />
            </dl>

            <div className="mt-6 flex-1">
              {plan.intro && <p className="text-sm font-semibold text-ink">{plan.intro}</p>}
              <ul className={`grid gap-y-3 ${plan.intro ? "mt-3" : ""}`}>
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
              className={`mt-8 w-full ${plan.recommended ? primaryButton : secondaryButton}`}
            >
              Build my website<span className="sr-only">, {plan.name} plan</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
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
