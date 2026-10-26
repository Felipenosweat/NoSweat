import { describe, expect, it, vi } from "vitest";
import {
  buildEstimateAnswerEmail,
  sendEstimateAnswerNotification,
  type EstimateAnswerInput,
} from "./estimate-email";

const input: EstimateAnswerInput = {
  ownerId: "owner-1",
  estimateId: "est-1",
  number: 12,
  title: "Move-out clean",
  clientName: "Maria Chen",
  decision: "approved",
  approvedByName: "Maria Chen",
  declineReason: null,
  totalCents: 36_500,
  fallbackEmail: "office@example.com",
  appOrigin: "https://nosweatfd.com/",
};

describe("buildEstimateAnswerEmail", () => {
  it("tells the owner who approved, how much, and links to the estimate", () => {
    const email = buildEstimateAnswerEmail(input);
    expect(email.subject).toBe("Maria Chen approved estimate #12");
    expect(email.text).toContain("$365.00");
    expect(email.text).toContain("https://nosweatfd.com/estimates/est-1");
  });

  it("includes the reason on a decline and escapes HTML", () => {
    const email = buildEstimateAnswerEmail({
      ...input,
      decision: "declined",
      approvedByName: null,
      declineReason: "Too <b>expensive</b>",
    });
    expect(email.subject).toBe("Maria Chen declined estimate #12");
    expect(email.text).toContain("Their reason: Too <b>expensive</b>");
    expect(email.html).toContain("Too &lt;b&gt;expensive&lt;/b&gt;");
  });
});

describe("sendEstimateAnswerNotification", () => {
  it("does nothing without a Resend key", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    expect(await sendEstimateAnswerNotification(input, {}, fetchImpl)).toEqual({
      sent: false,
      reason: "not_configured",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("falls back to the company e-mail when the account e-mail is unknown", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    const result = await sendEstimateAnswerNotification(
      input,
      { RESEND_API_KEY: "re_test" },
      fetchImpl,
    );
    expect(result).toEqual({ sent: true, to: "office@example.com" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
