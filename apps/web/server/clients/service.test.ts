import { fixtures } from "@nosweat/fixtures";
import type { Client } from "@nosweat/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { sortClients } from "@/lib/clients";
import { DEV_USER } from "../auth/session";
import { getSiteStore } from "../store";
import { clientsToCsv, csvCell } from "./csv";
import {
  addClientActivity,
  clientsNeedingAttention,
  createClient,
  getClientsSummary,
  listClients,
  searchClients,
  summarizeClients,
  updateClient,
} from "./service";
import { resetMemoryClientStore } from "./store";
import { normalizeTags } from "./types";

// Sem Supabase: tudo em memória. Os pedidos dos sites continuam entre os testes, por isso cada
// teste usa e-mails próprios.

beforeEach(() => {
  resetMemoryClientStore();
});

describe("syncLeadsToClients and the owner's own test request", () => {
  it("does not turn the owner's own test request into a client, even later", async () => {
    const site = await getSiteStore().create(fixtures["joes-plumbing"], DEV_USER.id);
    await getSiteStore().addLead(site.id, {
      name: "Owner Testing",
      email: " Owner.Self@Example.test ",
      phone: null,
      message: "Just testing my form.",
    });
    await getSiteStore().addLead(site.id, {
      name: "Real Customer",
      email: "real.customer@example.test",
      phone: null,
      message: "Can you fix my sink?",
    });

    const ownerEmail = "owner.self@example.test";
    const clients = await listClients(DEV_USER.id, { ownerEmail });
    expect(clients.some((c) => c.name === "Owner Testing")).toBe(false);
    expect(clients.some((c) => c.name === "Real Customer")).toBe(true);

    // O teste fica na lápide: sem o e-mail (ex.: outra chamada), ele não volta.
    expect(await listClients(DEV_USER.id, { q: "owner.self@example.test" })).toEqual([]);
    const summary = await clientsNeedingAttention(DEV_USER.id, "2026-10-15");
    const newClients = await listClients(DEV_USER.id, { stage: "new" });
    expect(summary.newCount).toBe(newClients.length);
    expect(newClients.some((c) => c.name === "Owner Testing")).toBe(false);
  });
});

// ---------- etiquetas, ordem, resumo e CSV ----------

function makeClient(over: Partial<Client> & Pick<Client, "id" | "name">): Client {
  return {
    email: null,
    phone: null,
    address: null,
    stage: "new",
    source: "manual",
    siteId: null,
    notes: "",
    followUpOn: null,
    lastActivityAt: "2026-10-10T12:00:00.000Z",
    totalJobsCents: 0,
    jobsCount: 0,
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    tags: [],
    ...over,
  };
}

describe("normalizeTags", () => {
  it("trims, drops empty and case-insensitive duplicates, and caps at 10", () => {
    expect(normalizeTags(["  VIP ", "vip", "", "Repeat   customer", "Referral"])).toEqual([
      "VIP",
      "Repeat customer",
      "Referral",
    ]);
    const many = Array.from({ length: 15 }, (_, i) => `t${i}`);
    expect(normalizeTags(many)).toHaveLength(10);
    expect(normalizeTags(undefined)).toEqual([]);
  });
});

describe("tags on create, update and search", () => {
  it("saves cleaned tags, finds clients by tag and address, and replaces tags on update", async () => {
    const client = await createClient(DEV_USER.id, {
      name: "Tina Tag",
      phone: "5125550170",
      address: "42 Oak Ln, Austin, TX",
      tags: [" VIP", "vip", "Commercial"],
      followUpOn: "2026-10-20",
    });
    expect(client.tags).toEqual(["VIP", "Commercial"]);
    expect(client.followUpOn).toBe("2026-10-20");

    expect((await listClients(DEV_USER.id, { q: "commercial" })).map((c) => c.id)).toEqual([
      client.id,
    ]);
    expect((await listClients(DEV_USER.id, { q: "oak ln" })).map((c) => c.id)).toEqual([client.id]);

    const updated = await updateClient(DEV_USER.id, client.id, { tags: ["Repeat"] });
    expect(updated?.tags).toEqual(["Repeat"]);
    // Sem `tags` no pedido: as etiquetas ficam como estão.
    const renamed = await updateClient(DEV_USER.id, client.id, { name: "Tina T." });
    expect(renamed?.tags).toEqual(["Repeat"]);
  });

  it("searchClients matches tags and phone digits", () => {
    const a = makeClient({ id: "a", name: "Ann", tags: ["Referral"] });
    const b = makeClient({ id: "b", name: "Ben", phone: "(512) 555-0199" });
    expect(searchClients([a, b], "referral").map((c) => c.id)).toEqual(["a"]);
    expect(searchClients([a, b], "512555").map((c) => c.id)).toEqual(["b"]);
    expect(searchClients([a, b], "").map((c) => c.id)).toEqual(["a", "b"]);
  });
});

describe("sortClients", () => {
  const older = makeClient({
    id: "1",
    name: "zoe",
    lastActivityAt: "2026-10-01T00:00:00.000Z",
    totalJobsCents: 50_000,
  });
  const newer = makeClient({
    id: "2",
    name: "Álvaro",
    lastActivityAt: "2026-10-12T00:00:00.000Z",
    totalJobsCents: 0,
  });
  const middle = makeClient({
    id: "3",
    name: "Bea",
    lastActivityAt: "2026-10-05T00:00:00.000Z",
    totalJobsCents: 50_000,
  });

  it("sorts by recent activity, by name (accent and case insensitive) and by value", () => {
    const list = [older, newer, middle];
    expect(sortClients(list, "recent").map((c) => c.id)).toEqual(["2", "3", "1"]);
    expect(sortClients(list, "name").map((c) => c.id)).toEqual(["2", "3", "1"]);
    // Empate no valor: o contato mais recente primeiro.
    expect(sortClients(list, "value").map((c) => c.id)).toEqual(["3", "1", "2"]);
    // Não muda a lista original.
    expect(list.map((c) => c.id)).toEqual(["1", "2", "3"]);
  });
});

describe("summarizeClients", () => {
  it("counts new, follow-ups due, won this month and revenue in the business time zone", () => {
    const today = "2026-10-15";
    const clients = [
      makeClient({ id: "n1", name: "New One", stage: "new", followUpOn: "2026-10-15" }),
      makeClient({ id: "n2", name: "New Two", stage: "new" }),
      makeClient({ id: "c1", name: "Late", stage: "contacted", followUpOn: "2026-10-02" }),
      makeClient({ id: "q1", name: "Later", stage: "quoted", followUpOn: "2026-10-30" }),
      // Retorno vencido, mas já ganho: não conta.
      makeClient({ id: "w1", name: "Won", stage: "won", followUpOn: "2026-10-01" }),
      // Ganho em setembro (fora do mês).
      makeClient({ id: "w2", name: "Won Before", stage: "won" }),
      // Cadastrado já como ganho neste mês (sem item de etapa).
      makeClient({
        id: "w3",
        name: "Won Manual",
        stage: "won",
        createdAt: "2026-10-03T15:00:00.000Z",
      }),
      // Foi ganho neste mês, mas depois perdido: não conta.
      makeClient({ id: "l1", name: "Lost", stage: "lost" }),
    ];
    const activities = [
      {
        clientId: "w1",
        kind: "stage" as const,
        body: "won",
        amountCents: null,
        occurredAt: "2026-10-08T14:00:00.000Z",
      },
      {
        clientId: "w2",
        kind: "stage" as const,
        body: "won",
        amountCents: null,
        occurredAt: "2026-09-20T14:00:00.000Z",
      },
      {
        clientId: "l1",
        kind: "stage" as const,
        body: "won",
        amountCents: null,
        occurredAt: "2026-10-04T14:00:00.000Z",
      },
      {
        clientId: "w1",
        kind: "job" as const,
        body: "Install",
        amountCents: 120_000,
        occurredAt: "2026-10-09T14:00:00.000Z",
      },
      {
        clientId: "w1",
        kind: "job" as const,
        body: "Visit",
        amountCents: null,
        occurredAt: "2026-10-10T14:00:00.000Z",
      },
      // 1º de outubro às 02:00 UTC ainda é 30 de setembro em Nova York: fica fora.
      {
        clientId: "w2",
        kind: "job" as const,
        body: "Old",
        amountCents: 99_900,
        occurredAt: "2026-10-01T02:00:00.000Z",
      },
    ];
    const summary = summarizeClients({
      clients,
      activities,
      today,
      timeZone: "America/New_York",
    });
    expect(summary).toEqual({
      newCount: 2,
      followUpsToday: 1,
      followUpsOverdue: 1,
      wonThisMonth: 2,
      revenueThisMonthCents: 120_000,
      jobsThisMonth: 2,
      month: "2026-10",
    });
  });

  it("reads this month's jobs and stage changes from the store", async () => {
    const client = await createClient(DEV_USER.id, {
      name: "Store Summary",
      email: "store.summary@example.test",
      stage: "quoted",
    });
    await updateClient(DEV_USER.id, client.id, { stage: "won" });
    await addClientActivity(DEV_USER.id, client.id, {
      kind: "job",
      body: "Kitchen remodel",
      amountCents: 450_000,
    });
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const clients = await listClients(DEV_USER.id);
    const summary = await getClientsSummary(DEV_USER.id, clients, today, "America/New_York");
    expect(summary.wonThisMonth).toBe(1);
    expect(summary.revenueThisMonthCents).toBe(450_000);
    expect(summary.jobsThisMonth).toBe(1);
  });
});

describe("clientsToCsv", () => {
  it("escapes commas, quotes and new lines, guards formulas and keeps phone numbers", () => {
    const csv = clientsToCsv(
      [
        makeClient({
          id: "x",
          name: 'Smith, "Bob"',
          phone: "+1 (512) 555-0100",
          email: "bob@smith.test",
          notes: "Line one\nLine two",
          tags: ["VIP", "Repeat"],
          stage: "won",
          totalJobsCents: 125_050,
          jobsCount: 2,
        }),
        makeClient({ id: "y", name: '=HYPERLINK("http://x")', email: "y@y.test" }),
      ],
      "America/New_York",
    );
    expect(csv.startsWith("﻿Name,Phone,Email,")).toBe(true);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[1]).toContain('"Smith, ""Bob"""');
    expect(lines[1]).toContain(",+1 (512) 555-0100,");
    expect(lines[1]).toContain(",Won,Added by you,VIP; Repeat,");
    expect(lines[1]).toContain(",2,1250.50,");
    expect(lines[1]).toContain('"Line one\nLine two"');
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`);
    expect(csvCell("-5")).toBe("-5");
    expect(csvCell("@cmd")).toBe("'@cmd");
    expect(csvCell(null)).toBe("");
  });
});
