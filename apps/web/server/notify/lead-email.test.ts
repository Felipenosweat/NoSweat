import { afterEach, describe, expect, it, vi } from "vitest";
import { sendLeadNotification, type LeadEmailInput } from "./lead-email";

const input: LeadEmailInput = {
  siteId: "site-123",
  siteName: "Joe's Plumbing",
  ownerId: null,
  fallbackEmail: null,
  lead: { name: "Maria", email: null, phone: "(512) 555-0199", message: "Leaking pipe." },
  appOrigin: "https://nosweatfd.com",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendLeadNotification logs when e-mails are off", () => {
  it("warns once per process without a Resend key", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await sendLeadNotification(input, {});
    await sendLeadNotification(input, {});
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("RESEND_API_KEY not set");
  });

  it("warns with the site id when there is nobody to send to", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await sendLeadNotification(input, { RESEND_API_KEY: "re_test" }, fetchImpl);
    expect(result).toEqual({ sent: false, reason: "no_recipient" });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("site-123"));
  });
});
