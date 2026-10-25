"use client";

import {
  ApiError,
  RedirectResponse,
  type BillingInterval,
  type BillingStatusResponse,
  type PlanId,
} from "@nosweat/schema";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  focusRing,
  panelClass,
  panelText,
  panelTitle,
  primaryButton,
  secondaryButton,
} from "@/components/DashboardUi";
import { CheckIcon } from "@/components/marketing/icons";

export type PlanCard = {
  id: PlanId;
  name: string;
  monthly: string;
  annual: string;
  setup: string | null;
  customDomain: boolean;
  /** Sites no ar ao mesmo tempo (`publishedSitesLimit` em server/billing/plans.ts). */
  publishedSitesLimit: number;
  /** Créditos da IA por mês (server/credits/pricing.ts). */
  monthlyCredits: number;
};

/** Como falar com a No Sweat para pagar à mão (Pix/WhatsApp) quando não há checkout. */
export type SalesContact = {
  whatsapp: string | null;
  email: string;
  accountEmail: string | null;
  /** Id da conta: o admin acha a conta certa no /admin mesmo se o e-mail vier diferente. */
  accountId: string | null;
};

/** Plano manual que já acabou (a página mostra o aviso e o link para renovar). */
export type EndedPlan = { name: string; endedOn: string };

/** Mensagem pronta: o pedido, o e-mail da conta e o id da conta. */
function salesMessage(contact: SalesContact, text: string): string {
  return [
    text,
    contact.accountEmail ? `My account: ${contact.accountEmail}` : null,
    contact.accountId ? `Account ID: ${contact.accountId}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function whatsappHref(whatsapp: string, contact: SalesContact, text: string): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(salesMessage(contact, text))}`;
}

function emailHref(contact: SalesContact, text: string): string {
  return `mailto:${contact.email}?subject=${encodeURIComponent("No Sweat plan")}&body=${encodeURIComponent(salesMessage(contact, text))}`;
}

/** Link do WhatsApp (se houver número) ou do e-mail, com a mensagem já escrita. */
export function contactHref(contact: SalesContact, text: string): string {
  return contact.whatsapp
    ? whatsappHref(contact.whatsapp, contact, text)
    : emailHref(contact, text);
}

/**
 * Link de contato: o WhatsApp abre em outra aba; o e-mail (mailto:) não, porque sem programa de
 * e-mail no computador a aba nova fica em branco.
 */
export function ContactLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  return href.startsWith("mailto:") ? (
    <a href={href} className={className}>
      {children}
    </a>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

const inlineLink = `rounded-sm font-semibold text-brand underline-offset-4 hover:underline ${focusRing}`;

/**
 * Os canais sempre à mostra, em texto: quem não tem WhatsApp (comum nos EUA) ainda vê o e-mail,
 * e quem não tem programa de e-mail pode copiar o endereço.
 */
export function ContactChannels({ contact, text }: { contact: SalesContact; text: string }) {
  return (
    <p className="mt-3 text-[13px] text-slate-500">
      {contact.whatsapp && (
        <>
          WhatsApp{" "}
          <a
            href={whatsappHref(contact.whatsapp, contact, text)}
            target="_blank"
            rel="noopener noreferrer"
            className={inlineLink}
          >
            +{contact.whatsapp}
          </a>
          {" · "}
        </>
      )}
      {contact.whatsapp ? "Prefer email? " : "Email: "}
      <a href={emailHref(contact, text)} className={`${inlineLink} break-all`}>
        {contact.email}
      </a>
    </p>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

/**
 * Planos com mensal/anual e botão de assinar (Stripe Checkout), ou "Manage billing".
 * Sem Stripe, os botões abrem o WhatsApp/e-mail da No Sweat e o admin libera o acesso à mão.
 * Quem tem plano manual também vê a grade, para trocar de plano (sempre pelo contato, nunca pelo
 * Stripe, para não pagar duas vezes).
 */
export function BillingPlans({
  plans,
  current,
  siteId,
  contact,
  ended = null,
}: {
  plans: PlanCard[];
  current: BillingStatusResponse;
  siteId: string | null;
  contact: SalesContact;
  ended?: EndedPlan | null;
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

  const hasPlan = current.active && current.plan !== null;
  // Plano liberado à mão (Pix/WhatsApp): não tem período (interval = null) nem portal do Stripe.
  const manualActive = hasPlan && current.source === "manual";
  const stripeActive = hasPlan && !manualActive;
  const currentPlan = hasPlan ? plans.find((p) => p.id === current.plan) : undefined;
  const currentName = currentPlan?.name ?? current.plan ?? "";
  const isCurrent = (planId: PlanId) =>
    hasPlan && current.plan === planId && (manualActive || current.interval === interval);
  const renewText = `Hi! I'd like to renew my ${currentName} plan.`;
  const publishHref = siteId ? `/sites/${siteId}#publish` : "/dashboard#sites";

  return (
    <div className="mt-8">
      {ended && !current.active && (
        <section
          role="status"
          className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-950"
        >
          <p>
            Your {ended.name} plan ended on {dateFormat.format(new Date(ended.endedOn))}, so your
            website is offline. Renew to bring it back.
          </p>
          <ContactLink
            href={contactHref(contact, `Hi! I'd like to renew my ${ended.name} plan.`)}
            className={`${inlineLink} mt-1 inline-flex min-h-11 items-center sm:min-h-10`}
          >
            {contact.whatsapp ? "Renew on WhatsApp" : "Renew by email"}
          </ContactLink>
        </section>
      )}

      {manualActive && (
        <section className={`${panelClass} mb-8`}>
          <h2 className={panelTitle}>Your plan: {currentName}</h2>
          <p className={`mt-1 ${panelText}`}>
            {current.currentPeriodEnd
              ? `Active until ${dateFormat.format(new Date(current.currentPeriodEnd))}.`
              : "Your plan is active."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={publishHref} className={primaryButton}>
              Publish your website <span aria-hidden="true">→</span>
            </Link>
            <ContactLink href={contactHref(contact, renewText)} className={secondaryButton}>
              {contact.whatsapp ? "Renew on WhatsApp" : "Renew by email"}
            </ContactLink>
          </div>
          <ContactChannels contact={contact} text={renewText} />
          <p className="mt-4 text-[13px] text-slate-500">
            To switch plans, pick one below and send us the message. We&rsquo;ll set it up for you.
          </p>
        </section>
      )}

      {stripeActive && (
        <section className={`${panelClass} mb-8`}>
          <h2 className={panelTitle}>
            Your plan: {currentName}
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
        {plans.map((plan) => {
          const recommended = plan.id === "pro";
          return (
            <li
              key={plan.id}
              aria-labelledby={`billing-plan-${plan.id}`}
              className={`${panelClass} flex flex-col ${recommended ? "ring-2 ring-brand" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id={`billing-plan-${plan.id}`} className={panelTitle}>
                  {plan.name}
                </h2>
                {recommended && (
                  <span className="inline-flex h-7 items-center rounded-lg bg-white px-2.5 text-[13px] font-semibold text-brand ring-1 ring-brand/30">
                    Recommended
                  </span>
                )}
              </div>
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
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li className="flex gap-2">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                  Up to {plan.publishedSitesLimit} live websites
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                  {plan.customDomain ? "Your own domain" : "Free nosweatfd.com address"}
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                  {plan.monthlyCredits.toLocaleString("en-US")} AI credits every month
                </li>
              </ul>
              <div className="mt-auto pt-5">
                {isCurrent(plan.id) ? (
                  <p
                    className={`${secondaryButton} w-full cursor-default hover:bg-white`}
                    aria-current="true"
                  >
                    Current plan
                  </p>
                ) : manualActive ? (
                  <ContactLink
                    href={contactHref(
                      contact,
                      `Hi! I'd like to switch from ${currentName} to ${plan.name} (${interval}).`,
                    )}
                    className={`${primaryButton} w-full`}
                  >
                    {`Switch to ${plan.name}`}
                  </ContactLink>
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
                  <ContactLink
                    href={contactHref(
                      contact,
                      `Hi! I'd like the ${plan.name} plan (${interval}) for my website.`,
                    )}
                    className={`${primaryButton} w-full`}
                  >
                    {`Choose ${plan.name}`}
                  </ContactLink>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <p className="mt-6 text-[13px] text-slate-500">
        {checkout && !manualActive
          ? "Payments are handled by Stripe. You can change plans or cancel anytime from this page."
          : `Pick a plan and we'll finish with you ${contact.whatsapp ? "on WhatsApp" : "by email"}. As soon as your payment is confirmed, your plan turns on and you can publish in one click.`}
      </p>
      {(!checkout || manualActive) && (
        <ContactChannels
          contact={contact}
          text={
            manualActive
              ? `Hi! I have a question about my ${currentName} plan.`
              : "Hi! I have a question about the No Sweat plans."
          }
        />
      )}
    </div>
  );
}
