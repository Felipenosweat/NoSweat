import { GenerateSiteRequest } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import {
  EMPTY_FIELDS,
  LIMITS,
  PROMPT_LIMIT,
  parseChoices,
  composeBrief,
  fieldsFromBrief,
  parseDraft,
  publishedSlug,
  joinArea,
  matchStates,
  splitArea,
  stateCodeFor,
  toggleArea,
  US_STATE_NAMES,
} from "./brief";

describe("composeBrief", () => {
  it("writes natural sentences with the style on its own line", () => {
    const brief = composeBrief({
      name: "Sparkle & Shine",
      what: "House cleaning, weekly and move-out",
      city: "Worcester",
      state: "ma",
      serviceArea: "Shrewsbury and Auburn",
      phone: "",
      details: "Eco-friendly products.",
      style: "warm",
    });
    expect(brief).toBe(
      "The business is called Sparkle & Shine. House cleaning, weekly and move-out. " +
        "Based in Worcester, MA. Service area: Shrewsbury and Auburn.\n\n" +
        "Eco-friendly products.\n\nStyle: warm & friendly.",
    );
  });

  it("adds the phone as its own sentence after the place", () => {
    const brief = composeBrief({
      ...EMPTY_FIELDS,
      what: "Family-owned plumbing",
      city: "Austin",
      state: "TX",
      phone: " (512) 555-0142 ",
    });
    expect(brief).toBe("Family-owned plumbing. Based in Austin, TX. Phone: (512) 555-0142.");
  });

  it("leaves out empty parts and the style when we pick it", () => {
    const brief = composeBrief({ ...EMPTY_FIELDS, what: "Mobile dog grooming!" });
    expect(brief).toBe("Mobile dog grooming!");
  });

  it("stays within the API limit when every field is full", () => {
    const brief = composeBrief({
      name: "n".repeat(LIMITS.name),
      what: "w".repeat(LIMITS.what),
      city: "c".repeat(LIMITS.city),
      state: "TX",
      serviceArea: "s".repeat(LIMITS.serviceArea),
      phone: "5".repeat(LIMITS.phone),
      details: "d".repeat(LIMITS.details),
      style: "professional",
    });
    expect(GenerateSiteRequest.safeParse({ brief }).success).toBe(true);
  });
});

describe("composeBrief with wizard choices", () => {
  it("adds the business type and layout as hint sentences before the style line", () => {
    const brief = composeBrief(
      { ...EMPTY_FIELDS, what: "Hair salon in Miami, FL", style: "elegant" },
      { kind: "beauty", layout: "editorial" },
    );
    expect(brief).toBe(
      "Hair salon in Miami, FL.\n\n" +
        "Type of business: beauty and personal care. Preferred layout: editorial.\n\n" +
        "Style: elegant.",
    );
  });

  it("leaves the hints out when No Sweat decides", () => {
    const brief = composeBrief(
      { ...EMPTY_FIELDS, what: "Mobile dog grooming!" },
      { kind: "auto", layout: "auto" },
    );
    expect(brief).toBe("Mobile dog grooming!");
  });

  it("stays within the API limit with a full prompt and every choice", () => {
    const brief = composeBrief(
      {
        name: "n".repeat(LIMITS.name),
        what: "w".repeat(PROMPT_LIMIT),
        city: "c".repeat(LIMITS.city),
        state: "TX",
        serviceArea: "s".repeat(LIMITS.serviceArea),
        phone: "5".repeat(LIMITS.phone),
        details: "",
        style: "professional",
      },
      { kind: "professional", layout: "typographic" },
    );
    expect(GenerateSiteRequest.safeParse({ brief }).success).toBe(true);
  });
});

describe("parseChoices", () => {
  it("keeps known choices and falls back to auto", () => {
    expect(parseChoices('{"kind":"restaurant","layout":"modular"}')).toEqual({
      kind: "restaurant",
      layout: "modular",
    });
    expect(parseChoices('{"kind":"spaceship","layout":7}')).toEqual({
      kind: "auto",
      layout: "auto",
    });
    expect(parseChoices("not json")).toEqual({ kind: "auto", layout: "auto" });
    expect(parseChoices(null)).toEqual({ kind: "auto", layout: "auto" });
  });
});

describe("fieldsFromBrief", () => {
  it("keeps a short brief in one field and reads the city and state", () => {
    const fields = fieldsFromBrief("Family-owned plumbing in Austin, TX. 24/7 repairs.");
    expect(fields.what).toBe("Family-owned plumbing in Austin, TX. 24/7 repairs.");
    expect(fields).toMatchObject({ city: "Austin", state: "TX", details: "" });
  });

  it("moves the rest of a long brief into the details", () => {
    const fields = fieldsFromBrief(`Hair salon in Miami. ${"Balayage and bridal. ".repeat(30)}`);
    expect(fields.what).toBe("Hair salon in Miami.");
    expect(fields.details.startsWith("Balayage")).toBe(true);
    expect(fields.city).toBe("");
  });

  it("ignores codes that are not US states", () => {
    expect(fieldsFromBrief("Bakery in Springfield, ZZ").state).toBe("");
  });
});

describe("publishedSlug", () => {
  it("matches the slug the publish route creates", () => {
    expect(publishedSlug("Joe's Plumbing", "6f1c2a3b-4d5e")).toBe("joes-plumbing-6f1c2a");
    expect(publishedSlug("!!!", "abcdef12")).toBe("site-abcdef");
  });
});

describe("parseDraft", () => {
  it("restores known fields and rejects garbage", () => {
    const draft = parseDraft(
      JSON.stringify({ source: "", step: 2, fields: { name: "Rosa", style: "nope", x: 1 } }),
    );
    expect(draft).toEqual({ source: "", step: 2, fields: { ...EMPTY_FIELDS, name: "Rosa" } });
    expect(parseDraft("{")).toBeNull();
    expect(parseDraft(null)).toBeNull();
  });
});

describe("campo de estado", () => {
  it("aceita a sigla ou o nome inteiro", () => {
    expect(stateCodeFor("ma")).toBe("MA");
    expect(stateCodeFor("Massachusetts")).toBe("MA");
    expect(stateCodeFor("new york")).toBe("NY");
    expect(stateCodeFor("Mass")).toBeNull();
  });

  it("filtra a lista pela sigla ou pelo começo do nome, sigla exata primeiro", () => {
    expect(matchStates("ma")[0]).toBe("MA");
    expect(matchStates("new")).toEqual(["NH", "NJ", "NM", "NY"]);
    expect(matchStates("carolina")).toEqual(["NC", "SC"]);
    expect(matchStates("")).toHaveLength(Object.keys(US_STATE_NAMES).length);
  });
});

describe("área atendida", () => {
  it("separa e junta como uma frase", () => {
    expect(splitArea("Shrewsbury, Auburn and Holden")).toEqual(["Shrewsbury", "Auburn", "Holden"]);
    expect(joinArea(["A"])).toBe("A");
    expect(joinArea(["A", "B"])).toBe("A and B");
    expect(joinArea(["A", "B", "C"])).toBe("A, B and C");
  });

  it("liga e desliga uma cidade sem perder o resto", () => {
    expect(toggleArea("", "Holden")).toBe("Holden");
    expect(toggleArea("Holden", "Auburn")).toBe("Holden and Auburn");
    expect(toggleArea("Shrewsbury, Auburn and Holden", "auburn")).toBe("Shrewsbury and Holden");
  });

  it("não passa do limite do campo", () => {
    expect(toggleArea("x".repeat(20), "Holden", 25)).toBe("x".repeat(20));
  });
});
