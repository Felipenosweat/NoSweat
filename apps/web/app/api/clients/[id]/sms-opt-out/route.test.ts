import { ApiError, ClientResponse } from "@nosweat/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getClientStore, resetMemoryClientStore } from "@/server/clients/store";

// O login: nesta suíte o usuário muda de um teste para outro (o dono, outra pessoa ou ninguém).
const state = vi.hoisted(() => ({ user: null as { id: string; email: string | null } | null }));

vi.mock("@/server/auth/session", () => ({
  DEV_USER: { id: "local-dev", email: "dev@localhost" },
  getCurrentUser: async () => state.user,
}));

const { POST } = await import("./route");

const OWNER = { id: "owner-1", email: "owner@example.test" };
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const post = (body: unknown) =>
  new Request("http://localhost/api/clients/x/sms-opt-out", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

async function newClient(ownerId = OWNER.id) {
  return getClientStore().insertClient({
    ownerId,
    name: "Ana Lima",
    email: null,
    phone: "(305) 555-0187",
    address: null,
    stage: "contacted",
    source: "website",
    siteId: null,
    notes: "",
    followUpOn: null,
  });
}

beforeEach(() => {
  resetMemoryClientStore();
  state.user = OWNER;
});

describe("POST /api/clients/[id]/sms-opt-out", () => {
  it("answers 401 without a login and changes nothing", async () => {
    const client = await newClient();
    state.user = null;
    const res = await POST(post({ optedOut: true }), ctx(client.id));
    expect(res.status).toBe(401);
    expect((await getClientStore().getClient(OWNER.id, client.id))?.smsOptOut).toBeFalsy();
  });

  it("answers 404 for another owner's client (and leaves it alone)", async () => {
    const hidden = await newClient("someone-else");
    const res = await POST(post({ optedOut: true }), ctx(hidden.id));
    expect(res.status).toBe(404);
    expect(ApiError.parse(await res.json()).error.code).toBe("not_found");
    expect((await getClientStore().getClient("someone-else", hidden.id))?.smsOptOut).toBeFalsy();
    expect((await POST(post({ optedOut: true }), ctx("no-such-client"))).status).toBe(404);
  });

  it("answers 400 in the standard shape for a wrong body", async () => {
    const client = await newClient();
    for (const body of [{}, { optedOut: "yes" }, null]) {
      const res = await POST(post(body), ctx(client.id));
      expect(res.status).toBe(400);
      expect(ApiError.parse(await res.json()).error.code).toBe("invalid_request");
    }
  });

  it("marks the client with the date and writes one note in the history", async () => {
    const client = await newClient();
    const res = await POST(post({ optedOut: true }), ctx(client.id));
    expect(res.status).toBe(200);
    const body = ClientResponse.parse(await res.json());
    expect(body.client.smsOptOut).toBe(true);
    expect(Date.parse(body.client.smsOptOutAt ?? "")).not.toBeNaN();

    const stored = await getClientStore().getClient(OWNER.id, client.id);
    expect(stored?.smsOptOut).toBe(true);
    const history = await getClientStore().listActivities(OWNER.id, client.id);
    expect(history.filter((a) => /replied STOP/.test(a.body))).toHaveLength(1);

    // Marcar de novo não repete a nota nem muda a data.
    const again = ClientResponse.parse(
      await (await POST(post({ optedOut: true }), ctx(client.id))).json(),
    );
    expect(again.client.smsOptOutAt).toBe(body.client.smsOptOutAt);
    expect(
      (await getClientStore().listActivities(OWNER.id, client.id)).filter((a) =>
        /replied STOP/.test(a.body),
      ),
    ).toHaveLength(1);
  });

  it("lets the owner undo it", async () => {
    const client = await newClient();
    await POST(post({ optedOut: true }), ctx(client.id));
    const res = await POST(post({ optedOut: false }), ctx(client.id));
    expect(res.status).toBe(200);
    const body = ClientResponse.parse(await res.json());
    expect(body.client.smsOptOut).toBeUndefined();
    expect((await getClientStore().getClient(OWNER.id, client.id))?.smsOptOutAt).toBeNull();
  });
});
