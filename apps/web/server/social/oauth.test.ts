import { describe, expect, it } from "vitest";
import { createOAuthState, verifyOAuthState } from "./oauth";

const USER = "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b";

describe("OAuth state", () => {
  it("round-trips for the same user", () => {
    const { state, cookieValue } = createOAuthState(USER);
    expect(verifyOAuthState(state, cookieValue, USER)).toBe(true);
  });

  it("rejects another user, a tampered state or a missing cookie", () => {
    const { state, cookieValue } = createOAuthState(USER);
    expect(verifyOAuthState(state, cookieValue, "local-dev")).toBe(false);
    const tampered = `${state.slice(0, -2)}xx`;
    expect(verifyOAuthState(tampered, tampered, USER)).toBe(false);
    expect(verifyOAuthState(state, null, USER)).toBe(false);
    expect(verifyOAuthState(state, createOAuthState(USER).cookieValue, USER)).toBe(false);
    expect(verifyOAuthState("a.b", "a.b", USER)).toBe(false);
  });

  it("expires after 10 minutes", () => {
    const start = Date.now();
    const { state, cookieValue } = createOAuthState(USER, start);
    expect(verifyOAuthState(state, cookieValue, USER, start + 9 * 60_000)).toBe(true);
    expect(verifyOAuthState(state, cookieValue, USER, start + 11 * 60_000)).toBe(false);
  });
});
