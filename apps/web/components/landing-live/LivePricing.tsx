"use client";

import type { PlanId } from "@nosweat/schema";
import Link from "next/link";
import { useId, useState } from "react";
// Só o texto das regras de renovação (função pura); o componente de cartões não é usado aqui.
import { renewalTerms } from "@/components/marketing/PricingPlans";
import { FREE_MONTHS, PLAN_ORDER, limitRows, planColumns, type PlanColumn } from "./content";
import { focusOnDark, onBlueButton } from "./styles";

// Preço (bloco ink): UMA tabela de verdade, planos nas colunas e limites nas linhas. Todo valor
// vem de content.ts (que lê plans.ts e credits/pricing.ts). No celular a tabela vira um seletor
// de plano (3 botões) com a coluna escolhida; nada de 3 colunas em 390px.
// Anual por padrão, como no PricingPlans. Os botões vão para /create, como lá.

type Billing = "monthly" | "annual";

const COLUMNS = planColumns();
const ROWS = limitRows();

export function LivePricing({
  checkout,
  promo,
  offerName,
}: {
  checkout: boolean;
  promo: boolean;
  offerName: string;
}) {
  const [billing, setBilling] = useState<Billing>("annual");
  const [plan, setPlan] = useState<PlanId>(PLAN_ORDER[0]);
  const annual = billing === "annual";
  const uid = useId();
  const chosen = COLUMNS.find((column) => column.id === plan) ?? COLUMNS[0];

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-4 bg-ink text-white">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12 lg:items-end">
          <h2
            id="pricing-title"
            className="live-d max-w-[14ch] text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.92] font-extrabold tracking-[-0.04em] text-balance lg:col-span-8"
          >
            Free to describe. Pay when you build.
          </h2>
          <div className="lg:col-span-4 lg:justify-self-end lg:pb-3">
            <BillingToggle billing={billing} onChange={setBilling} />
          </div>
        </div>
        <p aria-live="polite" className="sr-only">
          {annual ? "Showing yearly prices." : "Showing monthly prices."}
        </p>

        {/* Computador: a tabela inteira. */}
        <div className="mt-20 hidden lg:block">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">
              No Sweat plans compared, {annual ? "yearly" : "monthly"} prices
            </caption>
            <colgroup>
              <col className="w-[28%]" />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-white/20">
                <td />
                {COLUMNS.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    className="live-d px-4 pb-5 text-[22px] font-medium tracking-[-0.01em] lg:px-6"
                  >
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/20 align-top">
                <th scope="row" className="py-6 pr-4 text-base font-medium text-slate-300">
                  Price
                </th>
                {COLUMNS.map((column) => (
                  <td key={column.id} className="px-4 py-6 lg:px-6">
                    <Price column={column} annual={annual} promo={promo} offerName={offerName} />
                  </td>
                ))}
              </tr>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-white/20 align-top">
                  <th scope="row" className="py-5 pr-4 text-left font-normal">
                    <span className="block text-[17px] font-semibold text-white">{row.label}</span>
                    {row.note && (
                      <span className="mt-1 block max-w-[30ch] text-sm leading-snug text-slate-300">
                        {row.note}
                      </span>
                    )}
                  </th>
                  {COLUMNS.map((column) => (
                    <td
                      key={column.id}
                      className="live-d px-4 py-5 text-[26px] leading-none font-medium tabular-nums lg:px-6"
                    >
                      {row.values[column.id]}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="align-top">
                <td />
                {COLUMNS.map((column) => (
                  <td key={column.id} className="px-4 pt-8 lg:px-6">
                    <PlanCta column={column} annual={annual} checkout={checkout} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Celular e tablet: escolhe o plano e vê a coluna dele. */}
        <div className="mt-12 max-w-[560px] lg:hidden">
          <div
            role="radiogroup"
            aria-label="Plan"
            className="grid grid-cols-3 gap-1 rounded-full bg-white/10 p-1"
          >
            {COLUMNS.map((column) => (
              <label key={column.id} className="relative cursor-pointer">
                <input
                  type="radio"
                  name={`${uid}-plan`}
                  value={column.id}
                  checked={plan === column.id}
                  onChange={() => setPlan(column.id)}
                  className="peer sr-only"
                />
                <span className="flex min-h-11 items-center justify-center rounded-full text-[15px] font-semibold text-white transition-colors duration-150 peer-checked:bg-white peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white">
                  {column.name}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-8 border-b border-white/20 pb-6">
            <Price column={chosen} annual={annual} promo={promo} offerName={offerName} large />
          </div>
          <dl>
            {ROWS.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-6 border-b border-white/20 py-4"
              >
                <dt>
                  <span className="block text-base font-semibold">{row.label}</span>
                  {row.note && (
                    <span className="mt-1 block text-sm leading-snug text-slate-300">
                      {row.note}
                    </span>
                  )}
                </dt>
                <dd className="live-d shrink-0 text-[22px] leading-tight font-medium tabular-nums">
                  {row.values[chosen.id]}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-8">
            <PlanCta column={chosen} annual={annual} checkout={checkout} />
          </div>
        </div>

        {/* Quem já criou o site e volta para comprar vai direto para /billing (pede login). */}
        <p className="mt-12 max-w-[70ch] text-[15px] leading-relaxed text-pretty text-slate-300">
          Already built your site?{" "}
          <Link
            href="/billing"
            className={`rounded-sm font-semibold text-white underline underline-offset-4 ${focusOnDark}`}
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
    </section>
  );
}

function BillingToggle({
  billing,
  onChange,
}: {
  billing: Billing;
  onChange: (value: Billing) => void;
}) {
  const uid = useId();
  const options: { value: Billing; label: string; note?: string }[] = [
    { value: "monthly", label: "Monthly" },
    { value: "annual", label: "Yearly", note: `${FREE_MONTHS} months free` },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Billing"
      className="inline-flex rounded-full border border-white/30 p-1"
    >
      {options.map((option) => (
        <label key={option.value} className="relative cursor-pointer">
          <input
            type="radio"
            name={`${uid}-billing`}
            value={option.value}
            checked={billing === option.value}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <span className="flex min-h-11 items-center gap-2 rounded-full px-5 text-[15px] font-semibold whitespace-nowrap text-white transition-colors duration-150 peer-checked:bg-white peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white">
            {option.label}
            {option.note && <span className="font-normal">{option.note}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

function Price({
  column,
  annual,
  promo,
  offerName,
  large = false,
}: {
  column: PlanColumn;
  annual: boolean;
  promo: boolean;
  offerName: string;
  /** Celular: uma coluna só, então o preço pode crescer. */
  large?: boolean;
}) {
  const regular = annual ? column.regularAnnual : column.regularMonthly;
  return (
    <div>
      {/* Preço normal riscado só na oferta e só onde há desconto de verdade (hoje, o Starter). */}
      <p className="min-h-6 text-[15px] text-slate-300 tabular-nums">
        {promo && regular && (
          <>
            <span className="font-semibold text-white">{offerName}.</span>{" "}
            <span className="sr-only">Regular price </span>
            <s>
              {regular}
              {annual ? "/yr" : "/mo"}
            </s>
          </>
        )}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span
          className={`live-d ${large ? "text-[4rem]" : "text-[clamp(2.25rem,4.6vw,4.75rem)]"} leading-none font-extrabold tracking-[-0.04em] tabular-nums`}
        >
          {annual ? column.annual : column.monthly}
        </span>
        <span className="text-[17px] text-slate-300">{annual ? "/yr" : "/mo"}</span>
      </p>
      <p className="mt-3 text-[15px] text-slate-300 tabular-nums">
        {annual ? `${column.annualPerMonth}/mo, billed yearly` : "Billed monthly. No contract."}
      </p>
    </div>
  );
}

function PlanCta({
  column,
  annual,
  checkout,
}: {
  column: PlanColumn;
  annual: boolean;
  checkout: boolean;
}) {
  const id = `${useId()}-renewal`;
  return (
    <div>
      <Link href="/create" aria-describedby={id} className={`w-full ${onBlueButton}`}>
        Build my website<span className="sr-only">, {column.name} plan</span>
      </Link>
      {/* Regras de renovação junto do botão (leis de renovação automática dos EUA e a regra
          "click to cancel" da FTC), o mesmo texto do PricingPlans. */}
      <p id={id} className="mt-3 text-[13px] leading-relaxed text-pretty text-slate-300">
        {renewalTerms(column, annual, checkout)}{" "}
        <Link
          href="/terms#renewal"
          className={`rounded-sm text-white underline underline-offset-2 ${focusOnDark}`}
        >
          Renewal terms
        </Link>
      </p>
    </div>
  );
}
