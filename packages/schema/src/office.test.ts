import { describe, expect, it } from "vitest";
import {
  ClientActivityKind,
  ConvertEstimateRequest,
  CreateInvoiceRequest,
  CreateJobRequest,
  Estimate,
  LineItem,
  RecordPaymentRequest,
  RespondEstimateRequest,
  UpdatePriceItemRequest,
  UpdateTeamMemberRequest,
  computeTotals,
  isCalendarDate,
} from "./index";

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

describe("office fixes (0023)", () => {
  it("rejects dates that are not on the calendar", () => {
    expect(isCalendarDate("2028-02-29")).toBe(true);
    expect(isCalendarDate("2026-02-29")).toBe(false);
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("2026-13-01")).toBe(false);
    expect(isCalendarDate("2026-04-31")).toBe(false);
    expect(
      RecordPaymentRequest.safeParse({ amountCents: 1, method: "cash", receivedOn: "2026-02-30" })
        .success,
    ).toBe(false);
    expect(CreateInvoiceRequest.safeParse({ clientId: "c", dueOn: "2026-12-31" }).success).toBe(
      true,
    );
    const bad = CreateInvoiceRequest.safeParse({ clientId: "c", issuedOn: "2026-02-30" });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues.map((i) => i.message)).toContain("That date doesn't exist.");
    // Formato errado continua com a mensagem do formato (e sem exceção).
    const format = CreateInvoiceRequest.safeParse({ clientId: "c", issuedOn: "soon" });
    expect(format.error?.issues.map((i) => i.message)).toContain("Use the YYYY-MM-DD format.");
  });

  it("compares job times as instants, not as text", () => {
    // 11:00+05:00 = 06:00Z, antes do início (10:00Z): o texto "11" > "10" enganava.
    expect(
      CreateJobRequest.safeParse({
        clientId: "c",
        title: "x",
        startAt: "2030-01-15T10:00:00Z",
        endAt: "2030-01-15T11:00:00+05:00",
      }).success,
    ).toBe(false);
    // 10:00+05:00 = 05:00Z, antes do fim (09:00Z).
    expect(
      CreateJobRequest.safeParse({
        clientId: "c",
        title: "x",
        startAt: "2030-01-15T10:00:00+05:00",
        endAt: "2030-01-15T09:00:00Z",
      }).success,
    ).toBe(true);
  });

  it("rejects empty price item and team updates", () => {
    const priceItem = UpdatePriceItemRequest.safeParse({});
    expect(priceItem.success).toBe(false);
    expect(priceItem.error?.issues[0]?.message).toBe("Nothing to update.");
    expect(UpdatePriceItemRequest.safeParse({ active: false }).success).toBe(true);
    expect(UpdateTeamMemberRequest.safeParse({}).success).toBe(false);
    expect(UpdateTeamMemberRequest.safeParse({ role: "Tech" }).success).toBe(true);
  });

  it("accepts the version the customer saw and the new optional fields", () => {
    const parsed = RespondEstimateRequest.parse({
      decision: "approve",
      name: "Ana Lima",
      updatedAt: "2026-10-26T12:00:00.000Z",
    });
    expect(parsed.updatedAt).toBe("2026-10-26T12:00:00.000Z");
    expect(
      RespondEstimateRequest.safeParse({ decision: "decline", updatedAt: "x".repeat(65) }).success,
    ).toBe(false);
    expect(Estimate.shape.declineReason.safeParse(undefined).success).toBe(true);
    expect(ClientActivityKind.options).toContain("payment");
  });
});
