import { describe, expect, it } from "vitest";
import { blankLine, isUnpricedLine, unpricedWarning, type DraftLine } from "./draft";

// Linha com o preço digitado (o resto vem da linha em branco).
function line(unitPrice: string): DraftLine {
  return { ...blankLine(), name: "Service call", unitPrice };
}

describe("isUnpricedLine", () => {
  it("flags a blank or zero price", () => {
    expect(isUnpricedLine(line(""))).toBe(true);
    expect(isUnpricedLine(line("  "))).toBe(true);
    expect(isUnpricedLine(line("0"))).toBe(true);
    expect(isUnpricedLine(line("$0.00"))).toBe(true);
  });

  it("does not flag a real price or an invalid one (that is a validation error)", () => {
    expect(isUnpricedLine(line("120"))).toBe(false);
    expect(isUnpricedLine(line("0.50"))).toBe(false);
    expect(isUnpricedLine(line("12,3.456"))).toBe(false);
  });
});

describe("unpricedWarning", () => {
  it("is null when every line has a price", () => {
    expect(unpricedWarning([])).toBeNull();
    expect(unpricedWarning([line("89.50"), line("120")])).toBeNull();
  });

  it("explains one line or counts several", () => {
    expect(unpricedWarning([line("120"), line("")])).toBe(
      "One line has no price ($0). Add a price or remove the line.",
    );
    expect(unpricedWarning([line("0"), line(""), line("50")])).toBe(
      "2 lines have no price ($0). Add a price or remove them.",
    );
  });
});
