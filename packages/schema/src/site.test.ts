import { describe, expect, it } from "vitest";
import {
  ApiError,
  DomainName,
  GenerateSiteRequest,
  LeadRequest,
  SiteImage,
  SiteSpec,
} from "./index";

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

  it("accepts a hero image, an owner gallery and the new font pairs", () => {
    const image = {
      url: "https://images.pexels.com/photos/1/photo.jpeg",
      alt: "Bright, clean kitchen",
      source: "pexels",
      kind: "scene",
      credit: { name: "Jane Doe", url: "https://www.pexels.com/@jane" },
    };
    const result = SiteSpec.safeParse({
      ...minimal,
      theme: { ...minimal.theme, font: "fresh" },
      sections: [
        ...minimal.sections,
        { type: "gallery", images: [{ ...image, source: "upload", kind: "owner" }] },
      ],
    });
    expect(result.success).toBe(true);
    expect(
      SiteImage.safeParse({ ...image, url: "http://insecure.example.com/a.jpg" }).success,
    ).toBe(false);
  });

  it("accepts the model-site fields: about, prices, captions, address and links", () => {
    const result = SiteSpec.safeParse({
      ...minimal,
      business: {
        ...minimal.business,
        address: "1550 Wynkoop St",
        category: "Bookkeeper",
        links: { booking: "https://calendly.com/acme/intro" },
      },
      sections: [
        ...minimal.sections,
        {
          type: "services",
          title: "Services and fees",
          items: [
            {
              name: "Monthly books",
              description: "Reconciled every month.",
              price: "from $250",
              detail: "Monthly",
              group: "Bookkeeping",
            },
          ],
        },
        {
          type: "about",
          title: "Who you'll work with",
          body: "Two accountants, one office.",
          people: [{ name: "Dana Hale", role: "CPA" }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects links that are not https and an about text that is too long", () => {
    const badLink = SiteSpec.safeParse({
      ...minimal,
      business: { ...minimal.business, links: { booking: "http://calendly.com/acme" } },
    });
    expect(badLink.success).toBe(false);
    const longAbout = SiteSpec.safeParse({
      ...minimal,
      sections: [...minimal.sections, { type: "about", body: "x".repeat(701) }],
    });
    expect(longAbout.success).toBe(false);
  });

  it("rejects an unknown section type", () => {
    const result = SiteSpec.safeParse({
      ...minimal,
      sections: [...minimal.sections, { type: "video", url: "https://example.com" }],
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

describe("DomainName", () => {
  it.each([
    ["joesplumbing.com", "joesplumbing.com"],
    ["  https://www.JoesPlumbing.com/contact?x=1 ", "joesplumbing.com"],
    ["http://shop.joes.co.uk:8080/", "shop.joes.co.uk"],
    ["joes.com.", "joes.com"],
  ])("normalizes %s", (input, expected) => {
    expect(DomainName.parse(input)).toBe(expected);
  });

  it.each(["", "joes", "joes..com", "-joes.com", "joes plumbing.com", "localhost"])(
    "rejects %s",
    (input) => {
      expect(DomainName.safeParse(input).success).toBe(false);
    },
  );
});

describe("LeadRequest", () => {
  it("accepts a lead with a phone or an email", () => {
    expect(LeadRequest.safeParse({ name: "Ann", phone: "555-0100", message: "Leak" }).success).toBe(
      true,
    );
    expect(LeadRequest.safeParse({ name: "Ann", email: "a@b.co", message: "Leak" }).success).toBe(
      true,
    );
  });

  it("rejects a lead without a way to reply", () => {
    expect(LeadRequest.safeParse({ name: "Ann", email: "", message: "Leak" }).success).toBe(false);
  });

  it("accepts the honeypot field so the API can silently drop bots", () => {
    const lead = LeadRequest.parse({ name: "Bot", email: "b@b.co", message: "x", company: "spam" });
    expect(lead.company).toBe("spam");
  });
});

describe("business details", () => {
  it("accepts hours, service area and owner-confirmed highlights", () => {
    const result = SiteSpec.safeParse({
      ...minimal,
      business: {
        ...minimal.business,
        serviceArea: "Queens and Brooklyn",
        hours: [{ days: "Mon–Sat", time: "8 AM – 6 PM" }],
        highlights: ["Licensed & insured", "Free estimates"],
      },
    });
    expect(result.success).toBe(true);
  });

  it("limits highlights to four short facts", () => {
    const highlights = ["a", "b", "c", "d", "e"];
    expect(
      SiteSpec.safeParse({ ...minimal, business: { ...minimal.business, highlights } }).success,
    ).toBe(false);
  });
});
