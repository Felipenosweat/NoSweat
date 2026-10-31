// Fotos da demonstração Iron Lotus (Unsplash, hotlink com crédito, como pedem as regras do
// Unsplash). Escolhidas na API do Unsplash em 2026-10-26; o texto alternativo foi escrito à mão.
// São CENAS de estúdio, não o trabalho de Mara, Theo ou Lena: as legendas dizem "example image".
// Nenhuma mostra rosto reconhecível. Na página elas aparecem em preto e branco (fotocópia
// presa no papel) e ganham cor ao passar o mouse ou focar.

export type IronPhoto = {
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
  blackwork: {
    id: "5t4qCgtaLGU",
    raw: "https://images.unsplash.com/photo-1597852075234-fd721ac361d3?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Mnx8dGF0dG9vJTIwc3R1ZGlvfGVufDB8MHx8fDE3OTMwNTQwMzd8MA&ixlib=rb-4.1.0",
    width: 6720,
    height: 4480,
    color: "#262626",
    alt: "Two gloved hands run a blue tattoo machine along bold black linework on a forearm",
    caption: "Linework in progress",
    author: "benjamin lehman",
    authorUrl: `https://unsplash.com/@abject?${UTM}`,
    photoUrl: `https://unsplash.com/photos/person-with-tattoo-on-right-arm-5t4qCgtaLGU?${UTM}`,
  },
  script: {
    id: "xStc4iOKOLA",
    raw: "https://images.unsplash.com/photo-1617328332024-e5a942ff38bc?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTl8fHRhdHRvbyUyMGZsYXNoJTIwZHJhd2luZ3xlbnwwfHx8fDE3OTMwNTQwNzd8MA&ixlib=rb-4.1.0",
    width: 6000,
    height: 4000,
    color: "#735959",
    alt: "A pen resting on a pencil sketch of script lettering and small stars",
    caption: "Script lettering, sketched",
    author: "Matt Bero",
    authorUrl: `https://unsplash.com/@mbeero?${UTM}`,
    photoUrl: `https://unsplash.com/photos/black-and-silver-click-pen-on-white-paper-xStc4iOKOLA?${UTM}`,
  },
  color: {
    id: "cGj6ZbB3wcc",
    raw: "https://images.unsplash.com/photo-1590281527363-ea3e251271ee?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Nnx8dGF0dG9vJTIwZmxhc2glMjBkcmF3aW5nfGVufDB8fHx8MTc5MzA1NDA3N3ww&ixlib=rb-4.1.0",
    width: 6000,
    height: 4000,
    color: "#a6a68c",
    alt: "A ringed hand holding fine brushes over colored designs on paper",
    caption: "Color work on paper",
    author: "Guillermo Vuljevas",
    authorUrl: `https://unsplash.com/@vuljevas?${UTM}`,
    photoUrl: `https://unsplash.com/photos/person-wearing-gold-ring-holding-black-pen-cGj6ZbB3wcc?${UTM}`,
  },
  drawing: {
    id: "3peR38cnx9U",
    raw: "https://images.unsplash.com/photo-1537209383625-19584677a4d3?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MXx8dGF0dG9vJTIwZmxhc2glMjBkcmF3aW5nfGVufDB8fHx8MTc5MzA1NDA3N3ww&ixlib=rb-4.1.0",
    width: 6016,
    height: 4016,
    color: "#c0c0c0",
    alt: "A tattooed arm inks a large black and white drawing at a worktable",
    caption: "A drawing session",
    author: "Jordan Whitt",
    authorUrl: `https://unsplash.com/@jwwhitt?${UTM}`,
    photoUrl: `https://unsplash.com/photos/tattooed-person-painting-on-paper-3peR38cnx9U?${UTM}`,
  },
  stencil: {
    id: "idwVAx2ohf8",
    raw: "https://images.unsplash.com/photo-1753260814170-9f77d48c016e?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTJ8fHRhdHRvbyUyMGZsYXNoJTIwZHJhd2luZ3xlbnwwfHx8fDE3OTMwNTQwNzd8MA&ixlib=rb-4.1.0",
    width: 4000,
    height: 6000,
    color: "#8ca6a6",
    alt: "Scissors cutting one small design out of a printed sheet of flash",
    caption: "Cutting a stencil from a flash sheet",
    author: "Certified Tattoo Academy",
    authorUrl: `https://unsplash.com/@certifiedtattooacademy?${UTM}`,
    photoUrl: `https://unsplash.com/photos/someone-is-cutting-out-a-small-tattoo-stencil-idwVAx2ohf8?${UTM}`,
  },
  denver: {
    id: "r6BdUpN_iSk",
    raw: "https://images.unsplash.com/photo-1573297627466-6bed413a43f1?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MXx8UmlObyUyMERlbnZlcnxlbnwwfHx8fDE3OTMwNTQwOTZ8MA&ixlib=rb-4.1.0",
    width: 3913,
    height: 2201,
    color: "#0c2659",
    alt: "A painted wall in Denver with the word DENVER in big block letters",
    caption: "A mural in Denver",
    author: "Pieter van de Sande",
    authorUrl: `https://unsplash.com/@planner1963?${UTM}`,
    photoUrl: `https://unsplash.com/photos/denver-street-artowrk-r6BdUpN_iSk?${UTM}`,
  },
} satisfies Record<string, IronPhoto>;

export type PhotoKey = keyof typeof PHOTOS;

/** Endereço da foto na largura pedida (o Unsplash corta pela proporção quando há `ratio`). */
export function src(photo: IronPhoto, width: number, ratio?: number): string {
  const size = ratio
    ? `&w=${width}&h=${Math.round(width / ratio)}&fit=crop&crop=entropy`
    : `&w=${width}&fit=max`;
  return `${photo.raw}&q=72&fm=jpg&auto=format${size}`;
}

export function srcSet(photo: IronPhoto, ratio?: number, widths = [400, 640, 960, 1280]): string {
  return widths.map((w) => `${src(photo, w, ratio)} ${w}w`).join(", ");
}
