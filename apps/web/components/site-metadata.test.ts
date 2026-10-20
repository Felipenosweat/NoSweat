import { joesPlumbing } from "@nosweat/fixtures";
import type { SiteSpec } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import type { SiteRecord } from "@/server/store";
import { siteInitial, siteJsonLd, siteMetadata, textColorOn } from "./site-metadata";

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
      areaServed: "Austin, Round Rock, Cedar Park and nearby",
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

  it("inclui a rua (streetAddress) quando o dono deu o endereço", () => {
    const spec: SiteSpec = {
      ...joesPlumbing,
      business: {
        name: "Rosa's Kitchen",
        address: "2196 Logan Ave",
        city: "San Diego",
        state: "CA",
      },
    };
    expect(JSON.parse(siteJsonLd(record(spec), URL)).address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "2196 Logan Ave",
      addressLocality: "San Diego",
      addressRegion: "CA",
    });
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

  it("sem foto, usa a imagem gerada com o nome e a cor do site", () => {
    const spec: SiteSpec = {
      ...joesPlumbing,
      sections: joesPlumbing.sections.map((section) =>
        section.type === "hero" ? { ...section, image: undefined } : section,
      ),
    };
    const metadata = siteMetadata(record(spec), URL);
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "https://www.nosweatfd.com/api/sites/site_1/og",
        alt: "Joe's Plumbing",
        width: 1200,
        height: 630,
      },
    ]);
  });

  it("troca o ícone e o manifesto da No Sweat pelos do site", () => {
    const metadata = siteMetadata(record(joesPlumbing), URL);
    const version = joesPlumbing.theme.primary.slice(1).toLowerCase();
    expect(metadata.icons).toEqual({
      icon: [{ url: `/api/sites/site_1/icon?v=${version}`, type: "image/png", sizes: "64x64" }],
      apple: [
        {
          url: `/api/sites/site_1/icon?v=${version}&size=180`,
          type: "image/png",
          sizes: "180x180",
        },
      ],
    });
    expect(metadata.manifest).toBeNull();
  });
});

describe("siteInitial", () => {
  it("usa a primeira letra ou número do nome, em maiúscula", () => {
    expect(siteInitial("joe's plumbing")).toBe("J");
    expect(siteInitial('  "123 Movers"')).toBe("1");
    expect(siteInitial("Élan Salon")).toBe("É");
  });

  it("sem letras, não inventa nada", () => {
    expect(siteInitial("")).toBeNull();
    expect(siteInitial(" & ")).toBeNull();
  });
});

describe("textColorOn", () => {
  it("escolhe branco em cor escura e quase preto em cor clara", () => {
    expect(textColorOn("#0B3D91")).toBe("#FFFFFF");
    expect(textColorOn("#FDE68A")).toBe("#0B0F19");
    expect(textColorOn("not-a-color")).toBe("#FFFFFF");
  });
});
