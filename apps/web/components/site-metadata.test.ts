import { joesPlumbing } from "@nosweat/fixtures";
import type { SiteSpec } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import type { SiteRecord } from "@/server/store";
import { siteJsonLd, siteMetadata } from "./site-metadata";

const URL = "https://nosweatfd.com/s/joes-plumbing";

function record(spec: SiteSpec): SiteRecord {
  return {
    id: "site_1",
    ownerId: "user_1",
    guestId: null,
    spec,
    publishedSpec: spec,
    status: "published",
    slug: "joes-plumbing",
    customDomain: null,
    publishedAt: "2026-10-13T00:00:00.000Z",
    createdAt: "2026-10-13T00:00:00.000Z",
    updatedAt: "2026-10-13T00:00:00.000Z",
  };
}

describe("siteJsonLd", () => {
  it("só usa dados presentes no SiteSpec", () => {
    const data = JSON.parse(siteJsonLd(record(joesPlumbing), URL));
    expect(data).toEqual({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Joe's Plumbing",
      url: URL,
      telephone: "(512) 555-0142",
      email: "service@joesplumbing.example.com",
      address: { "@type": "PostalAddress", addressLocality: "Austin", addressRegion: "TX" },
    });
  });

  it("omite endereço e área atendida quando não existem; inclui serviceArea quando existe", () => {
    const spec: SiteSpec = {
      ...joesPlumbing,
      business: { name: "Sparkle Co", serviceArea: "Worcester County" },
    };
    const data = JSON.parse(siteJsonLd(record(spec), URL));
    expect(data.address).toBeUndefined();
    expect(data.telephone).toBeUndefined();
    expect(data.areaServed).toBe("Worcester County");
  });

  it("escapa texto do cliente que fecharia a tag <script>", () => {
    const spec: SiteSpec = {
      ...joesPlumbing,
      business: { name: "</script><script>alert(1)</script> & Co\u2028" },
    };
    const json = siteJsonLd(record(spec), URL);
    expect(json).not.toMatch(/[<>&\u2028]/);
    expect(JSON.parse(json).name).toBe("</script><script>alert(1)</script> & Co\u2028");
  });
});

describe("siteMetadata", () => {
  it("usa a foto do topo como og:image quando existe", () => {
    const spec: SiteSpec = {
      ...joesPlumbing,
      sections: joesPlumbing.sections.map((section) =>
        section.type === "hero"
          ? {
              ...section,
              image: {
                url: "https://images.example.com/plumbing.jpg",
                alt: "Pipes under a sink",
                source: "pexels",
                kind: "scene",
                width: 1600,
                height: 900,
              },
            }
          : section,
      ),
    };
    const metadata = siteMetadata(record(spec), URL);
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "https://images.example.com/plumbing.jpg",
        alt: "Pipes under a sink",
        width: 1600,
        height: 900,
      },
    ]);
    expect(metadata.alternates?.canonical).toBe(URL);
  });

  it("sem foto, não define og:image", () => {
    const metadata = siteMetadata(record(joesPlumbing), URL);
    expect(metadata.openGraph?.images).toBeUndefined();
  });
});
