// Fotos da demonstração Fade & Co. Barbers (Unsplash, hotlink com crédito, como pedem as regras
// do Unsplash). Busca na API em 2026-10-26; texto alternativo escrito à mão. São CENAS de
// barbearia, nunca apresentadas como os barbeiros da casa (Darnell, Tony e Kev são do texto do
// dono, sem foto). Todas passam pelo mesmo tratamento em duas cores, feito pelo próprio CDN do
// Unsplash (parâmetro `duotone` do imgix): sombra vinho-escuro e luz cor de osso. Assim as seis
// fotos de autores diferentes parecem uma série só, sem filtro no navegador.

export type FadePhoto = {
  id: string;
  /** URL base (raw) do Unsplash; tamanho e tratamento entram por parâmetro (ver `src`). */
  raw: string;
  width: number;
  height: number;
  /** Cor de fundo enquanto a foto carrega (já no tom do duotone). */
  color: string;
  alt: string;
  author: string;
  authorUrl: string;
  photoUrl: string;
};

const UTM = "utm_source=nosweat&utm_medium=referral";

/** Sombra e luz do duotone (sem #), as mesmas de --f-oxblood e --f-bone no CSS. */
export const DUOTONE = "4a0b0f,f1e8d9";

export const PHOTOS = {
  clipper: {
    id: "-sRVfY0f2d8",
    raw: "https://images.unsplash.com/photo-1567894340315-735d7c361db0?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8NXx8YmFyYmVyJTIwaGFpcmN1dCUyMGZhZGV8ZW58MHx8fHwxNzkzMDMyNTkxfDA&ixlib=rb-4.1.0",
    width: 3044,
    height: 4048,
    color: "#5a2a2a",
    alt: "A barber in black gloves shapes a client's curls with clippers",
    author: "Obi",
    authorUrl: `https://unsplash.com/@obionyeador?${UTM}`,
    photoUrl: `https://unsplash.com/photos/man-cutting-hair-man--sRVfY0f2d8?${UTM}`,
  },
  towel: {
    id: "1Ig9rw7aC5g",
    raw: "https://images.unsplash.com/photo-1761148438883-e34e0289a214?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MjJ8fHN0cmFpZ2h0JTIwcmF6b3IlMjBzaGF2ZXxlbnwwfHx8fDE3OTMwMzI1OTF8MA&ixlib=rb-4.1.0",
    width: 6016,
    height: 4000,
    color: "#7a4a48",
    alt: "Steam rises as a barber works a straight razor along a reclined client's beard",
    author: "Antonio Reynoso",
    authorUrl: `https://unsplash.com/@infantleon?${UTM}`,
    photoUrl: `https://unsplash.com/photos/barber-shaves-mans-beard-with-straight-razor-1Ig9rw7aC5g?${UTM}`,
  },
  shears: {
    id: "DrG4V5skbMY",
    raw: "https://images.unsplash.com/photo-1657105052497-f996284ffff8?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8M3x8YmFyYmVyJTIwaGFpcmN1dCUyMGZhZGV8ZW58MHx8fHwxNzkzMDMyNTkxfDA&ixlib=rb-4.1.0",
    width: 4480,
    height: 6720,
    color: "#4a1a1c",
    alt: "Close view of a comb lifting hair above the ear while thinning shears trim it",
    author: "Gulom Nazarov",
    authorUrl: `https://unsplash.com/@modelyano?${UTM}`,
    photoUrl: `https://unsplash.com/photos/barber-trimming-hair-with-thinning-shears-DrG4V5skbMY?${UTM}`,
  },
  razor: {
    id: "FvKpUZCbZ-s",
    raw: "https://images.unsplash.com/photo-1524230616393-d6229fcd2eff?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTF8fHN0cmFpZ2h0JTIwcmF6b3IlMjBzaGF2ZXxlbnwwfHx8fDE3OTMwMzI1OTF8MA&ixlib=rb-4.1.0",
    width: 5184,
    height: 3456,
    color: "#d9cbbd",
    alt: "A folding straight razor laid over a shaving brush and a ceramic mug",
    author: "Josh Sorenson",
    authorUrl: `https://unsplash.com/@joshsorenson?${UTM}`,
    photoUrl: `https://unsplash.com/photos/black-straight-razor-beside-beige-ceramic-mug-and-shaving-cream-brush-FvKpUZCbZ-s?${UTM}`,
  },
  beard: {
    id: "fE42nRlBcG8",
    raw: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8M3x8c3RyYWlnaHQlMjByYXpvciUyMHNoYXZlfGVufDB8fHx8MTc5MzAzMjU5MXww&ixlib=rb-4.1.0",
    width: 2848,
    height: 4288,
    color: "#4a1a1c",
    alt: "Scissors trim the edge of a full beard under a striped cape",
    author: "Nathon Oski",
    authorUrl: `https://unsplash.com/@onatecan?${UTM}`,
    photoUrl: `https://unsplash.com/photos/grayscale-photography-of-person-holding-scissor-clipping-mans-beard-fE42nRlBcG8?${UTM}`,
  },
  neck: {
    id: "vI3m5UnZ0aQ",
    raw: "https://images.unsplash.com/photo-1514336937476-a5b961020a5c?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Mjd8fGJhcmJlciUyMGhhaXJjdXQlMjBmYWRlfGVufDB8fHx8MTc5MzAzMjU5MXww&ixlib=rb-4.1.0",
    width: 5184,
    height: 3456,
    color: "#4a1a1c",
    alt: "A straight razor cleans up the neckline under a fresh short cut",
    author: "Chris Knight",
    authorUrl: `https://unsplash.com/@chrisknight?${UTM}`,
    photoUrl: `https://unsplash.com/photos/person-trimming-mans-hair-vI3m5UnZ0aQ?${UTM}`,
  },
} satisfies Record<string, FadePhoto>;

/** Endereço da foto na largura pedida, já em duotone (`ratio` recorta pela proporção). */
export function src(photo: FadePhoto, width: number, ratio?: number): string {
  const size = ratio
    ? `&w=${width}&h=${Math.round(width / ratio)}&fit=crop&crop=entropy`
    : `&w=${width}&fit=max`;
  return `${photo.raw}&q=72&fm=jpg&auto=format&duotone=${DUOTONE}${size}`;
}

/** srcset com larguras fixas (o navegador escolhe pela tela e pela densidade). */
export function srcSet(photo: FadePhoto, ratio?: number, widths = [480, 800, 1200, 1600, 2200]) {
  return widths.map((w) => `${src(photo, w, ratio)} ${w}w`).join(", ");
}
