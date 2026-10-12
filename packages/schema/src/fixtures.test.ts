import { describe, expect, it } from "vitest";
// Import relativo (e não "@nosweat/fixtures") para evitar dependência circular:
// @nosweat/fixtures já depende de @nosweat/schema.
import { fixtures } from "../../fixtures/src";
import { SiteSpec } from "./index";

describe("fixtures match the contract", () => {
  it.each(Object.entries(fixtures))("SiteSpec.parse accepts %s", (_slug, spec) => {
    expect(() => SiteSpec.parse(spec)).not.toThrow();
  });
});
