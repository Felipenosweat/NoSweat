"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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
};

export type LaunchOffer = {
  plans: OfferPlan[];
  /** Nome da oferta do momento ("Black Friday"); `null` quando não há oferta valendo. */
  name: string | null;
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
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

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
              <strong className="font-semibold">{offer.name}.</strong> Launch prices for our first
              customers. The regular price shown applies once we raise prices.
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
                <Link
                  href={href}
                  className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-[15px] font-semibold transition-colors duration-150 ${focusRing} ${
                    plan.recommended
                      ? "bg-brand text-white hover:bg-brand-dark"
                      : "border border-slate-300 bg-white text-ink hover:border-slate-400"
                  }`}
                >
                  Choose {plan.name}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[13px] leading-relaxed text-slate-500">
            Prices in US dollars, billed monthly (yearly saves 2 months). Cancel anytime.
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
