import { afterEach, describe, expect, it, vi } from "vitest";
import { ALERT_WINDOW_MS, errorDigest, reportError, resetAlertLimiter } from "./alert";

const ENV = { ALERT_EMAIL: "founder@example.com", RESEND_API_KEY: "re_test" };

function okFetch() {
  const mock = vi.fn(async (_url: string, _init?: RequestInit) => new Response("{}"));
  return { mock, fetchImpl: mock as unknown as typeof fetch };
}

describe("reportError", () => {
  afterEach(() => {
    resetAlertLimiter();
    vi.restoreAllMocks();
  });

  it("does nothing without ALERT_EMAIL or RESEND_API_KEY", async () => {
    const { mock, fetchImpl } = okFetch();
    expect(await reportError({ route: "/x", message: "boom" }, {}, fetchImpl)).toBe(false);
    expect(
      await reportError({ route: "/x", message: "boom" }, { ALERT_EMAIL: "a@b.co" }, fetchImpl),
    ).toBe(false);
    expect(mock).not.toHaveBeenCalled();
  });

  it("emails the route, digest and message once per route per 10 minutes", async () => {
    const { mock, fetchImpl } = okFetch();
    const now = Date.UTC(2026, 9, 20, 12);
    const report = { route: "/api/sites/generate", digest: "abc123", message: "db down" };
    expect(await reportError(report, ENV, fetchImpl, now)).toBe(true);
    expect(await reportError(report, ENV, fetchImpl, now + 60_000)).toBe(false);
    expect(await reportError({ ...report, route: "/other" }, ENV, fetchImpl, now)).toBe(true);
    expect(await reportError(report, ENV, fetchImpl, now + ALERT_WINDOW_MS)).toBe(true);
    expect(mock).toHaveBeenCalledTimes(3);

    const [url, init] = mock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(String(init.body)) as { to: string[]; subject: string; text: string };
    expect(body.to).toEqual(["founder@example.com"]);
    expect(body.subject).toContain("/api/sites/generate");
    expect(body.text).toContain("abc123");
    expect(body.text).toContain("db down");
  });

  it("never throws when the send fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = vi.fn(async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;
    await expect(reportError({ route: "/x", message: "boom" }, ENV, failing)).resolves.toBe(false);
  });

  it("reads the Next.js digest from an error", () => {
    expect(errorDigest(Object.assign(new Error("x"), { digest: "123" }))).toBe("123");
    expect(errorDigest(new Error("x"))).toBeUndefined();
    expect(errorDigest("text")).toBeUndefined();
  });
});
