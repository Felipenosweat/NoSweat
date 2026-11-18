import { REFUND_WINDOW_DAYS } from "@/components/marketing/legal/policy";

// O preço como linhas de recibo (linha pontilhada até o valor, números tabulares). Os números vêm
// das fontes únicas: `fromPrice` = planPrices().starter.monthly (pricing-data.ts) e o prazo de
// devolução de legal/policy.ts. Nada digitado à mão além do "$0" de criar e ver a prévia.

export function PriceReceipt({
  fromPrice,
  className = "",
}: {
  fromPrice: string;
  className?: string;
}) {
  const rows = [
    { label: "Build and preview", value: "$0" },
    { label: "Go live", value: `from ${fromPrice}/mo` },
    { label: `Not happy in ${REFUND_WINDOW_DAYS} days`, value: "full refund" },
  ];
  return (
    <dl className={`max-w-[440px] ${className}`}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline gap-3 py-1.5">
          {/* A linha pontilhada é um ::after do <dt> (dentro do <dl> só cabem dt/dd). */}
          <dt className="flex min-w-0 flex-1 items-baseline gap-3 text-[15px] text-slate-600 after:min-w-6 after:flex-1 after:border-b after:border-dotted after:border-slate-300 after:content-['']">
            {row.label}
          </dt>
          <dd className="shrink-0 text-[15px] font-semibold text-ink tabular-nums">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A mesma informação numa linha só (topo, no celular). */
export function PriceLine({
  fromPrice,
  className = "",
}: {
  fromPrice: string;
  className?: string;
}) {
  return (
    <p className={`text-[13px] leading-normal text-slate-600 tabular-nums ${className}`}>
      Free to build · from {fromPrice}/mo when it goes live · {REFUND_WINDOW_DAYS}-day money-back
      guarantee.
    </p>
  );
}
