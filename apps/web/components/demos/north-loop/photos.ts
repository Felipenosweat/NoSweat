// Fotos da demonstração North Loop Coffee (Unsplash, hotlink com crédito, como pedem as regras
// do Unsplash). Busca na API em 2026-10-27; texto alternativo escrito à mão. São CENAS: nenhuma
// é apresentada como "o nosso café" ou "a nossa equipe", e nenhuma mostra marca de outra loja.
// O `download_location` de cada uma foi para a fila do coordenador (kit/pings-queue.txt).
// Imagem "recortada" (collage-cutouts): as fotos de cima (xícara, pão, bandeja do torrador) viram
// círculos com borda de papel; as outras entram como cópias impressas coladas na página.

export type NorthLoopPhoto = {
  id: string;
  /** URL base (raw) do Unsplash; tamanho e recorte entram por parâmetro (ver `src`). */
  raw: string;
  width: number;
  height: number;
  color: string;
  alt: string;
  author: string;
  authorUrl: string;
  photoUrl: string;
  /** Ponto de foco do recorte (0–1). */
  focus?: [number, number];
  /** Recorte prévio em pixels da original (x, y, largura, altura). */
  rect?: [number, number, number, number];
};

const UTM = "utm_source=nosweat&utm_medium=referral";
const user = (name: string) => `https://unsplash.com/@${name}?${UTM}`;

export const PHOTOS = {
  latte: {
    id: "Nw8wbiDE3gU",
    raw: "https://images.unsplash.com/photo-1559001724-fbad036dbc9e?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8M3x8bGF0dGUlMjBmcm9tJTIwYWJvdmV8ZW58MHx8fHwxNzkzMDk2ODMxfDA&ixlib=rb-4.1.0",
    width: 2843,
    height: 2843,
    color: "#735940",
    alt: "A latte seen from above, a fern of milk foam on top, in a white cup on its saucer",
    author: "Phil Desforges",
    authorUrl: user("storybyphil"),
    photoUrl: `https://unsplash.com/photos/cafe-latte-Nw8wbiDE3gU?${UTM}`,
    rect: [179, 237, 2400, 2400],
  },
  bun: {
    id: "7XnDc0L9MFA",
    raw: "https://images.unsplash.com/photo-1791498291159-06b2a4274c9e?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8OXx8Y2FyZGFtb20lMjBidW58ZW58MHx8fHwxNzkzMDk2ODMyfDA&ixlib=rb-4.1.0",
    width: 11065,
    height: 8299,
    color: "#737359",
    alt: "A knotted cardamom bun with sugar crystals on a small ceramic plate",
    author: "Heng Chiu",
    authorUrl: user("chiuchuuu"),
    photoUrl: `https://unsplash.com/photos/cardamom-bun-on-ceramic-plate-7XnDc0L9MFA?${UTM}`,
    rect: [2395, 1423, 6800, 6800],
  },
  cortado: {
    id: "X2tfBv2bavI",
    raw: "https://images.unsplash.com/photo-1749104028391-c1362c3b92d6?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MjF8fGNvcnRhZG98ZW58MHx8fHwxNzkzMDk2ODk3fDA&ixlib=rb-4.1.0",
    width: 1760,
    height: 3120,
    color: "#262626",
    alt: "A small glass of coffee and steamed milk on a white saucer, on a dark wooden table",
    author: "Gaia&Co",
    authorUrl: user("gaiacoffee"),
    photoUrl: `https://unsplash.com/photos/a-latte-sits-on-a-small-white-saucer-X2tfBv2bavI?${UTM}`,
    focus: [0.5, 0.58],
  },
  roaster: {
    id: "Jmc0PORTQ-A",
    raw: "https://images.unsplash.com/photo-1537130508299-46ab547b4be3?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Mnx8Y29mZmVlJTIwcm9hc3RlciUyMG1hY2hpbmV8ZW58MHx8fHwxNzkzMDk2ODMyfDA&ixlib=rb-4.1.0",
    width: 5243,
    height: 3495,
    color: "#262626",
    alt: "Freshly roasted beans pouring out of a drum roaster into the round cooling tray",
    author: "Gregory Hayes",
    authorUrl: user("gregoryallen"),
    photoUrl: `https://unsplash.com/photos/time-lapse-photography-of-coffee-beans-grind-Jmc0PORTQ-A?${UTM}`,
    rect: [1500, 0, 3495, 3495],
  },
  room: {
    id: "kUjUo2-t-i8",
    raw: "https://images.unsplash.com/photo-1760844893062-d68f86c8c0ff?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTN8fGNhZmUlMjBicmljayUyMHdhcmVob3VzZSUyMGludGVyaW9yfGVufDB8fHx8MTc5MzA5Njg5OHww&ixlib=rb-4.1.0",
    width: 5152,
    height: 7728,
    color: "#260c0c",
    alt: "A coffee bar with grinders against an old brick wall, tall glass doors and a polished concrete floor",
    author: "Jacob Padilla",
    authorUrl: user("jacob17pad"),
    photoUrl: `https://unsplash.com/photos/modern-coffee-shop-interior-with-brick-wall-and-plants-kUjUo2-t-i8?${UTM}`,
    focus: [0.45, 0.4],
  },
  window: {
    id: "2Jm_gRFAIgk",
    raw: "https://images.unsplash.com/photo-1767400018420-dba59d5bd282?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8NHx8Y29mZmVlJTIwc2hvcCUyMHdpbmRvdyUyMHNub3d8ZW58MHx8fHwxNzkzMDk2ODk3fDA&ixlib=rb-4.1.0",
    width: 5609,
    height: 3741,
    color: "#8ca6a6",
    alt: "Someone sitting at a window counter, watching snow fall on a city street outside",
    author: "eldhose kuriyan",
    authorUrl: user("eldhosekuriyan"),
    photoUrl: `https://unsplash.com/photos/person-watches-snow-fall-outside-window-2Jm_gRFAIgk?${UTM}`,
    focus: [0.45, 0.55],
  },
} satisfies Record<string, NorthLoopPhoto>;

/** URL de um tamanho: largura em px e, opcionalmente, proporção (largura/altura) do recorte. */
export function src(photo: NorthLoopPhoto, width: number, ratio?: number): string {
  const params = new URLSearchParams({ q: "72", fm: "jpg", auto: "format", w: String(width) });
  if (photo.rect) params.set("rect", photo.rect.join(","));
  if (ratio) {
    params.set("h", String(Math.round(width / ratio)));
    params.set("fit", "crop");
    if (photo.focus) {
      params.set("crop", "focalpoint");
      params.set("fp-x", String(photo.focus[0]));
      params.set("fp-y", String(photo.focus[1]));
    }
  }
  return `${photo.raw}&${params.toString()}`;
}

const WIDTHS = [480, 720, 960, 1280, 1600, 2000];

export function srcSet(photo: NorthLoopPhoto, ratio?: number, max = 2000): string {
  return WIDTHS.filter((w) => w <= max)
    .map((w) => `${src(photo, w, ratio)} ${w}w`)
    .join(", ");
}
