import {
  ApiError,
  ConvertEstimateResponse,
  EstimateResponse,
  EstimatesResponse,
  InvoiceResponse,
  JobResponse,
  JobsResponse,
  OfficeSettingsResponse,
  OfficeSummary,
  PriceItemResponse,
  PriceItemsResponse,
  PublicEstimateResponse,
  PublicInvoiceResponse,
  SendDocumentResponse,
  TeamMemberResponse,
  TeamResponse,
} from "@nosweat/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { createClient } from "@/server/clients/service";
import { resetMemoryClientStore } from "@/server/clients/store";
import { createEstimate, createInvoice, createJob } from "@/server/office/service";
import { resetMemoryOfficeStore } from "@/server/office/store";
import { POST as convertRoute } from "./office/estimates/[id]/convert/route";
import {
  DELETE as deleteEstimateRoute,
  GET as getEstimateRoute,
  PATCH as patchEstimateRoute,
} from "./office/estimates/[id]/route";
import { POST as sendEstimateRoute } from "./office/estimates/[id]/send/route";
import { GET as listEstimatesRoute, POST as createEstimateRoute } from "./office/estimates/route";
import { DELETE as deletePaymentRoute } from "./office/invoices/[id]/payments/[paymentId]/route";
import { POST as paymentRoute } from "./office/invoices/[id]/payments/route";
import {
  DELETE as deleteInvoiceRoute,
  GET as getInvoiceRoute,
  PATCH as patchInvoiceRoute,
} from "./office/invoices/[id]/route";
import { POST as sendInvoiceRoute } from "./office/invoices/[id]/send/route";
import { POST as createInvoiceRoute } from "./office/invoices/route";
import { GET as getJobRoute, PATCH as patchJobRoute } from "./office/jobs/[id]/route";
import { GET as listJobsRoute, POST as createJobRoute } from "./office/jobs/route";
import {
  DELETE as deletePriceItemRoute,
  PATCH as patchPriceItemRoute,
} from "./office/price-items/[id]/route";
import {
  GET as listPriceItemsRoute,
  POST as createPriceItemRoute,
} from "./office/price-items/route";
import { GET as getSettingsRoute, PUT as putSettingsRoute } from "./office/settings/route";
import { GET as summaryRoute } from "./office/summary/route";
import { PATCH as patchTeamRoute } from "./office/team/[id]/route";
import { GET as listTeamRoute, POST as createTeamRoute } from "./office/team/route";
import { POST as respondRoute } from "./public/estimates/[token]/respond/route";
import { GET as publicEstimateRoute } from "./public/estimates/[token]/route";
import { GET as publicInvoiceRoute } from "./public/invoices/[token]/route";

// Sem Supabase: o usuário é o DEV_USER e tudo roda em memória (como em clients.test.ts).

const BASE = "http://localhost/api/office";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const tokenCtx = (token: string) => ({ params: Promise.resolve({ token }) });

function jsonRequest(path: string, method: string, body: unknown): Request {
  return new Request(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const post = (path: string) => new Request(`${BASE}${path}`, { method: "POST" });

async function errorCode(res: Response): Promise<string> {
  return ApiError.parse(await res.json()).error.code;
}

/** Linha como o navegador manda (sem `description`/`taxable`: o schema completa). */
const line = { priceItemId: null, name: "Labor", quantity: 2, unitPriceCents: 9_000 };
/** A mesma linha já completa, para chamar o service direto. */
const fullLine = { ...line, description: "", taxable: true };

async function newClient(name = "Ana Lima") {
  return createClient("local-dev", { name, email: `${name.split(" ")[0]!.toLowerCase()}@x.test` });
}

beforeEach(() => {
  resetMemoryOfficeStore();
  resetMemoryClientStore();
});

describe("/api/office settings, price book and team", () => {
  it("reads and updates the settings", async () => {
    const res = await getSettingsRoute();
    expect(res.status).toBe(200);
    expect(OfficeSettingsResponse.parse(await res.json()).settings.invoiceDueDays).toBe(14);

    const put = await putSettingsRoute(
      jsonRequest("/settings", "PUT", { companyName: "Ana's Co", defaultTaxRateBps: 700 }),
    );
    expect(put.status).toBe(200);
    const { settings } = OfficeSettingsResponse.parse(await put.json());
    expect(settings.companyName).toBe("Ana's Co");
    expect(settings.defaultTaxRateBps).toBe(700);

    const bad = await putSettingsRoute(jsonRequest("/settings", "PUT", { timeZone: "Nowhere" }));
    expect(bad.status).toBe(400);
    expect(await errorCode(bad)).toBe("invalid_request");
  });

  it("manages price items and team members", async () => {
    const created = await createPriceItemRoute(
      jsonRequest("/price-items", "POST", { name: "Drain clean", unitPriceCents: 12_500 }),
    );
    expect(created.status).toBe(201);
    const { item } = PriceItemResponse.parse(await created.json());
    expect(item.unit).toBe("each");
    expect(item.taxable).toBe(true);

    const patched = await patchPriceItemRoute(
      jsonRequest(`/price-items/${item.id}`, "PATCH", { active: false }),
      ctx(item.id),
    );
    expect(PriceItemResponse.parse(await patched.json()).item.active).toBe(false);
    const list = PriceItemsResponse.parse(await (await listPriceItemsRoute()).json());
    expect(list.items.map((i) => i.id)).toEqual([item.id]);
    expect((await deletePriceItemRoute(new Request(BASE), ctx(item.id))).status).toBe(200);
    expect((await deletePriceItemRoute(new Request(BASE), ctx(item.id))).status).toBe(404);

    const member = TeamMemberResponse.parse(
      await (
        await createTeamRoute(jsonRequest("/team", "POST", { name: "Tom", email: "" }))
      ).json(),
    ).member;
    expect(member.email).toBeNull();
    expect(member.color).toBe("blue");
    const renamed = await patchTeamRoute(
      jsonRequest(`/team/${member.id}`, "PATCH", { role: "Technician" }),
      ctx(member.id),
    );
    expect(TeamMemberResponse.parse(await renamed.json()).member.role).toBe("Technician");
    expect(TeamResponse.parse(await (await listTeamRoute()).json()).members).toHaveLength(1);
  });
});

describe("/api/office jobs", () => {
  it("creates, schedules, filters and validates", async () => {
    const client = await newClient();
    const created = await createJobRoute(
      jsonRequest("/jobs", "POST", { clientId: client.id, title: "Fix sink" }),
    );
    expect(created.status).toBe(201);
    const { job } = JobResponse.parse(await created.json());
    expect(job.number).toBe(1001);
    expect(job.status).toBe("unscheduled");

    const patched = await patchJobRoute(
      jsonRequest(`/jobs/${job.id}`, "PATCH", { startAt: "2030-01-15T09:00:00-05:00" }),
      ctx(job.id),
    );
    expect(JobResponse.parse(await patched.json()).job.status).toBe("scheduled");

    const inRange = await listJobsRoute(new Request(`${BASE}/jobs?from=2030-01-15&to=2030-01-15`));
    expect(JobsResponse.parse(await inRange.json()).jobs.map((j) => j.id)).toEqual([job.id]);
    expect((await listJobsRoute(new Request(`${BASE}/jobs?status=nope`))).status).toBe(400);

    const missingClient = await createJobRoute(
      jsonRequest("/jobs", "POST", { clientId: "nope", title: "x" }),
    );
    expect(missingClient.status).toBe(404);
    const noTitle = await createJobRoute(jsonRequest("/jobs", "POST", { clientId: client.id }));
    expect(noTitle.status).toBe(400);
  });
});

describe("/api/office estimates and the public link", () => {
  it("ignores client totals, sends, and accepts one public answer", async () => {
    const client = await newClient();
    const created = await createEstimateRoute(
      jsonRequest("/estimates", "POST", {
        clientId: client.id,
        title: "Kitchen sink",
        items: [line],
        taxRateBps: 1000,
        totalCents: 1,
        subtotalCents: 1,
      }),
    );
    expect(created.status).toBe(201);
    const { estimate } = EstimateResponse.parse(await created.json());
    expect(estimate.subtotalCents).toBe(18_000);
    expect(estimate.totalCents).toBe(19_800);
    expect(estimate.items[0]?.taxable).toBe(true);

    // Rascunho não existe no link público.
    expect(
      (await publicEstimateRoute(new Request(BASE), tokenCtx(estimate.publicToken))).status,
    ).toBe(404);

    const sent = await sendEstimateRoute(post(`/estimates/${estimate.id}/send`), ctx(estimate.id));
    expect(sent.status).toBe(200);
    const sendBody = SendDocumentResponse.parse(await sent.json());
    expect(sendBody.url).toBe(`http://localhost/q/${estimate.publicToken}`);
    expect(sendBody.estimate?.status).toBe("sent");

    const view = await publicEstimateRoute(new Request(BASE), tokenCtx(estimate.publicToken));
    expect(view.status).toBe(200);
    const publicBody = await view.json();
    expect(JSON.stringify(publicBody)).not.toContain(estimate.id);
    expect(PublicEstimateResponse.parse(publicBody).estimate.client.name).toBe("Ana Lima");

    const respond = (body: unknown) =>
      respondRoute(
        jsonRequest(`/public/${estimate.publicToken}/respond`, "POST", body),
        tokenCtx(estimate.publicToken),
      );
    expect((await respond({ decision: "approve", name: "" })).status).toBe(400);
    const approved = await respond({ decision: "approve", name: "Ana Lima" });
    expect(approved.status).toBe(200);
    expect(PublicEstimateResponse.parse(await approved.json()).estimate.status).toBe("approved");
    const again = await respond({ decision: "decline" });
    expect(again.status).toBe(409);
    expect(await errorCode(again)).toBe("conflict");

    const locked = await patchEstimateRoute(
      jsonRequest(`/estimates/${estimate.id}`, "PATCH", { items: [line] }),
      ctx(estimate.id),
    );
    expect(locked.status).toBe(409);

    const converted = await convertRoute(
      jsonRequest(`/estimates/${estimate.id}/convert`, "POST", { createInvoice: true }),
      ctx(estimate.id),
    );
    expect(converted.status).toBe(200);
    const result = ConvertEstimateResponse.parse(await converted.json());
    expect(result.job?.valueCents).toBe(19_800);
    expect(result.invoice?.totalCents).toBe(19_800);

    const nothing = await convertRoute(
      jsonRequest(`/estimates/${estimate.id}/convert`, "POST", {
        createJob: false,
        createInvoice: false,
      }),
      ctx(estimate.id),
    );
    expect(nothing.status).toBe(400);

    const unknown = await publicEstimateRoute(new Request(BASE), tokenCtx("x".repeat(32)));
    expect(unknown.status).toBe(404);
    expect((await publicEstimateRoute(new Request(BASE), tokenCtx("short"))).status).toBe(404);
  });

  it("filters by status and deletes", async () => {
    const client = await newClient("Bob Stone");
    const a = await createEstimate("local-dev", { clientId: client.id, items: [fullLine] });
    await createEstimate("local-dev", { clientId: client.id });
    await sendEstimateRoute(post(`/estimates/${a.id}/send`), ctx(a.id));

    const res = await listEstimatesRoute(new Request(`${BASE}/estimates?status=sent`));
    expect(EstimatesResponse.parse(await res.json()).estimates.map((e) => e.id)).toEqual([a.id]);
    expect((await listEstimatesRoute(new Request(`${BASE}/estimates?status=bad`))).status).toBe(
      400,
    );

    expect((await deleteEstimateRoute(new Request(BASE), ctx(a.id))).status).toBe(200);
    expect((await getEstimateRoute(new Request(BASE), ctx(a.id))).status).toBe(404);
  });
});

describe("/api/office invoices, payments and summary", () => {
  it("records payments up to the balance and reverts on delete", async () => {
    const client = await newClient("Carla Diaz");
    const created = await createInvoiceRoute(
      jsonRequest("/invoices", "POST", { clientId: client.id, items: [line], taxRateBps: 0 }),
    );
    expect(created.status).toBe(201);
    const { invoice } = InvoiceResponse.parse(await created.json());
    expect(invoice.totalCents).toBe(18_000);

    const sent = await sendInvoiceRoute(post(`/invoices/${invoice.id}/send`), ctx(invoice.id));
    expect(SendDocumentResponse.parse(await sent.json()).url).toBe(
      `http://localhost/i/${invoice.publicToken}`,
    );

    const pay = (amountCents: number) =>
      paymentRoute(
        jsonRequest(`/invoices/${invoice.id}/payments`, "POST", { amountCents, method: "zelle" }),
        ctx(invoice.id),
      );
    expect((await pay(18_001)).status).toBe(400);
    const first = await pay(8_000);
    expect(first.status).toBe(201);
    expect(InvoiceResponse.parse(await first.json()).invoice.status).toBe("partial");
    const second = await pay(10_000);
    const paid = InvoiceResponse.parse(await second.json()).invoice;
    expect(paid.status).toBe("paid");

    const blocked = await deleteInvoiceRoute(new Request(BASE), ctx(invoice.id));
    expect(blocked.status).toBe(409);
    const voidRes = await patchInvoiceRoute(
      jsonRequest(`/invoices/${invoice.id}`, "PATCH", { status: "void" }),
      ctx(invoice.id),
    );
    expect(voidRes.status).toBe(409);

    const paymentId = paid.payments[1]!.id;
    const removed = await deletePaymentRoute(new Request(BASE), {
      params: Promise.resolve({ id: invoice.id, paymentId }),
    });
    expect(removed.status).toBe(200);
    expect(InvoiceResponse.parse(await removed.json()).invoice.balanceCents).toBe(10_000);

    const publicRes = await publicInvoiceRoute(new Request(BASE), tokenCtx(invoice.publicToken));
    expect(publicRes.status).toBe(200);
    const publicInvoice = PublicInvoiceResponse.parse(await publicRes.json()).invoice;
    expect(publicInvoice.amountPaidCents).toBe(8_000);
    expect(publicInvoice.status).toBe("partial");

    const summary = OfficeSummary.parse(await (await summaryRoute()).json());
    expect(summary.unpaidInvoices).toBe(1);
    expect(summary.unpaidCents).toBe(10_000);
    expect(summary.collectedThisMonthCents).toBe(8_000);
  });

  it("hides other owners' documents", async () => {
    const theirs = await createClient("someone-else", { name: "Hidden", email: "h@x.test" });
    const estimate = await createEstimate("someone-else", {
      clientId: theirs.id,
      items: [fullLine],
    });
    const invoice = await createInvoice("someone-else", {
      clientId: theirs.id,
      items: [fullLine],
    });
    const job = await createJob("someone-else", { clientId: theirs.id, title: "Theirs" });

    expect((await getEstimateRoute(new Request(BASE), ctx(estimate.id))).status).toBe(404);
    expect(
      (await sendEstimateRoute(post(`/estimates/${estimate.id}/send`), ctx(estimate.id))).status,
    ).toBe(404);
    expect((await getInvoiceRoute(new Request(BASE), ctx(invoice.id))).status).toBe(404);
    expect(
      (
        await paymentRoute(
          jsonRequest(`/invoices/${invoice.id}/payments`, "POST", {
            amountCents: 1,
            method: "cash",
          }),
          ctx(invoice.id),
        )
      ).status,
    ).toBe(404);
    expect((await getJobRoute(new Request(BASE), ctx(job.id))).status).toBe(404);
    const createWithTheirClient = await createEstimateRoute(
      jsonRequest("/estimates", "POST", { clientId: theirs.id }),
    );
    expect(createWithTheirClient.status).toBe(404);
    expect(await errorCode(createWithTheirClient)).toBe("not_found");
  });
});
