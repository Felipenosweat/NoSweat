import { describe, expect, it } from "vitest";
import { REPLY_TEMPLATES, buildReplyTemplate, formatReplyWhen } from "./clients";

describe("formatReplyWhen", () => {
  it("writes the day and the time in plain English", () => {
    expect(formatReplyWhen({ date: "2026-10-21", time: "14:30" })).toBe(
      "Wednesday, Oct 21 at 2:30 PM",
    );
    expect(formatReplyWhen({ date: "2026-10-21", time: "00:05" })).toBe(
      "Wednesday, Oct 21 at 12:05 AM",
    );
    expect(formatReplyWhen({ date: "2026-10-21", time: "12:00" })).toBe(
      "Wednesday, Oct 21 at 12:00 PM",
    );
  });

  it("accepts only a day or only a time, and nothing", () => {
    expect(formatReplyWhen({ date: "2026-10-21", time: "" })).toBe("Wednesday, Oct 21");
    expect(formatReplyWhen({ date: "", time: "09:00" })).toBe("at 9:00 AM");
    expect(formatReplyWhen({ date: "", time: "" })).toBe("");
    expect(formatReplyWhen({ date: "soon", time: "later" })).toBe("");
  });
});

describe("buildReplyTemplate", () => {
  const base = { firstName: "Maria", company: "Joe's Plumbing", phone: "(512) 555-0100" };

  it("has the three templates", () => {
    expect(REPLY_TEMPLATES.map((t) => t.label)).toEqual([
      "Confirm the job",
      "Ask for details",
      "Send a quote soon",
    ]);
  });

  it("confirms with the day and time the owner picked", () => {
    const { subject, message } = buildReplyTemplate({
      ...base,
      template: "confirm",
      when: { date: "2026-10-21", time: "14:30" },
    });
    expect(subject).toBe("Confirming your request with Joe's Plumbing");
    expect(message).toBe(
      "Hi Maria, thanks for reaching out to Joe's Plumbing! We received your request. We can do it on Wednesday, Oct 21 at 2:30 PM. We'll see you then. Reply here or call (512) 555-0100 to change anything.",
    );
  });

  it("does not promise a date the owner did not pick", () => {
    const { message } = buildReplyTemplate({ ...base, template: "confirm" });
    expect(message).toContain("confirm a day and time with you shortly");
    expect(message).not.toMatch(/We can do it/);
  });

  it("uses a time without a day", () => {
    const { message } = buildReplyTemplate({
      ...base,
      template: "confirm",
      when: { date: "", time: "09:00" },
    });
    expect(message).toContain("We can do it at 9:00 AM.");
  });

  it("falls back to neutral words when name, company or phone are missing", () => {
    const { subject, message } = buildReplyTemplate({
      template: "quote",
      firstName: "",
      company: null,
      phone: null,
    });
    expect(subject).toBe("Your request");
    expect(message).toBe(
      "Hi there, thanks for reaching out to us! We received your request and will send you a quote soon. Just reply to this message if you want to add anything.",
    );
  });

  it("asks for details without inventing anything", () => {
    const { message } = buildReplyTemplate({ ...base, template: "details" });
    expect(message).toContain("Hi Maria");
    expect(message).toContain("tell us a bit more about the job");
    expect(message).toContain("call (512) 555-0100");
  });
});
