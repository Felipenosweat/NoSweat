import { fixtures } from "@nosweat/fixtures";
import { TemplateId } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteRenderer } from "./SiteRenderer";
import { readableTextOn } from "./theme";

describe("SiteRenderer", () => {
  it.each(Object.entries(fixtures))("renders %s without errors", (_slug, spec) => {
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    expect(html).toContain("ns-site");
    expect(html).toContain(`--ns-primary:${spec.theme.primary}`);
    // Nomes com apóstrofo saem escapados no HTML.
    expect(html).toContain(spec.business.name.replace("'", "&#x27;"));
  });

  it("renders sections in the order of the array", () => {
    const spec = fixtures["joes-plumbing"];
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    const positions = ['id="services"', 'id="reviews"', 'id="faq"', 'id="contact"'].map((marker) =>
      html.indexOf(marker),
    );
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it.each(TemplateId.options)("supports template %s", (template) => {
    const spec = { ...fixtures["joes-plumbing"], template };
    expect(() => renderToStaticMarkup(<SiteRenderer spec={spec} />)).not.toThrow();
  });
});

describe("readableTextOn", () => {
  it("picks light text on dark colors and dark text on light colors", () => {
    expect(readableTextOn("#1D4ED8")).toBe("#FFFFFF");
    expect(readableTextOn("#FDE68A")).not.toBe("#FFFFFF");
  });
});
