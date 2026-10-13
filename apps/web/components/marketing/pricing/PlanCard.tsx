import Link from "next/link";
import { CheckIcon } from "@/components/marketing/icons";
import { primaryButton } from "@/components/marketing/styles";
import { formatUsd, type Plan } from "@/lib/plans";

// Cartão de um plano na página /pricing, desenhado sobre o fundo escuro do topo.
// Tudo vem de `PLANS` (lib/plans.ts): nada de preço ou recurso escrito à mão aqui.

// Botão secundário para fundo escuro (o `secondaryButton` da landing é para fundo branco).
const darkOutlineButton =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/30 px-6 font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function PlanCard({ plan }: { plan: Plan }) {
  const featured = plan.highlighted === true;
  const titleId = `plan-${plan.id}-title`;

  return (
    <li
      className={`flex flex-col rounded-2xl p-6 sm:p-8 ${
        featured
          ? "bg-white text-ink ring-2 ring-brand shadow-[0_1px_2px_rgb(7_27_51/0.2),0_24px_48px_-24px_rgb(0_0_0/0.6)]"
          : "border border-white/15 bg-white/[0.04] text-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={titleId} className="font-display text-xl font-semibold tracking-[-0.01em]">
          {plan.name}
        </h2>
        {featured && (
          <span className="rounded-lg bg-brand/10 px-2.5 py-1 text-[13px] font-semibold text-brand-dark">
            Needed to go live
          </span>
        )}
      </div>
      <p
        className={`mt-2 max-w-[40ch] text-base leading-relaxed text-pretty ${
          featured ? "text-slate-600" : "text-slate-300"
        }`}
      >
        {plan.tagline}
      </p>

      <div className="mt-8">
        <p className="flex items-baseline gap-1">
          <span className="font-display text-5xl leading-none font-bold tracking-[-0.03em] tabular-nums">
            {formatUsd(plan.monthlyPrice)}
          </span>
          <span
            aria-hidden="true"
            className={`text-base ${featured ? "text-slate-500" : "text-slate-400"}`}
          >
            /mo
          </span>
          <span className="sr-only">per month</span>
        </p>
        <p
          className={`mt-3 text-sm font-semibold tabular-nums ${
            featured ? "text-ink" : "text-slate-300"
          }`}
        >
          {plan.setupPrice !== null
            ? `+ ${formatUsd(plan.setupPrice)} one-time setup`
            : "No setup fee"}
        </p>
      </div>

      <Link
        href={plan.cta.href}
        className={`mt-8 w-full ${featured ? primaryButton : darkOutlineButton}`}
      >
        {plan.cta.label}
      </Link>

      <ul
        className={`mt-8 space-y-3 border-t pt-6 text-base leading-snug ${
          featured ? "border-slate-200 text-slate-600" : "border-white/15 text-slate-300"
        }`}
      >
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <CheckIcon
              className={`mt-0.5 size-4 shrink-0 ${featured ? "text-brand" : "text-accent"}`}
            />
            {feature}
          </li>
        ))}
      </ul>
    </li>
  );
}
