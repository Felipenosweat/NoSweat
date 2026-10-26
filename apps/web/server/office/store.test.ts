import { describe, expect, it } from "vitest";
import { SupabaseOfficeStore } from "./store";

// O store do Supabase com um fetch de mentira: confere as URLs do PostgREST, os nomes das colunas
// (camelCase ↔ snake_case) e a RPC dos números.

const OWNER = "11111111-1111-4111-8111-111111111111";
const CLIENT = "22222222-2222-4222-8222-222222222222";
const JOB = "33333333-3333-4333-8333-333333333333";

type Call = { url: string; method: string; body: unknown; prefer: string | null };

function fakeStore(responses: unknown[]) {
  const calls: Call[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(String(init.body)) : null,
      prefer: headers.get("Prefer"),
    });
    const next = responses.shift();
    return new Response(next === undefined ? null : JSON.stringify(next), {
      status: next === undefined ? 204 : 200,
    });
  }) as typeof fetch;
  const store = new SupabaseOfficeStore(
    { url: "https://x.supabase.co/", serviceKey: "service-key" },
    fetchImpl,
  );
  return { store, calls };
}

const jobRow = {
  id: JOB,
  owner_id: OWNER,
  number: 1001,
  client_id: CLIENT,
  title: "Fix sink",
  description: "",
  status: "scheduled",
  start_at: "2030-01-15T14:00:00+00:00",
  end_at: null,
  address: null,
  assignee_ids: [],
  notes: "",
  estimate_id: null,
  invoice_id: null,
  value_cents: "12500",
  completed_at: null,
  created_at: "2026-10-26T12:00:00+00:00",
  updated_at: "2026-10-26T12:00:00+00:00",
};

describe("SupabaseOfficeStore", () => {
  it("reserves numbers through the RPC", async () => {
    const { store, calls } = fakeStore([1007]);
    expect(await store.nextNumber(OWNER, "invoice")).toBe(1007);
    expect(calls[0]?.url).toBe("https://x.supabase.co/rest/v1/rpc/office_next_number");
    expect(calls[0]?.body).toEqual({ p_owner: OWNER, p_kind: "invoice" });
  });

  it("writes snake_case columns and reads them back as records", async () => {
    const { store, calls } = fakeStore([[jobRow]]);
    const job = await store.insertJob({
      ownerId: OWNER,
      number: 1001,
      clientId: CLIENT,
      title: "Fix sink",
      description: "",
      status: "scheduled",
      startAt: "2030-01-15T14:00:00.000Z",
      endAt: null,
      address: null,
      assigneeIds: [],
      notes: "",
      estimateId: null,
      invoiceId: null,
      valueCents: 12_500,
      completedAt: null,
    });
    expect(calls[0]?.url).toBe("https://x.supabase.co/rest/v1/jobs");
    expect(calls[0]?.body).toEqual({
      owner_id: OWNER,
      number: 1001,
      client_id: CLIENT,
      title: "Fix sink",
      description: "",
      status: "scheduled",
      start_at: "2030-01-15T14:00:00.000Z",
      end_at: null,
      address: null,
      assignee_ids: [],
      notes: "",
      estimate_id: null,
      invoice_id: null,
      value_cents: 12_500,
      completed_at: null,
    });
    // bigint que volta como texto vira número.
    expect(job.valueCents).toBe(12_500);
    expect(job.clientId).toBe(CLIENT);
    expect(job.ownerId).toBe(OWNER);
  });

  it("guards the estimate answer by status and skips invalid ids", async () => {
    const { store, calls } = fakeStore([[]]);
    const result = await store.updateEstimate(
      OWNER,
      JOB,
      { status: "approved", approvedByName: "Ana" },
      "sent",
    );
    expect(result).toBeNull();
    expect(calls[0]?.method).toBe("PATCH");
    expect(calls[0]?.url).toBe(
      `https://x.supabase.co/rest/v1/estimates?id=eq.${JOB}&owner_id=eq.${OWNER}&status=eq.sent`,
    );
    expect(calls[0]?.body).toHaveProperty("approved_by_name");

    expect(await store.getJob("local-dev", JOB)).toBeNull();
    expect(await store.listJobs(OWNER, { clientId: "nope" })).toEqual([]);
    expect(calls).toHaveLength(1);
  });

  it("guards by version and by the linked job", async () => {
    const { store, calls } = fakeStore([[], []]);
    const seen = "2026-10-26T12:00:00.123+00:00";
    expect(
      await store.updateEstimate(
        OWNER,
        JOB,
        { status: "approved" },
        { status: "sent", updatedAt: seen },
      ),
    ).toBeNull();
    expect(calls[0]?.url).toBe(
      `https://x.supabase.co/rest/v1/estimates?id=eq.${JOB}&owner_id=eq.${OWNER}&status=eq.sent&updated_at=eq.${encodeURIComponent(seen)}`,
    );
    await store.updateEstimate(OWNER, JOB, { jobId: CLIENT }, { status: "approved", jobId: null });
    expect(calls[1]?.url).toBe(
      `https://x.supabase.co/rest/v1/estimates?id=eq.${JOB}&owner_id=eq.${OWNER}&status=eq.approved&job_id=is.null`,
    );
    // Versão que não é data nunca bate (e não chega ao banco).
    expect(await store.updateEstimate(OWNER, JOB, {}, { updatedAt: "nope" })).toBeNull();
    expect(calls).toHaveLength(2);
  });

  it("filters jobs by invoice and checks a client's documents", async () => {
    const { store, calls } = fakeStore([[jobRow], [], [], [{ id: JOB }]]);
    await store.listJobs(OWNER, { invoiceId: JOB });
    expect(calls[0]?.url).toContain(`&invoice_id=eq.${JOB}&`);
    expect(await store.clientHasDocuments(OWNER, CLIENT)).toBe(true);
    expect(calls[3]?.url).toBe(
      `https://x.supabase.co/rest/v1/invoices?owner_id=eq.${OWNER}&client_id=eq.${CLIENT}&select=id&limit=1&status=neq.void`,
    );
  });

  it("records payments through the atomic RPC and maps its errors", async () => {
    const paymentRow = {
      id: "44444444-4444-4444-8444-444444444444",
      owner_id: OWNER,
      invoice_id: JOB,
      amount_cents: 5_000,
      method: "cash",
      reference: "",
      received_on: "2026-10-26",
      created_at: "2026-10-26T12:00:00+00:00",
    };
    const invoiceRow = {
      id: JOB,
      owner_id: OWNER,
      number: 1001,
      client_id: CLIENT,
      job_id: null,
      estimate_id: null,
      title: "",
      status: "sent",
      items: [],
      tax_rate_bps: 0,
      subtotal_cents: 10_000,
      discount_cents: 0,
      tax_cents: 0,
      total_cents: 10_000,
      amount_paid_cents: 5_000,
      message: "",
      issued_on: "2026-10-26",
      due_on: null,
      public_token: "x".repeat(32),
      sent_at: null,
      paid_at: null,
      created_at: "2026-10-26T12:00:00+00:00",
      updated_at: "2026-10-26T12:00:00+00:00",
    };
    const replies: [number, unknown][] = [
      [200, { payment: paymentRow, invoice: invoiceRow }],
      [400, { code: "P0001", message: "office_payment_over_balance", details: "5000", hint: null }],
      [400, { code: "P0001", message: "office_invoice_void", details: null, hint: null }],
      [400, { code: "P0001", message: "office_invoice_not_found", details: null, hint: null }],
      [500, { message: "boom" }],
    ];
    const bodies: unknown[] = [];
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("https://x.supabase.co/rest/v1/rpc/office_record_payment");
      bodies.push(JSON.parse(String(init?.body)));
      const [status, body] = replies.shift()!;
      return new Response(JSON.stringify(body), { status });
    }) as typeof fetch;
    const store = new SupabaseOfficeStore(
      { url: "https://x.supabase.co", serviceKey: "service-key" },
      fetchImpl,
    );
    const payment = {
      ownerId: OWNER,
      invoiceId: JOB,
      amountCents: 5_000,
      method: "cash" as const,
      reference: "",
      receivedOn: "2026-10-26",
    };

    const ok = await store.recordPayment(payment);
    expect(bodies[0]).toEqual({
      p_owner: OWNER,
      p_invoice: JOB,
      p_amount: 5_000,
      p_method: "cash",
      p_reference: "",
      p_received_on: "2026-10-26",
    });
    expect(ok.ok && ok.payment.amountCents).toBe(5_000);
    expect(ok.ok && ok.invoice.amountPaidCents).toBe(5_000);
    expect(await store.recordPayment(payment)).toEqual({
      ok: false,
      reason: "over_balance",
      balanceCents: 5_000,
    });
    expect(await store.recordPayment(payment)).toEqual({ ok: false, reason: "void" });
    expect(await store.recordPayment(payment)).toEqual({ ok: false, reason: "not_found" });
    await expect(store.recordPayment(payment)).rejects.toThrow(/500/);
    // Id inválido nem chega ao banco.
    expect(await store.recordPayment({ ...payment, invoiceId: "nope" })).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(bodies).toHaveLength(5);
  });

  it("creates settings without overwriting existing ones", async () => {
    const settingsRow = {
      owner_id: OWNER,
      company_name: "Joe's",
      phone: null,
      email: null,
      address: null,
      default_tax_rate_bps: 0,
      invoice_due_days: 14,
      estimate_valid_days: 30,
      estimate_terms: "",
      payment_instructions: "",
      time_zone: "America/New_York",
      next_job_number: 1001,
      next_estimate_number: 1001,
      next_invoice_number: 1001,
      created_at: "2026-10-26T12:00:00+00:00",
      updated_at: "2026-10-26T12:00:00+00:00",
    };
    const { store, calls } = fakeStore([undefined, [settingsRow]]);
    const saved = await store.ensureSettings({
      ownerId: OWNER,
      companyName: "Joe's",
      phone: null,
      email: null,
      address: null,
      defaultTaxRateBps: 0,
      invoiceDueDays: 14,
      estimateValidDays: 30,
      estimateTerms: "",
      paymentInstructions: "",
      timeZone: "America/New_York",
    });
    expect(calls[0]?.url).toBe(
      "https://x.supabase.co/rest/v1/office_settings?on_conflict=owner_id",
    );
    expect(calls[0]?.prefer).toBe("resolution=ignore-duplicates,return=minimal");
    expect(saved.companyName).toBe("Joe's");
    expect(saved).not.toHaveProperty("nextJobNumber");
  });
});
