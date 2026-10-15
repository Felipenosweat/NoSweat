import { randomBytes } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  currentKeyVersion,
  decryptToken,
  encryptToken,
  socialCryptoConfigured,
  tokenAad,
} from "./crypto";

const keyB64 = () => randomBytes(32).toString("base64");
const aad = tokenAad("owner-1", "instagram", "1789");

afterEach(() => {
  delete process.env.SOCIAL_TOKEN_KEYS;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe("social token crypto", () => {
  it("round-trips a token and never stores it in clear text", () => {
    process.env.SOCIAL_TOKEN_KEYS = `v1:${keyB64()}`;
    const { value, version } = encryptToken("IGQ-secret-token", aad);
    expect(version).toBe("v1");
    expect(value).not.toContain("IGQ-secret-token");
    expect(decryptToken(value, aad)).toBe("IGQ-secret-token");
  });

  it("refuses a token moved to another account (AAD)", () => {
    process.env.SOCIAL_TOKEN_KEYS = `v1:${keyB64()}`;
    const { value } = encryptToken("IGQ-secret-token", aad);
    expect(() => decryptToken(value, tokenAad("owner-2", "instagram", "1789"))).toThrow();
  });

  it("keeps old keys working after rotation", () => {
    const old = keyB64();
    process.env.SOCIAL_TOKEN_KEYS = `v1:${old}`;
    const { value } = encryptToken("old-token", aad);
    process.env.SOCIAL_TOKEN_KEYS = `v2:${keyB64()},v1:${old}`;
    expect(currentKeyVersion()).toBe("v2");
    expect(decryptToken(value, aad)).toBe("old-token");
    expect(encryptToken("new-token", aad).version).toBe("v2");
  });

  it("uses a dev key only when Supabase is not configured", () => {
    expect(socialCryptoConfigured()).toBe(true);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
    expect(socialCryptoConfigured()).toBe(false);
    expect(() => encryptToken("t", aad)).toThrow();
  });

  it("rejects malformed keys", () => {
    process.env.SOCIAL_TOKEN_KEYS = "v1:short";
    expect(socialCryptoConfigured()).toBe(false);
  });
});
