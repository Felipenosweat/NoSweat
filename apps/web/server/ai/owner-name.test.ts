import { fixtures } from "@nosweat/fixtures";
import { GenerateSiteRequest, SiteSpec, type AiEditResult } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import {
  EMPTY_CHOICES,
  EMPTY_FIELDS,
  generateRequest,
  landingName,
} from "@/app/(dashboard)/create/brief";
import { heroBrief, heroCreateUrl } from "@/components/landing/hero-brief";
import { nameFromBrief } from "./brief-facts";
import { generateSiteSpec } from "./index";
import { MockGenerator, mockFill } from "./mock";
import { applyModelFill, verifyFacts } from "./model-fill";
import { cleanOwnerName, withOwnerName } from "./owner-name";
import type { SiteGenerator } from "./types";

// Bug J1 da auditoria: o nome digitado na pergunta 3 da landing sumia ("Joe's Plumbing" virava
// "Austin Home Services"). Agora o nome vai à parte (?name= → campo "Business name" →
// `businessName`) e vale em todos os geradores: mock do dev, modo modelo e IA (modelo e completo).

const NAMES = [
  "Joe's Plumbing",
  "Joe’s Plumbing",
  "Smith & Sons",
  "Sparkle & Co.",
  "Glow 💅 Studio",
  "Ñandú Café",
  "Zoë's Crème Brûlée",
  '<b>Glow</b> & "Co" 💅 Ñandú',
  "<script>alert(1)</script> Cleaning",
  "Yahoo! Cleaning",
  "Dr. Who's Repairs",
  "Is it Clean? LLC",
  "123 Movers",
];

/** O caminho inteiro da landing até o corpo do POST, como o navegador faz. */
function requestFromLanding(name: string) {
  const url = new URL(
    heroCreateUrl({ kind: "Home services", where: "Austin, TX", name, details: "" }),
    "http://localhost",
  );
  const brief = url.searchParams.get("brief") ?? "";
  // /create (page.tsx + CreateFlow): o texto vai para "what" e o nome para "Business name".
  const fields = { ...EMPTY_FIELDS, what: brief, name: landingName(url.searchParams.get("name")) };
  return GenerateSiteRequest.parse(generateRequest(fields, EMPTY_CHOICES));
}

/** Gerador que inventa outro nome (como a IA às vezes faz), partindo do modelo da categoria. */
function inventingGenerator(invented: string): SiteGenerator {
  return {
    usesAi: true,
    async generateSite(brief) {
      // Caminho "modelo" da Anthropic: o Haiku devolve um ModelFill; aqui o fill vem do mock
      // com o nome trocado, simulando a IA que leu mal o pedido.
      const model = fixtures["joes-plumbing"];
      const fill = mockFill(brief, model, "joes-plumbing");
      const wrong = { ...fill, business: { ...fill.business, name: invented } };
      const spec = applyModelFill(model, wrong, undefined, verifyFacts(wrong.business, brief));
      return SiteSpec.parse({
        ...spec,
        sections: spec.sections.map((section) =>
          section.type === "hero" ? { ...section, title: `Welcome to ${invented}` } : section,
        ),
      });
    },
    async editSite(spec): Promise<AiEditResult> {
      return { spec, summary: "" };
    },
  };
}

describe("landing → /create: the typed business name", () => {
  it("goes in its own parameter, not inside the brief", () => {
    const { brief, name } = heroBrief({
      kind: "Home services",
      where: "Austin, TX",
      name: "  Joe's   Plumbing ",
      details: "Call (512) 555-0142.",
    });
    expect(name).toBe("Joe's Plumbing");
    expect(brief).toBe("Home services business in Austin, TX. Call (512) 555-0142.");
    const url = new URL(
      heroCreateUrl({
        kind: "Home services",
        where: "Austin, TX",
        name: "Joe's Plumbing",
        details: "",
      }),
      "http://localhost",
    );
    expect(url.pathname).toBe("/create");
    expect(url.searchParams.get("name")).toBe("Joe's Plumbing");
    expect(url.searchParams.get("start")).toBe("1");
  });

  it("leaves the name out when the owner skipped the question", () => {
    const url = new URL(
      heroCreateUrl({ kind: "Food & drink", where: "Miami, FL", name: "   ", details: "" }),
      "http://localhost",
    );
    expect(url.searchParams.has("name")).toBe(false);
    expect(requestFromLanding("").businessName).toBeUndefined();
  });

  it.each(NAMES)("carries %s to the request exactly, as text", (name) => {
    const request = requestFromLanding(name);
    expect(request.businessName).toBe(name);
    // O texto também diz o nome (para a IA escrever sobre o negócio certo).
    expect(request.brief).toContain(`The business is called ${name}`);
  });

  it("reads the name sentence from the brief for ordinary names (mock and template mode)", () => {
    for (const name of ["Joe's Plumbing", "Smith & Sons", "Glow 💅 Studio", "Ñandú Café"]) {
      expect(nameFromBrief(requestFromLanding(name).brief)).toBe(name);
    }
  });
});

describe("generateSiteSpec with the owner's business name", () => {
  const generators: [string, () => SiteGenerator][] = [
    ["dev mock", () => new MockGenerator({ delayMs: 0 })],
    ["template mode (no AI)", () => new MockGenerator({ delayMs: 0, templateMode: true })],
    ["AI that invents a name", () => inventingGenerator("Austin Home Services")],
  ];

  for (const [label, make] of generators) {
    it.each(NAMES)(`${label}: the site is called %s`, async (name) => {
      const request = requestFromLanding(name);
      const spec = await generateSiteSpec(
        request.brief,
        make(),
        {},
        { businessName: request.businessName },
      );
      expect(spec.business.name).toBe(name);
      expect(JSON.stringify(spec)).not.toContain("Austin Home Services");
    });
  }

  it("keeps the generator's name when the owner left it blank", async () => {
    const spec = await generateSiteSpec(
      "Home services business in Austin, TX.",
      inventingGenerator("Austin Home Services"),
      {},
      { businessName: "   " },
    );
    expect(spec.business.name).toBe("Austin Home Services");
  });
});

describe("withOwnerName", () => {
  const base = fixtures["joes-plumbing"];

  it("sets the name and replaces the invented one in the copy", () => {
    const spec = SiteSpec.parse({
      ...base,
      business: { ...base.business, name: "Austin Home Services" },
      sections: base.sections.map((section) =>
        section.type === "hero"
          ? { ...section, title: "Austin Home Services, at your door" }
          : section,
      ),
    });
    const named = withOwnerName(spec, "Ñandú & Co");
    expect(named.business.name).toBe("Ñandú & Co");
    const hero = named.sections.find((section) => section.type === "hero");
    expect(hero?.type === "hero" && hero.title).toBe("Ñandú & Co, at your door");
  });

  it("does not touch common words when the old name is very short", () => {
    const spec = SiteSpec.parse({ ...base, business: { ...base.business, name: "Joe" } });
    const named = withOwnerName(spec, "Mary's Plumbing");
    expect(named.business.name).toBe("Mary's Plumbing");
    expect(JSON.stringify(named.sections)).toBe(JSON.stringify(spec.sections));
  });

  it("returns the same spec without a name, and cleans control characters", () => {
    expect(withOwnerName(base, undefined)).toBe(base);
    expect(withOwnerName(base, "  ")).toBe(base);
    expect(cleanOwnerName("Joe's\n\tPlumbing\u0000")).toBe("Joe's Plumbing");
    expect(cleanOwnerName("x".repeat(100))).toHaveLength(80);
  });
});
