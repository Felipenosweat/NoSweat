"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { focusRing } from "@/components/DashboardUi";
import { SparklesIcon } from "@/components/marketing/icons";
import { CREDITS_EVENT, readCreditsEvent } from "@/lib/credits-events";
import {
  applyCreditsEvent,
  creditState,
  pillAriaLabel,
  pillText,
  pillTitle,
  refillDate,
  type CreditState,
  type PillBalance,
} from "@/lib/credits-ui";

// "Pílula" de créditos da IA, sempre visível no painel: barra lateral (computador) e barra de cima
// (celular). Mostra quanto sobra, fica âmbar quando está acabando e vermelha quando zerou, e leva
// para /billing#credits. Atualiza sem recarregar quando uma ação da IA termina (lib/credits-events).
// Sem saldo (`initial` nulo: erro ao ler ou visitante) ela some. No "ver como" do admin mostra o
// saldo da conta vista e não escuta os eventos (o saldo do admin não é o dela).

const TONE: Record<CreditState, { text: string; icon: string; ring: string }> = {
  ok: { text: "text-(--glass-fg)", icon: "text-brand", ring: "" },
  unlimited: { text: "text-(--glass-fg)", icon: "text-brand", ring: "" },
  low: { text: "text-amber-900", icon: "text-amber-600", ring: "ring-1 ring-amber-500/60 ring-inset" },
  empty: { text: "text-red-800", icon: "text-red-600", ring: "ring-1 ring-red-500/60 ring-inset" },
};

export function CreditsPill({
  initial,
  readOnly = false,
  variant,
}: {
  initial: PillBalance | null;
  /** "Ver como": saldo da conta vista, sem acompanhar as ações do admin. */
  readOnly?: boolean;
  /** `sidebar`: linha larga do menu lateral. `chip`: cápsula da barra de cima do celular. */
  variant: "sidebar" | "chip";
}) {
  const [balance, setBalance] = useState(initial);
  const [seen, setSeen] = useState(initial);
  // O servidor mandou um saldo novo (ex.: a página foi recarregada): passa a valer.
  if (initial !== seen) {
    setSeen(initial);
    setBalance(initial);
  }

  useEffect(() => {
    if (readOnly) return;
    const onCredits = (event: Event) => {
      const detail = readCreditsEvent(event);
      if (!detail) return;
      setBalance((current) => (current ? applyCreditsEvent(current, detail) : current));
    };
    window.addEventListener(CREDITS_EVENT, onCredits);
    return () => window.removeEventListener(CREDITS_EVENT, onCredits);
  }, [readOnly]);

  if (!balance) return null;

  const state = creditState(balance);
  const tone = TONE[state];
  const refill = state === "unlimited" ? null : refillDate(balance.resetsAt);
  const base = `glass-pill flex items-center rounded-full font-semibold tabular-nums transition-colors duration-150 hover:bg-(--glass-ghost-hover) motion-reduce:transition-none ${tone.text} ${tone.ring} ${focusRing}`;

  return (
    <Link
      href="/billing#credits"
      title={pillTitle(balance)}
      aria-label={pillAriaLabel(balance)}
      className={
        variant === "sidebar"
          ? `${base} min-h-11 w-full gap-2 px-3.5 text-[15px] lg:min-h-10`
          : `${base} min-h-11 shrink-0 gap-1.5 px-3 text-[14px] whitespace-nowrap`
      }
    >
      <SparklesIcon className={`size-4 shrink-0 ${tone.icon}`} aria-hidden="true" />
      {variant === "chip" && (state === "ok" || state === "low") ? (
        // Celular estreito: só o número (o rótulo completo continua no aria-label).
        <>
          <span aria-hidden="true" className="min-[420px]:hidden">
            {balance.total.toLocaleString("en-US")}
          </span>
          <span aria-hidden="true" className="max-[419px]:hidden">
            {pillText(balance)}
          </span>
        </>
      ) : (
        <span aria-hidden="true">{state === "unlimited" ? "∞ Unlimited" : pillText(balance)}</span>
      )}
      {variant === "sidebar" && refill && state !== "empty" && (
        <span
          aria-hidden="true"
          className="ml-auto text-[12px] font-medium text-(--glass-fg-muted)"
        >
          Refills {refill}
        </span>
      )}
    </Link>
  );
}
