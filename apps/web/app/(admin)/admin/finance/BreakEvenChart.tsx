import type { CSSProperties } from "react";
import { cx } from "@/components/glass";
import { formatMoney, formatMoneyCompact } from "@/lib/finance";
import { axisTicks, type FinanceSummary } from "@/server/admin/finance";

// Gráfico do empate (break-even): eixo x = clientes pagantes, receita do mês (linha azul) contra
// custo total do mês (linha âmbar, começa no custo fixo). Área vermelha = prejuízo até o
// cruzamento; verde = lucro depois. Traço vertical no empate e um ponto em "You are here".
// SVG puro, sem biblioteca. As linhas usam um viewBox 1000×1000 esticado (preserveAspectRatio
// "none", traço com `non-scaling-stroke`) para caber em qualquer largura; os textos e o ponto
// ficam em HTML por cima, posicionados em %, para não deformar no celular. Sem "use client".

const SIZE = 1000;

/** Alinhamento do rótulo perto das bordas (não sai do gráfico). */
function edgeAlign(pct: number): string {
  if (pct < 12) return "translate-x-0";
  if (pct > 88) return "-translate-x-full";
  return "-translate-x-1/2";
}

export function BreakEvenChart({
  summary,
}: {
  summary: Pick<
    FinanceSummary,
    "fixedMonthlyCents" | "assumptions" | "maxClients" | "breakEven" | "payingClients" | "projection"
  >;
}) {
  const { fixedMonthlyCents: fixed, maxClients, breakEven, payingClients, projection } = summary;
  const { arpuCents: arpu, variableCents: variable } = summary.assumptions;
  const max = Math.max(1, maxClients);

  const revenueAt = (clients: number) => clients * arpu;
  const costAt = (clients: number) => fixed + clients * variable;

  const yTicks = axisTicks(Math.max(revenueAt(max), costAt(max), fixed, 100), 4);
  const yTop = yTicks[yTicks.length - 1] ?? 1;
  const xTicks = axisTicks(max, 5, 1).filter((tick) => tick <= max);

  const px = (clients: number) => (Math.min(Math.max(clients, 0), max) / max) * SIZE;
  const py = (cents: number) => SIZE - (Math.min(Math.max(cents, 0), yTop) / yTop) * SIZE;
  const pt = (clients: number, cents: number) => `${px(clients)},${py(cents)}`;

  // Cruzamento exato (fracionário) das duas linhas; sem margem positiva, nunca cruza.
  const margin = arpu - variable;
  const crossing = margin > 0 ? Math.max(0, fixed) / margin : Number.POSITIVE_INFINITY;
  const lossEnd = Math.min(crossing, max);
  const lossArea =
    lossEnd > 0
      ? [pt(0, costAt(0)), pt(lossEnd, costAt(lossEnd)), pt(lossEnd, revenueAt(lossEnd)), pt(0, 0)]
      : null;
  const profitArea =
    crossing < max
      ? [pt(crossing, revenueAt(crossing)), pt(max, revenueAt(max)), pt(max, costAt(max))]
      : null;

  // Traço do empate só quando ele cai dentro do gráfico (e há custo fixo para pagar).
  const mark = breakEven !== null && breakEven > 0 && breakEven <= max ? breakEven : null;
  const here = Math.min(payingClients, max);
  const pctX = (clients: number) => (px(clients) / SIZE) * 100;
  const pctY = (cents: number) => (py(cents) / SIZE) * 100;

  // Linhas da tabela: começo, marcas do eixo, hoje e o empate.
  const rows = [...new Set([0, ...xTicks, here, ...(mark !== null ? [mark] : [])])]
    .sort((a, b) => a - b)
    .map((clients) => projection[clients])
    .filter((point) => point !== undefined);

  const description =
    breakEven === null
      ? `Each client costs ${formatMoney(variable)} a month and pays ${formatMoney(arpu)}, so revenue never catches up with costs of ${formatMoney(fixed)} a month.`
      : breakEven === 0
        ? `No fixed costs yet: every paying client is profit.`
        : `Revenue grows ${formatMoney(arpu)} per client a month; costs start at ${formatMoney(fixed)} and grow ${formatMoney(variable)} per client. They cross at ${breakEven} paying clients. Today: ${payingClients}.`;

  const at = (left: number, top?: number): CSSProperties =>
    top === undefined ? { left: `${left}%` } : { left: `${left}%`, top: `${top}%` };

  return (
    <figure className="grid gap-4">
      <div className="mt-8 mr-3 mb-7 ml-14 sm:mr-4 sm:ml-16">
        <div className="relative h-60 sm:h-80">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            preserveAspectRatio="none"
            role="img"
            aria-labelledby="break-even-chart-title break-even-chart-desc"
            className="absolute inset-0 size-full overflow-visible"
          >
            <title id="break-even-chart-title">Revenue and costs by number of paying clients</title>
            <desc id="break-even-chart-desc">{description}</desc>

            {yTicks.map((tick) => (
              <line
                key={tick}
                x1={0}
                x2={SIZE}
                y1={py(tick)}
                y2={py(tick)}
                vectorEffect="non-scaling-stroke"
                className={tick === 0 ? "stroke-slate-400" : "stroke-slate-300/70"}
                strokeWidth={1}
                strokeDasharray={tick === 0 ? undefined : "2 4"}
              />
            ))}

            {lossArea && <polygon points={lossArea.join(" ")} className="fill-red-500/15" />}
            {profitArea && (
              <polygon points={profitArea.join(" ")} className="fill-emerald-500/15" />
            )}

            {mark !== null && (
              <line
                x1={px(mark)}
                x2={px(mark)}
                y1={0}
                y2={SIZE}
                vectorEffect="non-scaling-stroke"
                className="stroke-(--glass-fg)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
              />
            )}

            <line
              x1={px(0)}
              y1={py(costAt(0))}
              x2={px(max)}
              y2={py(costAt(max))}
              vectorEffect="non-scaling-stroke"
              className="stroke-amber-600"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <line
              x1={px(0)}
              y1={py(0)}
              x2={px(max)}
              y2={py(revenueAt(max))}
              vectorEffect="non-scaling-stroke"
              className="stroke-brand"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </svg>

          {/* Textos por cima do desenho (o leitor de tela já tem o <desc> e a tabela). */}
          <div aria-hidden="true">
            {yTicks.map((tick) => (
              <span
                key={tick}
                style={{ top: `${pctY(tick)}%` }}
                className="absolute right-full mr-2 -translate-y-1/2 text-xs whitespace-nowrap text-(--glass-fg-muted) tabular-nums"
              >
                {formatMoneyCompact(tick)}
              </span>
            ))}
            {xTicks.map((tick) => (
              <span
                key={tick}
                style={at(pctX(tick))}
                className="absolute top-full mt-2 -translate-x-1/2 text-xs text-(--glass-fg-muted) tabular-nums"
              >
                {tick}
              </span>
            ))}

            {mark !== null && (
              <span
                style={at(pctX(mark))}
                className={cx(
                  "glass-edge absolute top-0 -translate-y-[calc(100%+4px)] rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-(--glass-fg)",
                  edgeAlign(pctX(mark)),
                )}
              >
                Break-even · {mark}
              </span>
            )}

            <span
              style={at(pctX(here), pctY(revenueAt(here)))}
              className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-4 ring-white"
            />
            <span
              style={at(pctX(here), pctY(revenueAt(here)))}
              className={cx(
                "absolute -translate-y-[calc(100%+12px)] rounded-full bg-ink px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-white",
                edgeAlign(pctX(here)),
              )}
            >
              You are here · {payingClients}
            </span>
          </div>
        </div>
      </div>

      <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-(--glass-fg-muted)">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-brand" />
          Revenue per month
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-amber-600" />
          Costs per month
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-sm bg-red-500/20" />
          Loss
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-sm bg-emerald-500/20" />
          Profit
        </span>
        <span className="sm:ml-auto">Paying clients →</span>
      </figcaption>

      <details className="text-sm">
        <summary
          className={cx(
            "inline-flex min-h-11 cursor-pointer items-center rounded-lg font-semibold text-brand sm:min-h-9",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          )}
        >
          See the numbers
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left tabular-nums">
            <caption className="sr-only">Monthly revenue, costs and profit by paying clients</caption>
            <thead className="text-[13px] text-(--glass-fg-muted)">
              <tr>
                <th scope="col" className="py-2 font-semibold">
                  Paying clients
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  Revenue
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  Costs
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  Profit
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((point) => (
                <tr key={point.clients} className="border-t border-(--glass-rim)">
                  <th scope="row" className="py-2 font-medium text-(--glass-fg)">
                    {point.clients}
                    {point.clients === payingClients && " (today)"}
                    {point.clients === mark && " (break-even)"}
                  </th>
                  <td className="py-2 text-right">{formatMoney(point.revenueCents)}</td>
                  <td className="py-2 text-right">{formatMoney(point.costCents)}</td>
                  <td
                    className={cx(
                      "py-2 text-right font-semibold",
                      point.profitCents < 0 ? "text-red-700" : "text-emerald-700",
                    )}
                  >
                    {formatMoney(point.profitCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
