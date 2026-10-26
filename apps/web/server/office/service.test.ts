import { fixtures } from "@nosweat/fixtures";
import type { LineItem } from "@nosweat/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { DEV_USER } from "../auth/session";
import { createClient } from "../clients/service";
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
  recordPayment,
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
    expect(invoiceStatus({ status: "sent", dueOn: "2026-10-27" }, 0, "2026-10-26")).toBe("sent");
    expect(invoiceStatus({ status: "sent", dueOn: "2026-10-27" }, 100, "2026-10-26")).toBe(
      "partial",
    );
    expect(invoiceStatus({ status: "sent", dueOn: "2026-10-25" }, 100, "2026-10-26")).toBe(
      "overdue",
    );
    expect(invoiceStatus({ status: "paid", dueOn: "2020-01-01" }, 100, "2026-10-26")).toBe("paid");
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
    await expectOfficeError(
      respondToEstimate(draft.publicToken, { decision: "decline" }),
      409,
    );
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

    // Cada pagamento entra no histórico do cliente como serviço.
    const updatedClient = await getClientStore().getClient(OWNER, client.id);
    expect(updatedClient?.totalJobsCents).toBe(30_000);
    const activities = await getClientStore().listActivities(OWNER, client.id);
    expect(activities.filter((a) => a.body === `Payment for invoice #${invoice.number}`)).toHaveLength(
      2,
    );

    const reverted = await deletePayment(OWNER, invoice.id, paid!.payments[1]!.id);
    expect(reverted?.status).toBe("partial");
    expect(reverted?.paidAt).toBeNull();
    expect(reverted?.balanceCents).toBe(20_000);
    await expectOfficeError(deletePayment(OWNER, invoice.id, "missing"), 404);

    const publicView = await getPublicInvoice(invoice.publicToken);
    expect(publicView?.amountPaidCents).toBe(10_000);
    expect(publicView?.status).toBe("partial");
  });

  it("shows overdue, voids without payments, and hides drafts and voids publicly", async () => {
    const { invoice } = await sentInvoice(5_000);
    const overdue = await updateInvoice(OWNER, invoice.id, { dueOn: "2020-01-01" });
    expect(overdue?.status).toBe("overdue");
    expect((await listInvoices(OWNER, { status: "overdue" })).map((i) => i.id)).toEqual([
      invoice.id,
    ]);

    const voided = await updateInvoice(OWNER, invoice.id, { status: "void" });
    expect(voided?.status).toBe("void");
    expect(await getPublicInvoice(invoice.publicToken)).toBeNull();
    await expectOfficeError(updateInvoice(OWNER, invoice.id, { title: "x" }), 409);
    await expectOfficeError(recordPayment(OWNER, invoice.id, { amountCents: 1, method: "cash" }), 409);

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
    await expectOfficeError(
      updateJob(OWNER, job.id, { endAt: "2030-05-10T13:00:00-05:00" }),
      400,
    );

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
    const todayJob = await createJob(OWNER, { clientId: client.id, title: "Now", startAt: start, endAt: end });
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
