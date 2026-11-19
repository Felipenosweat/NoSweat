import { describe, expect, it } from "vitest";
import {
  deriveSecret,
  ipHashSecret,
  legacySecret,
  safeEqual,
  secretsFor,
  signingSecret,
} from "./secret";

describe("secretsFor", () => {
  it("uses the dedicated variable: first signs, the rest only verify, legacy last", () => {
    const env = {
      NOSWEAT_SECRET_UNSUBSCRIBE: " new , old ",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    };
    expect(secretsFor("unsubscribe", env)).toEqual(["new", "old", "service"]);
    expect(signingSecret("unsubscribe", env)).toBe("new");
  });

  it("derives a different secret per purpose from NOSWEAT_SECRET", () => {
    const env = { NOSWEAT_SECRET: "master" };
    const viewAs = signingSecret("view-as", env);
    const unsubscribe = signingSecret("unsubscribe", env);
    expect(viewAs).toBe(deriveSecret("master", "view-as"));
    expect(viewAs).not.toBe(unsubscribe);
    expect(viewAs).not.toBe("master");
  });

  it("supports rotating the master secret", () => {
    const env = { NOSWEAT_SECRET: "new-master,old-master" };
    expect(secretsFor("domain-verify", env)).toEqual([
      deriveSecret("new-master", "domain-verify"),
      deriveSecret("old-master", "domain-verify"),
    ]);
  });

  it("prefers the dedicated variable over the master", () => {
    const env = { NOSWEAT_SECRET: "master", NOSWEAT_SECRET_VIEW_AS: "own" };
    expect(secretsFor("view-as", env)).toEqual(["own"]);
  });

  it("keeps the old secret only for verification (IP_HASH_SALT before the Supabase key)", () => {
    const env = {
      NOSWEAT_SECRET: "master",
      IP_HASH_SALT: "salt",
      SUPABASE_SERVICE_ROLE_KEY: "service",
    };
    const list = secretsFor("unsubscribe", env);
    expect(list[0]).toBe(deriveSecret("master", "unsubscribe"));
    expect(list.at(-1)).toBe("salt");
    expect(list).not.toContain("service");
  });

  it("can pin or turn off the old secret", () => {
    expect(legacySecret({ NOSWEAT_SECRET_LEGACY: "pinned", SUPABASE_SERVICE_ROLE_KEY: "s" })).toBe(
      "pinned",
    );
    const off = { NOSWEAT_SECRET: "master", NOSWEAT_SECRET_LEGACY: "off", IP_HASH_SALT: "salt" };
    expect(secretsFor("unsubscribe", off)).toEqual([deriveSecret("master", "unsubscribe")]);
  });

  it("still signs with the old secret until a new one is configured", () => {
    expect(secretsFor("view-as", { SUPABASE_SERVICE_ROLE_KEY: "service" })).toEqual(["service"]);
  });

  it("falls back to a dev value only outside production", () => {
    expect(secretsFor("view-as", {})).toEqual(["dev-only-secret"]);
    expect(() => secretsFor("view-as", { VERCEL_ENV: "production" })).toThrow(/NOSWEAT_SECRET/);
  });
});

describe("ipHashSecret", () => {
  it("keeps the old value so stored hashes keep matching", () => {
    const env = { NOSWEAT_SECRET: "master", SUPABASE_SERVICE_ROLE_KEY: "service" };
    expect(ipHashSecret(env)).toBe("service");
    expect(secretsFor("ip-hash", env)).toEqual(["service"]);
  });

  it("uses NOSWEAT_SECRET_IP_HASH when set on purpose", () => {
    expect(ipHashSecret({ NOSWEAT_SECRET_IP_HASH: "ip", IP_HASH_SALT: "salt" })).toBe("ip");
  });

  it("derives from the master only when there is no old value", () => {
    expect(ipHashSecret({ NOSWEAT_SECRET: "master" })).toBe(deriveSecret("master", "ip-hash"));
  });
});

describe("safeEqual", () => {
  it("compares strings", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "ab")).toBe(false);
  });
});
