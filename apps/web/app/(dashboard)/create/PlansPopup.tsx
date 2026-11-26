"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "@/components/marketing/icons";

// Pop-up de planos do /create: abre quando a pessoa clica em "Create website" sem ter plano.
// Mostra os três planos com o nome da oferta do momento (Black Friday, Cyber Week...), o preço de
// lançamento e o preço normal. Sem relógio: a oferta não tem data final (vale até o fundador subir
// os preços), e um prazo que se renova sem o preço mudar é urgência falsa. As respostas da pessoa
// ficam guardadas na aba (CreateFlow), então escolher o plano não perde nada.

export type OfferPlan = {
  id: string;
  name: string;
  /** Preço mensal cobrado, ex.: "$19". */
  price: string;
  /** Preço normal (riscado) e desconto; `null` fora da oferta. */
  regular: string | null;
  percentOff: number | null;
  features: string[];
  recommended: boolean;
  /** Sem Stripe: link do WhatsApp/e-mail com o pedido deste plano já escrito (só conta logada). */
  contactHref: string | null;
};

export type LaunchOffer = {
  plans: OfferPlan[];
  /** Nome da oferta do momento ("Black Friday"); `null` quando não há oferta valendo. */
  name: string | null;
  /** Créditos de bônus da oferta no primeiro pagamento. */
  bonusCredits: number;
  /** O Stripe está ligado: "Choose" abre o pagamento direto. Senão, abre o contato. */
  checkout: boolean;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function PlansPopup({
  open,
  onClose,
  signedIn,
  offer,
}: {
  open: boolean;
  onClose: () => void;
  signedIn: boolean;
  offer: LaunchOffer;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // O assistente do /create (outro <dialog>) volta a abrir no mesmo instante e, se este abrisse
      // primeiro, ficaria por cima. Esperar um quadro garante que o pop-up de planos fica na frente.
      const frame = requestAnimationFrame(() => {
        if (!dialog.open) dialog.showModal();
      });
      return () => cancelAnimationFrame(frame);
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Stripe ligado: cria o pagamento do plano e vai direto para ele. */
  async function checkoutPlan(planId: string) {
    setPending(planId);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, interval: "monthly" }),
      });
      const json: { url?: string; error?: { message?: string } } | null = await res
        .json()
        .catch(() => null);
      if (!res.ok || !json?.url) {
        setError(json?.error?.message ?? "We couldn’t open the payment page. Please try again.");
        setPending(null);
        return;
      }
      window.location.assign(json.url);
    } catch {
      setError("We couldn’t reach our servers. Please try again.");
      setPending(null);
    }
  }

  const href = signedIn ? "/billing#plans" : "/signup?next=/billing";
  const promo = offer.name !== null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="plans-popup-title"
      onClose={onClose}
      onClick={(event) => {
        // Clique no fundo escuro (fora da caixa) fecha.
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      className="glass-strong m-0 mt-auto max-h-[92dvh] w-full max-w-none flex-col overflow-hidden rounded-t-[28px] border-0 p-0 text-ink backdrop:bg-ink/40 open:flex sm:m-auto sm:w-[calc(100%-3rem)] sm:max-w-[44rem] sm:rounded-[28px]"
    >
      {open && (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id="plans-popup-title"
                className="font-display text-[1.5rem] leading-tight font-bold tracking-[-0.025em]"
              >
                Your website is ready to build
              </h2>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-600">
                Pick a plan and we build it right now. Your answers are saved.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className={`-mt-1 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-xl text-slate-500 hover:bg-slate-900/[0.06] hover:text-ink ${focusRing}`}
            >
              ×
            </button>
          </div>

          {promo && offer.name && (
            <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-[15px] text-emerald-900">
              <strong className="font-semibold">{offer.name}.</strong> Get {offer.bonusCredits} bonus AI
              credits with your first payment. Your price never goes up while you stay subscribed.
            </p>
          )}

          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {offer.plans.map((plan) => (
              <li
                key={plan.id}
                className={`flex flex-col rounded-2xl bg-white p-4 ${
                  plan.recommended ? "ring-2 ring-brand" : "border border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                  {plan.recommended && (
                    <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[12px] font-semibold text-brand">
                      Best value
                    </span>
                  )}
                </div>
                {plan.regular && plan.percentOff !== null && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[12px] font-semibold text-emerald-800 tabular-nums">
                      Save {plan.percentOff}%
                    </span>
                    <s className="tabular-nums">{plan.regular}/mo</s>
                  </p>
                )}
                <p className={`font-display text-ink ${plan.regular ? "mt-1" : "mt-3"}`}>
                  <span className="text-[2rem] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                    {plan.price}
                  </span>
                  <span className="text-sm text-slate-600">/mo</span>
                </p>
                <ul className="mt-3 flex-1 space-y-1.5 text-[14px] leading-snug text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-brand" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {(() => {
                  const cls = `mt-4 inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-[15px] font-semibold transition-colors duration-150 ${focusRing} ${
                    plan.recommended
                      ? "bg-brand text-white hover:bg-brand-dark"
                      : "border border-slate-300 bg-white text-ink hover:border-slate-400"
                  }`;
                  if (!signedIn) {
                    return (
                      <Link href={href} className={cls}>
                        Choose {plan.name}
                      </Link>
                    );
                  }
                  if (offer.checkout) {
                    return (
                      <button
                        type="button"
                        onClick={() => void checkoutPlan(plan.id)}
                        disabled={pending !== null}
                        className={`${cls} disabled:cursor-wait disabled:opacity-60`}
                      >
                        {pending === plan.id ? "Opening…" : `Choose ${plan.name}`}
                      </button>
                    );
                  }
                  return (
                    <a
                      href={plan.contactHref ?? href}
                      target={plan.contactHref?.startsWith("mailto:") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      className={cls}
                    >
                      Choose {plan.name}
                    </a>
                  );
                })()}
              </li>
            ))}
          </ul>

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <p className="mt-4 text-[13px] leading-relaxed text-slate-500">
            {signedIn && !offer.checkout
              ? "Tap a plan and we finish the payment with you in a message. As soon as it’s confirmed, your plan turns on and we build your website. "
              : `Prices in US dollars (yearly saves 2 months). ${
                  offer.checkout
                    ? "Plans renew automatically each month or year until you cancel. Cancel anytime in Billing."
                    : "Cancel anytime."
                } `}
            Your answers are saved.
          </p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={`mt-2 inline-flex min-h-11 items-center rounded-lg px-1 text-sm font-semibold text-slate-600 underline underline-offset-4 hover:text-ink ${focusRing}`}
          >
            Not now
          </button>
        </div>
      )}
    </dialog>
  );
}
