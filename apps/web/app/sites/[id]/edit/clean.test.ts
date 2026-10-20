import { SiteSpec } from "@nosweat/schema";
import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it } from "vitest";
import {
  clean,
  describeIssue,
  missingRequired,
  parseLocalDraft,
  previewSpec,
  sameSpec,
  serializeLocalDraft,
  withHttps,
} from "./clean";

function withFacts(): SiteSpec {
  const spec = structuredClone(fixtures["joes-plumbing"]);
  spec.business.address = "2112 Logan Ave";
  spec.business.category = "Plumber";
  spec.business.links = {
    booking: "https://book.example.com/joe",
    instagram: "https://www.instagram.com/joesplumbing",
  };
  return spec;
}

describe("clean", () => {
  it("keeps the address, category and links", () => {
    const spec = withFacts();
    const cleaned = clean(spec);
    expect(cleaned.business).toEqual(spec.business);
    expect(SiteSpec.safeParse(cleaned).success).toBe(true);
  });

  it("removes empty optional fields and empty links", () => {
    const spec = withFacts();
    spec.business.email = "  ";
    spec.business.address = "";
    spec.business.category = " ";
    spec.business.state = "tx";
    spec.business.links = { booking: " ", order: "" };
    const { business } = clean(spec);
    expect(business).not.toHaveProperty("email");
    expect(business).not.toHaveProperty("address");
    expect(business).not.toHaveProperty("category");
    expect(business).not.toHaveProperty("links");
    expect(business.state).toBe("TX");
  });

  it("keeps the links that are filled in", () => {
    const spec = withFacts();
    spec.business.links = { booking: " https://book.example.com ", menu: "" };
    expect(clean(spec).business.links).toEqual({ booking: "https://book.example.com" });
  });

  it("drops blank services, questions and reviews", () => {
    const spec = withFacts();
    const count = (source: SiteSpec) =>
      source.sections.map((section) => ("items" in section ? section.items.length : 0));
    const before = count(spec);
    for (const section of spec.sections) {
      if (section.type === "services") section.items.push({ name: "", description: " " });
      if (section.type === "faq") section.items.push({ q: " ", a: "" });
      if (section.type === "testimonials") section.items.push({ quote: "", author: "" });
    }
    expect(count(spec)).not.toEqual(before);
    expect(count(clean(spec))).toEqual(before);
  });
});

describe("previewSpec", () => {
  it("ignores half-typed links instead of freezing the preview", () => {
    const spec = withFacts();
    spec.business.links = { booking: "book.exa", instagram: "https://www.instagram.com/joe" };
    spec.business.email = "joe@";
    const preview = previewSpec(spec);
    expect(preview).not.toBeNull();
    expect(preview?.business.links).toEqual({ instagram: "https://www.instagram.com/joe" });
    expect(preview?.business).not.toHaveProperty("email");
  });

  it("keeps every section so indexes match the panel", () => {
    const spec = withFacts();
    spec.sections.push({ type: "gallery", images: [] });
    expect(previewSpec(spec)?.sections).toHaveLength(spec.sections.length);
  });
});

describe("withHttps", () => {
  it.each([
    ["joesplumbing.com", undefined, "https://joesplumbing.com"],
    ["http://joes.com/book", undefined, "https://joes.com/book"],
    ["HTTPS://joes.com", undefined, "https://joes.com"],
    ["@joesplumbing", "instagram", "https://www.instagram.com/joesplumbing"],
    ["@joes", "tiktok", "https://www.tiktok.com/@joes"],
    ["  ", undefined, ""],
  ] as const)("%s → %s", (input, key, expected) => {
    expect(withHttps(input, key)).toBe(expected);
  });
});

describe("missingRequired", () => {
  it("asks for a name and a headline", () => {
    const spec = withFacts();
    expect(missingRequired(spec)).toBeNull();
    spec.business.name = " ";
    expect(missingRequired(spec)).toBe("name");
    spec.business.name = "Joe's";
    const hero = spec.sections.find((s) => s.type === "hero");
    if (hero?.type !== "hero") throw new Error("missing hero");
    hero.title = "";
    expect(missingRequired(spec)).toBe("headline");
  });
});

describe("describeIssue", () => {
  it("turns schema errors into plain sentences", () => {
    const spec = withFacts();
    spec.business.serviceArea = "x".repeat(121);
    const result = SiteSpec.safeParse(spec);
    expect(result.success).toBe(false);
    const issue = result.error?.issues[0];
    if (!issue) throw new Error("missing issue");
    expect(describeIssue(issue, spec)).toBe("Service area is too long (max 120 characters).");
  });

  it("explains bad links", () => {
    expect(
      describeIssue({ path: ["business", "links", "booking"], message: "Invalid string" }),
    ).toBe("Online booking link must be a full web address starting with https://.");
  });
});

describe("local draft", () => {
  it("round-trips, even with a half-typed email", () => {
    const spec = withFacts();
    spec.business.email = "joe@";
    const restored = parseLocalDraft(serializeLocalDraft(spec, 1000), 2000);
    expect(restored && sameSpec(restored, spec)).toBe(true);
  });

  it("ignores broken or old copies", () => {
    expect(parseLocalDraft("{oops")).toBeNull();
    expect(parseLocalDraft(null)).toBeNull();
    const old = serializeLocalDraft(withFacts(), 0);
    expect(parseLocalDraft(old, 8 * 24 * 60 * 60 * 1000)).toBeNull();
  });

  it("compares specs regardless of key order", () => {
    const spec = withFacts();
    const reordered = JSON.parse(JSON.stringify({ ...spec, version: 1 })) as SiteSpec;
    const shuffled = Object.fromEntries(Object.entries(reordered).reverse()) as SiteSpec;
    expect(sameSpec(spec, shuffled)).toBe(true);
  });
});
