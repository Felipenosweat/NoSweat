import type { CompanyExpense } from "@nosweat/schema";
import { beforeEach, describe, expect, it } from "vitest";
import type { AccessGrant } from "../billing/grants";
import type { SubscriptionRecord } from "../billing/store";
import {
  DEFAULT_AI_COST_PER_CLIENT_CENTS,
  ExpenseInputError,
  MAX_PROJECTION_CLIENTS,
  axisTicks,
  breakEvenClients,
  createExpense,
  deleteExpense,
  expenseStatus,
  financeToday,
  listExpenses,
  monthlyFixedCents,
  niceStep,
  oneTimeSpentCents,
  parseMoneyParam,
  projectionMaxClients,
  projectionSeries,
  resolveAssumptions,
  revenueModel,
  stripeFeeCents,
  summarizeFinance,
  updateExpense,
} from "./finance";
import { resetMemoryExpenseStore } from "./finance-store";

const NOW = new Date("2026-10-16T12:00:00Z");
const TODAY = "2026-10-16";
const DAY = 24 * 60 * 60 * 1000;

function expense(overrides: Partial<CompanyExpense>): CompanyExpense {
  return {
    id: crypto.randomUUID(),
    name: "Vercel",
    category: "hosting",
    amountCents: 2000,
    frequency: "monthly",
    startsOn: "2026-01-01",
    endsOn: null,
    notes: "",
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

function sub(userId: string, overrides: Partial<SubscriptionRecord> = {}): SubscriptionRecord {
  return {
    userId,
    stripeCustomerId: `cus_${userId}`,
    stripeSubscriptionId: `sub_${userId}`,
    plan: "pro",
    interval: "monthly",
    status: "active",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

function grant(userId: string, plan: AccessGrant["plan"], inDays: number): AccessGrant {
  return {
    userId,
    plan,
    expiresAt: new Date(NOW.getTime() + inDays * DAY).toISOString(),
    note: null,
    grantedBy: null,
    updatedAt: NOW.toISOString(),
  };
}

describe("company costs", () => {
  it("adds monthly costs and yearly costs / 12 that are active on the day, leaving one-time out", () => {
    const expenses = [
      expense({ amountCents: 2000 }),
      expense({ frequency: "yearly", amountCents: 12_000 }),
      expense({ frequency: "yearly", amountCents: 1_000 }),
      expense({ frequency: "one_time", amountCents: 50_000 }),
      // Acabou antes de hoje, começa depois de hoje: fora.
      expense({ amountCents: 9_999, endsOn: "2026-10-15" }),
      expense({ amountCents: 9_999, startsOn: "2026-10-17" }),
      // Acaba hoje: ainda vale (o fim é inclusive).
      expense({ amountCents: 500, endsOn: TODAY }),
    ];
    // 2000 + 500 + round(13000 / 12) = 2500 + 1083
    expect(monthlyFixedCents(expenses, TODAY)).toBe(3583);
  });

  it("sums one-time costs already paid", () => {
    const expenses = [
      expense({ frequency: "one_time", amountCents: 50_000, startsOn: "2026-03-01" }),
      expense({ frequency: "one_time", amountCents: 7_000, startsOn: TODAY }),
      expense({ frequency: "one_time", amountCents: 1_000, startsOn: "2026-12-01" }),
      expense({ amountCents: 2_000 }),
    ];
    expect(oneTimeSpentCents(expenses, TODAY)).toBe(57_000);
  });

  it("tells active, upcoming and ended costs apart", () => {
    expect(expenseStatus(expense({}), TODAY)).toBe("active");
    expect(expenseStatus(expense({ startsOn: "2026-11-01" }), TODAY)).toBe("upcoming");
    expect(expenseStatus(expense({ endsOn: "2026-09-30" }), TODAY)).toBe("ended");
    expect(expenseStatus(expense({ frequency: "one_time", startsOn: "2026-02-01" }), TODAY)).toBe(
      "active",
    );
  });

  it("uses the company's local date for today", () => {
    // 02:00 UTC ainda é o dia anterior em Nova York.
    expect(financeToday(new Date("2026-10-17T02:00:00Z"))).toBe("2026-10-16");
  });
});

describe("revenueModel", () => {
  it("counts active Stripe plans (annual = price / 12) and active manual grants once per account", () => {
    const model = revenueModel(
      [
        sub("a"),
        sub("b", { plan: "premium", interval: "annual" }),
        sub("c", { status: "canceled" }),
        sub("d", { plan: null }),
        sub("e", { status: "past_due", plan: "starter" }),
      ],
      [
        grant("a", "premium", 10), // já paga pelo Stripe: conta uma vez só
        grant("f", "starter", 5),
        grant("g", "pro", -1), // venceu
      ],
      new Set(),
      NOW,
    );
    expect(model.accounts.map((account) => account.userId).sort()).toEqual(["a", "b", "e", "f"]);
    expect(model.stripe).toEqual({ count: 3, mrrCents: 6900 + 10_750 + 3900 });
    expect(model.manual).toEqual({ count: 1, mrrCents: 3900 });
    expect(model.mrrCents).toBe(6900 + 10_750 + 3900 + 3900);
  });

  it("leaves admins and test accounts out", () => {
    const model = revenueModel(
      [sub("admin"), sub("a")],
      [grant("test", "pro", 30)],
      new Set(["admin", "test"]),
      NOW,
    );
    expect(model.accounts.map((account) => account.userId)).toEqual(["a"]);
    expect(model.mrrCents).toBe(6900);
  });
});

describe("assumptions", () => {
  it("charges 2.9% + 30¢ per Stripe charge", () => {
    expect(stripeFeeCents(6900)).toBe(200 + 30);
    expect(stripeFeeCents(0)).toBe(0);
  });

  it("reads dollars from the address", () => {
    expect(parseMoneyParam("69")).toBe(6900);
    expect(parseMoneyParam("$4.50")).toBe(450);
    expect(parseMoneyParam("")).toBeNull();
    expect(parseMoneyParam(undefined)).toBeNull();
    expect(parseMoneyParam("abc")).toBeNull();
    expect(parseMoneyParam("-5")).toBeNull();
  });

  it("defaults to the Pro price and the default AI estimate without paying clients", () => {
    const assumptions = resolveAssumptions({
      arpu: null,
      variable: null,
      revenue: { mrrCents: 0, accounts: [] },
      aiPerClient: null,
    });
    expect(assumptions).toMatchObject({
      arpuCents: 6900,
      arpuSource: "pro_price",
      stripeFeeCents: 230,
      aiCostCents: DEFAULT_AI_COST_PER_CLIENT_CENTS,
      aiSource: "default",
      variableCents: 230 + DEFAULT_AI_COST_PER_CLIENT_CENTS,
      variableSource: "computed",
    });
  });

  it("uses the real average and the measured AI cost when there are paying clients", () => {
    const revenue = revenueModel([sub("a"), sub("b", { plan: "starter" })], [], new Set(), NOW);
    const assumptions = resolveAssumptions({
      arpu: undefined,
      variable: undefined,
      revenue,
      aiPerClient: { cents: 12, sample: 2 },
    });
    expect(assumptions.arpuCents).toBe(5400);
    expect(assumptions.arpuSource).toBe("actual");
    expect(assumptions.aiSource).toBe("actual");
    expect(assumptions.variableCents).toBe(stripeFeeCents(5400) + 12);
  });

  it("lets the admin override ARPU and the variable cost", () => {
    const assumptions = resolveAssumptions({
      arpu: "100",
      variable: "10",
      revenue: { mrrCents: 0, accounts: [] },
      aiPerClient: null,
    });
    expect(assumptions).toMatchObject({
      arpuCents: 10_000,
      arpuSource: "custom",
      variableCents: 1000,
      variableSource: "custom",
    });
    // Só o ARPU trocado: a taxa do Stripe acompanha.
    const onlyArpu = resolveAssumptions({
      arpu: "100",
      variable: "",
      revenue: { mrrCents: 0, accounts: [] },
      aiPerClient: null,
    });
    expect(onlyArpu.variableCents).toBe(stripeFeeCents(10_000) + DEFAULT_AI_COST_PER_CLIENT_CENTS);
  });
});

describe("break-even and projection", () => {
  it("rounds the clients needed up", () => {
    expect(breakEvenClients(10_000, 6900, 900)).toBe(2); // 10000 / 6000 = 1.67
    expect(breakEvenClients(12_000, 6900, 900)).toBe(2);
    expect(breakEvenClients(12_001, 6900, 900)).toBe(3);
  });

  it("needs no clients without fixed costs and never breaks even when clients cost more than they pay", () => {
    expect(breakEvenClients(0, 6900, 900)).toBe(0);
    expect(breakEvenClients(10_000, 900, 900)).toBeNull();
    expect(breakEvenClients(10_000, 500, 900)).toBeNull();
    // Sem custo fixo, mas cada cliente dá prejuízo: também nunca empata.
    expect(breakEvenClients(0, 500, 900)).toBeNull();
  });

  it("projects to max(2 × break-even, current + 10, 20), rounded to an axis mark", () => {
    expect(projectionMaxClients(3, 0)).toBe(20);
    expect(projectionMaxClients(null, 0)).toBe(20);
    expect(projectionMaxClients(12, 18)).toBe(30); // 28 → 30
    expect(projectionMaxClients(40, 5)).toBe(80);
    expect(projectionMaxClients(10_000, 0)).toBe(MAX_PROJECTION_CLIENTS);
  });

  it("computes revenue, cost and profit for every client count", () => {
    const series = projectionSeries(10_000, 6900, 900, 20);
    expect(series).toHaveLength(21);
    expect(series[0]).toEqual({
      clients: 0,
      revenueCents: 0,
      costCents: 10_000,
      profitCents: -10_000,
    });
    expect(series[2]).toEqual({
      clients: 2,
      revenueCents: 13_800,
      costCents: 11_800,
      profitCents: 2_000,
    });
  });

  it("picks round axis steps", () => {
    expect(niceStep(4)).toBe(5);
    expect(niceStep(0.3)).toBeCloseTo(0.5);
    expect(niceStep(1500)).toBe(2000);
    expect(niceStep(0)).toBe(1);
    expect(axisTicks(37, 4)).toEqual([0, 10, 20, 30, 40]);
    expect(axisTicks(0, 4)).toEqual([0, 1]);
  });

  it("summarizes the page numbers", () => {
    const revenue = revenueModel([sub("a"), sub("b")], [], new Set(), NOW);
    const summary = summarizeFinance({
      expenses: [
        expense({ amountCents: 30_000 }),
        expense({ frequency: "one_time", amountCents: 80_000, startsOn: "2026-02-01" }),
      ],
      today: TODAY,
      revenue,
      aiPerClient: { cents: 70, sample: 2 },
      params: {},
    });
    // ARPU 69, variável 2.30 + 0.70 = 3.00 → margem 66 → ⌈300 / 66⌉ = 5 clientes.
    expect(summary).toMatchObject({
      fixedMonthlyCents: 30_000,
      oneTimeSpentCents: 80_000,
      activeRecurring: 1,
      payingClients: 2,
      mrrCents: 13_800,
      marginCents: 6600,
      breakEven: 5,
      toGo: 3,
      profitCents: 13_800 - 30_000 - 2 * 300,
      maxClients: 20,
    });
    expect(summary.projection).toHaveLength(21);
  });
});

describe("expenses in the store", () => {
  beforeEach(() => resetMemoryExpenseStore());

  it("creates, lists, updates and deletes", async () => {
    const created = await createExpense(
      { name: "Supabase", category: "database", amountCents: 2500, frequency: "monthly" },
      TODAY,
    );
    expect(created).toMatchObject({ startsOn: TODAY, endsOn: null, notes: "" });
    expect(await listExpenses()).toHaveLength(1);

    const updated = await updateExpense(created.id, { amountCents: 3000, endsOn: "2026-12-31" });
    expect(updated).toMatchObject({ amountCents: 3000, endsOn: "2026-12-31", name: "Supabase" });

    expect(await deleteExpense(created.id)).toBe(true);
    expect(await deleteExpense(created.id)).toBe(false);
    expect(await listExpenses()).toEqual([]);
  });

  it("drops the end date of one-time costs", async () => {
    const created = await createExpense(
      {
        name: "LLC filing",
        category: "legal_accounting",
        amountCents: 50_000,
        frequency: "one_time",
        startsOn: "2026-03-01",
        endsOn: "2026-04-01",
      },
      TODAY,
    );
    expect(created.endsOn).toBeNull();

    const recurring = await createExpense(
      {
        name: "Google Workspace",
        category: "email",
        amountCents: 700,
        frequency: "monthly",
        endsOn: "2027-01-01",
      },
      TODAY,
    );
    const changed = await updateExpense(recurring.id, { frequency: "one_time" });
    expect(changed?.endsOn).toBeNull();
  });

  it("refuses an end date before the start, checking what was already saved", async () => {
    await expect(
      createExpense(
        {
          name: "X",
          category: "other",
          amountCents: 1,
          frequency: "monthly",
          endsOn: "2026-01-01",
        },
        TODAY,
      ),
    ).rejects.toBeInstanceOf(ExpenseInputError);

    const created = await createExpense(
      {
        name: "X",
        category: "other",
        amountCents: 1,
        frequency: "monthly",
        startsOn: "2026-05-01",
      },
      TODAY,
    );
    await expect(updateExpense(created.id, { endsOn: "2026-04-30" })).rejects.toBeInstanceOf(
      ExpenseInputError,
    );
    expect(await updateExpense(crypto.randomUUID(), { amountCents: 5 })).toBeNull();
  });
});
