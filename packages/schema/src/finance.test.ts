import { describe, expect, it } from "vitest";
import {
  CompanyExpense,
  CreateCompanyExpenseRequest,
  UpdateCompanyExpenseRequest,
  expenseDatesInOrder,
} from "./index";

const base = { name: "Vercel Pro", category: "hosting", amountCents: 2000, frequency: "monthly" };

describe("CreateCompanyExpenseRequest", () => {
  it("accepts a cost with only the required fields", () => {
    expect(CreateCompanyExpenseRequest.parse(base)).toEqual(base);
  });

  it("trims the name and refuses empty names, negative or fractional amounts and unknown values", () => {
    expect(CreateCompanyExpenseRequest.parse({ ...base, name: "  Vercel  " }).name).toBe("Vercel");
    for (const bad of [
      { ...base, name: "   " },
      { ...base, amountCents: -1 },
      { ...base, amountCents: 10.5 },
      { ...base, category: "rent" },
      { ...base, frequency: "weekly" },
      { ...base, startsOn: "2026-02-30" },
    ]) {
      expect(CreateCompanyExpenseRequest.safeParse(bad).success).toBe(false);
    }
  });

  it("refuses an end date before the start date", () => {
    const result = CreateCompanyExpenseRequest.safeParse({
      ...base,
      startsOn: "2026-05-01",
      endsOn: "2026-04-30",
    });
    expect(result.success).toBe(false);
    expect(
      CreateCompanyExpenseRequest.safeParse({
        ...base,
        startsOn: "2026-05-01",
        endsOn: "2026-05-01",
      }).success,
    ).toBe(true);
  });
});

describe("UpdateCompanyExpenseRequest", () => {
  it("needs at least one field and allows clearing the end date", () => {
    expect(UpdateCompanyExpenseRequest.safeParse({}).success).toBe(false);
    expect(UpdateCompanyExpenseRequest.parse({ endsOn: null })).toEqual({ endsOn: null });
  });
});

describe("CompanyExpense", () => {
  it("keeps the dates as plain YYYY-MM-DD text", () => {
    const expense = CompanyExpense.parse({
      ...base,
      id: "e1",
      startsOn: "2026-01-01",
      endsOn: null,
      notes: "",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    expect(expense.startsOn).toBe("2026-01-01");
    expect(expenseDatesInOrder("2026-01-01", null)).toBe(true);
    expect(expenseDatesInOrder("2026-01-02", "2026-01-01")).toBe(false);
  });
});
