// Validação das fotos enviadas pelo dono (sem dependências: só olha os bytes).

/**
 * 4 MB: abaixo do limite de 4,5 MB do corpo das funções da Vercel (acima dele a Vercel recusa o
 * pedido antes da rota rodar). O editor reduz as fotos grandes no navegador antes de enviar.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export type ImageFormat = { mime: "image/jpeg" | "image/png" | "image/webp"; ext: string };

const FORMATS: Record<ImageFormat["mime"], ImageFormat> = {
  "image/jpeg": { mime: "image/jpeg", ext: "jpg" },
  "image/png": { mime: "image/png", ext: "png" },
  "image/webp": { mime: "image/webp", ext: "webp" },
};

export const ALLOWED_IMAGE_TYPES = Object.keys(FORMATS) as ImageFormat["mime"][];

/** Formato real do arquivo pelos "magic bytes" (não confia na extensão nem no MIME do navegador). */
export function detectImageFormat(bytes: Uint8Array): ImageFormat | null {
  const at = (i: number) => bytes[i];
  const ascii = (start: number, text: string) =>
    [...text].every((char, i) => at(start + i) === char.charCodeAt(0));

  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return FORMATS["image/jpeg"];
  if (
    at(0) === 0x89 &&
    ascii(1, "PNG") &&
    at(4) === 0x0d &&
    at(5) === 0x0a &&
    at(6) === 0x1a &&
    at(7) === 0x0a
  ) {
    return FORMATS["image/png"];
  }
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return FORMATS["image/webp"];
  return null;
}

export type ImageCheck =
  | { ok: true; format: ImageFormat; width?: number; height?: number }
  | { ok: false; status: 400 | 413; message: string };

/** Confere tamanho, MIME declarado e conteúdo. O MIME declarado precisa bater com os bytes. */
export function checkImageUpload(declaredType: string, bytes: Uint8Array): ImageCheck {
  if (bytes.byteLength === 0) {
    return { ok: false, status: 400, message: "The file is empty." };
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, status: 413, message: "Photos can be up to 4 MB." };
  }
  const notAnImage = "Please upload a JPG, PNG or WebP photo.";
  if (!(ALLOWED_IMAGE_TYPES as string[]).includes(declaredType)) {
    return { ok: false, status: 400, message: notAnImage };
  }
  const format = detectImageFormat(bytes);
  if (!format || format.mime !== declaredType) {
    return { ok: false, status: 400, message: notAnImage };
  }
  return { ok: true, format, ...imageSize(bytes, format) };
}

/** Largura e altura lidas do cabeçalho (melhor esforço; sem resultado se não reconhecer). */
export function imageSize(
  bytes: Uint8Array,
  format: ImageFormat,
): { width?: number; height?: number } {
  try {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const size = (width: number, height: number) =>
      width > 0 && height > 0 ? { width, height } : {};

    if (format.mime === "image/png") {
      return size(view.getUint32(16), view.getUint32(20));
    }

    if (format.mime === "image/webp") {
      const chunk = String.fromCharCode(...bytes.subarray(12, 16));
      if (chunk === "VP8 ")
        return size(view.getUint16(26, true) & 0x3fff, view.getUint16(28, true) & 0x3fff);
      if (chunk === "VP8L") {
        const bits = view.getUint32(21, true);
        return size((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1);
      }
      if (chunk === "VP8X") {
        const w = 1 + (bytes[24]! | (bytes[25]! << 8) | (bytes[26]! << 16));
        const h = 1 + (bytes[27]! | (bytes[28]! << 8) | (bytes[29]! << 16));
        return size(w, h);
      }
      return {};
    }

    // JPEG: procura o marcador SOFn (C0–CF, menos C4, C8 e CC).
    let offset = 2;
    while (offset + 9 < bytes.byteLength) {
      if (bytes[offset] !== 0xff) return {};
      const marker = bytes[offset + 1]!;
      const length = view.getUint16(offset + 2);
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return size(view.getUint16(offset + 7), view.getUint16(offset + 5));
      }
      offset += 2 + length;
    }
    return {};
  } catch {
    return {};
  }
}
