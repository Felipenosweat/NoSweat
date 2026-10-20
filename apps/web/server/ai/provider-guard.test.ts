import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteGenerator } from "./index";
import { MockGenerator } from "./mock";

// Erros de configuração da IA aparecem ao montar o gerador (antes de gastar um crédito).
describe("getSiteGenerator configuration guards", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("refuses the mock in Vercel production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => getSiteGenerator("mock")).toThrow(/not allowed in production/);
  });

  it("keeps the mock in preview deployments and local dev", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(getSiteGenerator("mock")).toBeInstanceOf(MockGenerator);
  });

  it("fails clearly when the Anthropic key is missing", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("ANTHROPIC_AUTH_TOKEN", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => getSiteGenerator("anthropic")).toThrow(/ANTHROPIC_API_KEY is not set/);
  });

  it("builds the Anthropic generator when the key is set", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    expect(() => getSiteGenerator("anthropic")).not.toThrow();
  });
});
