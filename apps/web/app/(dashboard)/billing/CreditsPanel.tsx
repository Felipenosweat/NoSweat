"use client";

import type { CreditBalance } from "@nosweat/schema";
import { panelClass, panelText, panelTitle, secondaryButton } from "@/components/DashboardUi";
import { Notice } from "@/components/glass";
import { ContactChannels, ContactLink, contactHref, type SalesContact } from "./BillingPlans";

// Saldo de créditos da IA em /billing: cota do mês (zera todo mês) + créditos comprados (não
// vencem), quanto custa cada ação e como comprar mais. Regras e números: server/credits.
// A compra ainda é manual (WhatsApp/e-mail) e o admin lança os créditos.
// TODO(Stripe): checkout avulso (mode "payment") para os pacotes, quando o Stripe estiver ligado.

export type CreditCost = { label: string; credits: number };
export type CreditPack = { credits: number; price: string };

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const number = (value: number) => value.toLocaleString("en-US");

export function CreditsPanel({
  balance,
  costs,
  packs,
  contact,
  planName,
}: {
  balance: CreditBalance;
  costs: CreditCost[];
  packs: CreditPack[];
  contact: SalesContact;
  /** Plano que dá a cota do mês (`null` = sem plano). */
  planName: string | null;
}) {
  const refill = dateFormat.format(new Date(balance.resetsAt));
  const usedShare =
    balance.monthlyAllowance > 0
      ? Math.min(100, Math.round((balance.monthlyUsed / balance.monthlyAllowance) * 100))
      : 100;
  // Pouco saldo: não dá para a ação mais cara da lista.
  const low = !balance.unlimited && balance.total < Math.max(1, ...costs.map((c) => c.credits));
  const askText = "Hi! I'd like to buy more AI credits.";

  return (
    <section id="credits" aria-labelledby="credits-title" className={`${panelClass} mt-8`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="credits-title" className={panelTitle}>
          AI credits
        </h2>
        <p className="font-display text-[1.75rem] leading-tight font-bold tracking-[-0.02em] text-ink tabular-nums">
          {balance.unlimited ? "Unlimited" : number(balance.total)}
          {!balance.unlimited && (
            <span className="ml-1.5 text-base font-medium text-(--glass-fg-muted)">left</span>
          )}
        </p>
      </div>

      {balance.unlimited ? (
        <p className={`mt-1 ${panelText}`}>Admin accounts use AI without limits.</p>
      ) : (
        <>
          {low && (
            <Notice tone="warning" size="sm" className="mt-3">
              {balance.total === 0
                ? "You’re out of AI credits."
                : "You’re running low on AI credits."}{" "}
              Your monthly credits refill on {refill}, or you can buy more below.
            </Notice>
          )}

          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="glass-inset rounded-xl p-4">
              <dt className="text-[13px] font-medium text-(--glass-fg-muted)">
                Monthly credits{planName ? ` (${planName})` : ""}
              </dt>
              <dd className="mt-1 text-[15px] text-ink">
                <span className="font-semibold tabular-nums">{number(balance.monthlyLeft)}</span> of{" "}
                <span className="tabular-nums">{number(balance.monthlyAllowance)}</span> left
              </dd>
              <div
                role="progressbar"
                aria-label="Monthly credits used"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={usedShare}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-900/[0.08]"
              >
                <div className="h-full rounded-full bg-brand" style={{ width: `${usedShare}%` }} />
              </div>
              <p className="mt-2 text-[13px] text-(--glass-fg-muted)">Refills on {refill}.</p>
            </div>
            <div className="glass-inset rounded-xl p-4">
              <dt className="text-[13px] font-medium text-(--glass-fg-muted)">Extra credits</dt>
              <dd className="mt-1 text-[15px] text-ink">
                <span className="font-semibold tabular-nums">{number(balance.topup)}</span>{" "}
                {balance.topup === 1 ? "credit" : "credits"}
              </dd>
              <p className="mt-2 text-[13px] text-(--glass-fg-muted)">
                Never expire. Used after your monthly credits run out.
              </p>
            </div>
          </dl>
        </>
      )}

      <p className={`mt-4 ${panelText}`}>
        Your plan gives you a fresh set of credits every month. Monthly credits that you don&rsquo;t
        use don&rsquo;t carry over. Credits you buy never expire. Editing your website yourself is
        always free.
      </p>

      <h3 className="mt-5 text-[13px] font-semibold text-(--glass-fg-muted)">What uses credits</h3>
      <ul className="mt-2 divide-y divide-(--glass-rim) text-[15px]">
        {costs.map((cost) => (
          <li key={cost.label} className="flex items-center justify-between gap-4 py-2">
            <span className="text-slate-700">{cost.label}</span>
            <span className="shrink-0 font-semibold text-ink tabular-nums">
              {cost.credits} {cost.credits === 1 ? "credit" : "credits"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[13px] text-(--glass-fg-muted)">
        If the AI can&rsquo;t finish a request, the credits go back to you.
      </p>

      {!balance.unlimited && packs.length > 0 && (
        <>
          <h3 className="mt-5 text-[13px] font-semibold text-(--glass-fg-muted)">
            Buy more credits
          </h3>
          <div className="mt-2 flex flex-wrap gap-3">
            {packs.map((pack) => (
              <ContactLink
                key={pack.credits}
                href={contactHref(
                  contact,
                  `Hi! I'd like to buy ${number(pack.credits)} AI credits (${pack.price}).`,
                )}
                className={secondaryButton}
              >
                {number(pack.credits)} credits · {pack.price}
              </ContactLink>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-(--glass-fg-muted)">
            We&rsquo;ll finish with you {contact.whatsapp ? "on WhatsApp" : "by email"}. The credits
            show up here as soon as your payment is confirmed.
          </p>
          <ContactChannels contact={contact} text={askText} />
        </>
      )}
    </section>
  );
}
