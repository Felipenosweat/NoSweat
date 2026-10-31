// Fotos da demonstração Sunrise Bakery (Unsplash, hotlink com crédito, como pedem as regras do
// Unsplash). Busca na API em 2026-10-26; texto alternativo escrito à mão. São CENAS: nenhuma
// é apresentada como "o nosso pão" ou "a nossa equipe", e nenhuma mostra a marca de outra loja.
// O `download_location` de cada uma foi para a fila do coordenador (kit/pings-queue.txt).

export type SunrisePhoto = {
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
  /** Ponto de foco do recorte (0–1), para o servidor do Unsplash cortar no lugar certo. */
  focus?: [number, number];
  /** Recorte prévio em pixels da original (x, y, largura, altura), para tirar uma placa. */
  rect?: [number, number, number, number];
};

const UTM = "utm_source=nosweat&utm_medium=referral";
const user = (name: string) => `https://unsplash.com/@${name}?${UTM}`;

export const PHOTOS = {
  window: {
    id: "CghSzqN06V8",
    raw: "https://images.unsplash.com/photo-1729710817471-fb39f3785ac4?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Nnx8YmFrZXJ5JTIwd2luZG93JTIwbW9ybmluZyUyMHN1bmxpZ2h0fGVufDB8fHx8MTc5MzA1MzY1N3ww&ixlib=rb-4.1.0",
    width: 4000,
    height: 6000,
    color: "#3a2414",
    alt: "Morning sun pouring through a kitchen window onto a table of loaves and pastries, flour hanging in the light",
    author: "Nereid Ndreu",
    authorUrl: user("nereiq"),
    photoUrl: `https://unsplash.com/photos/a-kitchen-with-a-window-and-a-table-with-food-on-it-CghSzqN06V8?${UTM}`,
    focus: [0.5, 0.6],
  },
  sill: {
    id: "NPYmhef4kX4",
    raw: "https://images.unsplash.com/photo-1686154596696-d6f594a98af9?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Mnx8c291cmRvdWdoJTIwYnJlYWQlMjBtb3JuaW5nJTIwbGlnaHR8ZW58MHx8fHwxNzkzMDUzNTE0fDA&ixlib=rb-4.1.0",
    width: 6006,
    height: 4004,
    color: "#d98c40",
    alt: "A round sourdough loaf cooling on a sunny windowsill against a warm orange wall",
    author: "Ben Stein",
    authorUrl: user("benostein"),
    photoUrl: `https://unsplash.com/photos/a-loaf-of-bread-sitting-on-top-of-a-counter-NPYmhef4kX4?${UTM}`,
    focus: [0.42, 0.5],
  },
  dough: {
    id: "2HMPWWifKrs",
    raw: "https://images.unsplash.com/photo-1595801105145-795f1927c0fc?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Nnx8ZmxvdXIlMjBkb3VnaCUyMGhhbmRzfGVufDB8fHx8MTc5MzA1MzUxNXww&ixlib=rb-4.1.0",
    width: 5616,
    height: 3744,
    color: "#402626",
    alt: "A ball of dough resting on a floured table while flour drifts through a beam of light",
    author: "Duncan Kidd",
    authorUrl: user("we_the_royal"),
    photoUrl: `https://unsplash.com/photos/persons-hand-on-white-textile-2HMPWWifKrs?${UTM}`,
    focus: [0.6, 0.65],
  },
  croissants: {
    id: "sqkXyyj4WdE",
    raw: "https://images.unsplash.com/photo-1623334044303-241021148842?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MXx8Y3JvaXNzYW50cyUyMGJha2VyeXxlbnwwfHx8fDE3OTMwNTM1MTR8MA&ixlib=rb-4.1.0",
    width: 6000,
    height: 4000,
    color: "#73260c",
    alt: "Rows of glossy, deep-golden croissants on baking paper, seen from above",
    author: "Conor Brown",
    authorUrl: user("commonboxturtle"),
    photoUrl: `https://unsplash.com/photos/a-bunch-of-croissants-that-are-on-a-table-sqkXyyj4WdE?${UTM}`,
  },
  scored: {
    id: "b5v5dKikmRU",
    raw: "https://images.unsplash.com/photo-1585478259844-06d7b756b082?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8NHx8c291cmRvdWdoJTIwYnJlYWQlMjBtb3JuaW5nJTIwbGlnaHR8ZW58MHx8fHwxNzkzMDUzNTE0fDA&ixlib=rb-4.1.0",
    width: 3317,
    height: 4973,
    color: "#c08c59",
    alt: "A floured oval loaf with a wheat-ear pattern scored along one side and a dark, blistered crust",
    author: "Tommaso Urli",
    authorUrl: user("tunnuz"),
    photoUrl: `https://unsplash.com/photos/brown-bread-on-brown-wooden-table-b5v5dKikmRU?${UTM}`,
  },
  cake: {
    id: "mZl9B2eXGlQ",
    raw: "https://images.unsplash.com/photo-1706463996571-7a2d9bb5e5fa?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTJ8fGRlY29yYXRlZCUyMGxheWVyJTIwY2FrZXxlbnwwfHx8fDE3OTMwNTM2MDN8MA&ixlib=rb-4.1.0",
    width: 4000,
    height: 5000,
    color: "#a68c73",
    alt: "A tall butterscotch-coloured cake on a gold stand, ringed with piped red roses and green leaves",
    author: "Yaya The Creator",
    authorUrl: user("uyaiabasi"),
    photoUrl: `https://unsplash.com/photos/a-decorated-cake-on-a-gold-pedestal-on-a-table-mZl9B2eXGlQ?${UTM}`,
    focus: [0.5, 0.55],
  },
  tiered: {
    id: "53nLF9woXE0",
    raw: "https://images.unsplash.com/photo-1559373098-e1caaccae791?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTl8fGRlY29yYXRlZCUyMGxheWVyJTIwY2FrZXxlbnwwfHx8fDE3OTMwNTM2MDN8MA&ixlib=rb-4.1.0",
    width: 4379,
    height: 6568,
    color: "#404026",
    alt: "A three-tier white wedding cake with pink peonies beside two champagne flutes by a window",
    author: "Frank Zhang",
    authorUrl: user("frankzphoto"),
    photoUrl: `https://unsplash.com/photos/three-tier-cake-with-pink-fresh-flowers-on-table-beside-two-champagne-flute-glasses-53nLF9woXE0?${UTM}`,
    focus: [0.45, 0.55],
  },
  market: {
    id: "nUnMwuo8xoQ",
    raw: "https://images.unsplash.com/photo-1787228748996-0f7c545f1fde?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTR8fGZhcm1lcnMlMjBtYXJrZXQlMjBicmVhZCUyMHN0YWxsfGVufDB8fHx8MTc5MzA1MzYwNHww&ixlib=rb-4.1.0",
    width: 1430,
    height: 1072,
    color: "#260c0c",
    alt: "Crusty loaves on straw beside a wicker basket at a market stall, in hard sunlight",
    author: "Rosalie Gdy",
    authorUrl: user("rosaliegdy"),
    photoUrl: `https://unsplash.com/photos/crusty-bread-loaves-on-market-stall-nUnMwuo8xoQ?${UTM}`,
    // Recorte da original (2080×3120): só os pães e o cesto, sem a placa de preço nem os
    // potes com rótulo de outra banca.
    rect: [0, 1165, 1430, 1072],
  },
} satisfies Record<string, SunrisePhoto>;

export type PhotoKey = keyof typeof PHOTOS;

const WIDTHS = [480, 720, 960, 1280, 1600, 2000, 2560];

/** URL do Unsplash com largura (e proporção, se houver recorte). */
export function src(photo: SunrisePhoto, width: number, ratio?: number): string {
  const params = new URLSearchParams({ q: "72", fm: "jpg", auto: "format", w: String(width) });
  if (photo.rect) params.set("rect", photo.rect.join(","));
  params.set("fit", "crop");
  if (ratio) {
    params.set("h", String(Math.round(width / ratio)));
    if (photo.focus) {
      params.set("crop", "focalpoint");
      params.set("fp-x", String(photo.focus[0]));
      params.set("fp-y", String(photo.focus[1]));
    } else params.set("crop", "entropy");
  }
  return `${photo.raw}&${params.toString()}`;
}

export function srcSet(photo: SunrisePhoto, ratio?: number, max = 2560): string {
  return WIDTHS.filter((w) => w <= max)
    .map((w) => `${src(photo, w, ratio)} ${w}w`)
    .join(", ");
}
