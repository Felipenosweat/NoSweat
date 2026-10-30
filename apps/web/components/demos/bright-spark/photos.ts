// Fotos da demo Bright Spark Electric (Unsplash, hotlink com crédito, como pedem as regras do
// Unsplash). Escolhidas na API do Unsplash em 2026-10-27; texto alternativo escrito à mão.
// São CENAS, nunca "nossa equipe" nem "nosso trabalho": as legendas dizem "Example scene". Uma
// foto de painel com adesivos de energia solar foi descartada (a fixture não fala de solar).

export type SparkPhoto = {
  id: string;
  raw: string;
  width: number;
  height: number;
  color: string;
  alt: string;
  caption: string;
  author: string;
  authorUrl: string;
  photoUrl: string;
};

const UTM = "utm_source=nosweat&utm_medium=referral";

export const PHOTOS = {
  trouble: {
    id: "_2AlIm-F6pw",
    raw: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Mnx8ZWxlY3RyaWNpYW4lMjB3b3JraW5nfGVufDB8fHx8MTc5MzA5Njk0M3ww&ixlib=rb-4.1.0",
    width: 4000,
    height: 2670,
    color: "#595959",
    alt: "An electrician in a yellow hard hat and work gloves testing a box on a grey wall",
    caption: "Testing a box on an outside wall",
    author: "Emmanuel Ikwuegbu",
    authorUrl: `https://unsplash.com/@emmages?${UTM}`,
    photoUrl: `https://unsplash.com/photos/electrician-installing-wiring-with-yellow-hardhat-_2AlIm-F6pw?${UTM}`,
  },
  ev: {
    id: "EKCoj22EC4U",
    raw: "https://images.unsplash.com/photo-1600490819734-6311c5c6f517?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Nnx8ZXYlMjBjaGFyZ2VyJTIwZ2FyYWdlfGVufDB8fHx8MTc5MzA5Njk0NHww&ixlib=rb-4.1.0",
    width: 6024,
    height: 4024,
    color: "#c0a68c",
    alt: "A grey wall-mounted EV charger with its cable plugged in, on a pale block wall",
    caption: "A Level 2 wall charger",
    author: "Evnex Ltd",
    authorUrl: `https://unsplash.com/@evnex?${UTM}`,
    photoUrl: `https://unsplash.com/photos/black-charger-plugged-in-on-socket-EKCoj22EC4U?${UTM}`,
  },
  lighting: {
    id: "kD6WyYQ9dj8",
    raw: "https://images.unsplash.com/photo-1733431773954-6f1b427f8850?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTV8fHJlY2Vzc2VkJTIwbGlnaHRpbmclMjBjZWlsaW5nJTIwZmFuJTIwbGl2aW5nJTIwcm9vbXxlbnwwfHx8fDE3OTMwOTY5NTR8MA&ixlib=rb-4.1.0",
    width: 7925,
    height: 5286,
    color: "#d9c08c",
    alt: "A living room with a white five-blade ceiling fan, a grey sectional and an arched window",
    caption: "A ceiling fan with a light kit",
    author: "Brian Wangenheim",
    authorUrl: `https://unsplash.com/@brianwangenheim?${UTM}`,
    photoUrl: `https://unsplash.com/photos/a-living-room-filled-with-furniture-and-a-ceiling-fan-kD6WyYQ9dj8?${UTM}`,
  },
  panel: {
    id: "loSTMy7gSKU",
    raw: "https://images.unsplash.com/photo-1622059796766-f2b1f9d2d119?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Mnx8cGhvZW5peCUyMGFyaXpvbmElMjBob3VzZXxlbnwwfHx8fDE3OTMwOTY5NTV8MA&ixlib=rb-4.1.0",
    width: 3672,
    height: 4896,
    color: "#a6c0d9",
    alt: "A pink stucco ranch house with a tile roof, two fan palms and a saguaro in a gravel yard",
    caption: "A stucco ranch house at dusk",
    author: "Natalie Brennan",
    authorUrl: `https://unsplash.com/@natalie_brennan?${UTM}`,
    photoUrl: `https://unsplash.com/photos/green-palm-tree-near-brown-wooden-house-during-daytime-loSTMy7gSKU?${UTM}`,
  },
  rewire: {
    id: "djqSXWnCpq8",
    raw: "https://images.unsplash.com/photo-1785183086929-61e343715643?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTZ8fHBob2VuaXglMjBhcml6b25hJTIwaG91c2V8ZW58MHx8fHwxNzkzMDk2OTU1fDA&ixlib=rb-4.1.0",
    width: 3840,
    height: 2160,
    color: "#40a6d9",
    alt: "Rows of tile-roofed houses and trees stretching to distant mountains under a clear sky",
    caption: "Rooftops from above",
    author: "Yashas Tayal",
    authorUrl: `https://unsplash.com/@ytayal234?${UTM}`,
    photoUrl: `https://unsplash.com/photos/sprawling-suburban-neighborhood-under-a-clear-blue-sky-djqSXWnCpq8?${UTM}`,
  },
} satisfies Record<string, SparkPhoto>;

export type PhotoKey = keyof typeof PHOTOS;

export function src(photo: SparkPhoto, width: number, ratio?: number): string {
  const size = ratio
    ? `&w=${width}&h=${Math.round(width / ratio)}&fit=crop&crop=entropy`
    : `&w=${width}&fit=max`;
  return `${photo.raw}&q=72&fm=jpg&auto=format${size}`;
}

export function srcSet(photo: SparkPhoto, ratio?: number, widths = [480, 720, 960, 1440]): string {
  return widths.map((w) => `${src(photo, w, ratio)} ${w}w`).join(", ");
}
