import { ApiError, ClientReplyResponse } from "@nosweat/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEV_USER } from "@/server/auth/session";
import { createClient } from "@/server/clients/service";
import { getClientStore, resetMemoryClientStore } from "@/server/clients/store";
import { updateSettings } from "@/server/office/service";
import { resetMemoryOfficeStore } from "@/server/office/store";
import { POST as reply } from "./clients/[id]/reply/route";

// Sem Supabase: o usuário é o DEV_USER e tudo roda em memória. A Resend é falsa (fetch global).

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function post(id: string, body: unknown): Promise<Response> {
  return reply(
    new Request(`http://localhost/api/clients/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    ctx(id),
  );
}

async function errorOf(res: Response) {
  return ApiError.parse(await res.json()).error;
}

const valid = { channel: "email", subject: "Your request", message: "Hi, we got it." };

beforeEach(async () => {
  resetMemoryClientStore();
  resetMemoryOfficeStore();
  await updateSettings(DEV_USER.id, { companyName: "Joe's Plumbing", email: "joe@biz.test" });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/clients/[id]/reply", () => {
  it("sends the email and answers with the new activity", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = await createClient(DEV_USER.id, { name: "Maria Lopez", email: "m@x.test" });

    const res = await post(client.id, { ...valid, confirmation: true, moveToContacted: true });
    expect(res.status).toBe(201);
    const body = ClientReplyResponse.parse(await res.json());
    expect(body.delivery).toBe("sent");
    expect(body.activity.body).toBe("Confirmation sent by email: Hi, we got it.");
    expect(body.client.stage).toBe("contacted");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("answers 503 email_not_configured when sending is off", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const client = await createClient(DEV_USER.id, { name: "Maria", email: "m@x.test" });
    const res = await post(client.id, valid);
    expect(res.status).toBe(503);
    const error = await errorOf(res);
    expect(error.code).toBe("email_not_configured");
    expect(error.message).toMatch(/email app/);
  });

  it("logs a text message the owner sent from the phone", async () => {
    const client = await createClient(DEV_USER.id, { name: "Bob", phone: "(512) 555-0101" });
    const res = await post(client.id, { channel: "sms", mode: "log", message: "See you at 2" });
    expect(res.status).toBe(201);
    expect(ClientReplyResponse.parse(await res.json()).delivery).toBe("logged");
  });

  it("rejects bad input with the standard error format", async () => {
    const client = await createClient(DEV_USER.id, { name: "Maria", email: "m@x.test" });
    for (const bad of [
      { ...valid, message: "" },
      { ...valid, message: "a".repeat(2001) },
      { ...valid, subject: undefined },
      { channel: "sms", message: "Hi" },
      { channel: "fax", message: "Hi" },
    ]) {
      const res = await post(client.id, bad);
      expect(res.status).toBe(400);
      expect((await errorOf(res)).code).toBe("invalid_request");
    }
    const notJson = await reply(
      new Request("http://localhost/api/clients/x/reply", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "hi",
      }),
      ctx(client.id),
    );
    expect(notJson.status).toBe(415);
  });

  it("answers 400 when the client has no email", async () => {
    const client = await createClient(DEV_USER.id, { name: "Bob", phone: "(512) 555-0101" });
    const res = await post(client.id, valid);
    expect(res.status).toBe(400);
    expect((await errorOf(res)).message).toMatch(/no email/);
  });

  it("answers 404 for a missing client or one that belongs to someone else", async () => {
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
    expect((await post(other.id, valid)).status).toBe(404);
    expect((await post("does-not-exist", valid)).status).toBe(404);
  });
});
