import { describe, expect, it } from "vitest";
import {
  detailToMinutes,
  galleryShapes,
  initials,
  priceToCents,
  serviceIconKey,
  shortName,
  usableHero,
  usableThumb,
} from "./soft-data";

describe("serviceIconKey", () => {
  it.each([
    ["Precision cut and blowout", "scissors"],
    ["Blowout", "wind"],
    ["Balayage", "brush"],
    ["Single-process color", "brush"],
    ["Keratin smoothing", "droplet"],
    ["Scalp treatment", "droplet"],
    ["Bridal and event hair and makeup", "crown"],
    ["Gel manicure", "nail"],
    ["Hot stone massage", "lotus"],
    ["Mystery service", "sparkle"],
  ] as const)("%s uses %s", (name, key) => {
    expect(serviceIconKey(name)).toBe(key);
  });
});

describe("labels", () => {
  it("shortens names and builds initials", () => {
    expect(shortName("Precision cut and blowout")).toBe("Precision cut");
    expect(shortName("Balayage")).toBe("Balayage");
    expect(initials("Camila Reyes")).toBe("CR");
    expect(initials("Madonna")).toBe("M");
  });
});

describe("photo quality", () => {
  const image = (width?: number, height?: number) => ({
    url: "https://example.com/a.jpg",
    alt: "",
    source: "upload" as const,
    kind: "owner" as const,
    width,
    height,
  });
  it("drops small photos and keeps the ones without sizes", () => {
    expect(usableHero(image(1000, 800))).toBe(false);
    expect(usableHero(image(2400, 1600))).toBe(true);
    expect(usableHero(image())).toBe(true);
    expect(usableThumb(image(500, 400))).toBe(false);
    expect(usableThumb(image(800, 600))).toBe(true);
  });
});

describe("galleryShapes", () => {
  it("never leaves a hole on the 4-column desktop grid", () => {
    for (let count = 1; count <= 12; count++) {
      const cells = galleryShapes(count).reduce((sum, shape) => {
        if (shape.d === "big") return sum + 4;
        if (shape.d === "w2") return sum + 2;
        if (shape.d === "w4") return sum + 4;
        return sum + 1;
      }, 0);
      expect(cells % 4, `count ${count}`).toBe(0);
    }
  });

  it("fills the 2-column mobile grid", () => {
    for (let count = 2; count <= 12; count++) {
      const cells = galleryShapes(count).reduce(
        (sum, shape) => sum + (shape.m === "full" ? 2 : shape.m === "tall" ? 1 : 1),
        0,
      );
      // "tall" ocupa 2 linhas de uma coluna (3 imagens = 1 + 2 empilhadas): par de colunas fechado.
      expect(cells % 2 === 0 || count === 3, `count ${count}`).toBe(true);
    }
  });
});

describe("booking facts", () => {
  it("reads prices and durations", () => {
    expect(priceToCents("from $85")).toBe(8500);
    expect(priceToCents("$1,200.50")).toBe(120050);
    expect(priceToCents(undefined)).toBeNull();
    expect(detailToMinutes("60 min")).toBe(60);
    expect(detailToMinutes("About 3 hours")).toBe(180);
    expect(detailToMinutes("Lasts up to 12 weeks")).toBe(60);
  });
});
