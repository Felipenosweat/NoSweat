import { REFUND_WINDOW_DAYS } from "@/components/marketing/legal/policy";

// O preço como linhas de recibo (linha pontilhada até o valor, números tabulares). Os números vêm
// das fontes únicas: `fromPrice` = planPrices().starter.monthly (pricing-data.ts) e o prazo de
// devolução de legal/policy.ts. Regra atual (CLAUDE.md "Criar site exige plano"): descrever o
// negócio e responder as perguntas é grátis; criar o site com a IA e publicar pedem plano.

export function PriceReceipt({
  fromPrice,
  className = "",
}: {
  fromPrice: string;
  className?: string;
}) {
  const rows = [
    { label: "Describe your business", value: "free" },
    { label: "Build and go live", value: `from ${fromPrice}/mo` },
    {
      label: `Not happy in ${REFUND_WINDOW_DAYS} days`,
      value: "full refund of your first payment",
    },
  ];
  return (
    <dl className={`max-w-[440px] ${className}`}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline gap-3 py-1.5">
          {/* A linha pontilhada é um ::after do <dt> (dentro do <dl> só cabem dt/dd). O rótulo não
              quebra (min-w-fit); no celular quem quebra é o valor, alinhado à direita. */}
          <dt className="flex min-w-fit flex-1 items-baseline gap-3 text-[15px] whitespace-nowrap text-slate-600 after:min-w-6 after:flex-1 after:border-b after:border-dotted after:border-slate-300 after:content-['']">
            {row.label}
          </dt>
          <dd className="min-w-0 text-right text-[15px] font-semibold text-ink tabular-nums">
            {row.value}
          </dd>
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
      Describing your business is free · build and go live from {fromPrice}/mo ·{" "}
      {REFUND_WINDOW_DAYS}-day money-back guarantee.
    </p>
  );
}
