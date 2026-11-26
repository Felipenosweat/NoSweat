import { fixtures } from "@nosweat/fixtures";
import { beforeEach, describe, expect, it } from "vitest";
import { DEV_USER } from "../auth/session";
import { getPublicAvailability, updateBookingSettings } from "../booking/service";
import { resetMemoryBookingStore } from "../booking/store";
import { listClients } from "../clients/service";
import { resetMemoryClientStore } from "../clients/store";
import { getSiteStore } from "../store";
import { createPriceItem, createTeamMember, listJobs, updateJob, updateSettings } from "./service";
import { resetMemoryOfficeStore } from "./store";
import { OfficeError } from "./types";
import { createWalkIn } from "./walk-in";

// "Agora" fixo (terça, 1/12/2026, 12:00 em Nova York). Quarta-feira tem horário das 9h às 17h.

const OWNER = DEV_USER.id;
const NOW = new Date("2026-12-01T17:00:00Z");
const WED_10 = "2026-12-02T10:00:00-05:00";

async function setup() {
  const store = getSiteStore();
  const site = await store.create(fixtures["glow-salon"], OWNER);
  await store.updateMeta(site.id, {
    status: "published",
    slug: `glow-${site.id.slice(0, 6)}`,
    publishedSpec: site.spec,
    publishedAt: NOW.toISOString(),
  });
  await updateSettings(OWNER, { timeZone: "America/New_York" });
  const item = await createPriceItem(OWNER, {
    name: "Haircut",
    unitPriceCents: 4500,
    bookable: true,
    durationMinutes: 45,
  });
  await updateBookingSettings(OWNER, { enabled: true, minNoticeHours: 0 });
  return { siteId: site.id, serviceId: item.id };
}

async function wednesday(data: { siteId: string; serviceId: string }, staffId?: string) {
  const result = await getPublicAvailability(
    data.siteId,
    { serviceId: data.serviceId, from: "2026-12-02", days: 1, staffId },
    NOW,
  );
  return (result?.days[0]?.slots ?? []).map((slot) => slot.startAt.slice(11, 16));
}

beforeEach(() => {
  resetMemoryOfficeStore();
  resetMemoryClientStore();
  resetMemoryBookingStore();
});

describe("createWalkIn", () => {
  it("blocks the time in online booking right away", async () => {
    const data = await setup();
    const before = await wednesday(data);
    expect(before).toContain("10:00");

    const job = await createWalkIn(OWNER, {
      serviceId: data.serviceId,
      startAt: WED_10,
      durationMinutes: 45,
    });
    expect(job).toMatchObject({ title: "Haircut", status: "scheduled", valueCents: 4500 });
    expect(Date.parse(job.endAt ?? "") - Date.parse(job.startAt ?? "")).toBe(45 * 60_000);

    const after = await wednesday(data);
    for (const time of ["09:30", "10:00", "10:30"]) expect(after).not.toContain(time);
    expect(after).toContain("09:00");
    expect(after).toContain("11:00");

    // Cancelar o walk-in devolve o horário.
    await updateJob(OWNER, job.id, { status: "canceled" });
    expect(await wednesday(data)).toContain("10:00");
  });

  it("only blocks the chosen person when the shop has a team", async () => {
    const data = await setup();
    const ana = await createTeamMember(OWNER, { name: "Ana" });
    const bo = await createTeamMember(OWNER, { name: "Bo" });
    await createWalkIn(OWNER, {
      serviceId: data.serviceId,
      startAt: WED_10,
      durationMinutes: 45,
      assigneeId: ana.id,
    });
    expect(await wednesday(data, ana.id)).not.toContain("10:00");
    expect(await wednesday(data, bo.id)).toContain("10:00");
  });

  it("uses one generic client for nameless walk-ins and reuses named ones", async () => {
    await setup();
    const at = (hour: number) => `2026-12-02T${String(hour).padStart(2, "0")}:00:00-05:00`;
    await createWalkIn(OWNER, { startAt: at(9), durationMinutes: 30 });
    await createWalkIn(OWNER, { startAt: at(13), durationMinutes: 30 });
    await createWalkIn(OWNER, { name: "Maria Lopez", startAt: at(14), durationMinutes: 30 });
    await createWalkIn(OWNER, { name: " maria lopez ", startAt: at(15), durationMinutes: 30 });
    const clients = await listClients(OWNER);
    expect(clients.map((c) => c.name).sort()).toEqual(["Maria Lopez", "Walk-in"]);
    const jobs = await listJobs(OWNER, {});
    expect(jobs).toHaveLength(4);
    expect(jobs.every((j) => j.title === "Walk-in")).toBe(true);
  });

  it("rejects an unknown service", async () => {
    await setup();
    await expect(
      createWalkIn(OWNER, { serviceId: "nope", startAt: WED_10, durationMinutes: 30 }),
    ).rejects.toBeInstanceOf(OfficeError);
  });
});
