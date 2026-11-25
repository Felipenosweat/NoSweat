import { afterEach, describe, expect, it, vi } from "vitest";
import { logAiUsage } from "./usage-log";

afterEach(() => vi.restoreAllMocks());

describe("logAiUsage", () => {
  it("logs the four token counts, the thinking share and the extras", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    logAiUsage(
      "generate",
      "claude-opus-5-5",
      {
        stop_reason: "end_turn",
        usage: {
          input_tokens: 1200,
          cache_creation_input_tokens: 5000,
          cache_read_input_tokens: null,
          output_tokens: 9000,
          output_tokens_details: { thinking_tokens: 3000 },
        },
      },
      { attempt: 1 },
    );
    expect(info).toHaveBeenCalledWith("[ai] usage", {
      label: "generate",
      model: "claude-opus-5-5",
      stop: "end_turn",
      input: 1200,
      cacheWrite: 5000,
      cacheRead: 0,
      output: 9000,
      thinking: 3000,
      attempt: 1,
    });
  });

  it("never throws, even with an odd response", () => {
    vi.spyOn(console, "info").mockImplementation(() => {
      throw new Error("log failed");
    });
    expect(() => logAiUsage("ai_edit", "m", { usage: {} })).not.toThrow();
  });
});
