import { fixtures } from "@nosweat/fixtures";
import { beforeEach, describe, expect, it } from "vitest";
import { POST as visitRoute } from "@/app/api/public/sites/[id]/visit/route";
import { getSiteStore } from "../store";
import {
  buildMonthlyReportEmail,
  previousMonth,
  sendMonthlyReports,
  type ReportDeps,
} from "./report";
import { MemoryVisitStore, dayKey, getVisitStore } from "./store";

const OWNER = "00000000-0000-4000-8000-000000000001";
const BROWSER =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

async function newSite(published: boolean): Promise<string> {
  const site = await getSiteStore().create(fixtures["joes-plumbing"], OWNER);
  if (published) await getSiteStore().updateMeta(site.id, { status: "published" });
  return site.id;
}

let visitor = 0;
function visit(siteId: string, userAgent: string | null = BROWSER, ip?: string) {
  visitor++;
  return visitRoute(
    new Request(`http://localhost:3000/api/public/sites/${siteId}/visit`, {
      method: "POST",
      headers: {
        "x-forwarded-for": ip ?? `203.0.113.${visitor}`,
        ...(userAgent ? { "user-agent": userAgent } : {}),
      },
    }),
    { params: Promise.resolve({ id: siteId }) },
  );
}

const today = () => dayKey(new Date());
const visitsOf = async (siteId: string) =>
  (await getVisitStore().totals(today(), today(), [siteId])).get(siteId) ?? 0;

beforeEach(() => {
  new MemoryVisitStore().clear();
});

describe("POST /api/public/sites/[id]/visit", () => {
  it("counts people opening a published site", async () => {
    const siteId = await newSite(true);
    expect((await visit(siteId)).status).toBe(204);
    await visit(siteId);
    expect(await visitsOf(siteId)).toBe(2);
  });

  it("does not count drafts, bots, requests without a browser or made-up ids", async () => {
    const draft = await newSite(false);
    const live = await newSite(true);
    const responses = await Promise.all([
      visit(draft),
      visit(live, "Googlebot/2.1 (+http://www.google.com/bot.html)"),
      visit(live, null),
      visit("not-an-id"),
    ]);
    expect(responses.map((res) => res.status)).toEqual([204, 204, 204, 204]);
    expect(await visitsOf(draft)).toBe(0);
    expect(await visitsOf(live)).toBe(0);
  });

  it("stops counting the same IP after 20 visits in an hour", async () => {
    const siteId = await newSite(true);
    for (let i = 0; i < 25; i++) await visit(siteId, BROWSER, "198.51.100.77");
    expect(await visitsOf(siteId)).toBe(20);
  });
});

describe("MemoryVisitStore", () => {
  it("adds up the days in the range, per site", async () => {
    const store = new MemoryVisitStore();
    const a = await newSite(true);
    const b = await newSite(true);
    await store.count(a, new Date("2026-10-01T12:00:00Z"));
    await store.count(a, new Date("2026-10-31T23:59:00Z"));
    await store.count(a, new Date("2026-11-01T00:00:00Z"));
    await store.count(b, new Date("2026-10-15T08:00:00Z"));

    const october = await store.totals("2026-10-01", "2026-10-31");
    expect(Object.fromEntries(october)).toEqual({ [a]: 2, [b]: 1 });
    expect((await store.totals("2026-10-01", "2026-11-30", [a])).get(a)).toBe(3);
  });

  it("lets each account claim a month's report only once", async () => {
    const store = new MemoryVisitStore();
    expect(await store.claimReport(OWNER, "2026-10-01")).toBe(true);
    expect(await store.claimReport(OWNER, "2026-10-01")).toBe(false);
    expect(await store.claimReport(OWNER, "2026-11-01")).toBe(true);
  });
});

describe("previousMonth", () => {
  it("is the whole month before, also across the new year", () => {
    expect(previousMonth(new Date("2027-01-01T15:41:00Z"))).toEqual({
      month: "2026-12-01",
      fromDay: "2026-12-01",
      toDay: "2026-12-31",
      fromIso: "2026-12-01T00:00:00.000Z",
      toIso: "2027-01-01T00:00:00.000Z",
      label: "December",
    });
    expect(previousMonth(new Date("2027-03-01T15:41:00Z")).toDay).toBe("2027-02-28");
  });
});

describe("buildMonthlyReportEmail", () => {
  const appUrl = "https://www.nosweatfd.com";

  it("puts the numbers in the subject and links to the site's requests", () => {
    const email = buildMonthlyReportEmail({
      monthLabel: "October",
      sites: [{ siteId: "s1", name: "Joe's Plumbing", visits: 1240, requests: 1 }],
      bookings: 3,
      appUrl,
    });
    expect(email.subject).toBe(
      "Your website in October: 1,240 visits, 1 request, 3 online bookings",
    );
    expect(email.text).toContain("Here is how Joe's Plumbing did in October:");
    expect(email.text).toContain("- 1 request from your contact form");
    expect(email.text).toContain(`${appUrl}/sites/s1`);
    expect(email.html).toContain(`<a href="${appUrl}/sites/s1">`);
  });

  it("lists each website when the account has more than one, and skips bookings at zero", () => {
    const email = buildMonthlyReportEmail({
      monthLabel: "October",
      sites: [
        { siteId: "s1", name: "Joe's Plumbing", visits: 10, requests: 0 },
        { siteId: "s2", name: "Joe's Drains", visits: 5, requests: 0 },
      ],
      bookings: 0,
      appUrl,
    });
    expect(email.subject).toBe("Your website in October: 15 visits, 0 requests");
    expect(email.text).toContain("Joe's Drains: 5 visits, 0 requests");
    expect(email.text).toContain(`${appUrl}/dashboard`);
    expect(email.text).not.toContain("online booking");
  });
});

describe("sendMonthlyReports", () => {
  const now = new Date("2026-11-01T15:41:00Z");
  type Sent = { to: string; subject: string };

  function deps(overrides: Partial<ReportDeps> = {}): { deps: ReportDeps; sent: Sent[] } {
    const sent: Sent[] = [];
    const claimed = new Set<string>();
    const base: ReportDeps = {
      env: { RESEND_API_KEY: "re_test" },
      appUrl: "https://www.nosweatfd.com",
      publishedSites: async () => [
        { id: "site-active", ownerId: "active", name: "Joe's Plumbing" },
        { id: "site-quiet", ownerId: "quiet", name: "Quiet Co" },
        { id: "site-unpaid", ownerId: "unpaid", name: "Unpaid Co" },
        { id: "site-test", ownerId: "tester", name: "Test Co" },
      ],
      hasLiveAccess: async (ownerId) => ownerId !== "unpaid",
      visits: async () =>
        new Map([
          ["site-active", 40],
          ["site-unpaid", 9],
          ["site-test", 7],
        ]),
      requests: async (siteId) => (siteId === "site-active" ? 2 : 0),
      bookings: async () => 0,
      getAccount: async (ownerId) => ({
        email: `${ownerId}@example.com`,
        testAccount: ownerId === "tester",
      }),
      claim: async (ownerId, month) => {
        const key = `${ownerId}|${month}`;
        if (claimed.has(key)) return false;
        claimed.add(key);
        return true;
      },
      send: async (to, email) => {
        sent.push({ to, subject: email.subject });
        return true;
      },
    };
    return { deps: { ...base, ...overrides }, sent };
  }

  it("does nothing without the email key", async () => {
    const { deps: d, sent } = deps({ env: {} });
    expect(await sendMonthlyReports(now, d)).toMatchObject({ disabled: "email_off", sent: 0 });
    expect(sent).toEqual([]);
  });

  it("emails only paying accounts that had activity, once per month", async () => {
    const { deps: d, sent } = deps();
    expect(await sendMonthlyReports(now, d)).toEqual({
      disabled: null,
      month: "2026-10-01",
      owners: 4,
      sent: 1,
      failed: 0,
      skipped: 3,
    });
    expect(sent).toEqual([
      { to: "active@example.com", subject: "Your website in October: 40 visits, 2 requests" },
    ]);

    // O cron rodou de novo no mesmo mês: ninguém recebe duas vezes.
    expect(await sendMonthlyReports(now, d)).toMatchObject({ sent: 0, skipped: 4 });
    expect(sent).toHaveLength(1);
  });

  it("counts a failed email and keeps going", async () => {
    const { deps: d } = deps({
      send: async () => false,
      getAccount: async () => {
        throw new Error("auth is down");
      },
      hasLiveAccess: async () => true,
    });
    expect(await sendMonthlyReports(now, d)).toMatchObject({ owners: 4, sent: 0, failed: 3 });
  });
});
