import { describe, expect, it } from "vitest";
import {
  digestDue,
  draftCheck,
  isAutopilotCandidate,
  monthToPlan,
  needsNotice,
  noticeHorizon,
  pickWithinCap,
  postsPerWeekFor,
  readyToAutoApprove,
} from "./autopilot-rules";

const TZ = "America/New_York";
const HOUR = 3_600_000;
const media = [
  {
    path: "owner/a.jpg",
    url: "https://x.supabase.co/storage/v1/object/public/social-media/a.jpg",
    width: 1080,
    height: 1350,
    mime: "image/jpeg" as const,
  },
];

// 25/11/2026 às 9 h em Nova York (UTC-5).
const NOW = new Date("2026-11-25T14:00:00.000Z");
const nowMs = NOW.getTime();
const at = (hours: number) => new Date(nowMs + hours * HOUR).toISOString();

function draft(overrides: Partial<Parameters<typeof draftCheck>[0]> = {}) {
  return {
    status: "draft" as const,
    source: "ai" as const,
    caption: "Spotless kitchens in Austin.",
    media,
    scheduledAt: at(20),
    claimsFlagged: false,
    autopilotSkip: false,
    ownerEditedAt: null,
    autopilotNoticeAt: null,
    ...overrides,
  };
}

describe("draftCheck", () => {
  it("needs a photo, a caption and a future date, and respects Skip and flagged claims", () => {
    expect(draftCheck(draft(), nowMs)).toBe("ready");
    expect(draftCheck(draft({ media: [] }), nowMs)).toBe("incomplete");
    expect(draftCheck(draft({ caption: "  " }), nowMs)).toBe("incomplete");
    expect(draftCheck(draft({ scheduledAt: null }), nowMs)).toBe("incomplete");
    expect(draftCheck(draft({ scheduledAt: at(-1) }), nowMs)).toBe("past");
    expect(draftCheck(draft({ autopilotSkip: true }), nowMs)).toBe("skipped");
    expect(draftCheck(draft({ claimsFlagged: true }), nowMs)).toBe("flagged");
  });
});

describe("autopilot candidates", () => {
  it("only takes complete AI drafts the owner did not edit", () => {
    expect(isAutopilotCandidate(draft(), nowMs)).toBe(true);
    expect(isAutopilotCandidate(draft({ source: "manual" }), nowMs)).toBe(false);
    expect(isAutopilotCandidate(draft({ ownerEditedAt: at(-1) }), nowMs)).toBe(false);
    expect(isAutopilotCandidate(draft({ status: "approved" }), nowMs)).toBe(false);
    expect(isAutopilotCandidate(draft({ autopilotSkip: true }), nowMs)).toBe(false);
  });

  it("notices only posts with room for 12 hours of notice", () => {
    const horizon = Date.parse(noticeHorizon(NOW, TZ));
    expect(needsNotice(draft({ scheduledAt: at(20) }), nowMs, horizon)).toBe(true);
    // Daqui a 12 h: não dá para avisar com 12 h antes da janela de aprovação.
    expect(needsNotice(draft({ scheduledAt: at(12) }), nowMs, horizon)).toBe(false);
    // Já avisado.
    expect(needsNotice(draft({ autopilotNoticeAt: at(-1) }), nowMs, horizon)).toBe(false);
    // Depois de amanhã: fica para o aviso de amanhã.
    expect(needsNotice(draft({ scheduledAt: at(70) }), nowMs, horizon)).toBe(false);
  });

  it("auto-approves only within 2 hours of the time and 12 hours after the notice", () => {
    const noticed = (hoursAgo: number, leadHours: number) =>
      draft({ autopilotNoticeAt: at(-hoursAgo), scheduledAt: at(leadHours) });
    expect(readyToAutoApprove(noticed(13, 1.5), nowMs)).toBe(true);
    expect(readyToAutoApprove(noticed(13, 3), nowMs)).toBe(false); // cedo demais
    expect(readyToAutoApprove(noticed(11, 1.5), nowMs)).toBe(false); // aviso recente
    expect(readyToAutoApprove(noticed(13, -0.5), nowMs)).toBe(false); // já passou
    expect(readyToAutoApprove(noticed(13, 0.01), nowMs)).toBe(false); // em cima da hora
    expect(readyToAutoApprove(draft({ scheduledAt: at(1) }), nowMs)).toBe(false); // sem aviso
    expect(readyToAutoApprove({ ...noticed(13, 1), ownerEditedAt: at(-0.5) }, nowMs)).toBe(false);
    expect(readyToAutoApprove({ ...noticed(13, 1), autopilotSkip: true }, nowMs)).toBe(false);
  });
});

describe("daily digest timing", () => {
  it("sends from 8 AM local time, once per local day", () => {
    expect(digestDue(null, NOW, TZ)).toBe(true);
    // 7 h em Nova York: ainda não.
    expect(digestDue(null, new Date("2026-11-25T12:00:00.000Z"), TZ)).toBe(false);
    // Já saiu hoje às 8 h.
    expect(digestDue("2026-11-25T13:05:00.000Z", NOW, TZ)).toBe(false);
    // Saiu ontem.
    expect(digestDue("2026-11-24T13:05:00.000Z", NOW, TZ)).toBe(true);
  });

  it("covers today and tomorrow in the business time zone", () => {
    // Fim de 26/11 em Nova York = 27/11 05:00 UTC.
    expect(noticeHorizon(NOW, TZ)).toBe("2026-11-27T05:00:00.000Z");
  });
});

describe("next month plan", () => {
  const empty = { autopilotPlanMonth: null, autopilotPlanStatus: null, autopilotPlanAt: null };

  it("plans next month from the 25th", () => {
    expect(monthToPlan(empty, NOW, TZ)).toBe("2026-12");
    expect(monthToPlan(empty, new Date("2026-11-24T14:00:00.000Z"), TZ)).toBeNull();
    // Dezembro → janeiro do ano seguinte.
    expect(monthToPlan(empty, new Date("2026-12-28T14:00:00.000Z"), TZ)).toBe("2027-01");
  });

  it("does not plan twice and retries the next day when out of credits", () => {
    expect(
      monthToPlan(
        { autopilotPlanMonth: "2026-12", autopilotPlanStatus: "planned", autopilotPlanAt: at(-48) },
        NOW,
        TZ,
      ),
    ).toBeNull();
    const outOfCredits = {
      autopilotPlanMonth: "2026-12",
      autopilotPlanStatus: "out_of_credits" as const,
    };
    expect(monthToPlan({ ...outOfCredits, autopilotPlanAt: at(-2) }, NOW, TZ)).toBeNull();
    expect(monthToPlan({ ...outOfCredits, autopilotPlanAt: at(-24) }, NOW, TZ)).toBe("2026-12");
  });

  it("maps the posting days to posts per week", () => {
    expect(postsPerWeekFor([2, 4, 6])).toBe(3);
    expect(postsPerWeekFor([1])).toBe(2);
    expect(postsPerWeekFor([1, 2, 3, 4, 5])).toBe(5);
  });
});

describe("pickWithinCap", () => {
  it("approves the earliest posts up to the monthly cap", () => {
    const posts = ["a", "b", "c", "d"];
    const used = new Map([["2026-12", 2]]);
    expect(pickWithinCap(posts, 4, used, () => "2026-12")).toEqual({
      approve: ["a", "b"],
      overCap: ["c", "d"],
    });
    expect(pickWithinCap(posts, null, used, () => "2026-12").approve).toHaveLength(4);
    // Limite contado por mês.
    const byMonth = (p: string) => (p === "d" ? "2027-01" : "2026-12");
    expect(pickWithinCap(posts, 3, used, byMonth)).toEqual({
      approve: ["a", "d"],
      overCap: ["b", "c"],
    });
  });
});
