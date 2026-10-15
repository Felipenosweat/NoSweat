import { fixtures } from "@nosweat/fixtures";
import {
  ApiError,
  ClientActivityResponse,
  ClientDetailResponse,
  ClientResponse,
  ClientsResponse,
} from "@nosweat/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { DEV_USER } from "@/server/auth/session";
import { clientsNeedingAttention, listClients } from "@/server/clients/service";
import { getClientStore, resetMemoryClientStore } from "@/server/clients/store";
import { getSiteStore } from "@/server/store";
import { POST as addActivity } from "./clients/[id]/activities/route";
import {
  DELETE as deleteClient,
  GET as getClient,
  PATCH as patchClient,
} from "./clients/[id]/route";
import { GET as listRoute, POST as createRoute } from "./clients/route";

// Sem Supabase: o usuário é o DEV_USER e tudo roda em memória. Os sites e pedidos (server/store)
// continuam entre um teste e outro; por isso cada teste usa e-mails próprios.

const BASE = "http://localhost/api/clients";
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function jsonRequest(path: string, method: string, body: unknown): Request {
  return new Request(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function create(body: Record<string, unknown>) {
  const res = await createRoute(jsonRequest("", "POST", body));
  expect(res.status).toBe(201);
  return ClientResponse.parse(await res.json()).client;
}

async function list(query = "") {
  const res = await listRoute(new Request(`${BASE}${query}`));
  expect(res.status).toBe(200);
  return ClientsResponse.parse(await res.json()).clients;
}

async function detail(id: string) {
  const res = await getClient(new Request(`${BASE}/${id}`), ctx(id));
  expect(res.status).toBe(200);
  return ClientDetailResponse.parse(await res.json());
}

beforeEach(() => {
  resetMemoryClientStore();
});

describe("/api/clients", () => {
  it("creates, lists, searches and filters by stage", async () => {
    const ana = await create({ name: "Ana Lima", email: "", phone: "(512) 555-0101" });
    expect(ana.source).toBe("manual");
    expect(ana.stage).toBe("new");
    expect(ana.email).toBeNull();
    expect(ana.siteId).toBeNull();
    const bob = await create({ name: "Bob Stone", email: "bob@stone.test", stage: "quoted" });

    const all = await list();
    expect(all.map((c) => c.id)).toEqual(expect.arrayContaining([ana.id, bob.id]));

    expect((await list("?q=ANA%20L")).map((c) => c.id)).toEqual([ana.id]);
    expect((await list("?q=BOB%40STONE")).map((c) => c.id)).toEqual([bob.id]);
    expect((await list("?q=512-555")).map((c) => c.id)).toEqual([ana.id]);

    const quoted = await list("?stage=quoted");
    expect(quoted.map((c) => c.id)).toEqual([bob.id]);

    const bad = await listRoute(new Request(`${BASE}?stage=nope`));
    expect(bad.status).toBe(400);
    expect(ApiError.parse(await bad.json()).error.code).toBe("invalid_request");
  });

  it("rejects a client without email or phone", async () => {
    const res = await createRoute(jsonRequest("", "POST", { name: "Nobody" }));
    expect(res.status).toBe(400);
  });

  it("imports site leads, merging the same email in different case, idempotently", async () => {
    const site = await getSiteStore().create(fixtures["joes-plumbing"], DEV_USER.id);
    const store = getSiteStore();
    const first = await store.addLead(site.id, {
      name: "Carla Diaz",
      email: "Carla@Example.test",
      phone: null,
      message: "My sink is leaking.",
    });
    const second = await store.addLead(site.id, {
      name: "Carla D.",
      email: "  carla@example.TEST ",
      phone: "+1 (512) 555-0199",
      message: "Any time Friday?",
    });

    const once = (await list("?q=carla@example")).filter((c) => c.siteId === site.id);
    const twice = (await list("?q=carla@example")).filter((c) => c.siteId === site.id);
    expect(once).toHaveLength(1);
    expect(twice).toHaveLength(1);
    const carla = twice[0]!;
    expect(carla.id).toBe(once[0]!.id);
    expect(carla.source).toBe("website");
    expect(carla.name).toBe("Carla Diaz");
    expect(carla.phone).toBe("+1 (512) 555-0199");

    const { activities } = await detail(carla.id);
    const leads = activities.filter((a) => a.kind === "lead");
    expect(leads).toHaveLength(2);
    expect(leads.map((a) => a.leadId).sort()).toEqual([first.id, second.id].sort());
    expect(leads.every((a) => a.siteId === site.id)).toBe(true);

    // Telefone igual (com ou sem o "1" do país) também junta.
    await store.addLead(site.id, {
      name: "Carla",
      email: null,
      phone: "512.555.0199",
      message: "Third message",
    });
    const after = (await list("?q=carla")).filter((c) => c.siteId === site.id);
    expect(after).toHaveLength(1);
    expect((await detail(carla.id)).activities.filter((a) => a.kind === "lead")).toHaveLength(3);
  });

  it("writes a stage activity when the stage changes", async () => {
    const client = await create({ name: "Dan Ruiz", email: "dan@ruiz.test" });
    const res = await patchClient(
      jsonRequest(`/${client.id}`, "PATCH", { stage: "contacted", followUpOn: "2026-10-20" }),
      ctx(client.id),
    );
    expect(res.status).toBe(200);
    const updated = ClientResponse.parse(await res.json()).client;
    expect(updated.stage).toBe("contacted");
    expect(updated.followUpOn).toBe("2026-10-20");

    // Mesma etapa de novo: nada novo no histórico.
    await patchClient(
      jsonRequest(`/${client.id}`, "PATCH", { stage: "contacted" }),
      ctx(client.id),
    );
    const { activities } = await detail(client.id);
    expect(activities.filter((a) => a.kind === "stage").map((a) => a.body)).toEqual(["contacted"]);
  });

  it("sums job activities and keeps the amount only on jobs", async () => {
    const client = await create({ name: "Eva Moss", phone: "5125550123" });
    const job = async (body: string, amountCents: number | null) => {
      const res = await addActivity(
        jsonRequest(`/${client.id}/activities`, "POST", { kind: "job", body, amountCents }),
        ctx(client.id),
      );
      expect(res.status).toBe(201);
      return ClientActivityResponse.parse(await res.json());
    };
    await job("Water heater install", 120_000);
    const last = await job("Follow-up visit", null);
    expect(last.client.jobsCount).toBe(2);
    expect(last.client.totalJobsCents).toBe(120_000);

    const noteRes = await addActivity(
      jsonRequest(`/${client.id}/activities`, "POST", {
        kind: "note",
        body: "Gate code 1234",
        amountCents: 5_000,
      }),
      ctx(client.id),
    );
    const note = ClientActivityResponse.parse(await noteRes.json());
    expect(note.activity.amountCents).toBeNull();
    expect(note.client.totalJobsCents).toBe(120_000);

    const { activities } = await detail(client.id);
    expect(activities).toHaveLength(3);
  });

  it("hides other owners' clients", async () => {
    const other = await getClientStore().insertClient({
      ownerId: "someone-else",
      name: "Hidden",
      email: "hidden@x.test",
      phone: null,
      address: null,
      stage: "new",
      source: "manual",
      siteId: null,
      notes: "",
      followUpOn: null,
    });
    expect((await getClient(new Request(BASE), ctx(other.id))).status).toBe(404);
    expect(
      (await patchClient(jsonRequest(`/${other.id}`, "PATCH", { name: "X" }), ctx(other.id)))
        .status,
    ).toBe(404);
    expect(
      (
        await addActivity(
          jsonRequest(`/${other.id}/activities`, "POST", { kind: "note", body: "hi" }),
          ctx(other.id),
        )
      ).status,
    ).toBe(404);
    expect((await deleteClient(new Request(BASE), ctx(other.id))).status).toBe(404);
    expect((await list()).some((c) => c.id === other.id)).toBe(false);
  });

  it("does not re-import the leads of a deleted client", async () => {
    const site = await getSiteStore().create(fixtures["glow-salon"], DEV_USER.id);
    await getSiteStore().addLead(site.id, {
      name: "Fay Gold",
      email: "fay@gold.test",
      phone: null,
      message: "Haircut on Saturday?",
    });
    const [fay] = await list("?q=fay@gold.test");
    expect(fay).toBeDefined();

    const res = await deleteClient(new Request(`${BASE}/${fay!.id}`), ctx(fay!.id));
    expect(res.status).toBe(200);
    expect(await list("?q=fay@gold.test")).toEqual([]);
    expect(await listClients(DEV_USER.id, { q: "fay@gold.test" })).toEqual([]);
  });

  it("summarizes clients needing attention", async () => {
    const late = await create({ name: "Gus Late", email: "gus@late.test", stage: "contacted" });
    const today = await create({ name: "Hal Today", email: "hal@today.test", stage: "quoted" });
    const won = await create({ name: "Ivy Won", email: "ivy@won.test", stage: "won" });
    const future = await create({ name: "Jo Future", email: "jo@future.test" });
    const follow = (id: string, followUpOn: string) =>
      patchClient(jsonRequest(`/${id}`, "PATCH", { followUpOn }), ctx(id));
    await follow(late.id, "2026-10-01");
    await follow(today.id, "2026-10-15");
    await follow(won.id, "2026-10-02");
    await follow(future.id, "2026-10-30");

    const summary = await clientsNeedingAttention(DEV_USER.id, "2026-10-15");
    expect(summary.followUpsDue.map((c) => c.id)).toEqual([late.id, today.id]);
    const newClients = await listClients(DEV_USER.id, { stage: "new" });
    expect(summary.newCount).toBe(newClients.length);
    expect(newClients.some((c) => c.id === future.id)).toBe(true);
  });
});
