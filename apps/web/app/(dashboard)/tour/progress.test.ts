import { describe, expect, it } from "vitest";
import {
  TOUR_PROGRESS_TTL_MS,
  parseProgress,
  serializeProgress,
  shouldContinue,
  type TourProgress,
} from "./progress";

const now = 1_800_000_000_000;
const saved: TourProgress = {
  v: 1,
  accountKey: "user-1",
  phase: "spotlight",
  index: 4,
  viewport: "desktop",
  savedAt: now - 1000,
};
const base = { progress: saved, accountKey: "user-1", now, totalSteps: 15 };

describe("parseProgress", () => {
  it("round-trips what was saved", () => {
    expect(parseProgress(serializeProgress(saved))).toEqual(saved);
  });

  it("ignores missing, broken or foreign values", () => {
    expect(parseProgress(null)).toBeNull();
    expect(parseProgress("")).toBeNull();
    expect(parseProgress("{nope")).toBeNull();
    expect(parseProgress(JSON.stringify({ ...saved, v: 2 }))).toBeNull();
    expect(parseProgress(JSON.stringify({ ...saved, index: -1 }))).toBeNull();
    expect(parseProgress(JSON.stringify({ ...saved, phase: "welcome" }))).toBeNull();
  });
});

describe("shouldContinue", () => {
  it("continues a recent tour of the same account", () => {
    expect(shouldContinue(base)).toBe(true);
    expect(shouldContinue({ ...base, progress: { ...saved, phase: "finish" } })).toBe(true);
  });

  it("doesn't continue without progress or for another account", () => {
    expect(shouldContinue({ ...base, progress: null })).toBe(false);
    expect(shouldContinue({ ...base, accountKey: "user-2" })).toBe(false);
  });

  it("forgets an old (or future-dated) tour", () => {
    expect(
      shouldContinue({ ...base, progress: { ...saved, savedAt: now - TOUR_PROGRESS_TTL_MS - 1 } }),
    ).toBe(false);
    expect(shouldContinue({ ...base, progress: { ...saved, savedAt: now + 60_000 } })).toBe(false);
  });

  it("doesn't continue past the last step", () => {
    expect(shouldContinue({ ...base, totalSteps: 4 })).toBe(false);
  });
});
