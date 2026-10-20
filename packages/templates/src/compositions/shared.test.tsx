import { fixtures } from "@nosweat/fixtures";
import { Composition, type SiteSpec } from "@nosweat/schema";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteRenderer } from "../SiteRenderer";
import { VISITOR_PRIVACY_URL } from "../sections/ContactForm";
import { buildModel } from "./model";
import { lowestPrice } from "./shared";

const withComposition = (spec: SiteSpec, composition: Composition): SiteSpec => ({
  ...spec,
  design: { ...spec.design, composition },
});

describe("contact form placeholders", () => {
  it("usa os serviços do próprio site, não o exemplo de outro ramo", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={fixtures["sparkle-cleaning"]} />);
    expect(html).toContain('placeholder="Recurring cleaning, Deep cleaning..."');
    expect(html).not.toContain("Water heater");
  });

  it("põe os serviços no campo de serviço em agendamento e consultoria", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={fixtures["hale-ortiz"]} />);
    expect(html).not.toContain("Monthly books, a tax return");
    // A ordem dos atributos no HTML não é garantida: acha o <input> do campo e olha o placeholder.
    const topic = html.match(/<input[^>]*name="x_topic"[^>]*>/)?.[0] ?? "";
    expect(topic).toMatch(/placeholder="[^"]+\.\.\."/);
  });

  it("só pede os nomes do casal em negócios de casamento", () => {
    const wedding = renderToStaticMarkup(<SiteRenderer spec={fixtures["vega-photo"]} />);
    expect(wedding).toContain("Your names");
    const other = renderToStaticMarkup(<SiteRenderer spec={fixtures["joes-plumbing"]} />);
    expect(other).not.toContain("Your names");
    expect(other).not.toContain("Ana &amp; Luis");
  });
});

describe("contact form notices", () => {
  it("diz que telefone ou e-mail basta", () => {
    const html = renderToStaticMarkup(<SiteRenderer spec={fixtures["joes-plumbing"]} />);
    expect(html).toContain("Leave a phone number or email so we can reply.");
  });

  it("mostra o aviso de privacidade só no site publicado (com endpoint)", () => {
    const live = renderToStaticMarkup(
      <SiteRenderer spec={fixtures["joes-plumbing"]} contactEndpoint="/api/sites/x/leads" />,
    );
    expect(live).toContain("Your details are sent to this business so they can reply.");
    const preview = renderToStaticMarkup(<SiteRenderer spec={fixtures["joes-plumbing"]} />);
    expect(preview).not.toContain("Your details are sent to this business");
  });
});

describe("site chrome", () => {
  it.each(Composition.options)("%s: rodapé com Privacy, <main id> e área segura do iPhone", (c) => {
    const spec = withComposition(fixtures["joes-plumbing"], c);
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    expect(html).toContain(`href="${VISITOR_PRIVACY_URL}"`);
    expect(html).toContain('<main id="main"');
    expect(html).toContain("env(safe-area-inset-bottom)");
    const thumb = renderToStaticMarkup(<SiteRenderer spec={spec} anchors={false} />);
    expect(thumb).not.toContain('id="main"');
  });

  it("não mostra pessoa sem nome no quem somos", () => {
    const base = fixtures["glow-salon"];
    const spec: SiteSpec = {
      ...base,
      sections: base.sections.map((section) =>
        section.type === "about"
          ? { ...section, people: [{ name: "  ", role: "Mystery role" }] }
          : section,
      ),
    };
    const html = renderToStaticMarkup(<SiteRenderer spec={spec} />);
    expect(html).not.toContain("Mystery role");
  });
});

describe("lowest price fact", () => {
  it("reads thousands separators ($3,200 is not $3)", () => {
    const priced = (prices: string[]): SiteSpec => ({
      ...fixtures["vega-photo"],
      sections: fixtures["vega-photo"].sections.map((section) =>
        section.type === "services"
          ? {
              ...section,
              items: prices.map((price, index) => ({
                name: `Service ${index}`,
                description: "Something we do.",
                price,
              })),
            }
          : section,
      ),
    });
    expect(lowestPrice(buildModel(priced(["from $3,200", "$18,000"])))).toBe("$3,200");
    expect(lowestPrice(buildModel(priced(["from $1,800", "$450"])))).toBe("$450");
    expect(lowestPrice(buildModel(priced(["$12.50"])))).toBe("$12.50");
  });
});
