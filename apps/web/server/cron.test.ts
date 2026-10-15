import { afterEach, describe, expect, it } from "vitest";
import { isCronAuthorized } from "./cron";

const request = (auth?: string) =>
  new Request("http://localhost/api/cron/x", { headers: auth ? { authorization: auth } : {} });

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("isCronAuthorized", () => {
  it("refuses everything when CRON_SECRET is not set", () => {
    expect(isCronAuthorized(request("Bearer "))).toBe(false);
  });

  it("accepts only the exact bearer secret", () => {
    process.env.CRON_SECRET = "s3cret";
    expect(isCronAuthorized(request("Bearer s3cret"))).toBe(true);
    expect(isCronAuthorized(request("Bearer wrong!"))).toBe(false);
    expect(isCronAuthorized(request())).toBe(false);
  });
});
