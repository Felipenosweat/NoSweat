import { describe, expect, it } from "vitest";
import { cropBox, pickRatio, planSocialImage, ratioOf, targetSize } from "./social-image";

describe("pickRatio", () => {
  it("retrato vira 4:5; paisagem e quadrada viram 1:1", () => {
    expect(pickRatio(3000, 4000)).toBe("portrait");
    expect(pickRatio(4000, 3000)).toBe("square");
    expect(pickRatio(1000, 1000)).toBe("square");
  });
});

describe("ratioOf", () => {
  it("reconhece fotos já prontas", () => {
    expect(ratioOf(1440, 1800)).toBe("portrait");
    expect(ratioOf(1080, 1080)).toBe("square");
  });
});

describe("cropBox", () => {
  it("corta as laterais de uma foto larga, centralizado", () => {
    expect(cropBox(4000, 3000, "square")).toEqual({ sx: 500, sy: 0, sw: 3000, sh: 3000 });
  });

  it("corta em cima e embaixo de uma foto alta para 4:5", () => {
    // 3000 / 0,8 = 3750 de altura; sobram 250 (125 em cima e 125 embaixo).
    expect(cropBox(3000, 4000, "portrait")).toEqual({ sx: 0, sy: 125, sw: 3000, sh: 3750 });
  });

  it("corta as laterais de uma foto quadrada para 4:5", () => {
    expect(cropBox(1000, 1000, "portrait")).toEqual({ sx: 100, sy: 0, sw: 800, sh: 1000 });
  });

  it("não corta nada se a proporção já é a certa", () => {
    expect(cropBox(1080, 1350, "portrait")).toEqual({ sx: 0, sy: 0, sw: 1080, sh: 1350 });
  });

  it("recusa tamanho inválido", () => {
    expect(() => cropBox(0, 100, "square")).toThrow();
  });
});

describe("targetSize", () => {
  it("limita a largura a 1440 e mantém a proporção exata", () => {
    expect(targetSize(3000, "portrait")).toEqual({ width: 1440, height: 1800 });
    expect(targetSize(3000, "square")).toEqual({ width: 1440, height: 1440 });
  });

  it("não aumenta foto pequena", () => {
    expect(targetSize(800, "portrait")).toEqual({ width: 800, height: 1000 });
  });

  it("aceita uma largura máxima menor", () => {
    expect(targetSize(3000, "square", 1080)).toEqual({ width: 1080, height: 1080 });
  });
});

describe("planSocialImage", () => {
  it("foto de celular (retrato 3024×4032) vira 1440×1800", () => {
    const plan = planSocialImage(3024, 4032);
    expect(plan.ratio).toBe("portrait");
    expect(plan.crop).toEqual({ sx: 0, sy: 126, sw: 3024, sh: 3780 });
    expect({ width: plan.width, height: plan.height }).toEqual({ width: 1440, height: 1800 });
  });

  it("respeita o formato pedido (carrossel com a 1ª foto quadrada)", () => {
    const plan = planSocialImage(3024, 4032, "square");
    expect(plan.crop).toEqual({ sx: 0, sy: 504, sw: 3024, sh: 3024 });
    expect({ width: plan.width, height: plan.height }).toEqual({ width: 1440, height: 1440 });
  });
});
