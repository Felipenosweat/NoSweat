import { GenerateSiteRequest } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import {
  EMPTY_FIELDS,
  LIMITS,
  composeBrief,
  fieldsFromBrief,
  parseDraft,
  publishedSlug,
} from "./brief";

describe("composeBrief", () => {
  it("writes natural sentences with the style on its own line", () => {
    const brief = composeBrief({
      name: "Sparkle & Shine",
      what: "House cleaning, weekly and move-out",
      city: "Worcester",
      state: "ma",
      serviceArea: "Shrewsbury and Auburn",
      details: "Eco-friendly products.",
      style: "warm",
    });
    expect(brief).toBe(
      "The business is called Sparkle & Shine. House cleaning, weekly and move-out. " +
        "Based in Worcester, MA. Service area: Shrewsbury and Auburn.\n\n" +
        "Eco-friendly products.\n\nStyle: warm & friendly.",
    );
  });

  it("leaves out empty parts and the style when we pick it", () => {
    const brief = composeBrief({ ...EMPTY_FIELDS, what: "Mobile dog grooming!" });
    expect(brief).toBe("Mobile dog grooming!");
  });

  it("stays within the API limit when every field is full", () => {
    const brief = composeBrief({
      name: "n".repeat(LIMITS.name),
      what: "w".repeat(LIMITS.what),
      city: "c".repeat(LIMITS.city),
      state: "TX",
      serviceArea: "s".repeat(LIMITS.serviceArea),
      details: "d".repeat(LIMITS.details),
      style: "professional",
    });
    expect(GenerateSiteRequest.safeParse({ brief }).success).toBe(true);
  });
});

describe("fieldsFromBrief", () => {
  it("keeps a short brief in one field and reads the city and state", () => {
    const fields = fieldsFromBrief("Family-owned plumbing in Austin, TX. 24/7 repairs.");
    expect(fields.what).toBe("Family-owned plumbing in Austin, TX. 24/7 repairs.");
    expect(fields).toMatchObject({ city: "Austin", state: "TX", details: "" });
  });

  it("moves the rest of a long brief into the details", () => {
    const fields = fieldsFromBrief(`Hair salon in Miami. ${"Balayage and bridal. ".repeat(30)}`);
    expect(fields.what).toBe("Hair salon in Miami.");
    expect(fields.details.startsWith("Balayage")).toBe(true);
    expect(fields.city).toBe("");
  });

  it("ignores codes that are not US states", () => {
    expect(fieldsFromBrief("Bakery in Springfield, ZZ").state).toBe("");
  });
});

describe("publishedSlug", () => {
  it("matches the slug the publish route creates", () => {
    expect(publishedSlug("Joe's Plumbing", "6f1c2a3b-4d5e")).toBe("joes-plumbing-6f1c2a");
    expect(publishedSlug("!!!", "abcdef12")).toBe("site-abcdef");
  });
});

describe("parseDraft", () => {
  it("restores known fields and rejects garbage", () => {
    const draft = parseDraft(
      JSON.stringify({ source: "", step: 2, fields: { name: "Rosa", style: "nope", x: 1 } }),
    );
    expect(draft).toEqual({ source: "", step: 2, fields: { ...EMPTY_FIELDS, name: "Rosa" } });
    expect(parseDraft("{")).toBeNull();
    expect(parseDraft(null)).toBeNull();
  });
});
