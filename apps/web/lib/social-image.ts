// Prepara fotos para o Instagram no navegador: recorta no formato 4:5 (retrato) ou 1:1
// (quadrado), limita a 1440 px de largura e exporta JPEG abaixo de 4 MB.
// As contas (recorte e tamanho) são funções puras e testadas; a parte do canvas só roda no navegador
// e é a mesma das fotos do site (lib/image-resize.ts).

import { encodeJpeg, jpegName, loadImage, type CropBox } from "./image-resize";

export { JPEG_QUALITIES, type CropBox } from "./image-resize";

/** Formato da foto: largura ÷ altura. */
export type SocialRatio = "portrait" | "square";

export const RATIO_VALUE: Record<SocialRatio, number> = { portrait: 4 / 5, square: 1 };

/** Largura máxima que o Instagram usa (fotos maiores são reduzidas por ele mesmo). */
export const MAX_SOCIAL_WIDTH = 1440;
/** Limite da rota POST /api/social/media. */
export const MAX_SOCIAL_BYTES = 4 * 1024 * 1024;

/**
 * Escolhe o formato pela foto original: retrato (mais alta que larga) vira 4:5; o resto vira 1:1.
 * Paisagem vira quadrado porque 4:5 cortaria demais as laterais.
 */
export function pickRatio(width: number, height: number): SocialRatio {
  return height > width ? "portrait" : "square";
}

/** Formato de uma foto já pronta (para manter as fotos de um carrossel iguais). */
export function ratioOf(width: number, height: number): SocialRatio {
  return Math.abs(width / height - RATIO_VALUE.portrait) < 0.02 ? "portrait" : "square";
}

/** Maior área centralizada da foto com a proporção pedida (corta o excesso igual dos dois lados). */
export function cropBox(width: number, height: number, ratio: SocialRatio): CropBox {
  if (width <= 0 || height <= 0) throw new Error("Invalid image size.");
  const target = RATIO_VALUE[ratio];
  if (width / height > target) {
    // Larga demais: corta as laterais.
    const sw = Math.round(height * target);
    return { sx: Math.floor((width - sw) / 2), sy: 0, sw, sh: height };
  }
  // Alta demais (ou já na proporção): corta em cima e embaixo.
  const sh = Math.min(height, Math.round(width / target));
  return { sx: 0, sy: Math.floor((height - sh) / 2), sw: width, sh };
}

/**
 * Tamanho final do JPEG: a largura do recorte, sem passar de `maxWidth` e sem aumentar a foto.
 * A altura sai da proporção exata (1080×1350, 1440×1800...).
 */
export function targetSize(
  cropWidth: number,
  ratio: SocialRatio,
  maxWidth: number = MAX_SOCIAL_WIDTH,
): { width: number; height: number } {
  const width = Math.max(1, Math.min(Math.round(cropWidth), Math.round(maxWidth)));
  return { width, height: Math.max(1, Math.round(width / RATIO_VALUE[ratio])) };
}

/** Plano completo para uma foto: recorte na original e tamanho final. */
export function planSocialImage(
  width: number,
  height: number,
  ratio: SocialRatio = pickRatio(width, height),
  maxWidth: number = MAX_SOCIAL_WIDTH,
): { ratio: SocialRatio; crop: CropBox; width: number; height: number } {
  const crop = cropBox(width, height, ratio);
  return { ratio, crop, ...targetSize(crop.sw, ratio, maxWidth) };
}

export type PreparedSocialImage = { file: File; width: number; height: number };

// ---------- navegador (canvas, em lib/image-resize.ts) ----------

/**
 * Carrega a foto, recorta, reduz e exporta JPEG (~0,85). Se passar de 4 MB, baixa a qualidade e,
 * em último caso, a largura.
 */
export async function prepareSocialImage(
  file: File,
  options: { ratio?: SocialRatio; maxBytes?: number } = {},
): Promise<PreparedSocialImage> {
  const maxBytes = options.maxBytes ?? MAX_SOCIAL_BYTES;
  const image = await loadImage(file);
  try {
    let maxWidth = MAX_SOCIAL_WIDTH;
    for (let round = 0; round < 3; round++) {
      const plan = planSocialImage(image.width, image.height, options.ratio, maxWidth);
      const blob = await encodeJpeg(image, plan, maxBytes, plan.crop);
      if (blob) {
        return {
          file: new File([blob], jpegName(file.name), { type: "image/jpeg" }),
          width: plan.width,
          height: plan.height,
        };
      }
      maxWidth = Math.round(plan.width * 0.75);
    }
    throw new Error("This photo is too large. Try a smaller one.");
  } finally {
    image.close();
  }
}
