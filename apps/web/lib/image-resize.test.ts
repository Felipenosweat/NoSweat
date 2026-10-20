import { describe, expect, it } from "vitest";
import { fitWithin, jpegName, MAX_PHOTO_EDGE } from "./image-resize";

describe("fitWithin", () => {
  it("reduz o lado maior até o limite, mantendo a proporção", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: MAX_PHOTO_EDGE, height: 1800 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1800, height: MAX_PHOTO_EDGE });
  });

  it("não aumenta fotos pequenas", () => {
    expect(fitWithin(1200, 800)).toEqual({ width: 1200, height: 800 });
  });

  it("aceita outro limite", () => {
    expect(fitWithin(2000, 1000, 1000)).toEqual({ width: 1000, height: 500 });
  });

  it("recusa tamanho inválido", () => {
    expect(() => fitWithin(0, 100)).toThrow();
  });
});

describe("jpegName", () => {
  it("troca a extensão e limpa o nome", () => {
    expect(jpegName("IMG 1234.HEIC")).toBe("IMG-1234.jpg");
    expect(jpegName(".png")).toBe("photo.jpg");
  });
});
