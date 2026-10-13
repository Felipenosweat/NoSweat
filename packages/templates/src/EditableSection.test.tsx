import { readFileSync } from "node:fs";
import { fixtures } from "@nosweat/fixtures";
import { TemplateId } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteRenderer } from "./SiteRenderer";

describe("SiteRenderer editable mode", () => {
  it.each(Object.entries(fixtures))(
    "renders the published markup unchanged when editable is false (%s)",
    (_slug, spec) => {
      const published = renderToStaticMarkup(<SiteRenderer spec={spec} />);
      expect(renderToStaticMarkup(<SiteRenderer spec={spec} editable={false} />)).toBe(published);
      // Mesmo com uma seção "selecionada", nada muda fora do modo de edição.
      expect(renderToStaticMarkup(<SiteRenderer spec={spec} selectedSection={0} />)).toBe(
        published,
      );
      expect(published).not.toContain("data-section-index");
      expect(published).not.toContain("data-editable");
      expect(published).not.toContain("data-section-select");
      expect(published).not.toContain("--ns-edit-outline");
    },
  );

  it("wraps every section, in order, with its index and a labeled select button", () => {
    const spec = fixtures["joes-plumbing"];
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} editable />);
    expect(html).toContain("data-editable");
    const indices = [...html.matchAll(/data-section-index="(\d+)"/g)].map((m) => Number(m[1]));
    expect(indices).toEqual(spec.sections.map((_, index) => index));
    for (const [index, section] of spec.sections.entries()) {
      expect(html).toContain(`data-section-index="${index}" data-section-type="${section.type}"`);
      expect(html).toContain(`data-section-select="${index}"`);
    }
    expect(html).toContain(">Edit Services</button>");
    // As seções continuam dentro da moldura (a âncora #services segue existindo).
    expect(html).toContain('id="services"');
  });

  it("marks only the selected section", () => {
    const spec = fixtures["joes-plumbing"];
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} editable selectedSection={1} />);
    expect(html.match(/data-selected=""/g)).toHaveLength(1);
    expect(html).toMatch(/data-section-index="1" data-section-type="[a-z]+" data-selected=""/);
  });

  it.each(TemplateId.options)("supports editable mode in template %s", (template) => {
    const spec = { ...fixtures["joes-plumbing"], template };
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} editable />);
    expect(html).toContain('data-section-index="0"');
  });

  it("uses only theme or editor CSS variables for its colors (no fixed Tailwind colors)", () => {
    const source = readFileSync(new URL("./EditableSection.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(
      /\b(?:bg|text|border|outline|ring)-(?:slate|gray|zinc|neutral|stone|red|blue|sky|emerald|green|amber|white|black)\b/,
    );
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});
