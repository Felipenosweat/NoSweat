import { ApiError, EstimateResponse, InvoiceResponse } from "@nosweat/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { createClient } from "@/server/clients/service";
import { resetMemoryClientStore } from "@/server/clients/store";
import {
  createEstimate,
  createInvoice,
  recordPayment,
  sendEstimate,
  sendInvoice,
  updateEstimate,
} from "@/server/office/service";
import { resetMemoryOfficeStore } from "@/server/office/store";
import { POST as duplicateEstimateRoute } from "./estimates/[id]/duplicate/route";
import { POST as reopenRoute } from "./estimates/[id]/reopen/route";
import { POST as duplicateInvoiceRoute } from "./invoices/[id]/duplicate/route";
import { POST as markPaidRoute } from "./invoices/[id]/mark-paid/route";

// Rotas de duplicar, reabrir e "Mark as paid" (as regras estão em server/office/service.test.ts).
// Sem Supabase: o usuário é o DEV_USER ("local-dev") e tudo roda em memória.

const BASE = "http://localhost/api/office";
const OWNER = "local-dev";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const post = (path: string) => new Request(`${BASE}${path}`, { method: "POST" });
const line = {
  priceItemId: null,
  name: "Labor",
  description: "",
  quantity: 1,
  unitPriceCents: 9_000,
  taxable: true,
};

async function newClient() {
  return createClient(OWNER, { name: "Ana Lima", email: "ana@x.test" });
}

async function errorCode(res: Response): Promise<string> {
  return ApiError.parse(await res.json()).error.code;
}

beforeEach(() => {
  resetMemoryOfficeStore();
  resetMemoryClientStore();
});

describe("/api/office duplicate, reopen and mark-paid", () => {
  it("duplicates estimates and invoices with the create response shape", async () => {
    const client = await newClient();
    const estimate = await createEstimate(OWNER, { clientId: client.id, items: [line] });
    const res = await duplicateEstimateRoute(
      post(`/estimates/${estimate.id}/duplicate`),
      ctx(estimate.id),
    );
    expect(res.status).toBe(201);
    const copy = EstimateResponse.parse(await res.json()).estimate;
    expect(copy.status).toBe("draft");
    expect(copy.number).toBe(estimate.number + 1);

    const invoice = await createInvoice(OWNER, { clientId: client.id, items: [line] });
    const invoiceRes = await duplicateInvoiceRoute(
      post(`/invoices/${invoice.id}/duplicate`),
      ctx(invoice.id),
    );
    expect(invoiceRes.status).toBe(201);
    expect(InvoiceResponse.parse(await invoiceRes.json()).invoice.number).toBe(invoice.number + 1);

    expect((await duplicateEstimateRoute(post("/estimates/x/duplicate"), ctx("x"))).status).toBe(
      404,
    );
    expect((await duplicateInvoiceRoute(post("/invoices/x/duplicate"), ctx("x"))).status).toBe(404);
  });

  it("reopens an owner-marked answer and explains a refusal with 409", async () => {
    const client = await newClient();
    const estimate = await createEstimate(OWNER, { clientId: client.id, items: [line] });
    await sendEstimate(OWNER, estimate.id, "http://localhost");

    const notAnswered = await reopenRoute(
      post(`/estimates/${estimate.id}/reopen`),
      ctx(estimate.id),
    );
    expect(notAnswered.status).toBe(409);
    expect(await errorCode(notAnswered)).toBe("conflict");

    await updateEstimate(OWNER, estimate.id, { status: "declined" });
    const res = await reopenRoute(post(`/estimates/${estimate.id}/reopen`), ctx(estimate.id));
    expect(res.status).toBe(200);
    expect(EstimateResponse.parse(await res.json()).estimate.status).toBe("sent");
    expect((await reopenRoute(post("/estimates/x/reopen"), ctx("x"))).status).toBe(404);
  });

  it("marks the balance paid", async () => {
    const client = await newClient();
    const invoice = await createInvoice(OWNER, {
      clientId: client.id,
      items: [line],
      taxRateBps: 0,
    });
    await sendInvoice(OWNER, invoice.id, "http://localhost");
    await recordPayment(OWNER, invoice.id, { amountCents: 8_000, method: "cash" });

    const res = await markPaidRoute(post(`/invoices/${invoice.id}/mark-paid`), ctx(invoice.id));
    expect(res.status).toBe(200);
    const paid = InvoiceResponse.parse(await res.json()).invoice;
    expect(paid.status).toBe("paid");
    expect(paid.payments.map((p) => [p.amountCents, p.method, p.reference])).toEqual([
      [8_000, "cash", ""],
      [1_000, "other", "Marked paid"],
    ]);
    expect((await markPaidRoute(post("/invoices/x/mark-paid"), ctx("x"))).status).toBe(404);
  });
});
