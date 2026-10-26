import { describe, expect, it } from "vitest";
import { qrPath, qrSvgDataUrl, qrSvgMarkup } from "./qr";

const LINK = "https://g.page/r/CbX1ab2Cd3EfEAI/review";

describe("QR code", () => {
  it("gera uma grade de QR válida (21 + 4n módulos) com módulos escuros", () => {
    const { size, path } = qrPath(LINK);
    expect((size - 21) % 4).toBe(0);
    expect(size).toBeGreaterThanOrEqual(21);
    // Canto do padrão de localização (sempre escuro).
    expect(path.startsWith("M0 0h1v1h-1z")).toBe(true);
  });

  it("monta um SVG para imprimir e um data: URL", () => {
    const svg = qrSvgMarkup(LINK);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('fill="#000000"');
    expect(qrSvgDataUrl(LINK).startsWith("data:image/svg+xml;charset=utf-8,%3Csvg")).toBe(true);
  });
});
