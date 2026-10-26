import { create as createQr } from "qrcode";

// QR code como SVG (um <path> só), com a biblioteca `qrcode` que o app já usa (PublishDialog).
// Nada de canvas: o mesmo desenho serve para a tela e para baixar e imprimir.

/** Tamanho (em módulos) e o caminho SVG dos módulos escuros. */
export function qrPath(value: string): { size: number; path: string } {
  const { modules } = createQr(value, { errorCorrectionLevel: "M" });
  let path = "";
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) path += `M${col} ${row}h1v1h-1z`;
    }
  }
  return { size: modules.size, path };
}

/** Margem branca em volta (em módulos): os leitores precisam dela. */
export const QR_MARGIN = 2;

/** SVG completo (preto no branco, cores fixas de propósito: é para imprimir). */
export function qrSvgMarkup(value: string, pixels = 512): string {
  const { size, path } = qrPath(value);
  const box = size + QR_MARGIN * 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-QR_MARGIN} ${-QR_MARGIN} ${box} ${box}"`,
    ` width="${pixels}" height="${pixels}" shape-rendering="crispEdges">`,
    `<rect x="${-QR_MARGIN}" y="${-QR_MARGIN}" width="${box}" height="${box}" fill="#ffffff"/>`,
    `<path d="${path}" fill="#000000"/></svg>`,
  ].join("");
}

/** O SVG como data: URL (para o link "Download"). */
export function qrSvgDataUrl(value: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvgMarkup(value))}`;
}
