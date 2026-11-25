import { fixtures } from "@nosweat/fixtures";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient, getClientDetail } from "../clients/service";
import { resetMemoryClientStore } from "../clients/store";
import { createJob, updateJob, updateSettings } from "../office/service";
import { resetMemoryOfficeStore } from "../office/store";
import { withReviewUrl } from "../reviews";
import { getSiteStore } from "../store";
import {
  autoReviewActivityBody,
  getAutoReviewSummary,
  monthStartIso,
  sendAutoReviewRequest,
  setAutoReviewEnabled,
} from "./service";
import {
  getReviewRequestStore,
  MemoryReviewRequestStore,
  resetMemoryReviewRequestStore,
} from "./store";

// Sem Supabase: tudo em memória. A Resend é falsa (`fetchImpl`) e o plano é trocado por
// `hasFeature`. Cada teste usa um dono novo (o store de sites em memória é compartilhado).

const ENV = { RESEND_API_KEY: "re_test" };
const REVIEW_URL = "https://g.page/r/abc123/review";

function okFetch() {
  return vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
}

const withFeature = async () => true;
let owner: string;

/** Dono com site (com link de avaliações), cliente com e-mail e um job já "done". */
async function setup({ link = true, email = "maria@x.test" as string | null } = {}) {
  const spec = fixtures["joes-plumbing"];
  await getSiteStore().create(link ? withReviewUrl(spec, REVIEW_URL) : spec, owner);
  await updateSettings(owner, { companyName: "Joe's Plumbing", email: "joe@biz.test" });
  const client = await createClient(owner, {
    name: "Maria Lopez",
    email,
    phone: email ? null : "512 555 0199",
  });
  const job = await createJob(owner, { clientId: client.id, title: "Fix the sink" });
  await updateJob(owner, job.id, { status: "done" });
  return { client, job };
}

beforeEach(() => {
  owner = crypto.randomUUID();
  resetMemoryClientStore();
  resetMemoryOfficeStore();
  resetMemoryReviewRequestStore();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendAutoReviewRequest", () => {
  it("emails the review request once, logs it and replies to the business", async () => {
    const { client, job } = await setup();
    const fetchImpl = okFetch();
    const deps = { env: ENV, fetchImpl, hasFeature: withFeature };

    expect(await sendAutoReviewRequest(owner, job.id, deps)).toEqual({ sent: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
    expect(body.to).toEqual(["maria@x.test"]);
    expect(body.reply_to).toBe("joe@biz.test");
    expect(body.subject).toBe("A quick favor from Joe's Plumbing");
    expect(String(body.text)).toContain("Hi Maria");
    expect(String(body.text)).toContain(REVIEW_URL);

    const detail = await getClientDetail(owner, client.id);
    const message = detail?.activities.find((a) => a.kind === "message");
    expect(message?.body).toBe(autoReviewActivityBody(job.number));

    // Mesmo job de novo: nada sai.
    expect(await sendAutoReviewRequest(owner, job.id, deps)).toEqual({
      sent: false,
      reason: "already_asked",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(await getReviewRequestStore().countSent(owner, monthStartIso())).toBe(1);
  });

  it("does not ask the same client again within 30 days", async () => {
    const { client, job } = await setup();
    const deps = { env: ENV, fetchImpl: okFetch(), hasFeature: withFeature };
    expect(await sendAutoReviewRequest(owner, job.id, deps)).toEqual({ sent: true });

    // Outro job do mesmo cliente, logo depois: nada sai.
    const second = await createJob(owner, { clientId: client.id, title: "Second visit" });
    await updateJob(owner, second.id, { status: "done" });
    expect(await sendAutoReviewRequest(owner, second.id, deps)).toEqual({
      sent: false,
      reason: "already_asked",
    });
    expect(deps.fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("skips when a rule is missing", async () => {
    const fetchImpl = okFetch();
    const { job } = await setup();

    expect(await sendAutoReviewRequest(owner, job.id, { fetchImpl, env: {} })).toEqual({
      sent: false,
      reason: "not_configured",
    });
    expect(
      await sendAutoReviewRequest(owner, job.id, {
        env: ENV,
        fetchImpl,
        hasFeature: async () => false,
      }),
    ).toEqual({ sent: false, reason: "no_feature" });

    await setAutoReviewEnabled(owner, false);
    expect(
      await sendAutoReviewRequest(owner, job.id, { env: ENV, fetchImpl, hasFeature: withFeature }),
    ).toEqual({ sent: false, reason: "disabled" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("skips jobs that are not done, sites without a link and clients without email", async () => {
    const deps = { env: ENV, fetchImpl: okFetch(), hasFeature: withFeature };

    const noLink = await setup({ link: false });
    expect(await sendAutoReviewRequest(owner, noLink.job.id, deps)).toEqual({
      sent: false,
      reason: "no_review_link",
    });

    owner = crypto.randomUUID();
    const noEmail = await setup({ email: null });
    expect(await sendAutoReviewRequest(owner, noEmail.job.id, deps)).toEqual({
      sent: false,
      reason: "no_email",
    });

    const open = await createJob(owner, { clientId: noEmail.client.id, title: "Open job" });
    expect(await sendAutoReviewRequest(owner, open.id, deps)).toEqual({
      sent: false,
      reason: "not_done",
    });
    expect(deps.fetchImpl).not.toHaveBeenCalled();
  });

  it("does not log anything when the email fails, and does not retry the job", async () => {
    const { client, job } = await setup();
    const failing = vi.fn<typeof fetch>(async () => new Response("nope", { status: 500 }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const deps = { env: ENV, fetchImpl: failing, hasFeature: withFeature };

    expect(await sendAutoReviewRequest(owner, job.id, deps)).toEqual({
      sent: false,
      reason: "send_failed",
    });
    const detail = await getClientDetail(owner, client.id);
    expect(detail?.activities.some((a) => a.kind === "message")).toBe(false);
    expect(await sendAutoReviewRequest(owner, job.id, deps)).toEqual({
      sent: false,
      reason: "already_asked",
    });
  });
});

describe("MemoryReviewRequestStore", () => {
  it("allows the same client again after 30 days, and after a failed send", async () => {
    const store = new MemoryReviewRequestStore();
    const day = 24 * 60 * 60 * 1000;
    const now = Date.parse("2026-11-25T12:00:00Z");
    const base = { ownerId: owner, clientId: "c1", email: "a@b.test" };

    const first = await store.claim({ ...base, jobId: "j1" }, now - 31 * day);
    expect(first).not.toBeNull();
    const second = await store.claim({ ...base, jobId: "j2" }, now);
    expect(second).not.toBeNull();
    expect(await store.claim({ ...base, jobId: "j3" }, now + day)).toBeNull();

    if (second) await store.finish(second, "failed");
    expect(await store.claim({ ...base, jobId: "j3" }, now + day)).not.toBeNull();
    expect(await store.claim({ ...base, jobId: "j3" }, now + 60 * day)).toBeNull();
  });
});

describe("getAutoReviewSummary", () => {
  it("is on by default and counts this month's sends", async () => {
    // Sem cobrança ligada (testes), o recurso está liberado.
    expect(await getAutoReviewSummary(owner)).toEqual({
      available: true,
      enabled: true,
      sentThisMonth: 0,
    });
    await setAutoReviewEnabled(owner, false);
    expect((await getAutoReviewSummary(owner)).enabled).toBe(false);
  });

  it("starts the month on day 1 (UTC)", () => {
    expect(monthStartIso(new Date("2026-11-25T03:00:00Z"))).toBe("2026-11-01T00:00:00.000Z");
  });
});
