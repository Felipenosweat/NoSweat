import { describe, expect, it } from "vitest";
import { fixtures } from "./index";

describe("fixtures", () => {
  it.each(Object.entries(fixtures))("%s has 4 to 6 sections", (_slug, spec) => {
    expect(spec.sections.length).toBeGreaterThanOrEqual(4);
    expect(spec.sections.length).toBeLessThanOrEqual(6);
  });

  it.each(Object.entries(fixtures))("%s starts with a hero", (_slug, spec) => {
    expect(spec.sections[0]?.type).toBe("hero");
  });
});
