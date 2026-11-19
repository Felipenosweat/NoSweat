import { panelClass, panelText, panelTitle } from "@/components/DashboardUi";
import { CheckIcon } from "@/components/marketing/icons";

// "Your plan" em /billing: quanto do plano já foi usado (sites no ar, posts do Instagram) e, se há
// um plano acima, o que ele acrescenta. Server component: só desenha o que a página calculou.

export type UsageRow = { label: string; used: number; limit: number };

export type NextPlan = {
  name: string;
  price: string;
  gains: string[];
};

export function PlanUsage({
  planName,
  rows,
  next,
}: {
  planName: string;
  rows: UsageRow[];
  next: NextPlan | null;
}) {
  return (
    <section aria-labelledby="usage-title" className={`${panelClass} mt-8`}>
      <h2 id="usage-title" className={panelTitle}>
        Your plan: {planName}
      </h2>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {rows.map((row) => {
          const share =
            row.limit > 0 ? Math.min(100, Math.round((row.used / row.limit) * 100)) : 100;
          const full = row.used >= row.limit;
          return (
            <li key={row.label}>
              <p className="flex items-baseline justify-between gap-3 text-[15px] text-slate-700">
                <span>{row.label}</span>
                <span className="font-semibold text-ink tabular-nums">
                  {row.used} of {row.limit}
                </span>
              </p>
              <div
                role="progressbar"
                aria-label={row.label}
                aria-valuemin={0}
                aria-valuemax={row.limit}
                aria-valuenow={Math.min(row.used, row.limit)}
                className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
              >
                <div
                  className={`h-full rounded-full ${full ? "bg-amber-600" : "bg-brand"}`}
                  style={{ width: `${share}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {next && next.gains.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-[15px] font-semibold text-ink">
            Need more? {next.name} is {next.price} a month and adds:
          </p>
          <ul className={`mt-3 grid gap-2 ${panelText}`}>
            {next.gains.map((gain) => (
              <li key={gain} className="flex gap-2.5">
                <CheckIcon className="mt-1 size-4 shrink-0 text-brand" />
                {gain}
              </li>
            ))}
          </ul>
          <a
            href="#plans"
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Upgrade to {next.name}
          </a>
        </div>
      )}
    </section>
  );
}
