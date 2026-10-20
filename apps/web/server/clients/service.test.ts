import { fixtures } from "@nosweat/fixtures";
import { beforeEach, describe, expect, it } from "vitest";
import { DEV_USER } from "../auth/session";
import { getSiteStore } from "../store";
import { clientsNeedingAttention, listClients } from "./service";
import { resetMemoryClientStore } from "./store";

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
