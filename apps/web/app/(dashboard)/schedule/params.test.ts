import { describe, expect, it } from "vitest";
import { parseScheduleParams, scheduleHref } from "./params";

// Filtros da agenda na URL: leitura (valores ruins voltam ao padrão) e o link curto.

describe("parseScheduleParams", () => {
  it("returns the defaults for an empty URL", () => {
    expect(parseScheduleParams({})).toEqual({
      view: null,
      date: null,
      team: null,
      openNew: false,
      clientId: null,
    });
  });

  it("reads the view, date, team, new job sheet and client", () => {
    expect(
      parseScheduleParams({
        view: "day",
        date: "2026-10-26",
        team: "m1",
        new: "1",
        client: "c1",
      }),
    ).toEqual({ view: "day", date: "2026-10-26", team: "m1", openNew: true, clientId: "c1" });
  });

  it("ignores unknown values and keeps the first of repeated ones", () => {
    const params = parseScheduleParams({
      view: "month",
      date: "tomorrow",
      new: "yes",
      client: ["c1", "c2"],
    });
    expect(params.view).toBeNull();
    expect(params.date).toBeNull();
    expect(params.openNew).toBe(false);
    expect(params.clientId).toBe("c1");
  });

  it("trims the client id and caps it at 64 characters", () => {
    expect(parseScheduleParams({ client: "   " }).clientId).toBeNull();
    expect(parseScheduleParams({ client: ` ${"x".repeat(80)} ` }).clientId).toBe("x".repeat(64));
  });
});

describe("scheduleHref", () => {
  const base = { view: null, date: null, team: null };

  it("keeps the link short when everything is the default", () => {
    expect(scheduleHref(base)).toBe("/schedule");
  });

  it("adds the client only when the new job sheet opens", () => {
    expect(scheduleHref({ ...base, openNew: true, clientId: "c 1" })).toBe(
      "/schedule?new=1&client=c+1",
    );
    expect(scheduleHref({ ...base, clientId: "c1" })).toBe("/schedule");
  });

  it("keeps the view, date and team", () => {
    expect(scheduleHref({ view: "week", date: "2026-10-26", team: "unassigned" })).toBe(
      "/schedule?view=week&date=2026-10-26&team=unassigned",
    );
  });
});
