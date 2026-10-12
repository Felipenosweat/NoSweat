import { describe, expect, it } from "vitest";
import { ApiError, GenerateSiteRequest, SiteSpec } from "./index";

const minimal: SiteSpec = {
  version: 1,
  template: "professional",
  business: { name: "Acme Accounting", state: "NY" },
  theme: {
    primary: "#123456",
    secondary: "#ABCDEF",
    background: "#FFFFFF",
    text: "#111111",
    font: "modern",
  },
  sections: [
    { type: "hero", title: "Taxes, done.", subtitle: "Since 1999.", ctaLabel: "Book a call" },
    { type: "contact", showForm: true, showMap: false },
  ],
};

describe("SiteSpec", () => {
  it("accepts a minimal valid spec", () => {
    expect(SiteSpec.parse(minimal)).toEqual(minimal);
  });

  it("rejects an invalid spec", () => {
    const invalid = {
      version: 2,
      template: "car-wash",
      business: { name: "Bad Co", email: "not-an-email", state: "Texas" },
      theme: {
        primary: "blue",
        secondary: "#fff",
        background: "#FFFFFF",
        text: "#000000",
        font: "comic",
      },
      sections: [{ type: "hero", title: "Hi" }],
    };
    const result = SiteSpec.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects fewer than 2 sections", () => {
    const result = SiteSpec.safeParse({ ...minimal, sections: minimal.sections.slice(0, 1) });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown section type", () => {
    const result = SiteSpec.safeParse({
      ...minimal,
      sections: [...minimal.sections, { type: "gallery", images: [] }],
    });
    expect(result.success).toBe(false);
  });
});

describe("API schemas", () => {
  it("validates the error shape", () => {
    expect(ApiError.safeParse({ error: { code: "not_found", message: "Nope" } }).success).toBe(
      true,
    );
    expect(ApiError.safeParse({ message: "Nope" }).success).toBe(false);
  });

  it("trims and validates the brief", () => {
    expect(GenerateSiteRequest.parse({ brief: "  plumbing company in Austin  " }).brief).toBe(
      "plumbing company in Austin",
    );
    expect(GenerateSiteRequest.safeParse({ brief: "hi" }).success).toBe(false);
  });
});
