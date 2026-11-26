import { fixtures } from "@nosweat/fixtures";
import type { SiteSpec } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteRenderer } from "../../SiteRenderer";

const render = (spec: SiteSpec) => renderToStaticMarkup(<SiteRenderer spec={spec} />);
const without = (spec: SiteSpec): SiteSpec => ({
  ...spec,
  business: { ...spec.business, payments: undefined },
});

describe("soft composition: how customers pay", () => {
  it("shows the Payment card with the owner's methods in the contact block", () => {
    const html = render(fixtures["glow-salon"]);
    expect(html).toContain("ns-s-pay");
    expect(html).toContain("<h3>Payment</h3>");
    for (const pill of [
      "Cash",
      "Credit &amp; debit cards",
      "Zelle · (305) 555-0187",
      "Venmo · @glowsalon-demo",
      "Cash App · $glowsalondemo",
    ]) {
      expect(html).toContain(`<li>${pill}</li>`);
    }
    expect(html).toContain("Tips are always appreciated, never expected.");
    // Está dentro do contato, antes do formulário.
    expect(html.indexOf("ns-s-pay")).toBeGreaterThan(html.indexOf('id="contact"'));
  });

  it("works for the other variants too", () => {
    const html = render(fixtures["joes-plumbing"]);
    expect(html).toContain("<h3>Payment</h3>");
    expect(html).toContain("<li>Check</li>");
    expect(html).toContain("<li>Zelle · (512) 555-0142</li>");
  });

  it("renders nothing when the owner chose nothing", () => {
    for (const slug of ["glow-salon", "joes-plumbing"] as const) {
      const html = render(without(fixtures[slug]));
      expect(html).not.toContain("ns-s-pay");
      expect(html).not.toContain("ns-s-payline");
      expect(html).not.toContain("<h3>Payment</h3>");
    }
    const empty: SiteSpec = {
      ...fixtures["glow-salon"],
      business: { ...fixtures["glow-salon"].business, payments: { methods: [] } },
    };
    expect(render(empty)).not.toContain("ns-s-pay");
  });

  it("falls back to a footer line when the site has no contact section", () => {
    const glow = fixtures["glow-salon"];
    const spec: SiteSpec = {
      ...glow,
      sections: glow.sections.filter((section) => section.type !== "contact"),
    };
    const html = render(spec);
    expect(html).not.toContain("<h3>Payment</h3>");
    expect(html).toContain("ns-s-payline");
    expect(html).toContain("Payment: Cash · Credit &amp; debit cards · Zelle · (305) 555-0187");
  });

  it("does not invent payment claims on sites that have no payments", () => {
    const html = render(without(fixtures["rosas-kitchen"]));
    expect(html).not.toMatch(/zelle|venmo|cash app|paypal/i);
  });
});
