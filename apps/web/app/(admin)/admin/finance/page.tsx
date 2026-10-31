import type { CompanyExpense, ExpenseFrequency } from "@nosweat/schema";
import type { Metadata } from "next";
import { connection } from "next/server";
import { StatTile, hintClass } from "@/components/DashboardUi";
import { EmptyState, GlassBadge, GlassButton, GlassCard, Notice, cx } from "@/components/glass";
import { formatDateOnly } from "@/lib/clients";
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_FREQUENCIES,
  EXPENSE_FREQUENCY_LABELS,
  centsToDollarsInput,
  formatMoney,
} from "@/lib/finance";
import { requireAdmin } from "@/server/admin";
import {
  expenseStatus,
  isExpenseActiveOn,
  oneTimeSpentCents,
  type FinanceAssumptions,
  type FinanceSummary,
} from "@/server/admin/finance";
import { loadFinance } from "@/server/admin/finance-data";
import { AdminPageHeader, fieldClass, labelClass, panelText, panelTitle } from "../AdminUi";
import { firstParam, formatCount, type Param } from "../admin-data";
import { BreakEvenChart } from "./BreakEvenChart";
import { AddExpenseButton, ExpenseRowActions } from "./ExpenseActions";

export const metadata: Metadata = { title: "Finance · Admin" };

// Finanças da No Sweat: custos da empresa (o admin lança aqui), receita dos planos ativos e
// quantos clientes pagantes faltam para empatar. As premissas (ARPU e custo variável por
// cliente) podem ser trocadas pelo endereço (?arpu=&var=, em dólares). Contas em
// server/admin/finance.ts.

type FinancePageProps = { searchParams: Promise<{ arpu?: Param; var?: Param }> };

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** Ladrilhos do topo: custo fixo, MRR, clientes, lucro/prejuízo e o empate. */
function Tiles({
  summary,
  stripe,
  manual,
}: {
  summary: FinanceSummary;
  stripe: { count: number; mrrCents: number };
  manual: { count: number; mrrCents: number };
}) {
  const { breakEven, toGo, profitCents } = summary;
  const breakEvenValue = breakEven === null ? "Never" : formatCount(breakEven);
  const breakEvenHint =
    breakEven === null
      ? "Each client costs more than they pay"
      : summary.fixedMonthlyCents === 0
        ? "Add your monthly costs to see it"
        : toGo === 0
          ? "Break-even reached"
          : `${formatCount(toGo)} to go`;

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <li>
        <StatTile
          label="Monthly costs"
          value={formatMoney(summary.fixedMonthlyCents)}
          hint={`${plural(summary.activeRecurring, "recurring cost", "recurring costs")} · ${formatMoney(summary.oneTimeSpentCents)} one-time so far`}
        />
      </li>
      <li>
        <StatTile
          label="Monthly revenue"
          value={formatMoney(summary.mrrCents)}
          hint={
            summary.payingClients === 0
              ? "No paying clients yet"
              : `Card ${formatMoney(stripe.mrrCents)} · manual ${formatMoney(manual.mrrCents)}`
          }
        />
      </li>
      <li>
        <StatTile
          href="/admin/accounts"
          label="Paying clients"
          value={formatCount(summary.payingClients)}
          hint={`${stripe.count} card · ${manual.count} manual · no admins or test accounts`}
        />
      </li>
      <li>
        <StatTile
          label={profitCents < 0 ? "Loss per month" : "Profit per month"}
          value={formatMoney(profitCents)}
          tone={profitCents < 0 ? "red" : "emerald"}
          highlight={profitCents !== 0}
          hint="Revenue minus costs, Stripe fees and AI"
        />
      </li>
      <li className="col-span-2 lg:col-span-1">
        <StatTile
          label="Clients to break even"
          value={breakEvenValue}
          tone={breakEven === null ? "red" : toGo === 0 ? "emerald" : "slate"}
          highlight={breakEven === null || (toGo === 0 && summary.fixedMonthlyCents > 0)}
          hint={breakEvenHint}
        />
      </li>
    </ul>
  );
}

/** De onde veio cada premissa (texto embaixo do campo). */
function arpuNote(assumptions: FinanceAssumptions, summary: FinanceSummary): string {
  if (assumptions.arpuSource === "actual") {
    return `Default: real average, ${formatMoney(summary.mrrCents)} MRR ÷ ${plural(summary.payingClients, "paying client", "paying clients")}.`;
  }
  if (assumptions.arpuSource === "pro_price") {
    return `Default: Pro plan price (no paying clients to average yet).`;
  }
  return "Your number. Clear the field to go back to the default.";
}

function variableNote(assumptions: FinanceAssumptions): string {
  const ai =
    assumptions.aiSource === "actual"
      ? `AI ${formatMoney(assumptions.aiCostCents)} (30-day estimate, average of ${plural(assumptions.aiSample, "paying account", "paying accounts")})`
      : `AI ${formatMoney(assumptions.aiCostCents)} (default estimate, no paying clients to measure yet)`;
  const computed = `Stripe ${formatMoney(assumptions.stripeFeeCents)} (2.9% + 30¢ on the ARPU) + ${ai}.`;
  return assumptions.variableSource === "custom"
    ? `Your number. Default would be ${formatMoney(assumptions.stripeFeeCents + assumptions.aiCostCents)}: ${computed}`
    : `Default: ${computed}`;
}

/** Premissas do modelo, com o formulário GET que troca ?arpu= e ?var=. */
function AssumptionsCard({
  summary,
  arpuParam,
  varParam,
}: {
  summary: FinanceSummary;
  arpuParam: string;
  varParam: string;
}) {
  const { assumptions } = summary;
  const custom = assumptions.arpuSource === "custom" || assumptions.variableSource === "custom";
  return (
    <GlassCard as="section" aria-labelledby="assumptions-heading">
      <h2 id="assumptions-heading" className={panelTitle}>
        Assumptions
      </h2>
      <p className={cx("mt-1", panelText)}>
        Each new client pays the ARPU and costs the variable amount. What&rsquo;s left,{" "}
        <strong className="font-semibold text-(--glass-fg)">
          {formatMoney(summary.marginCents)}
        </strong>{" "}
        a month, pays down the fixed costs.
      </p>
      <form method="get" action="/admin/finance" className="mt-4 grid gap-4">
        <div>
          <label className={labelClass}>
            Revenue per client per month (ARPU, USD)
            <input
              name="arpu"
              inputMode="decimal"
              defaultValue={arpuParam}
              placeholder={centsToDollarsInput(assumptions.arpuCents)}
              autoComplete="off"
              className={fieldClass}
            />
          </label>
          <p className={hintClass}>
            Now {formatMoney(assumptions.arpuCents)}. {arpuNote(assumptions, summary)}
          </p>
        </div>
        <div>
          <label className={labelClass}>
            Variable cost per client per month (USD)
            <input
              name="var"
              inputMode="decimal"
              defaultValue={varParam}
              placeholder={centsToDollarsInput(assumptions.variableCents)}
              autoComplete="off"
              className={fieldClass}
            />
          </label>
          <p className={hintClass}>
            Now {formatMoney(assumptions.variableCents)}. {variableNote(assumptions)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <GlassButton type="submit" variant="secondary">
            Update the chart
          </GlassButton>
          {custom && (
            <GlassButton href="/admin/finance" variant="ghost">
              Use the defaults
            </GlassButton>
          )}
        </div>
      </form>
    </GlassCard>
  );
}

/** "Since Jan 1" / "Jan 1 – Dec 31, 2027" / "Paid Mar 1". */
function expenseDates(expense: CompanyExpense, today: string): string {
  const start = formatDateOnly(expense.startsOn, today);
  if (expense.frequency === "one_time") return `Paid ${start}`;
  if (expense.endsOn) return `${start} – ${formatDateOnly(expense.endsOn, today)}`;
  return `Since ${start}`;
}

const PER: Record<ExpenseFrequency, string> = {
  monthly: "/ month",
  yearly: "/ year",
  one_time: "once",
};

/** Total do grupo, só com o que vale hoje (únicos: o que já foi pago). */
function groupTotal(frequency: ExpenseFrequency, items: CompanyExpense[], today: string): string {
  if (frequency === "one_time") return `${formatMoney(oneTimeSpentCents(items, today))} spent`;
  const active = items
    .filter((expense) => isExpenseActiveOn(expense, today))
    .reduce((sum, expense) => sum + expense.amountCents, 0);
  if (frequency === "monthly") return `${formatMoney(active)} / month`;
  return `${formatMoney(active)} / year · ≈ ${formatMoney(Math.round(active / 12))} / month`;
}

function ExpenseGroup({
  frequency,
  items,
  today,
}: {
  frequency: ExpenseFrequency;
  items: CompanyExpense[];
  today: string;
}) {
  const headingId = `expenses-${frequency}`;
  return (
    <GlassCard as="section" aria-labelledby={headingId} padding="none">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-5 pb-3 sm:px-6">
        <h3 id={headingId} className={panelTitle}>
          {EXPENSE_FREQUENCY_LABELS[frequency]}{" "}
          <span className="text-[15px] font-semibold text-(--glass-fg-muted) tabular-nums">
            {items.length}
          </span>
        </h3>
        <p className="text-[15px] font-semibold text-(--glass-fg) tabular-nums">
          {groupTotal(frequency, items, today)}
        </p>
      </div>
      <ul>
        {items.map((expense) => {
          const status = expenseStatus(expense, today);
          return (
            <li
              key={expense.id}
              className="flex items-start gap-3 border-t border-(--glass-rim) px-5 py-3.5 sm:px-6"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold break-words text-(--glass-fg)">
                    {expense.name}
                  </span>
                  <GlassBadge size="sm">{EXPENSE_CATEGORY_LABELS[expense.category]}</GlassBadge>
                  {status === "upcoming" && (
                    <GlassBadge size="sm" tone="info">
                      Starts {formatDateOnly(expense.startsOn, today)}
                    </GlassBadge>
                  )}
                  {status === "ended" && (
                    <GlassBadge size="sm" tone="draft">
                      Ended
                    </GlassBadge>
                  )}
                </div>
                <p className="mt-0.5 text-[13px] leading-5 text-(--glass-fg-muted)">
                  {expenseDates(expense, today)}
                </p>
                {expense.notes && (
                  <p className="mt-1 text-sm break-words whitespace-pre-line text-(--glass-fg-muted)">
                    {expense.notes}
                  </p>
                )}
              </div>
              <p
                className={cx(
                  "shrink-0 pt-0.5 text-right font-semibold whitespace-nowrap tabular-nums",
                  status === "active" ? "text-(--glass-fg)" : "text-(--glass-fg-muted)",
                )}
              >
                {formatMoney(expense.amountCents)}{" "}
                <span className="text-[13px] font-medium text-(--glass-fg-muted)">
                  {PER[frequency]}
                </span>
              </p>
              <ExpenseRowActions expense={expense} today={today} />
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}

/**
 * /admin/finance: quanto a No Sweat gasta por mês, quanto entra dos planos e a partir de quantos
 * clientes pagantes a conta fecha. Só admins.
 */
export default async function AdminFinancePage({ searchParams }: FinancePageProps) {
  await connection();
  await requireAdmin();
  const params = await searchParams;
  const arpuParam = firstParam(params.arpu).trim().slice(0, 20);
  const varParam = firstParam(params.var).trim().slice(0, 20);
  const { expenses, summary, revenue, subscriptionsFailed } = await loadFinance({
    arpu: arpuParam,
    variable: varParam,
  });
  const { today } = summary;
  const groups = EXPENSE_FREQUENCIES.map((frequency) => ({
    frequency,
    items: expenses.filter((expense) => expense.frequency === frequency),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="grid grid-cols-1 gap-8">
      <AdminPageHeader
        title="Finance"
        description="What No Sweat spends each month, what paying clients bring in, and how many clients we need to break even."
        actions={
          // Sem custos, o botão principal é o do estado vazio (um "primary" por tela).
          <AddExpenseButton today={today} variant={groups.length === 0 ? "secondary" : "primary"} />
        }
      />

      {subscriptionsFailed && (
        <Notice tone="warning">
          We couldn&rsquo;t load the Stripe subscriptions. Revenue below counts manual access only.
        </Notice>
      )}

      <section aria-labelledby="finance-numbers-heading">
        <h2 id="finance-numbers-heading" className="sr-only">
          This month
        </h2>
        <Tiles summary={summary} stripe={revenue.stripe} manual={revenue.manual} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassCard as="section" aria-labelledby="chart-heading" className="lg:col-span-2">
          <h2 id="chart-heading" className={panelTitle}>
            Path to break-even
          </h2>
          <p className={cx("mt-1", panelText)}>
            Monthly revenue and costs as paying clients grow. Costs start at your fixed monthly
            costs; every client adds revenue and a little cost.
          </p>
          <div className="mt-4">
            <BreakEvenChart summary={summary} />
          </div>
        </GlassCard>
        <AssumptionsCard summary={summary} arpuParam={arpuParam} varParam={varParam} />
      </div>

      <section aria-labelledby="expenses-heading" className="grid gap-4">
        <div>
          <h2 id="expenses-heading" className={panelTitle}>
            Company costs
          </h2>
          <p className={cx("mt-1", panelText)}>
            Monthly and yearly costs count toward break-even (yearly as 1/12 a month). One-time
            costs show as money already spent.
          </p>
        </div>
        {groups.length === 0 ? (
          <EmptyState
            title="Add your first cost"
            description="Hosting, database, AI, email, domains, tools, fees and people. Once your monthly costs are in, the chart shows how many clients cover them."
            actions={<AddExpenseButton today={today} />}
          />
        ) : (
          groups.map((group) => (
            <ExpenseGroup
              key={group.frequency}
              frequency={group.frequency}
              items={group.items}
              today={today}
            />
          ))
        )}
      </section>
    </div>
  );
}
