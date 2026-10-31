import { z } from "zod";
import { describe, expect, it } from "vitest";
import { extractJson, jsonInstructions, rawJson } from "./json-output";

describe("json output", () => {
  it("reads JSON from text, with or without code fences", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Here you go: {"a":{"b":2}} done')).toEqual({ a: { b: 2 } });
    expect(() => extractJson("no json here")).toThrow(/no JSON/);
  });

  it("prefers parsed_output and falls back to the text blocks", () => {
    expect(rawJson({ parsed_output: { x: 1 } })).toEqual({ x: 1 });
    expect(
      rawJson({
        parsed_output: null,
        content: [{ type: "thinking" }, { type: "text", text: '{"y":2}' }],
      }),
    ).toEqual({ y: 2 });
  });

  it("puts the JSON Schema in the instructions", () => {
    const text = jsonInstructions(z.object({ name: z.string(), age: z.number().optional() }));
    expect(text).toContain("<json_schema>");
    expect(text).toContain('"name"');
  });
});
