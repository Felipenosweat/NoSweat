import { describe, expect, it } from "vitest";
import { aalFromClaims, adminMfaRequired, normalizeTotpCode } from "./mfa";

describe("adminMfaRequired", () => {
  it("is on by default when Supabase is configured", () => {
    expect(adminMfaRequired({}, true)).toBe(true);
    expect(adminMfaRequired({ ADMIN_REQUIRE_MFA: "true" }, true)).toBe(true);
  });

  it("can be turned off for recovery", () => {
    for (const value of ["false", "0", "off", "no", " FALSE "]) {
      expect(adminMfaRequired({ ADMIN_REQUIRE_MFA: value }, true)).toBe(false);
    }
  });

  it("is off without Supabase (local dev, DEV_USER)", () => {
    expect(adminMfaRequired({ ADMIN_REQUIRE_MFA: "true" }, false)).toBe(false);
  });
});

describe("aalFromClaims", () => {
  it("reads the aal claim of the session JWT", () => {
    expect(aalFromClaims(null)).toBeNull();
    expect(aalFromClaims({ sub: "u", aal: "aal2" })).toBe("aal2");
    expect(aalFromClaims({ sub: "u", aal: "aal1" })).toBe("aal1");
    // Sem a claim (ou valor estranho) conta como AAL1.
    expect(aalFromClaims({ sub: "u" })).toBe("aal1");
    expect(aalFromClaims({ sub: "u", aal: "AAL2" })).toBe("aal1");
  });
});

describe("normalizeTotpCode", () => {
  it("accepts 6 digits, with spaces", () => {
    expect(normalizeTotpCode("123456")).toBe("123456");
    expect(normalizeTotpCode(" 123 456 ")).toBe("123456");
    expect(normalizeTotpCode("12345")).toBeNull();
    expect(normalizeTotpCode("12345a")).toBeNull();
    expect(normalizeTotpCode(null)).toBeNull();
  });
});
