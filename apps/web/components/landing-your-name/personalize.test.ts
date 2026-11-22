import { joesPlumbing } from "@nosweat/fixtures";
import { siteStyle } from "@nosweat/templates";
import { describe, expect, it } from "vitest";
import {
  briefFrom,
  createHref,
  HERO_COMPOSITION,
  PLACEHOLDER_NAME,
  previewBase,
  slugOf,
  STYLE_OPTIONS,
  withName,
} from "./personalize";

// A landing "Your name on it" promete trocar só o nome (e a cidade do topo) do site de exemplo
// e levar o que foi digitado para o /create. Estes testes seguram essa promessa.

const base = previewBase(joesPlumbing, siteStyle(joesPlumbing));
const heroOf = (spec: typeof base) => {
  const hero = spec.sections.find((section) => section.type === "hero");
  if (hero?.type !== "hero") throw new Error("no hero");
  return hero;
};

describe("previewBase", () => {
  it("keeps only the sections the frame shows", () => {
    expect(base.sections.map((section) => section.type)).toEqual(["hero", "services", "contact"]);
  });

  it("locks menu, buttons and contact so typing never reshuffles the look", () => {
    const a = withName(base, { name: "Rivera Plumbing", city: "" }, HERO_COMPOSITION);
    const b = withName(base, { name: "Zed & Sons HVAC", city: "" }, HERO_COMPOSITION);
    expect(siteStyle(a)).toEqual(siteStyle(b));
    expect(siteStyle(a)).toEqual(siteStyle(joesPlumbing));
  });
});

describe("withName", () => {
  it("puts the typed name on the site and leaves the made-up text alone", () => {
    const spec = withName(base, { name: "  Rivera   Plumbing ", city: "" }, "editorial");
    expect(spec.business.name).toBe("Rivera Plumbing");
    expect(spec.design?.composition).toBe("editorial");
    expect(spec.business.phone).toBe(joesPlumbing.business.phone);
    expect(heroOf(spec).title).toBe(heroOf(base).title);
  });

  it("shows an invitation, not a fake business, while the field is empty", () => {
    expect(withName(base, { name: "   ", city: "" }, "modular").business.name).toBe(
      PLACEHOLDER_NAME,
    );
  });

  it("swaps the example city in the hero and drops the example's state and area", () => {
    const spec = withName(base, { name: "Rivera Plumbing", city: "Denver" }, "service-led");
    expect(spec.business.city).toBe("Denver");
    expect(spec.business.state).toBeUndefined();
    expect(spec.business.serviceArea).toBeUndefined();
    expect(heroOf(spec).title).toContain("Denver");
    expect(heroOf(spec).title).not.toContain("Austin");
    // A base não muda (a prévia recalcula a cada tecla).
    expect(base.business.city).toBe("Austin");
  });

  it("caps very long input", () => {
    const spec = withName(base, { name: "x".repeat(500), city: "y".repeat(500) }, "editorial");
    expect(spec.business.name.length).toBeLessThanOrEqual(60);
    expect(spec.business.city?.length).toBeLessThanOrEqual(40);
  });
});

describe("style options", () => {
  it("offers three different compositions, none the same as the hero preview", () => {
    const ids = STYLE_OPTIONS.map((option) => option.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids).not.toContain(HERO_COMPOSITION);
  });
});

describe("carrying the name to /create", () => {
  it("builds the first line of the brief", () => {
    expect(briefFrom("Rivera Plumbing", "")).toBe("Rivera Plumbing");
    expect(briefFrom(" Rivera Plumbing ", " Austin, TX ")).toBe("Rivera Plumbing in Austin, TX");
    expect(briefFrom("", "Austin")).toBe("");
  });

  it("links to /create?brief= (the param /create reads) without auto-starting", () => {
    expect(createHref("", "")).toBe("/create");
    const href = createHref("Rosa’s Café & Bar", "San José");
    expect(href.startsWith("/create?brief=")).toBe(true);
    expect(href).not.toContain("start=");
    const brief = new URL(href, "https://example.com").searchParams.get("brief");
    expect(brief).toBe("Rosa’s Café & Bar in San José");
  });

  it("makes a slug for the free address shown in the frame", () => {
    expect(slugOf("Rivera Plumbing")).toBe("rivera-plumbing");
    expect(slugOf("Rosa’s Café & Bar")).toBe("rosas-cafe-bar");
    expect(slugOf("  ")).toBe("your-business");
  });
});
