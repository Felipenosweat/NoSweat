import { describe, expect, it } from "vitest";
import { ConvertEstimateRequest, LineItem, RespondEstimateRequest, computeTotals } from "./index";

const item = (quantity: number, unitPriceCents: number, taxable = true) => ({
  quantity,
  unitPriceCents,
  taxable,
});

describe("computeTotals", () => {
  it("returns zeros for an empty document", () => {
    expect(computeTotals([], 825, 500)).toEqual({
      subtotalCents: 0,
      discountCents: 0,
      taxCents: 0,
      totalCents: 0,
    });
  });

  it("rounds each line and the tax to the cent", () => {
    // 1.5 × $33.33 = 4999.5 → 5000; imposto 8.25% de 5000 = 412.5 → 413.
    expect(computeTotals([item(1.5, 3_333)], 825)).toEqual({
      subtotalCents: 5_000,
      discountCents: 0,
      taxCents: 413,
      totalCents: 5_413,
    });
  });

  it("taxes only taxable lines, after a proportional discount", () => {
    // Tributável 15000 de 20000; desconto 2000 → tributável 13500 → 8.25% = 1113.75 → 1114.
    expect(computeTotals([item(1.5, 10_000), item(1, 5_000, false)], 825, 2_000)).toEqual({
      subtotalCents: 20_000,
      discountCents: 2_000,
      taxCents: 1_114,
      totalCents: 19_114,
    });
  });

  it("never discounts more than the subtotal or below zero", () => {
    expect(computeTotals([item(1, 1_000)], 1000, 5_000)).toEqual({
      subtotalCents: 1_000,
      discountCents: 1_000,
      taxCents: 0,
      totalCents: 0,
    });
    expect(computeTotals([item(1, 1_000)], 0, -50).discountCents).toBe(0);
  });

  it("keeps floating point noise out of line totals", () => {
    // 1.15 × 100 = 114.99999999999999 em ponto flutuante.
    expect(computeTotals([item(1.15, 100)], 0).subtotalCents).toBe(115);
  });
});

describe("office request schemas", () => {
  it("fills line defaults", () => {
    const parsed = LineItem.parse({
      priceItemId: null,
      name: " Labor ",
      quantity: 1,
      unitPriceCents: 0,
    });
    expect(parsed).toEqual({
      priceItemId: null,
      name: "Labor",
      description: "",
      quantity: 1,
      unitPriceCents: 0,
      taxable: true,
    });
  });

  it("converts to a job by default and needs at least one target", () => {
    expect(ConvertEstimateRequest.parse({})).toEqual({ createJob: true, createInvoice: false });
    expect(ConvertEstimateRequest.safeParse({ createJob: false }).success).toBe(false);
  });

  it("requires a name to approve", () => {
    expect(RespondEstimateRequest.safeParse({ decision: "approve", name: " " }).success).toBe(
      false,
    );
    expect(RespondEstimateRequest.safeParse({ decision: "decline" }).success).toBe(true);
  });
});
