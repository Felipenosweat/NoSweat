import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCustomerBookingEmail,
  buildOwnerBookingEmail,
  formatWhen,
  sendBookingNotifications,
  type BookingEmailInput,
} from "./booking-email";

const input: BookingEmailInput = {
  ownerId: "owner-1",
  businessName: "Fade & Co <Barbers>",
  businessPhone: "(512) 555-0100",
  businessEmail: "shop@biz.test",
  serviceName: "Haircut",
  staffName: "Darnell",
  // Quinta, 3 de dezembro de 2026, 15:30 em Nova York (EST = UTC-5).
  startAt: "2026-12-03T20:30:00.000Z",
  timeZone: "America/New_York",
  customer: {
    name: "Ana <b>Lima</b>\r\nBcc: evil@example.test",
    phone: "(512) 555-0142",
    email: "ana@example.test",
    notes: "Fade <script>alert(1)</script>",
  },
  token: "abcDEF_123-token",
  appOrigin: "https://nosweatfd.com/",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("formatWhen", () => {
  it("writes the time in the company's zone, like 'Thu Dec 3, 3:30 PM'", () => {
    expect(formatWhen(input.startAt, "America/New_York")).toBe("Thu Dec 3, 3:30 PM");
    expect(formatWhen(input.startAt, "America/Los_Angeles")).toBe("Thu Dec 3, 12:30 PM");
    expect(formatWhen("2026-12-03T14:05:00.000Z", "America/New_York")).toBe("Thu Dec 3, 9:05 AM");
  });
});

describe("buildOwnerBookingEmail", () => {
  it("puts service, name and time in the subject, on one line", () => {
    const email = buildOwnerBookingEmail(input);
    expect(email.subject).toMatch(/^New booking: Haircut · Ana <b>Lima<\/b> Bcc: evil@example\.test · Thu Dec 3, 3:30 PM$/);
    expect(email.subject).not.toMatch(/[\r\n]/);
  });

  it("lists the details, links the schedule and escapes the HTML", () => {
    const email = buildOwnerBookingEmail(input);
    expect(email.text).toContain("Service: Haircut");
    expect(email.text).toContain("When: Thu Dec 3, 3:30 PM");
    expect(email.text).toContain("With: Darnell");
    expect(email.text).toContain("Phone: (512) 555-0142");
    expect(email.text).toContain("https://nosweatfd.com/schedule");
    expect(email.html).toContain("Fade &amp; Co &lt;Barbers&gt;");
    expect(email.html).toContain("Fade &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<b>Lima");
  });
});

describe("buildCustomerBookingEmail", () => {
  it("has the details, the cancel link and the business phone", () => {
    const email = buildCustomerBookingEmail(input);
    expect(email.subject).toBe("Booking confirmed: Haircut · Thu Dec 3, 3:30 PM");
    expect(email.text).toContain("https://nosweatfd.com/booking/abcDEF_123-token");
    expect(email.text).toContain("(512) 555-0100");
    expect(email.text).toContain("When: Thu Dec 3, 3:30 PM");
    expect(email.html).toContain('href="https://nosweatfd.com/booking/abcDEF_123-token"');
    expect(email.html).toContain("Fade &amp; Co &lt;Barbers&gt;");
    // O que o cliente digitou nunca entra como HTML.
    expect(email.html).not.toContain("<b>");
  });

  it("leaves out the phone line when the business has no phone", () => {
    const email = buildCustomerBookingEmail({ ...input, businessPhone: null });
    expect(email.text).not.toContain("Call");
  });
});

describe("sendBookingNotifications", () => {
  const env = { RESEND_API_KEY: "re_test" };
  const ok = () => new Response("{}", { status: 200 });

  it("skips silently without a Resend key", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const result = await sendBookingNotifications(input, {}, fetchImpl);
    expect(result.owner).toEqual({ sent: false, reason: "not_configured" });
    expect(result.customer).toEqual({ sent: false, reason: "not_configured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends one e-mail to the owner and one to the customer", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => ok());
    const result = await sendBookingNotifications(input, env, fetchImpl);
    expect(result.owner).toEqual({ sent: true, to: "shop@biz.test" });
    expect(result.customer).toEqual({ sent: true, to: "ana@example.test" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const bodies = fetchImpl.mock.calls.map(
      ([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>,
    );
    const owner = bodies.find((b) => (b.to as string[])[0] === "shop@biz.test");
    const customer = bodies.find((b) => (b.to as string[])[0] === "ana@example.test");
    expect(owner?.from).toBe("NoSweat <leads@nosweatfd.com>");
    expect(owner?.reply_to).toBe("ana@example.test");
    // Cliente: remetente com o nome da empresa (sem caracteres que quebram o cabeçalho) e
    // "Responder" chega na empresa.
    expect(customer?.from).toBe("Fade & Co Barbers <leads@nosweatfd.com>");
    expect(customer?.reply_to).toBe("shop@biz.test");
    expect(String(customer?.html)).toContain("/booking/abcDEF_123-token");
    for (const [url, init] of fetchImpl.mock.calls) {
      expect(url).toBe("https://api.resend.com/emails");
      expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    }
  });

  it("looks up the owner's account e-mail first", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async (url) =>
      String(url).includes("/auth/v1/admin/users/")
        ? new Response(JSON.stringify({ email: "owner@account.test" }), { status: 200 })
        : ok(),
    );
    const result = await sendBookingNotifications(
      input,
      {
        ...env,
        NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service",
      },
      fetchImpl,
    );
    expect(result.owner).toEqual({ sent: true, to: "owner@account.test" });
  });

  it("does not e-mail the customer who gave no address, and still tells the owner", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => ok());
    const result = await sendBookingNotifications(
      { ...input, customer: { ...input.customer, email: null } },
      env,
      fetchImpl,
    );
    expect(result.owner.sent).toBe(true);
    expect(result.customer).toEqual({ sent: false, reason: "no_recipient" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
    expect(body.reply_to).toBeUndefined();
  });

  it("has no owner recipient without any e-mail and never throws when sending fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchImpl = vi.fn<typeof fetch>(async () => ok());
    const none = await sendBookingNotifications({ ...input, businessEmail: null }, env, fetchImpl);
    expect(none.owner).toEqual({ sent: false, reason: "no_recipient" });
    expect(none.customer.sent).toBe(true);

    const refused = vi.fn<typeof fetch>(async () => new Response("no", { status: 422 }));
    expect(await sendBookingNotifications(input, env, refused)).toEqual({
      owner: { sent: false, reason: "send_failed" },
      customer: { sent: false, reason: "send_failed" },
    });
    const broken = vi.fn<typeof fetch>(async () => {
      throw new Error("offline");
    });
    expect(await sendBookingNotifications(input, env, broken)).toEqual({
      owner: { sent: false, reason: "send_failed" },
      customer: { sent: false, reason: "send_failed" },
    });
  });
});
