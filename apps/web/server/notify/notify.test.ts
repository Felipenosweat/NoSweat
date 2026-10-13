import { LeadCreatedResponse } from "@nosweat/schema";
import { fixtures } from "@nosweat/fixtures";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as sendLead } from "@/app/api/sites/[id]/leads/route";
import { DEV_USER } from "@/server/auth/session";
import { getSiteStore } from "@/server/store";
import {
  RateLimiter,
  appOrigin,
  buildLeadEmail,
  clientIp,
  sendLeadNotification,
  type LeadEmailInput,
} from ".";

const input: LeadEmailInput = {
  siteId: "site-123",
  siteName: "Joe's Plumbing",
  ownerId: "owner-1",
  fallbackEmail: "hello@joes.com",
  lead: {
    name: "Maria <b>",
    email: "maria@example.com",
    phone: "(512) 555-0199",
    message: "Water heater is leaking.",
  },
  appOrigin: "https://nosweatfd.com/",
};

const env = {
  RESEND_API_KEY: "re_test",
  LEADS_FROM_EMAIL: "NoSweat <leads@nosweatfd.com>",
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "secret",
};

type Call = [string, RequestInit | undefined];

describe("buildLeadEmail", () => {
  it("has a clear subject, all fields and a link to the dashboard", () => {
    const email = buildLeadEmail(input);
    expect(email.subject).toBe("New request from your website: Maria <b>");
    expect(email.text).toContain("Phone: (512) 555-0199");
    expect(email.text).toContain("Email: maria@example.com");
    expect(email.text).toContain("Water heater is leaking.");
    expect(email.text).toContain("https://nosweatfd.com/sites/site-123");
    // O HTML escapa o que o visitante digitou.
    expect(email.html).toContain("Maria &lt;b&gt;");
    expect(email.html).not.toContain("Maria <b>");
  });

  it("keeps the subject on one line", () => {
    const email = buildLeadEmail({ ...input, lead: { ...input.lead, name: "A\r\nBcc: x@y.z" } });
    expect(email.subject).not.toMatch(/[\r\n]/);
  });
});

describe("sendLeadNotification", () => {
  it("skips silently without a Resend key", async () => {
    const fetchMock = vi.fn();
    const result = await sendLeadNotification(input, {}, fetchMock as unknown as typeof fetch);
    expect(result).toEqual({ sent: false, reason: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("emails the owner's account address found via the Auth admin API", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("/auth/v1/admin/users/")
        ? Response.json({ id: "owner-1", email: "joe@gmail.com" })
        : Response.json({ id: "email_1" }),
    );
    const result = await sendLeadNotification(input, env, fetchMock as unknown as typeof fetch);
    expect(result).toEqual({ sent: true, to: "joe@gmail.com" });

    const calls = fetchMock.mock.calls as unknown as Call[];
    expect(calls[0]![0]).toBe("https://abc.supabase.co/auth/v1/admin/users/owner-1");
    const [resendUrl, init] = calls[1]!;
    expect(resendUrl).toBe("https://api.resend.com/emails");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      from: "NoSweat <leads@nosweatfd.com>",
      to: ["joe@gmail.com"],
      subject: "New request from your website: Maria <b>",
      reply_to: "maria@example.com",
    });
  });

  it("falls back to the business email when the owner lookup fails", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("/auth/v1/") ? new Response("nope", { status: 500 }) : Response.json({}),
    );
    const result = await sendLeadNotification(input, env, fetchMock as unknown as typeof fetch);
    expect(result).toEqual({ sent: true, to: "hello@joes.com" });
  });

  it("does nothing without any recipient", async () => {
    const fetchMock = vi.fn(async () => new Response("nope", { status: 404 }));
    const result = await sendLeadNotification(
      { ...input, fallbackEmail: null },
      env,
      fetchMock as unknown as typeof fetch,
    );
    expect(result).toEqual({ sent: false, reason: "no_recipient" });
  });

  it("never throws when Resend fails or the network breaks", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = vi.fn(async (url: string) => {
      if (url.includes("/auth/v1/")) throw new Error("network down");
      return new Response("bad", { status: 422 });
    });
    await expect(
      sendLeadNotification(input, env, failing as unknown as typeof fetch),
    ).resolves.toEqual({ sent: false, reason: "send_failed" });

    const throwing = vi.fn(async () => {
      throw new Error("timeout");
    });
    await expect(
      sendLeadNotification({ ...input, ownerId: null }, env, throwing as unknown as typeof fetch),
    ).resolves.toEqual({ sent: false, reason: "send_failed" });
  });
});

describe("appOrigin", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the request origin on the platform and the app URL on customer domains", () => {
    expect(appOrigin("https://nosweatfd.com/api/sites/1/leads")).toBe("https://nosweatfd.com");
    expect(appOrigin("http://localhost:3000/api/x")).toBe("http://localhost:3000");
    vi.stubEnv("APP_URL", "");
    expect(appOrigin("https://joesplumbing.com/api/x")).toBe("https://nosweatfd.com");
    vi.stubEnv("APP_URL", "https://staging.example.com/");
    expect(appOrigin("https://joesplumbing.com/api/x")).toBe("https://staging.example.com");
  });
});

describe("RateLimiter", () => {
  it("allows up to the limit inside the window, then again after it", () => {
    const limiter = new RateLimiter(2, 1000);
    expect(limiter.take("a", 0)).toBe(true);
    expect(limiter.take("a", 10)).toBe(true);
    expect(limiter.take("a", 20)).toBe(false);
    expect(limiter.take("b", 20)).toBe(true);
    expect(limiter.take("a", 1011)).toBe(true);
  });

  it("reads the client IP from proxy headers", () => {
    const req = (headers: Record<string, string>) => new Request("http://x", { headers });
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(req({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(req({}))).toBe("unknown");
  });
});

describe("POST /api/sites/[id]/leads rate limit", () => {
  it("answers 429 after 5 messages from the same IP in 10 minutes", async () => {
    const store = getSiteStore();
    const site = await store.create(fixtures["joes-plumbing"], DEV_USER.id);
    await store.updateMeta(site.id, {
      status: "published",
      slug: `joes-${site.id.slice(0, 6)}`,
      publishedSpec: site.spec,
      publishedAt: new Date().toISOString(),
    });

    const send = (ip: string) =>
      sendLead(
        new Request("http://localhost/api/x", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
          body: JSON.stringify({ name: "Maria", phone: "512 555 0199", message: "Hi there" }),
        }),
        { params: Promise.resolve({ id: site.id }) },
      );

    for (let i = 0; i < 5; i++) {
      const res = await send("9.9.9.9");
      expect(res.status).toBe(201);
      LeadCreatedResponse.parse(await res.json());
    }
    const blocked = await send("9.9.9.9");
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).error.code).toBe("quota_exceeded");
    expect((await send("8.8.8.8")).status).toBe(201);
  });
});
