import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildClientReplyEmail,
  replyFromAddress,
  sendClientReplyEmail,
  type ClientReplyEmailInput,
} from "./client-reply-email";

const input: ClientReplyEmailInput = {
  to: "maria@example.test",
  replyTo: "joe@biz.test",
  companyName: "Joe's Plumbing",
  subject: "Your request\r\nBcc: evil@example.test",
  message: "Hi Maria <b>thanks</b>!\nSee you then.",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("replyFromAddress", () => {
  it("keeps the platform address and shows the company name", () => {
    expect(replyFromAddress("Joe's Plumbing", {})).toBe("Joe's Plumbing <leads@nosweatfd.com>");
    expect(replyFromAddress("A", { LEADS_FROM_EMAIL: "Team <x@mail.test>" })).toBe(
      "A <x@mail.test>",
    );
  });

  it("strips characters that could break the header and keeps the default without a name", () => {
    expect(replyFromAddress('Joe "<evil>"\n', {})).toBe("Joe evil <leads@nosweatfd.com>");
    expect(replyFromAddress("", {})).toBe("NoSweat <leads@nosweatfd.com>");
  });
});

describe("buildClientReplyEmail", () => {
  it("makes the subject one line and escapes the HTML", () => {
    const email = buildClientReplyEmail(input);
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.text).toBe("Hi Maria <b>thanks</b>!\nSee you then.");
    expect(email.html).toContain("&lt;b&gt;thanks&lt;/b&gt;");
    expect(email.html).not.toContain("<b>");
  });
});

describe("sendClientReplyEmail", () => {
  it("does nothing without a Resend key", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    expect(await sendClientReplyEmail(input, {}, fetchImpl)).toEqual({
      sent: false,
      reason: "not_configured",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends through Resend with reply_to on the owner", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    const result = await sendClientReplyEmail(input, { RESEND_API_KEY: "re_test" }, fetchImpl);
    expect(result).toEqual({ sent: true });
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe("https://api.resend.com/emails");
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body.to).toEqual(["maria@example.test"]);
    expect(body.reply_to).toBe("joe@biz.test");
    expect(body.from).toBe("Joe's Plumbing <leads@nosweatfd.com>");
  });

  it("reports a failure when Resend refuses or the network breaks", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const refused = vi.fn<typeof fetch>(async () => new Response("no", { status: 422 }));
    expect(await sendClientReplyEmail(input, { RESEND_API_KEY: "re_test" }, refused)).toEqual({
      sent: false,
      reason: "send_failed",
    });
    const broken = vi.fn<typeof fetch>(async () => {
      throw new Error("offline");
    });
    expect(await sendClientReplyEmail(input, { RESEND_API_KEY: "re_test" }, broken)).toEqual({
      sent: false,
      reason: "send_failed",
    });
  });
});
