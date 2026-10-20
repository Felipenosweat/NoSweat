// Redução de fotos no navegador antes do upload (fotos do site e do Instagram).
// As funções de cálculo são puras e testadas; carregar a foto e o canvas só rodam no navegador.
// Por que existe: as funções da Vercel recusam corpos acima de 4,5 MB antes de a rota rodar,
// e foto de celular costuma ter de 3 a 8 MB.

/** Qualidades tentadas, em ordem, até o arquivo caber no limite. */
export const JPEG_QUALITIES = [0.85, 0.75, 0.65, 0.55] as const;

/** Lado maior das fotos do site (topo, galeria, "quem somos"): nítido em telas grandes. */
export const MAX_PHOTO_EDGE = 2400;

/** Pedaço da foto original que vai para o canvas. */
export type CropBox = { sx: number; sy: number; sw: number; sh: number };

/** Tamanho final com o lado maior até `maxEdge`, mantendo a proporção e sem aumentar a foto. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number = MAX_PHOTO_EDGE,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) throw new Error("Invalid image size.");
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Nome do arquivo convertido: sem acentos/espaços, terminado em .jpg. */
export function jpegName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-") || "photo";
  return `${base.slice(0, 60)}.jpg`;
}

// ---------- navegador (canvas) ----------

export type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

/** Decodifica a foto já na posição certa (rotação EXIF das fotos de celular). */
export async function loadImage(file: File): Promise<LoadedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      // "from-image" respeita a rotação EXIF das fotos de celular.
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Alguns navegadores não decodificam tudo por aqui (ex.: HEIC): tenta pelo <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("We couldn't read this photo. Try a JPEG or PNG.");
  }
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("We couldn't process this photo."))),
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Desenha a foto (ou o recorte `crop`) num canvas `size` e exporta JPEG na maior qualidade de
 * JPEG_QUALITIES que cabe em `maxBytes`. `null` quando nem a menor qualidade cabe.
 */
export async function encodeJpeg(
  image: LoadedImage,
  size: { width: number; height: number },
  maxBytes: number,
  crop: CropBox = { sx: 0, sy: 0, sw: image.width, sh: image.height },
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("We couldn't process this photo.");
  // JPEG não tem transparência: fundo branco em vez de preto (ex.: PNG com fundo vazado).
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size.width, size.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image.source,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    size.width,
    size.height,
  );
  for (const quality of JPEG_QUALITIES) {
    const blob = await toJpeg(canvas, quality);
    if (blob.size <= maxBytes) return blob;
  }
  return null;
}

export type ResizedPhoto = { file: File; width: number; height: number };

/**
 * Foto do site: lado maior até `maxEdge` (2400 px), JPEG abaixo de `maxBytes`. Sem recorte.
 * Se nenhuma qualidade couber, reduz o tamanho mais um pouco (até 3 tentativas).
 * O canvas também tira os metadados da foto (como a localização GPS do celular).
 */
export async function resizePhoto(
  file: File,
  options: { maxBytes: number; maxEdge?: number },
): Promise<ResizedPhoto> {
  const image = await loadImage(file);
  try {
    let maxEdge = options.maxEdge ?? MAX_PHOTO_EDGE;
    for (let round = 0; round < 3; round++) {
      const size = fitWithin(image.width, image.height, maxEdge);
      const blob = await encodeJpeg(image, size, options.maxBytes);
      if (blob) {
        return {
          file: new File([blob], jpegName(file.name), { type: "image/jpeg" }),
          ...size,
        };
      }
      maxEdge = Math.round(Math.max(size.width, size.height) * 0.75);
    }
    throw new Error("This photo is too large. Try a smaller one.");
  } finally {
    image.close();
  }
}
