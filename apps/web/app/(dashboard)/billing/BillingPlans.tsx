"use client";

import {
  ApiError,
  RedirectResponse,
  type BillingInterval,
  type BillingStatusResponse,
  type PlanId,
} from "@nosweat/schema";
import { useState } from "react";
import {
  focusRing,
  panelClass,
  panelText,
  panelTitle,
  primaryButton,
  secondaryButton,
} from "@/components/DashboardUi";

export type PlanCard = {
  id: PlanId;
  name: string;
  monthly: string;
  annual: string;
  setup: string | null;
  customDomain: boolean;
};

/** Como falar com a No Sweat para pagar à mão (Pix/WhatsApp) quando não há checkout. */
export type SalesContact = { whatsapp: string | null; email: string; accountEmail: string | null };

/** Link do WhatsApp (ou e-mail) com a mensagem já escrita: plano, período e a conta. */
function contactHref(contact: SalesContact, text: string): string {
  const message = contact.accountEmail ? `${text} My account: ${contact.accountEmail}` : text;
  return contact.whatsapp
    ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`
    : `mailto:${contact.email}?subject=${encodeURIComponent("No Sweat plan")}&body=${encodeURIComponent(message)}`;
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

/**
 * Planos com mensal/anual e botão de assinar (Stripe Checkout), ou "Manage billing".
 * Sem Stripe, os botões abrem o WhatsApp/e-mail da No Sweat e o admin libera o acesso à mão.
 */
export function BillingPlans({
  plans,
  current,
  siteId,
  contact,
}: {
  plans: PlanCard[];
  current: BillingStatusResponse;
  siteId: string | null;
  contact: SalesContact;
}) {
  const checkout = current.checkoutEnabled !== false;
  const [interval, setBillingInterval] = useState<BillingInterval>(current.interval ?? "annual");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(path: string, body?: unknown, key = path) {
    setPending(key);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const apiError = ApiError.safeParse(json);
        setError(apiError.success ? apiError.data.error.message : "Something went wrong.");
        setPending(null);
        return;
      }
      window.location.assign(RedirectResponse.parse(json).url);
    } catch {
      setError("We couldn't reach our servers. Please try again.");
      setPending(null);
    }
  }

  if (current.active && current.plan && current.source === "manual") {
    const plan = plans.find((p) => p.id === current.plan);
    return (
      <section className={`${panelClass} mt-8`}>
        <h2 className={panelTitle}>Your plan: {plan?.name ?? current.plan}</h2>
        <p className={`mt-1 ${panelText}`}>
          {current.currentPeriodEnd
            ? `Active until ${dateFormat.format(new Date(current.currentPeriodEnd))}.`
            : "Your plan is active."}
        </p>
        <a
          href={contactHref(contact, `Hi! I'd like to renew my ${plan?.name ?? ""} plan.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${secondaryButton} mt-4`}
        >
          {contact.whatsapp ? "Renew on WhatsApp" : "Renew by email"}
        </a>
      </section>
    );
  }

  // Plano do Stripe ativo: mostra o plano e o portal, e logo abaixo os planos para trocar.
  const stripeActive = current.active && current.plan !== null;
  const currentPlan = stripeActive ? plans.find((p) => p.id === current.plan) : undefined;
  const isCurrent = (planId: PlanId) =>
    stripeActive && current.plan === planId && current.interval === interval;

  return (
    <div className="mt-8">
      {stripeActive && (
        <section className={`${panelClass} mb-8`}>
          <h2 className={panelTitle}>
            Your plan: {currentPlan?.name ?? current.plan}
            {current.interval ? ` (${current.interval})` : ""}
          </h2>
          <p className={`mt-1 ${panelText}`}>
            {current.currentPeriodEnd
              ? `${current.cancelAtPeriodEnd ? "Ends" : "Renews"} on ${dateFormat.format(new Date(current.currentPeriodEnd))}.`
              : "Your plan is active."}
            {current.status === "past_due" && " Your last payment failed. Please update your card."}
          </p>
          <button
            type="button"
            onClick={() => void go("/api/billing/portal")}
            disabled={pending !== null}
            className={`${secondaryButton} mt-4`}
          >
            {pending === "/api/billing/portal" ? "Opening…" : "Manage billing"}
          </button>
          <p className="mt-4 text-[13px] text-slate-500">
            To change plans, pick a new one below. It starts today, with no setup fee, and the
            unused time on your current plan is credited to your account.
          </p>
        </section>
      )}
      <div
        role="group"
        aria-label="Billing period"
        className="inline-flex rounded-xl bg-slate-200/60 p-1"
      >
        {(["monthly", "annual"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={interval === value}
            onClick={() => setBillingInterval(value)}
            className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition-colors duration-150 sm:min-h-10 ${focusRing} ${
              interval === value
                ? "bg-white text-ink shadow-[0_1px_2px_rgb(7_27_51/0.08),0_1px_1px_rgb(7_27_51/0.04)]"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            {value === "monthly" ? "Monthly" : "Annual · 2 months free"}
          </button>
        ))}
      </div>

      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <li key={plan.id} className={`${panelClass} flex flex-col`}>
            <h2 className={panelTitle}>{plan.name}</h2>
            <p className="mt-3 font-display text-[2rem] leading-tight font-bold tracking-[-0.02em] text-ink tabular-nums">
              {interval === "annual" ? plan.annual : plan.monthly}
              <span className="text-base font-medium text-slate-500">
                {interval === "annual" ? "/yr" : "/mo"}
              </span>
            </p>
            <p className={`mt-1 text-sm ${panelText}`}>
              {interval === "monthly" && plan.setup && !stripeActive
                ? `+ ${plan.setup} one-time setup`
                : "No setup fee"}
            </p>
            <p className={`mt-3 text-sm ${panelText}`}>
              {plan.customDomain ? "Your own domain included." : "Free nosweatfd.com address."}
            </p>
            <div className="mt-auto pt-5">
              {isCurrent(plan.id) ? (
                <p
                  className={`${secondaryButton} w-full cursor-default hover:bg-white`}
                  aria-current="true"
                >
                  Current plan
                </p>
              ) : checkout ? (
                <button
                  type="button"
                  onClick={() =>
                    void go(
                      "/api/billing/checkout",
                      { plan: plan.id, interval, siteId: siteId ?? undefined },
                      plan.id,
                    )
                  }
                  disabled={pending !== null}
                  className={`${primaryButton} w-full`}
                >
                  {pending === plan.id
                    ? "Opening checkout…"
                    : `${stripeActive ? "Switch to" : "Choose"} ${plan.name}`}
                </button>
              ) : (
                <a
                  href={contactHref(
                    contact,
                    `Hi! I'd like the ${plan.name} plan (${interval}) for my website.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${primaryButton} w-full`}
                >
                  {`Choose ${plan.name}`}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <p className="mt-6 text-[13px] text-slate-500">
        {checkout
          ? "Payments are handled by Stripe. You can change plans or cancel anytime from this page."
          : `Pick a plan and we'll finish with you ${contact.whatsapp ? "on WhatsApp" : "by email"}. Your website goes live as soon as your payment is confirmed.`}
      </p>
    </div>
  );
}
