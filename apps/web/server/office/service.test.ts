import { fixtures } from "@nosweat/fixtures";
import type { LineItem } from "@nosweat/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEV_USER } from "../auth/session";
import {
  addClientActivity,
  CLIENT_HAS_DOCUMENTS,
  createClient,
  deleteClient,
} from "../clients/service";
import { getClientStore, resetMemoryClientStore } from "../clients/store";
import { getSiteStore } from "../store";
import {
  addDays,
  convertEstimate,
  createEstimate,
  createInvoice,
  createJob,
  createPriceItem,
  createTeamMember,
  deleteInvoice,
  deleteJob,
  deletePayment,
  duplicateEstimate,
  duplicateInvoice,
  estimateStatus,
  getEstimate,
  getInvoice,
  getJob,
  getOfficeSummary,
  getPublicEstimate,
  getPublicInvoice,
  getSettings,
  invoiceStatus,
  listEstimates,
  listInvoices,
  listJobs,
  markInvoicePaid,
  recordPayment,
  reopenEstimate,
  respondToEstimate,
  sendEstimate,
  sendInvoice,
  todayIn,
  updateEstimate,
  updateInvoice,
  updateJob,
  updateSettings,
} from "./service";
import { getOfficeStore, resetMemoryOfficeStore } from "./store";
import { isPublicToken } from "./tokens";
import { OfficeError } from "./types";

// Sem Supabase: tudo em memória. O dono principal é o DEV_USER; "outro dono" é só um id
// diferente (o service recebe o dono, não lê a sessão).

const OWNER = DEV_USER.id;
const OTHER = "someone-else";
const ORIGIN = "https://nosweatfd.com";
const today = () => todayIn("America/New_York");

function line(over: Partial<LineItem> = {}): LineItem {
  return {
    priceItemId: null,
    name: "Service call",
    description: "",
    quantity: 1,
    unitPriceCents: 10_000,
    taxable: true,
    ...over,
  };
}

async function newClient(owner = OWNER, name = "Ana Lima") {
  return createClient(owner, { name, email: `${name.replace(/\W/g, "").toLowerCase()}@x.test` });
}

/** Espera um OfficeError com o status pedido. */
async function expectOfficeError(promise: Promise<unknown>, status: number): Promise<void> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(OfficeError);
  expect((error as OfficeError).status).toBe(status);
}

beforeEach(() => {
  resetMemoryOfficeStore();
  resetMemoryClientStore();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("dates", () => {
  it("adds days across months and leap years", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("computes expired and partial/overdue on read", () => {
    expect(estimateStatus({ status: "sent", validUntil: "2026-10-25" }, "2026-10-26")).toBe(
      "expired",
    );
    expect(estimateStatus({ status: "sent", validUntil: "2026-10-26" }, "2026-10-26")).toBe("sent");
    expect(estimateStatus({ status: "approved", validUntil: "2020-01-01" }, "2026-10-26")).toBe(
      "approved",
    );
    const sent = { status: "sent", totalCents: 1_000 } as const;
    expect(invoiceStatus({ ...sent, dueOn: "2026-10-27" }, 0, "2026-10-26")).toBe("sent");
    expect(invoiceStatus({ ...sent, dueOn: "2026-10-27" }, 100, "2026-10-26")).toBe("partial");
    expect(invoiceStatus({ ...sent, dueOn: "2026-10-25" }, 100, "2026-10-26")).toBe("overdue");
    expect(
      invoiceStatus({ status: "paid", dueOn: "2020-01-01", totalCents: 100 }, 100, "2026-10-26"),
    ).toBe("paid");
  });

  it("shows a sent $0 invoice as paid (even past due), but keeps a $0 draft a draft", () => {
    expect(
      invoiceStatus({ status: "sent", dueOn: "2026-10-27", totalCents: 0 }, 0, "2026-10-26"),
    ).toBe("paid");
    expect(
      invoiceStatus({ status: "sent", dueOn: "2020-01-01", totalCents: 0 }, 0, "2026-10-26"),
    ).toBe("paid");
    expect(invoiceStatus({ status: "draft", dueOn: null, totalCents: 0 }, 0, "2026-10-26")).toBe(
      "draft",
    );
    expect(invoiceStatus({ status: "void", dueOn: null, totalCents: 0 }, 0, "2026-10-26")).toBe(
      "void",
    );
  });
});

describe("settings", () => {
  it("defaults to the owner's latest site and the social time zone", async () => {
    const owner = "settings-owner";
    await getSiteStore().create(fixtures["joes-plumbing"], owner);
    const settings = await getSettings(owner);
    expect(settings.companyName).toBe("Joe's Plumbing");
    expect(settings.phone).toBe("(512) 555-0142");
    expect(settings.email).toBe("service@joesplumbing.example.com");
    expect(settings.address).toContain("Austin, TX");
    expect(settings.timeZone).toBe("America/New_York");
    expect(settings.invoiceDueDays).toBe(14);
    expect(settings.estimateValidDays).toBe(30);
  });

  it("starts empty without a site and saves changes", async () => {
    const settings = await getSettings("no-site-owner");
    expect(settings.companyName).toBe("");
    expect(settings.phone).toBeNull();

    const updated = await updateSettings("no-site-owner", {
      companyName: "Ana's Cleaning",
      email: "",
      defaultTaxRateBps: 825,
      timeZone: "America/Chicago",
    });
    expect(updated.companyName).toBe("Ana's Cleaning");
    expect(updated.email).toBeNull();
    expect(updated.defaultTaxRateBps).toBe(825);
    expect((await getSettings("no-site-owner")).timeZone).toBe("America/Chicago");
    await expectOfficeError(updateSettings("no-site-owner", { timeZone: "Mars/Base" }), 400);
  });
});

describe("numbers and totals", () => {
  it("numbers each kind per owner from 1001", async () => {
    const client = await newClient();
    const e1 = await createEstimate(OWNER, { clientId: client.id });
    const e2 = await createEstimate(OWNER, { clientId: client.id });
    const j1 = await createJob(OWNER, { clientId: client.id, title: "Fix sink" });
    const i1 = await createInvoice(OWNER, { clientId: client.id });
    expect([e1.number, e2.number, j1.number, i1.number]).toEqual([1001, 1002, 1001, 1001]);
    expect(isPublicToken(e1.publicToken)).toBe(true);
    expect(e1.publicToken).not.toBe(e2.publicToken);

    const other = await newClient(OTHER, "Other Person");
    expect((await createEstimate(OTHER, { clientId: other.id })).number).toBe(1001);
  });

  it("computes totals on the server with discount and tax rounding", async () => {
    const client = await newClient();
    const estimate = await createEstimate(OWNER, {
      clientId: client.id,
      items: [
        line({ quantity: 1.5, unitPriceCents: 10_000 }),
        line({ name: "Parts", unitPriceCents: 5_000, taxable: false }),
      ],
      taxRateBps: 825,
      discountCents: 2_000,
    });
    // Tributável depois do desconto: 15000 − 2000 × 15000/20000 = 13500 → imposto 1113,75 → 1114.
    expect(estimate.subtotalCents).toBe(20_000);
    expect(estimate.discountCents).toBe(2_000);
    expect(estimate.taxCents).toBe(1_114);
    expect(estimate.totalCents).toBe(19_114);

    // O desconto nunca passa do subtotal; trocar as linhas recalcula.
    const updated = await updateEstimate(OWNER, estimate.id, {
      items: [line({ unitPriceCents: 1_000 })],
    });
    expect(updated?.subtotalCents).toBe(1_000);
    expect(updated?.discountCents).toBe(1_000);
    expect(updated?.totalCents).toBe(0);
  });

  it("uses the default tax rate and keeps only the owner's price items", async () => {
    await updateSettings(OWNER, { defaultTaxRateBps: 500 });
    const item = await createPriceItem(OWNER, { name: "Drain clean", unitPriceCents: 12_500 });
    const client = await newClient();
    const estimate = await createEstimate(OWNER, {
      clientId: client.id,
      items: [line({ priceItemId: item.id }), line({ priceItemId: "not-mine", quantity: 2.333 })],
    });
    expect(estimate.taxRateBps).toBe(500);
    expect(estimate.items[0]?.priceItemId).toBe(item.id);
    expect(estimate.items[1]?.priceItemId).toBeNull();
    expect(estimate.items[1]?.quantity).toBe(2.33);
  });
});

describe("estimate lifecycle", () => {
  it("sends, moves the client to quoted, and accepts one approval", async () => {
    const client = await newClient();
    const draft = await createEstimate(OWNER, { clientId: client.id, items: [line()] });
    expect(draft.status).toBe("draft");
    expect(await getPublicEstimate(draft.publicToken)).toBeNull();

    const sent = await sendEstimate(OWNER, draft.id, `${ORIGIN}/`);
    expect(sent?.url).toBe(`${ORIGIN}/q/${draft.publicToken}`);
    expect(sent?.estimate.status).toBe("sent");
    expect(sent?.estimate.sentAt).not.toBeNull();
    expect(sent?.estimate.validUntil).toBe(addDays(today(), 30));
    expect((await getClientStore().getClient(OWNER, client.id))?.stage).toBe("quoted");

    const view = await getPublicEstimate(draft.publicToken);
    expect(view?.status).toBe("sent");
    expect(view?.client.name).toBe("Ana Lima");
    expect(view?.items[0]).not.toHaveProperty("priceItemId");

    const approved = await respondToEstimate(draft.publicToken, {
      decision: "approve",
      name: "Ana Lima",
    });
    expect(approved?.status).toBe("approved");
    expect(approved?.approvedByName).toBe("Ana Lima");
    expect((await getClientStore().getClient(OWNER, client.id))?.stage).toBe("won");

    // Segunda resposta (mesmo que recusa): conflito.
    await expectOfficeError(respondToEstimate(draft.publicToken, { decision: "decline" }), 409);
    // Aprovado não muda mais as linhas.
    await expectOfficeError(updateEstimate(OWNER, draft.id, { items: [line()] }), 409);
  });

  it("does not send an empty estimate", async () => {
    const client = await newClient();
    const draft = await createEstimate(OWNER, { clientId: client.id });
    await expectOfficeError(sendEstimate(OWNER, draft.id, ORIGIN), 400);
  });

  it("expires after validUntil, refuses answers, and reopens when sent again", async () => {
    const client = await newClient();
    const draft = await createEstimate(OWNER, { clientId: client.id, items: [line()] });
    await sendEstimate(OWNER, draft.id, ORIGIN);
    const old = await updateEstimate(OWNER, draft.id, { validUntil: "2020-01-01" });
    expect(old?.status).toBe("expired");
    expect((await listEstimates(OWNER, { status: "expired" })).map((e) => e.id)).toEqual([
      draft.id,
    ]);
    await expectOfficeError(
      respondToEstimate(draft.publicToken, { decision: "approve", name: "Ana" }),
      409,
    );

    const resent = await sendEstimate(OWNER, draft.id, ORIGIN);
    expect(resent?.estimate.status).toBe("sent");
    expect(resent?.estimate.validUntil).toBe(addDays(today(), 30));
    const declined = await respondToEstimate(draft.publicToken, {
      decision: "decline",
      reason: "Too expensive",
    });
    expect(declined?.status).toBe("declined");
  });

  it("lets the owner mark an answer and only converts approved estimates", async () => {
    const client = await newClient();
    const estimate = await createEstimate(OWNER, {
      clientId: client.id,
      title: "Water heater",
      items: [line({ unitPriceCents: 150_000 })],
    });
    await expectOfficeError(
      convertEstimate(OWNER, estimate.id, { createJob: true, createInvoice: false }),
      409,
    );
    const marked = await updateEstimate(OWNER, estimate.id, { status: "approved" });
    expect(marked?.status).toBe("approved");
    expect(marked?.respondedAt).not.toBeNull();
    expect((await getClientStore().getClient(OWNER, client.id))?.stage).toBe("won");
  });
});

describe("convert", () => {
  it("creates a job and an invoice once and links everything", async () => {
    const client = await createClient(OWNER, {
      name: "Bob Stone",
      email: "bob@stone.test",
      address: "1 Main St",
    });
    const estimate = await createEstimate(OWNER, {
      clientId: client.id,
      title: "New faucet",
      items: [line({ unitPriceCents: 20_000 })],
      taxRateBps: 1000,
    });
    await updateEstimate(OWNER, estimate.id, { status: "approved" });

    const first = await convertEstimate(OWNER, estimate.id, {
      createJob: true,
      createInvoice: true,
    });
    expect(first?.job).not.toBeNull();
    expect(first?.invoice).not.toBeNull();
    const job = first!.job!;
    const invoice = first!.invoice!;
    expect(job.status).toBe("unscheduled");
    expect(job.title).toBe("New faucet");
    expect(job.valueCents).toBe(22_000);
    expect(job.address).toBe("1 Main St");
    expect(job.estimateId).toBe(estimate.id);
    expect(job.invoiceId).toBe(invoice.id);
    expect(first?.estimate.jobId).toBe(job.id);
    expect(invoice.items).toEqual(estimate.items);
    expect(invoice.totalCents).toBe(22_000);
    expect(invoice.status).toBe("draft");
    expect(invoice.jobId).toBe(job.id);
    expect(invoice.estimateId).toBe(estimate.id);
    expect(invoice.dueOn).toBe(addDays(today(), 14));

    const again = await convertEstimate(OWNER, estimate.id, {
      createJob: true,
      createInvoice: true,
    });
    expect(again?.job?.id).toBe(job.id);
    expect(again?.invoice?.id).toBe(invoice.id);
    expect(await listJobs(OWNER)).toHaveLength(1);
    expect(await listInvoices(OWNER)).toHaveLength(1);
  });
});

describe("invoices and payments", () => {
  async function sentInvoice(totalCents = 30_000) {
    const client = await newClient(OWNER, "Carla Diaz");
    const invoice = await createInvoice(OWNER, {
      clientId: client.id,
      items: [line({ unitPriceCents: totalCents })],
      taxRateBps: 0,
    });
    const sent = await sendInvoice(OWNER, invoice.id, ORIGIN);
    expect(sent?.url).toBe(`${ORIGIN}/i/${invoice.publicToken}`);
    return { client, invoice: sent!.invoice };
  }

  it("moves an old draft's dates to the day it is sent (never sent already overdue)", async () => {
    const client = await newClient(OWNER, "Carla Diaz");
    const issuedOn = addDays(today(), -20);
    const draft = await createInvoice(OWNER, {
      clientId: client.id,
      items: [line()],
      issuedOn,
      dueOn: addDays(issuedOn, 14),
    });
    const sent = await sendInvoice(OWNER, draft.id, ORIGIN);
    expect(sent?.invoice.issuedOn).toBe(today());
    expect(sent?.invoice.dueOn).toBe(addDays(today(), 14));
    expect(sent?.invoice.status).toBe("sent");
  });

  it("goes partial, refuses overpayment, then paid; deleting a payment reverts", async () => {
    const { client, invoice } = await sentInvoice();
    expect(invoice.status).toBe("sent");
    expect(invoice.dueOn).toBe(addDays(today(), 14));

    const partial = await recordPayment(OWNER, invoice.id, { amountCents: 10_000, method: "cash" });
    expect(partial?.status).toBe("partial");
    expect(partial?.amountPaidCents).toBe(10_000);
    expect(partial?.balanceCents).toBe(20_000);
    expect(partial?.payments[0]?.receivedOn).toBe(today());

    await expectOfficeError(
      recordPayment(OWNER, invoice.id, { amountCents: 20_001, method: "zelle" }),
      400,
    );
    // Com pagamento: linhas, anular e apagar ficam bloqueados.
    await expectOfficeError(updateInvoice(OWNER, invoice.id, { items: [line()] }), 409);
    await expectOfficeError(updateInvoice(OWNER, invoice.id, { status: "void" }), 409);
    await expectOfficeError(deleteInvoice(OWNER, invoice.id), 409);
    // Textos continuam editáveis.
    expect((await updateInvoice(OWNER, invoice.id, { message: "Thanks!" }))?.message).toBe(
      "Thanks!",
    );

    const paid = await recordPayment(OWNER, invoice.id, {
      amountCents: 20_000,
      method: "check",
      reference: "#123",
    });
    expect(paid?.status).toBe("paid");
    expect(paid?.paidAt).not.toBeNull();
    expect(paid?.balanceCents).toBe(0);
    await expectOfficeError(
      recordPayment(OWNER, invoice.id, { amountCents: 1, method: "cash" }),
      400,
    );

    // Cada pagamento entra no histórico do cliente como `payment`: soma no total, não é serviço.
    const updatedClient = await getClientStore().getClient(OWNER, client.id);
    expect(updatedClient?.totalJobsCents).toBe(30_000);
    expect(updatedClient?.jobsCount).toBe(0);
    const activities = await getClientStore().listActivities(OWNER, client.id);
    const payments = activities.filter((a) => a.body === `Payment for invoice #${invoice.number}`);
    expect(payments).toHaveLength(2);
    expect(payments.every((a) => a.kind === "payment")).toBe(true);
    expect(new Set(payments.map((a) => a.paymentId))).toEqual(
      new Set(paid!.payments.map((p) => p.id)),
    );

    const reverted = await deletePayment(OWNER, invoice.id, paid!.payments[1]!.id);
    expect(reverted?.status).toBe("partial");
    expect(reverted?.paidAt).toBeNull();
    expect(reverted?.balanceCents).toBe(20_000);
    await expectOfficeError(deletePayment(OWNER, invoice.id, "missing"), 404);
    // O item do pagamento apagado sai do histórico e o total do cliente cai junto.
    expect((await getClientStore().getClient(OWNER, client.id))?.totalJobsCents).toBe(10_000);
    const left = await getClientStore().listActivities(OWNER, client.id);
    expect(left.filter((a) => a.kind === "payment").map((a) => a.paymentId)).toEqual([
      paid!.payments[0]!.id,
    ]);

    const publicView = await getPublicInvoice(invoice.publicToken);
    expect(publicView?.amountPaidCents).toBe(10_000);
    expect(publicView?.status).toBe("partial");
  });

  it("shows overdue, voids without payments, shows voids publicly and hides drafts", async () => {
    const { invoice } = await sentInvoice(5_000);
    const overdue = await updateInvoice(OWNER, invoice.id, { dueOn: "2020-01-01" });
    expect(overdue?.status).toBe("overdue");
    expect((await listInvoices(OWNER, { status: "overdue" })).map((i) => i.id)).toEqual([
      invoice.id,
    ]);

    const voided = await updateInvoice(OWNER, invoice.id, { status: "void" });
    expect(voided?.status).toBe("void");
    // Anulada continua no link (a página mostra "canceled"); rascunho não.
    const publicVoid = await getPublicInvoice(invoice.publicToken);
    expect(publicVoid?.status).toBe("void");
    expect(publicVoid?.timeZone).toBe("America/New_York");
    await expectOfficeError(updateInvoice(OWNER, invoice.id, { title: "x" }), 409);
    await expectOfficeError(
      recordPayment(OWNER, invoice.id, { amountCents: 1, method: "cash" }),
      409,
    );

    const client = await newClient(OWNER, "Dan Ruiz");
    const draft = await createInvoice(OWNER, { clientId: client.id, items: [line()] });
    expect(await getPublicInvoice(draft.publicToken)).toBeNull();
    expect(await deleteInvoice(OWNER, draft.id)).toBe(true);
    expect(await getInvoice(OWNER, draft.id)).toBeNull();
  });
});

describe("jobs", () => {
  it("schedules, completes, filters by range and drops unknown assignees", async () => {
    const client = await newClient();
    const tech = await createTeamMember(OWNER, { name: "Tom Tech" });
    const helper = await createTeamMember(OWNER, { name: "Hal Helper" });
    expect(tech.color).toBe("blue");
    expect(helper.color).toBe("green");

    const job = await createJob(OWNER, {
      clientId: client.id,
      title: "Install",
      assigneeIds: [tech.id, "ghost", tech.id],
    });
    expect(job.status).toBe("unscheduled");
    expect(job.assigneeIds).toEqual([tech.id]);
    expect(job.clientName).toBe("Ana Lima");

    const scheduled = await updateJob(OWNER, job.id, {
      startAt: "2030-05-10T14:00:00-05:00",
      endAt: "2030-05-10T16:00:00-05:00",
    });
    expect(scheduled?.status).toBe("scheduled");
    expect(scheduled?.startAt).toBe("2030-05-10T19:00:00.000Z");
    await expectOfficeError(updateJob(OWNER, job.id, { endAt: "2030-05-10T13:00:00-05:00" }), 400);

    const floating = await createJob(OWNER, { clientId: client.id, title: "Someday" });

    const may10 = await listJobs(OWNER, { from: "2030-05-10", to: "2030-05-10" });
    expect(may10.map((j) => j.id)).toEqual([job.id]);
    expect(await listJobs(OWNER, { from: "2030-05-11", to: "2030-05-12" })).toEqual([]);
    expect(
      (await listJobs(OWNER, { from: "2030-05-11", status: "unscheduled" })).map((j) => j.id),
    ).toEqual([floating.id]);
    expect((await listJobs(OWNER)).map((j) => j.id)).toEqual([job.id, floating.id]);
    await expectOfficeError(listJobs(OWNER, { from: "soon" }), 400);

    const done = await updateJob(OWNER, job.id, { status: "done" });
    expect(done?.completedAt).not.toBeNull();
    const reopened = await updateJob(OWNER, job.id, { status: "in_progress" });
    expect(reopened?.completedAt).toBeNull();

    // Membro apagado some do job na leitura.
    await getOfficeStore().deleteTeamMember(OWNER, tech.id);
    expect((await getJob(OWNER, job.id))?.assigneeIds).toEqual([]);
  });
});

describe("owner isolation", () => {
  it("never shows or changes another owner's records", async () => {
    const mine = await newClient();
    const theirs = await newClient(OTHER, "Their Client");
    // Cliente de outro dono = 404 ao criar.
    await expectOfficeError(createEstimate(OWNER, { clientId: theirs.id }), 404);
    await expectOfficeError(createJob(OWNER, { clientId: theirs.id, title: "x" }), 404);

    const estimate = await createEstimate(OTHER, { clientId: theirs.id, items: [line()] });
    const invoice = await createInvoice(OTHER, { clientId: theirs.id, items: [line()] });
    const job = await createJob(OTHER, { clientId: theirs.id, title: "Their job" });

    expect(await getEstimate(OWNER, estimate.id)).toBeNull();
    expect(await updateEstimate(OWNER, estimate.id, { title: "x" })).toBeNull();
    expect(await sendEstimate(OWNER, estimate.id, ORIGIN)).toBeNull();
    expect(await getInvoice(OWNER, invoice.id)).toBeNull();
    expect(await recordPayment(OWNER, invoice.id, { amountCents: 1, method: "cash" })).toBeNull();
    expect(await getJob(OWNER, job.id)).toBeNull();
    expect(await deleteJob(OWNER, job.id)).toBe(false);
    expect(await listEstimates(OWNER)).toEqual([]);
    expect(await listInvoices(OWNER)).toEqual([]);
    expect(await listJobs(OWNER)).toEqual([]);
    // Job de outro dono não serve de vínculo.
    await expectOfficeError(createInvoice(OWNER, { clientId: mine.id, jobId: job.id }), 404);
  });
});

describe("summary", () => {
  it("counts today's jobs, awaiting estimates, unpaid and collected money", async () => {
    const client = await newClient();
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const end = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const todayJob = await createJob(OWNER, {
      clientId: client.id,
      title: "Now",
      startAt: start,
      endAt: end,
    });
    await createJob(OWNER, { clientId: client.id, title: "Later" });
    const done = await createJob(OWNER, { clientId: client.id, title: "Done" });
    await updateJob(OWNER, done.id, { status: "done" });

    const estimate = await createEstimate(OWNER, { clientId: client.id, items: [line()] });
    await sendEstimate(OWNER, estimate.id, ORIGIN);

    const invoice = await createInvoice(OWNER, {
      clientId: client.id,
      items: [line({ unitPriceCents: 8_000 })],
    });
    await sendInvoice(OWNER, invoice.id, ORIGIN);
    await recordPayment(OWNER, invoice.id, { amountCents: 3_000, method: "card" });
    const late = await createInvoice(OWNER, {
      clientId: client.id,
      items: [line({ unitPriceCents: 1_000 })],
      dueOn: "2020-01-01",
    });
    await sendInvoice(OWNER, late.id, ORIGIN);

    const summary = await getOfficeSummary(OWNER);
    expect(summary.todayJobs.map((j) => j.id)).toEqual([todayJob.id]);
    expect(summary.unscheduledJobs).toBe(1);
    expect(summary.jobsToInvoice).toBe(1);
    expect(summary.estimatesAwaiting).toBe(1);
    expect(summary.estimatesAwaitingCents).toBe(10_000);
    expect(summary.unpaidInvoices).toBe(2);
    expect(summary.unpaidCents).toBe(6_000);
    expect(summary.overdueInvoices).toBe(1);
    expect(summary.overdueCents).toBe(1_000);
    expect(summary.collectedThisMonthCents).toBe(3_000);
  });
});

// ---------- correções da 0023 ----------

/** Orçamento enviado (com uma linha) pronto para o cliente responder. */
async function sentEstimate(clientName = "Ana Lima") {
  const client = await newClient(OWNER, clientName);
  const draft = await createEstimate(OWNER, { clientId: client.id, items: [line()] });
  const sent = await sendEstimate(OWNER, draft.id, ORIGIN);
  return { client, estimate: sent!.estimate };
}

describe("deleting a client with office documents", () => {
  it("refuses with 409 while estimates, jobs or invoices exist", async () => {
    const client = await newClient();
    const estimate = await createEstimate(OWNER, { clientId: client.id });
    const error = await deleteClient(OWNER, client.id).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(OfficeError);
    expect((error as OfficeError).status).toBe(409);
    expect((error as OfficeError).message).toBe(CLIENT_HAS_DOCUMENTS);
    expect(await getEstimate(OWNER, estimate.id)).not.toBeNull();

    await getOfficeStore().deleteEstimate(OWNER, estimate.id);
    const job = await createJob(OWNER, { clientId: client.id, title: "Fix" });
    await expectOfficeError(deleteClient(OWNER, client.id), 409);
    await deleteJob(OWNER, job.id);

    // Só fatura anulada: apaga a fatura e o cliente.
    const invoice = await createInvoice(OWNER, { clientId: client.id, items: [line()] });
    await expectOfficeError(deleteClient(OWNER, client.id), 409);
    await updateInvoice(OWNER, invoice.id, { status: "void" });
    expect(await deleteClient(OWNER, client.id)).toBe(true);
    expect(await getInvoice(OWNER, invoice.id)).toBeNull();
    expect(await getClientStore().getClient(OWNER, client.id)).toBeNull();
  });

  it("still deletes a client without documents (and 404s someone else's)", async () => {
    const client = await newClient();
    expect(await deleteClient(OTHER, client.id)).toBe(false);
    expect(await deleteClient(OWNER, client.id)).toBe(true);
  });
});

describe("void invoices and job links", () => {
  it("unlinks jobs when voiding and relinks them on the next invoice", async () => {
    const client = await newClient();
    const job = await createJob(OWNER, { clientId: client.id, title: "Install" });
    const first = await createInvoice(OWNER, { clientId: client.id, jobId: job.id });
    expect((await getJob(OWNER, job.id))?.invoiceId).toBe(first.id);

    await updateInvoice(OWNER, first.id, { status: "void" });
    expect((await getJob(OWNER, job.id))?.invoiceId).toBeNull();

    const second = await createInvoice(OWNER, { clientId: client.id, jobId: job.id });
    expect((await getJob(OWNER, job.id))?.invoiceId).toBe(second.id);
  });

  it("relinks a job whose invoice was voided (data from before the fix) on create and convert", async () => {
    const client = await newClient();
    const estimate = await createEstimate(OWNER, { clientId: client.id, items: [line()] });
    await updateEstimate(OWNER, estimate.id, { status: "approved" });
    const first = await convertEstimate(OWNER, estimate.id, {
      createJob: true,
      createInvoice: true,
    });
    const jobId = first!.job!.id;
    // Fatura anulada por fora (sem soltar o job), como nos dados antigos.
    await getOfficeStore().updateInvoice(OWNER, first!.invoice!.id, { status: "void" });
    expect((await getJob(OWNER, jobId))?.invoiceId).toBe(first!.invoice!.id);

    const again = await convertEstimate(OWNER, estimate.id, {
      createJob: true,
      createInvoice: true,
    });
    expect(again?.invoice?.id).not.toBe(first!.invoice!.id);
    expect(again?.job?.id).toBe(jobId);
    expect(again?.job?.invoiceId).toBe(again?.invoice?.id);

    await getOfficeStore().updateInvoice(OWNER, again!.invoice!.id, { status: "void" });
    const manual = await createInvoice(OWNER, { clientId: client.id, jobId });
    expect((await getJob(OWNER, jobId))?.invoiceId).toBe(manual.id);
  });

  it("refuses a job from another client", async () => {
    const ana = await newClient();
    const bob = await newClient(OWNER, "Bob Stone");
    const job = await createJob(OWNER, { clientId: ana.id, title: "Ana's job" });
    await expectOfficeError(createInvoice(OWNER, { clientId: bob.id, jobId: job.id }), 400);
    await expectOfficeError(createEstimate(OWNER, { clientId: bob.id, jobId: job.id }), 400);
  });
});

describe("payments race", () => {
  it("never records more than the balance with two payments at once", async () => {
    const client = await newClient();
    const invoice = await createInvoice(OWNER, {
      clientId: client.id,
      items: [line({ unitPriceCents: 30_000 })],
      taxRateBps: 0,
    });
    const results = await Promise.allSettled([
      recordPayment(OWNER, invoice.id, { amountCents: 20_000, method: "cash" }),
      recordPayment(OWNER, invoice.id, { amountCents: 20_000, method: "zelle" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected");
    expect((rejected as PromiseRejectedResult).reason).toBeInstanceOf(OfficeError);
    expect(((rejected as PromiseRejectedResult).reason as OfficeError).status).toBe(400);

    const after = await getInvoice(OWNER, invoice.id);
    expect(after?.amountPaidCents).toBe(20_000);
    expect(after?.payments).toHaveLength(1);
    // Rascunho com pagamento vira enviado.
    expect(after?.status).toBe("partial");
  });
});

describe("client totals with payments", () => {
  it("counts payments as revenue but not as jobs", async () => {
    const client = await newClient();
    const invoice = await createInvoice(OWNER, {
      clientId: client.id,
      items: [line({ unitPriceCents: 5_000 })],
      taxRateBps: 0,
    });
    await recordPayment(OWNER, invoice.id, { amountCents: 5_000, method: "card" });
    const logged = await addClientActivity(OWNER, client.id, {
      kind: "job",
      body: "Gutter cleaning",
      amountCents: 2_000,
    });
    // O serviço manual não apaga o pagamento do total.
    expect(logged?.client.jobsCount).toBe(1);
    expect(logged?.client.totalJobsCents).toBe(7_000);
  });
});

describe("stale estimate answers", () => {
  it("rejects an approval of a version the customer did not see", async () => {
    const { estimate } = await sentEstimate();
    const seen = await getPublicEstimate(estimate.publicToken);
    expect(seen?.updatedAt).toBe(estimate.updatedAt);
    expect(seen?.timeZone).toBe("America/New_York");

    // O dono muda o preço de um orçamento enviado: continua enviado, versão nova.
    const edited = await updateEstimate(OWNER, estimate.id, {
      items: [line({ unitPriceCents: 99_000 })],
    });
    expect(edited?.status).toBe("sent");
    expect(edited?.updatedAt).not.toBe(estimate.updatedAt);

    const error = await respondToEstimate(estimate.publicToken, {
      decision: "approve",
      name: "Ana Lima",
      updatedAt: seen!.updatedAt,
    }).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(OfficeError);
    expect((error as OfficeError).status).toBe(409);
    expect((error as OfficeError).message).toBe(
      "This estimate was changed. Refresh to see the latest version.",
    );
    expect((await getEstimate(OWNER, estimate.id))?.status).toBe("sent");

    const fresh = await getPublicEstimate(estimate.publicToken);
    const approved = await respondToEstimate(estimate.publicToken, {
      decision: "approve",
      name: "Ana Lima",
      updatedAt: fresh!.updatedAt,
    });
    expect(approved?.status).toBe("approved");
    expect(approved?.totalCents).toBe(99_000);
  });

  it("shows the decline reason to the owner", async () => {
    const { estimate } = await sentEstimate();
    await respondToEstimate(estimate.publicToken, { decision: "decline", reason: "Too pricey" });
    expect((await getEstimate(OWNER, estimate.id))?.declineReason).toBe("Too pricey");
  });
});

describe("owner answer race", () => {
  it("returns 409 when the customer answered after the owner loaded the estimate", async () => {
    const { estimate } = await sentEstimate();
    const stale = await getOfficeStore().getEstimate(OWNER, estimate.id);
    await respondToEstimate(estimate.publicToken, { decision: "decline" });
    // O dono ainda tem a leitura antiga ("sent") quando marca "approved".
    vi.spyOn(getOfficeStore(), "getEstimate").mockResolvedValueOnce(stale);
    await expectOfficeError(updateEstimate(OWNER, estimate.id, { status: "approved" }), 409);
    expect((await getEstimate(OWNER, estimate.id))?.status).toBe("declined");
  });
});

describe("convert twice at once", () => {
  it("creates one job and one invoice", async () => {
    const client = await newClient();
    const estimate = await createEstimate(OWNER, { clientId: client.id, items: [line()] });
    await updateEstimate(OWNER, estimate.id, { status: "approved" });
    const both = { createJob: true, createInvoice: true };
    const [a, b] = await Promise.all([
      convertEstimate(OWNER, estimate.id, both),
      convertEstimate(OWNER, estimate.id, both),
    ]);
    expect(a?.job?.id).toBe(b?.job?.id);
    expect(a?.invoice?.id).toBe(b?.invoice?.id);
    expect(await listJobs(OWNER)).toHaveLength(1);
    expect(await listInvoices(OWNER)).toHaveLength(1);
    expect((await getEstimate(OWNER, estimate.id))?.jobId).toBe(a?.job?.id);
  });

  it("keeps one active invoice per estimate in the store", async () => {
    const client = await newClient();
    const estimate = await createEstimate(OWNER, { clientId: client.id, items: [line()] });
    await updateEstimate(OWNER, estimate.id, { status: "approved" });
    const result = await convertEstimate(OWNER, estimate.id, {
      createJob: false,
      createInvoice: true,
    });
    const stored = await getOfficeStore().getInvoice(OWNER, result!.invoice!.id);
    expect(stored).not.toBeNull();
    await expect(
      getOfficeStore().insertInvoice({ ...stored!, publicToken: "y".repeat(32) }),
    ).rejects.toThrow();
  });
});

describe("job status needs a start time", () => {
  it("refuses scheduled or in progress without startAt", async () => {
    const client = await newClient();
    const job = await createJob(OWNER, { clientId: client.id, title: "Someday" });
    await expectOfficeError(updateJob(OWNER, job.id, { status: "scheduled" }), 400);
    await expectOfficeError(updateJob(OWNER, job.id, { status: "in_progress" }), 400);
    const ok = await updateJob(OWNER, job.id, {
      status: "in_progress",
      startAt: "2030-01-15T09:00:00-05:00",
    });
    expect(ok?.status).toBe("in_progress");
    // Tirar o horário de um job em andamento também não pode.
    await expectOfficeError(updateJob(OWNER, job.id, { startAt: null }), 400);
    expect((await updateJob(OWNER, job.id, { status: "done" }))?.status).toBe("done");
  });
});

describe("totals cap", () => {
  it("refuses documents over $1,000,000", async () => {
    const client = await newClient();
    const huge = [line({ quantity: 2, unitPriceCents: 60_000_000 })];
    await expectOfficeError(createEstimate(OWNER, { clientId: client.id, items: huge }), 400);
    await expectOfficeError(createInvoice(OWNER, { clientId: client.id, items: huge }), 400);
    const estimate = await createEstimate(OWNER, { clientId: client.id, items: [line()] });
    await expectOfficeError(updateEstimate(OWNER, estimate.id, { items: huge }), 400);
    // Exatamente US$ 1.000.000 passa.
    const max = await createInvoice(OWNER, {
      clientId: client.id,
      items: [line({ unitPriceCents: 100_000_000 })],
      taxRateBps: 0,
    });
    expect(max.totalCents).toBe(100_000_000);
    // Nenhum número foi gasto nas recusadas.
    expect(max.number).toBe(1001);
  });
});

describe("pure reads", () => {
  it("do not create the settings row", async () => {
    const owner = "reader-only";
    expect((await getSettings(owner)).invoiceDueDays).toBe(14);
    await listEstimates(owner);
    await listInvoices(owner);
    await listJobs(owner);
    await getOfficeSummary(owner);
    expect(await getOfficeStore().getSettings(owner)).toBeNull();

    await updateSettings(owner, { companyName: "Saved" });
    expect((await getOfficeStore().getSettings(owner))?.companyName).toBe("Saved");
  });
});

// ---------- duplicar, reabrir e "Mark as paid" ----------

describe("duplicate", () => {
  it("copies an answered estimate into a fresh draft without job, answer or validity", async () => {
    const client = await newClient();
    const item = await createPriceItem(OWNER, { name: "Drain clean", unitPriceCents: 12_500 });
    const source = await createEstimate(OWNER, {
      clientId: client.id,
      title: "Kitchen drain",
      items: [
        line({ priceItemId: item.id, unitPriceCents: 12_500 }),
        line({ name: "Parts", taxable: false }),
      ],
      taxRateBps: 825,
      discountCents: 1_500,
      message: "Thanks for asking!",
    });
    await sendEstimate(OWNER, source.id, ORIGIN);
    await respondToEstimate(source.publicToken, { decision: "approve", name: "Ana Lima" });
    const converted = await convertEstimate(OWNER, source.id, {
      createJob: true,
      createInvoice: false,
    });
    expect(converted?.job).not.toBeNull();
    const before = await getEstimate(OWNER, source.id);

    const copy = await duplicateEstimate(OWNER, source.id);
    expect(copy).not.toBeNull();
    expect(copy!.id).not.toBe(source.id);
    expect(copy!.number).toBe(source.number + 1);
    expect(copy!.status).toBe("draft");
    expect(copy!.publicToken).not.toBe(source.publicToken);
    expect(isPublicToken(copy!.publicToken)).toBe(true);
    expect(copy!.clientId).toBe(client.id);
    expect(copy!.title).toBe("Kitchen drain");
    expect(copy!.items).toEqual(source.items);
    expect(copy!.items[0]?.priceItemId).toBe(item.id);
    expect(copy!.taxRateBps).toBe(825);
    expect(copy!.discountCents).toBe(1_500);
    expect(copy!.totalCents).toBe(source.totalCents);
    expect(copy!.message).toBe("Thanks for asking!");
    expect(copy!.jobId).toBeNull();
    expect(copy!.validUntil).toBeNull();
    expect(copy!.sentAt).toBeNull();
    expect(copy!.respondedAt).toBeNull();
    expect(copy!.approvedByName).toBeNull();
    // A cópia é rascunho (fora do link) e o original não muda.
    expect(await getPublicEstimate(copy!.publicToken)).toBeNull();
    expect(await getEstimate(OWNER, source.id)).toEqual(before);
  });

  it("copies a paid invoice into a draft dated today, without links or payments", async () => {
    await updateSettings(OWNER, { invoiceDueDays: 7 });
    const client = await newClient();
    const estimate = await createEstimate(OWNER, {
      clientId: client.id,
      title: "Faucet",
      items: [line()],
      taxRateBps: 500,
    });
    await updateEstimate(OWNER, estimate.id, { status: "approved" });
    const converted = await convertEstimate(OWNER, estimate.id, {
      createJob: true,
      createInvoice: true,
    });
    const source = converted!.invoice!;
    await updateInvoice(OWNER, source.id, {
      message: "Pay by Zelle",
      issuedOn: addDays(today(), -40),
      dueOn: addDays(today(), -30),
    });
    await recordPayment(OWNER, source.id, { amountCents: source.totalCents, method: "zelle" });

    const copy = await duplicateInvoice(OWNER, source.id);
    expect(copy).not.toBeNull();
    expect(copy!.number).toBe(source.number + 1);
    expect(copy!.status).toBe("draft");
    expect(copy!.publicToken).not.toBe(source.publicToken);
    expect(copy!.clientId).toBe(client.id);
    expect(copy!.title).toBe("Faucet");
    expect(copy!.items).toEqual(source.items);
    expect(copy!.taxRateBps).toBe(500);
    expect(copy!.totalCents).toBe(source.totalCents);
    expect(copy!.message).toBe("Pay by Zelle");
    expect(copy!.jobId).toBeNull();
    expect(copy!.estimateId).toBeNull();
    expect(copy!.payments).toEqual([]);
    expect(copy!.amountPaidCents).toBe(0);
    expect(copy!.balanceCents).toBe(copy!.totalCents);
    expect(copy!.issuedOn).toBe(today());
    expect(copy!.dueOn).toBe(addDays(today(), 7));
    expect(copy!.sentAt).toBeNull();
    expect(copy!.paidAt).toBeNull();
    // O job continua com a fatura original, que continua paga.
    expect((await getJob(OWNER, converted!.job!.id))?.invoiceId).toBe(source.id);
    expect((await getInvoice(OWNER, source.id))?.status).toBe("paid");
  });

  it("copies void invoices and never another owner's documents", async () => {
    const client = await newClient();
    const invoice = await createInvoice(OWNER, { clientId: client.id, items: [line()] });
    await sendInvoice(OWNER, invoice.id, ORIGIN);
    await updateInvoice(OWNER, invoice.id, { status: "void" });
    const copy = await duplicateInvoice(OWNER, invoice.id);
    expect(copy?.status).toBe("draft");
    expect(copy?.number).toBe(invoice.number + 1);

    const estimate = await createEstimate(OWNER, { clientId: client.id, items: [line()] });
    expect(await duplicateInvoice(OTHER, invoice.id)).toBeNull();
    expect(await duplicateEstimate(OTHER, estimate.id)).toBeNull();
    expect(await duplicateEstimate(OWNER, "missing")).toBeNull();
    expect(await listEstimates(OTHER)).toEqual([]);
    expect(await listInvoices(OTHER)).toEqual([]);
  });
});

describe("reopen", () => {
  it("reopens an answer the owner marked; the customer can answer again", async () => {
    const { client, estimate } = await sentEstimate();
    const marked = await updateEstimate(OWNER, estimate.id, { status: "approved" });
    expect(marked?.status).toBe("approved");
    expect(marked?.approvedByName).toBeNull();

    const reopened = await reopenEstimate(OWNER, estimate.id);
    expect(reopened?.status).toBe("sent");
    expect(reopened?.respondedAt).toBeNull();
    expect(reopened?.approvedByName).toBeNull();
    expect(reopened?.declineReason).toBeNull();
    expect(reopened?.sentAt).toBe(estimate.sentAt);
    // A etapa do cliente não volta (pode estar em "won" por outro motivo).
    expect((await getClientStore().getClient(OWNER, client.id))?.stage).toBe("won");

    // O link volta a aceitar resposta; a resposta do cliente não se reabre.
    const approved = await respondToEstimate(estimate.publicToken, {
      decision: "approve",
      name: "Ana Lima",
    });
    expect(approved?.status).toBe("approved");
    await expectOfficeError(reopenEstimate(OWNER, estimate.id), 409);
    expect((await getEstimate(OWNER, estimate.id))?.approvedByName).toBe("Ana Lima");
  });

  it("reopens an owner-marked decline, never one sent through the link", async () => {
    const { estimate } = await sentEstimate();
    await updateEstimate(OWNER, estimate.id, { status: "declined" });
    expect((await reopenEstimate(OWNER, estimate.id))?.status).toBe("sent");

    // Recusa pelo link sem motivo grava "" (não se confunde com a marcada pelo dono).
    await respondToEstimate(estimate.publicToken, { decision: "decline" });
    expect((await getEstimate(OWNER, estimate.id))?.declineReason).toBe("");
    await expectOfficeError(reopenEstimate(OWNER, estimate.id), 409);

    const other = await sentEstimate("Bob Stone");
    await respondToEstimate(other.estimate.publicToken, {
      decision: "decline",
      reason: "Too pricey",
    });
    await expectOfficeError(reopenEstimate(OWNER, other.estimate.id), 409);
    expect((await getEstimate(OWNER, other.estimate.id))?.declineReason).toBe("Too pricey");
  });

  it("refuses while a job or an active invoice came from it", async () => {
    const { estimate } = await sentEstimate();
    await updateEstimate(OWNER, estimate.id, { status: "approved" });

    const withJob = await convertEstimate(OWNER, estimate.id, {
      createJob: true,
      createInvoice: false,
    });
    const jobError = await reopenEstimate(OWNER, estimate.id).then(
      () => null,
      (e: unknown) => e,
    );
    expect(jobError).toBeInstanceOf(OfficeError);
    expect((jobError as OfficeError).status).toBe(409);
    expect((jobError as OfficeError).message).toContain("has a job");
    await deleteJob(OWNER, withJob!.job!.id);

    const withInvoice = await convertEstimate(OWNER, estimate.id, {
      createJob: false,
      createInvoice: true,
    });
    await expectOfficeError(reopenEstimate(OWNER, estimate.id), 409);
    expect((await getEstimate(OWNER, estimate.id))?.status).toBe("approved");

    // Fatura anulada não segura mais o orçamento.
    await updateInvoice(OWNER, withInvoice!.invoice!.id, { status: "void" });
    expect((await reopenEstimate(OWNER, estimate.id))?.status).toBe("sent");
  });

  it("only reopens answered estimates; one never sent goes back to draft", async () => {
    const client = await newClient();
    const draft = await createEstimate(OWNER, { clientId: client.id, items: [line()] });
    await expectOfficeError(reopenEstimate(OWNER, draft.id), 409);

    await updateEstimate(OWNER, draft.id, { status: "approved" });
    const back = await reopenEstimate(OWNER, draft.id);
    expect(back?.status).toBe("draft");
    expect(await getPublicEstimate(draft.publicToken)).toBeNull();

    await sendEstimate(OWNER, draft.id, ORIGIN);
    await expectOfficeError(reopenEstimate(OWNER, draft.id), 409);
    expect(await reopenEstimate(OTHER, draft.id)).toBeNull();
    expect(await reopenEstimate(OWNER, "missing")).toBeNull();
  });

  it("returns 409 when the estimate changed after it was read", async () => {
    const { estimate } = await sentEstimate();
    await updateEstimate(OWNER, estimate.id, { status: "declined" });
    const stale = await getOfficeStore().getEstimate(OWNER, estimate.id);
    // Outra aba reabriu e marcou de novo no meio.
    await reopenEstimate(OWNER, estimate.id);
    await updateEstimate(OWNER, estimate.id, { status: "declined" });
    vi.spyOn(getOfficeStore(), "getEstimate").mockResolvedValueOnce(stale);
    await expectOfficeError(reopenEstimate(OWNER, estimate.id), 409);
    expect((await getEstimate(OWNER, estimate.id))?.status).toBe("declined");
  });
});

describe("mark as paid", () => {
  it("records the balance left as Other · Marked paid, only once", async () => {
    const client = await newClient();
    const invoice = await createInvoice(OWNER, {
      clientId: client.id,
      items: [line({ unitPriceCents: 30_000 })],
      taxRateBps: 0,
    });
    await sendInvoice(OWNER, invoice.id, ORIGIN);
    await recordPayment(OWNER, invoice.id, { amountCents: 25_000, method: "cash" });

    const paid = await markInvoicePaid(OWNER, invoice.id);
    expect(paid?.status).toBe("paid");
    expect(paid?.paidAt).not.toBeNull();
    expect(paid?.balanceCents).toBe(0);
    expect(paid?.payments).toHaveLength(2);
    const marked = paid!.payments[1]!;
    expect(marked.amountCents).toBe(5_000);
    expect(marked.method).toBe("other");
    expect(marked.reference).toBe("Marked paid");
    expect(marked.receivedOn).toBe(today());

    // Clique duplo: nada novo.
    const again = await markInvoicePaid(OWNER, invoice.id);
    expect(again?.status).toBe("paid");
    expect(again?.payments).toHaveLength(2);

    // Apagar o "Marked paid" desfaz.
    const undone = await deletePayment(OWNER, invoice.id, marked.id);
    expect(undone?.status).toBe("partial");
    expect(undone?.balanceCents).toBe(5_000);
  });

  it("closes a draft too, refuses void invoices and other owners", async () => {
    const client = await newClient();
    const draft = await createInvoice(OWNER, {
      clientId: client.id,
      items: [line()],
      taxRateBps: 0,
    });
    const paid = await markInvoicePaid(OWNER, draft.id);
    expect(paid?.status).toBe("paid");
    expect(paid?.amountPaidCents).toBe(10_000);

    const voided = await createInvoice(OWNER, { clientId: client.id, items: [line()] });
    await updateInvoice(OWNER, voided.id, { status: "void" });
    await expectOfficeError(markInvoicePaid(OWNER, voided.id), 409);
    expect(await markInvoicePaid(OTHER, draft.id)).toBeNull();
  });
});

describe("$0 invoices", () => {
  it("show as paid once sent: lists, summary and the public link", async () => {
    const client = await newClient();
    const invoice = await createInvoice(OWNER, {
      clientId: client.id,
      items: [line({ unitPriceCents: 0 })],
      dueOn: "2020-01-01",
    });
    expect(invoice.totalCents).toBe(0);
    expect(invoice.status).toBe("draft");

    const sent = await sendInvoice(OWNER, invoice.id, ORIGIN);
    expect(sent?.invoice.status).toBe("paid");
    expect(sent?.invoice.balanceCents).toBe(0);
    expect((await listInvoices(OWNER, { status: "paid" })).map((i) => i.id)).toEqual([invoice.id]);
    expect(await listInvoices(OWNER, { status: "overdue" })).toEqual([]);
    expect((await getPublicInvoice(invoice.publicToken))?.status).toBe("paid");
    const summary = await getOfficeSummary(OWNER);
    expect(summary.unpaidInvoices).toBe(0);
    expect(summary.overdueInvoices).toBe(0);

    // Nada a quitar: "Mark as paid" devolve como está, sem pagamento.
    const same = await markInvoicePaid(OWNER, invoice.id);
    expect(same?.status).toBe("paid");
    expect(same?.payments).toEqual([]);
  });
});
