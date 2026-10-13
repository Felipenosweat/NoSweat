import { describe, expect, it } from "vitest";
import { safeNextPath } from "./config";

describe("safeNextPath", () => {
  it.each(["/dashboard", "/sites/abc/edit", "/create?brief=house%20cleaning"])(
    "keeps the internal path %s",
    (path) => {
      expect(safeNextPath(path)).toBe(path);
    },
  );

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/\\/evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "dashboard",
    "",
    null,
    42,
  ])("falls back for %j", (value) => {
    expect(safeNextPath(value)).toBe("/dashboard");
  });
});
