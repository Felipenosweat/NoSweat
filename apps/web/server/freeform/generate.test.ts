import { describe, expect, it } from "vitest";
import { extractHtml, freeformModelFromEnv } from "./generate";
import { estimateFreeformCostUsd } from "./pricing";
import { buildFreeformUserPrompt, FREEFORM_SYSTEM_PROMPT } from "./prompt";

describe("extractHtml", () => {
  it("takes the document out of a fenced block", () => {
    const text = "Here you go:\n```html\n<!doctype html>\n<html><body>x</body></html>\n```\nDone.";
    expect(extractHtml(text)).toBe("<!doctype html>\n<html><body>x</body></html>\n");
  });

  it("accepts a bare document with text around it", () => {
    expect(extractHtml("ok <!DOCTYPE html><html></html> bye")).toBe(
      "<!DOCTYPE html><html></html>\n",
    );
  });

  it("returns null for a cut-off document", () => {
    expect(extractHtml("<!doctype html><html><body>")).toBeNull();
  });
});

describe("freeformModelFromEnv", () => {
  it("defaults to Sonnet 5.5 and accepts Opus 5.5", () => {
    expect(freeformModelFromEnv(undefined)).toBe("claude-sonnet-5-5");
    expect(freeformModelFromEnv("claude-opus-5-5")).toBe("claude-opus-5-5");
  });

  it("rejects other models", () => {
    expect(() => freeformModelFromEnv("gpt-x")).toThrow(/FREEFORM_MODEL/);
  });
});

describe("estimateFreeformCostUsd", () => {
  it("prices input, cache and output tokens", () => {
    const usd = estimateFreeformCostUsd("claude-sonnet-5-5", {
      input_tokens: 1_000_000,
      output_tokens: 100_000,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 1_000_000,
    });
    expect(usd).toBeCloseTo(2 + 1 + 0.1, 6);
  });

  it("returns null for an unknown model", () => {
    expect(estimateFreeformCostUsd("mystery", { input_tokens: 1, output_tokens: 1 })).toBeNull();
  });
});

describe("freeform prompt", () => {
  it("bakes in the honesty rule and the form hook", () => {
    expect(FREEFORM_SYSTEM_PROMPT).toContain("data-ns-contact");
    expect(FREEFORM_SYSTEM_PROMPT).toContain("[Your phone]");
    expect(FREEFORM_SYSTEM_PROMPT).toContain("prefers-reduced-motion");
  });

  it("lists only the given photos", () => {
    const withPhotos = buildFreeformUserPrompt(
      { description: "A bakery.", photos: [{ url: "https://ok.test/a.jpg", alt: "Bread" }] },
      2026,
    );
    expect(withPhotos).toContain("url: https://ok.test/a.jpg");
    expect(withPhotos).toContain("Current year (for the footer only): 2026");
    expect(buildFreeformUserPrompt({ description: "A bakery." })).toContain(
      "No photos are available",
    );
  });
});
