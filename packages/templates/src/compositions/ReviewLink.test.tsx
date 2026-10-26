import { fixtures } from "@nosweat/fixtures";
import { Composition, type SiteSpec } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteRenderer } from "../SiteRenderer";

const LINK = "https://g.page/r/CbX1ab2Cd3EfEAI/review";

const withReviewLink = (spec: SiteSpec, composition: Composition, url?: string): SiteSpec => ({
  ...spec,
  design: { ...spec.design, composition },
  business: { ...spec.business, googleReviewUrl: url },
});

/** Todos os <a> que apontam para o link de avaliações. */
const reviewAnchors = (html: string) =>
  (html.match(/<a\s[^>]*>/g) ?? []).filter((tag) => tag.includes(`href="${LINK}"`));

describe("botão Review us on Google", () => {
  it.each(Composition.options)("%s: aparece no rodapé com o link do dono", (composition) => {
    const html = renderToStaticMarkup(
      <SiteRenderer spec={withReviewLink(fixtures["joes-plumbing"], composition, LINK)} />,
    );
    expect(html).toContain("Review us on Google");
    const anchors = reviewAnchors(html);
    expect(anchors.length).toBeGreaterThanOrEqual(1);
    for (const anchor of anchors) {
      expect(anchor).toContain('target="_blank"');
      expect(anchor).toContain('rel="noopener"');
    }
  });

  it("também aparece na área de contato quando o site tem formulário", () => {
    const spec = fixtures["joes-plumbing"];
    expect(spec.sections.some((s) => s.type === "contact" && s.showForm)).toBe(true);
    const html = renderToStaticMarkup(
      <SiteRenderer spec={withReviewLink(spec, "service-led", LINK)} />,
    );
    // Contato + rodapé.
    expect(reviewAnchors(html).length).toBeGreaterThanOrEqual(2);
  });

  it("não aparece sem link, nem com um link que não é do Google", () => {
    const without = renderToStaticMarkup(<SiteRenderer spec={fixtures["joes-plumbing"]} />);
    expect(without).not.toContain("Review us on Google");

    // Spec montado à mão (sem passar pelo SiteSpec.parse): o template confere de novo.
    const evil = withReviewLink(fixtures["joes-plumbing"], "editorial", "javascript:alert(1)");
    const html = renderToStaticMarkup(<SiteRenderer spec={evil} />);
    expect(html).not.toContain("Review us on Google");
    expect(html).not.toContain("javascript:alert");
  });

  it("regra 8: só o convite, sem estrelas nem números de avaliações", () => {
    const html = renderToStaticMarkup(
      <SiteRenderer spec={withReviewLink(fixtures["joes-plumbing"], "modular", LINK)} />,
    );
    const anchor = html.slice(html.indexOf(`href="${LINK}"`));
    const inner = anchor.slice(0, anchor.indexOf("</a>"));
    expect(inner).not.toMatch(/★|☆|\d(\.\d)?\s*stars?/i);
  });
});
