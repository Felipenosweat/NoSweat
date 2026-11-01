import { ClientReplyRequest } from "@nosweat/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEV_USER } from "../auth/session";
import { resetMemoryOfficeStore } from "../office/store";
import { updateSettings } from "../office/service";
import { replyActivityBody, replyToClient } from "./reply";
import { createClient, getClientDetail } from "./service";
import { getClientStore, resetMemoryClientStore } from "./store";

// Sem Supabase: tudo em memória. A Resend é falsa (`fetchImpl`).

const ENV = { RESEND_API_KEY: "re_test" };

function okFetch() {
  return vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
}

function request(over: Record<string, unknown> = {}): ClientReplyRequest {
  return ClientReplyRequest.parse({
    channel: "email",
    subject: "Your request",
    message: "Hi Maria, we can do it on Wednesday at 2 PM.",
    ...over,
  });
}

beforeEach(async () => {
  resetMemoryClientStore();
  resetMemoryOfficeStore();
  await updateSettings(DEV_USER.id, { companyName: "Joe's Plumbing", email: "joe@biz.test" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("replyActivityBody", () => {
  it("labels the channel and keeps the first 120 characters on one line", () => {
    expect(replyActivityBody({ channel: "email", message: "Hi\n  there" })).toBe(
      "Reply sent by email: Hi there",
    );
    expect(replyActivityBody({ channel: "sms", message: "See you", confirmation: true })).toBe(
      "Confirmation texted: See you",
    );
    const long = replyActivityBody({ channel: "email", message: "a".repeat(300) });
    expect(long).toBe(`Reply sent by email: ${"a".repeat(120)}…`);
  });
});

describe("replyToClient", () => {
  it("sends the email, logs it and moves the client to contacted", async () => {
    const client = await createClient(DEV_USER.id, { name: "Maria Lopez", email: "maria@x.test" });
    const fetchImpl = okFetch();
    const outcome = await replyToClient(
      DEV_USER.id,
      client.id,
      request({ confirmation: true, moveToContacted: true }),
      ENV,
      fetchImpl,
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.data.delivery).toBe("sent");
    expect(outcome.data.activity.kind).toBe("message");
    expect(outcome.data.activity.body).toMatch(/^Confirmation sent by email: Hi Maria/);
    expect(outcome.data.client.stage).toBe("contacted");

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as Record<string, unknown>;
    expect(body.to).toEqual(["maria@x.test"]);
    expect(body.reply_to).toBe("joe@biz.test");

    const detail = await getClientDetail(DEV_USER.id, client.id);
    expect(detail?.activities.map((a) => a.kind).sort()).toEqual(["message", "stage"]);
  });

  it("keeps the stage when the owner does not ask to move it", async () => {
    const client = await createClient(DEV_USER.id, { name: "Ana", email: "ana@x.test" });
    const outcome = await replyToClient(DEV_USER.id, client.id, request(), ENV, okFetch());
    expect(outcome.ok && outcome.data.client.stage).toBe("new");
  });

  it("does not log anything when email sending is off", async () => {
    const client = await createClient(DEV_USER.id, { name: "Ana", email: "ana@x.test" });
    const fetchImpl = okFetch();
    const outcome = await replyToClient(DEV_USER.id, client.id, request(), {}, fetchImpl);
    expect(outcome).toEqual({ ok: false, reason: "not_configured" });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect((await getClientDetail(DEV_USER.id, client.id))?.activities).toEqual([]);
  });

  it("does not log anything when Resend refuses", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const client = await createClient(DEV_USER.id, { name: "Ana", email: "ana@x.test" });
    const refused = vi.fn<typeof fetch>(async () => new Response("no", { status: 500 }));
    expect(await replyToClient(DEV_USER.id, client.id, request(), ENV, refused)).toEqual({
      ok: false,
      reason: "send_failed",
    });
    expect((await getClientDetail(DEV_USER.id, client.id))?.activities).toEqual([]);
  });

  it("refuses to send when there is no business email for the answer to reach", async () => {
    await updateSettings(DEV_USER.id, { email: "" });
    const client = await createClient(DEV_USER.id, { name: "Ana", email: "ana@x.test" });
    const fetchImpl = okFetch();
    expect(await replyToClient(DEV_USER.id, client.id, request(), ENV, fetchImpl)).toEqual({
      ok: false,
      reason: "no_reply_to",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("logs a text message the owner sent from the phone, without calling Resend", async () => {
    const client = await createClient(DEV_USER.id, { name: "Bob", phone: "(512) 555-0101" });
    const fetchImpl = okFetch();
    const outcome = await replyToClient(
      DEV_USER.id,
      client.id,
      request({ channel: "sms", mode: "log", subject: undefined, confirmation: true }),
      ENV,
      fetchImpl,
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.data.delivery).toBe("logged");
    expect(outcome.data.activity.body).toMatch(/^Confirmation texted: /);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("needs the contact for the chosen channel", async () => {
    const client = await createClient(DEV_USER.id, { name: "Bob", phone: "(512) 555-0101" });
    expect(await replyToClient(DEV_USER.id, client.id, request(), ENV, okFetch())).toEqual({
      ok: false,
      reason: "no_contact",
    });
  });

  it("does not touch a client that belongs to someone else", async () => {
    const other = await getClientStore().insertClient({
      ownerId: "someone-else",
      name: "Not Yours",
      email: "notyours@x.test",
      phone: null,
      address: null,
      stage: "new",
      source: "manual",
      siteId: null,
      notes: "",
      followUpOn: null,
    });
    const fetchImpl = okFetch();
    expect(await replyToClient(DEV_USER.id, other.id, request(), ENV, fetchImpl)).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("ClientReplyRequest", () => {
  it("validates the message, the subject and the channel rules", () => {
    const base = { channel: "email", subject: "Hi", message: "Hello" };
    expect(ClientReplyRequest.safeParse(base).success).toBe(true);
    expect(ClientReplyRequest.safeParse({ ...base, message: "  " }).success).toBe(false);
    expect(ClientReplyRequest.safeParse({ ...base, message: "a".repeat(2001) }).success).toBe(
      false,
    );
    expect(ClientReplyRequest.safeParse({ ...base, subject: "" }).success).toBe(false);
    expect(ClientReplyRequest.safeParse({ ...base, subject: "a".repeat(151) }).success).toBe(false);
    // SMS nunca é enviado pelo servidor: só registrado.
    expect(ClientReplyRequest.safeParse({ channel: "sms", message: "Hi" }).success).toBe(false);
    expect(
      ClientReplyRequest.safeParse({ channel: "sms", mode: "log", message: "Hi" }).success,
    ).toBe(true);
  });
});
