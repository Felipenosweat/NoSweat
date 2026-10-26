import { afterEach, describe, expect, it, vi } from "vitest";
import { aiEnabled, getSiteGenerator } from "./index";
import { fixtures } from "@nosweat/fixtures";
import { MockGenerator } from "./mock";

// Erros de configuração da IA aparecem ao montar o gerador (antes de gastar um crédito).
describe("getSiteGenerator configuration guards", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uses template mode (no AI) for the mock in Vercel production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const generator = getSiteGenerator("mock");
    expect(generator).toBeInstanceOf(MockGenerator);
    const edit = await generator.editSite(fixtures["joes-plumbing"], "make it blue");
    expect(edit.summary).toMatch(/aren't switched on yet/);
  });

  it("keeps the mock in preview deployments and local dev", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(getSiteGenerator("mock")).toBeInstanceOf(MockGenerator);
  });

  it("falls back to template mode when the Anthropic key is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("ANTHROPIC_AUTH_TOKEN", "");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const generator = getSiteGenerator("anthropic");
    expect(generator).toBeInstanceOf(MockGenerator);
    // Barbearia parte do modelo de barbearia da biblioteca, sem fatos inventados.
    const spec = await generator.generateSite(
      "Fade House, a barbershop in Chicago, IL. Fades and beard trims. Call (773) 555-0199.",
    );
    expect(spec.business.name).toBe("Fade House");
    expect(spec.business.phone).toBe("(773) 555-0199");
    expect(JSON.stringify(spec)).not.toContain("Fade & Co.");
  });

  it("builds the Anthropic generator when the key is set", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    expect(() => getSiteGenerator("anthropic")).not.toThrow();
  });

  it("says which generators use real AI (and spend credits)", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // O mock do dev simula a IA (créditos e limites valem); o modo modelo não usa IA.
    expect(new MockGenerator().usesAi).toBe(true);
    expect(new MockGenerator({ templateMode: true }).usesAi).toBe(false);
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    expect(getSiteGenerator("anthropic").usesAi).toBe(true);
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("ANTHROPIC_AUTH_TOKEN", "");
    expect(getSiteGenerator("anthropic").usesAi).toBe(false);
  });

  it("aiEnabled() is off in production without an AI key, quietly", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("ANTHROPIC_AUTH_TOKEN", "");
    expect(aiEnabled("mock")).toBe(false);
    expect(aiEnabled("anthropic")).toBe(false);
    expect(aiEnabled("gemini")).toBe(false);
    expect(warn).not.toHaveBeenCalled();
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test");
    expect(aiEnabled("anthropic")).toBe(true);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(aiEnabled("mock")).toBe(true);
  });

  it("template mode builds the site from the brief the /create wizard writes", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const spec = await new MockGenerator({ delayMs: 0, templateMode: true }).generateSite(
      "The business is called Valley Cuts. Fades, beard trims and kids cuts. Based in McAllen, TX. Phone: 956-555-0110.",
    );
    expect(spec.business).toMatchObject({
      name: "Valley Cuts",
      phone: "(956) 555-0110",
      city: "McAllen",
      state: "TX",
    });
    const services = spec.sections.find((section) => section.type === "services");
    expect(services?.type === "services" && services.items.map((item) => item.name)).toEqual([
      "Fades",
      "Beard Trims",
      "Kids Cuts",
    ]);
  });
});
