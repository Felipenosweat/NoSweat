// Fotos da demonstração Hollis Interiors (Unsplash, hotlink com crédito, como pedem as regras do
// Unsplash). Busca na API do Unsplash em 2026-10-27; texto alternativo escrito à mão. São cômodos
// de EXEMPLO (fotos de banco): a página nunca os apresenta como projetos da Hollis. Seis das dez
// vêm da mesma série de Clay Banks (mesma luz de dia, paredes brancas, nogueira e couro), para a
// página ter uma luz só.

export type HollisPhoto = {
  id: string;
  /** URL base (raw) do Unsplash; o tamanho entra por parâmetro (ver `src`). */
  raw: string;
  width: number;
  height: number;
  color: string;
  alt: string;
  author: string;
  authorUrl: string;
  photoUrl: string;
};

const UTM = "utm_source=nosweat&utm_medium=referral";

export const PHOTOS = {
  doorway: {
    id: "9MbWyxGzvD0",
    raw: "https://images.unsplash.com/photo-1784318519037-7ee0b1668e95?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Nnx8Y2FsbSUyMGJlZHJvb20lMjBsaW5lbiUyMG5ldXRyYWx8ZW58MHx8fHwxNzkzMDk2NDUxfDA&ixlib=rb-4.1.0",
    width: 3400,
    height: 2267,
    color: "#6d5339",
    alt: "A bedroom seen through an open doorway: a low walnut bed with sand-coloured linen and striped cushions against a wood-panelled wall",
    author: "Clay Banks",
    authorUrl: `https://unsplash.com/@claybanks?${UTM}`,
    photoUrl: `https://unsplash.com/photos/modern-bedroom-with-bed-pillows-and-warm-brown-wall-9MbWyxGzvD0?${UTM}`,
  },
  living: {
    id: "CCQi3pV95k0",
    raw: "https://images.unsplash.com/photo-1762544968153-b9b47435fefd?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8NXx8bWluaW1hbCUyMGxpdmluZyUyMHJvb20lMjBuYXR1cmFsJTIwbGlnaHR8ZW58MHx8fHwxNzkzMDk2MzM5fDA&ixlib=rb-4.1.0",
    width: 3400,
    height: 2267,
    color: "#c5baab",
    alt: "A white living room with four tan leather lounge chairs around a low walnut table on a dark rug, a wood stove by a tall window",
    author: "Clay Banks",
    authorUrl: `https://unsplash.com/@claybanks?${UTM}`,
    photoUrl: `https://unsplash.com/photos/modern-living-room-with-tan-leather-chairs-and-fireplace-CCQi3pV95k0?${UTM}`,
  },
  kitchen: {
    id: "TDXF1KUyyTk",
    raw: "https://images.unsplash.com/photo-1788217158679-5f7a52049ecc?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MzB8fHdhcm0lMjBtaW5pbWFsJTIwa2l0Y2hlbiUyMG9ha3xlbnwwfHx8fDE3OTMwOTYzODl8MA&ixlib=rb-4.1.0",
    width: 3400,
    height: 2267,
    color: "#a18a71",
    alt: "A kitchen wall of walnut cabinetry behind a white island with four wooden stools, under a brass pendant light",
    author: "Clay Banks",
    authorUrl: `https://unsplash.com/@claybanks?${UTM}`,
    photoUrl: `https://unsplash.com/photos/modern-kitchen-with-walnut-cabinetry-TDXF1KUyyTk?${UTM}`,
  },
  bath: {
    id: "HCiafGVJlL0",
    raw: "https://images.unsplash.com/photo-1617596220547-e8bc4b244e94?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8M3x8bWluaW1hbCUyMGJhdGhyb29tJTIwc3RvbmUlMjBuYXR1cmFsJTIwbGlnaHR8ZW58MHx8fHwxNzkzMDk2NDIwfDA&ixlib=rb-4.1.0",
    width: 4880,
    height: 3253,
    color: "#c9c6b6",
    alt: "A long stone basin under a wide window set in a warm plaster wall, with green hills outside",
    author: "Deconovo",
    authorUrl: `https://unsplash.com/@deconovo?${UTM}`,
    photoUrl: `https://unsplash.com/photos/white-framed-glass-window-closed-HCiafGVJlL0?${UTM}`,
  },
  bedroom: {
    id: "E-z8iE6LSgg",
    raw: "https://images.unsplash.com/photo-1779903726446-6f796d533d47?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8OHx8Y2FsbSUyMGJlZHJvb20lMjBsaW5lbiUyMG5ldXRyYWx8ZW58MHx8fHwxNzkzMDk2NDUxfDA&ixlib=rb-4.1.0",
    width: 4584,
    height: 6762,
    color: "#c7beb2",
    alt: "A bed with a cream upholstered headboard beside a floating white nightstand and a small brass wall light",
    author: "Caroline Badran",
    authorUrl: `https://unsplash.com/@___atmos?${UTM}`,
    photoUrl: `https://unsplash.com/photos/modern-bedroom-with-beige-bed-and-floating-white-nightstand-E-z8iE6LSgg?${UTM}`,
  },
  study: {
    id: "Mb-lGau6K5U",
    raw: "https://images.unsplash.com/photo-1777896193454-8b4863264f0b?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTF8fHF1aWV0JTIwaG9tZSUyMHN0dWR5JTIwZGVzayUyMHdpbmRvdyUyMHdvb2R8ZW58MHx8fHwxNzkzMDk2NTEwfDA&ixlib=rb-4.1.0",
    width: 3386,
    height: 2257,
    color: "#c5b8a2",
    alt: "A bright study with a row of windows, a long desk with two chairs and white drawers, and bookshelves along one wall",
    author: "Clay Banks",
    authorUrl: `https://unsplash.com/@claybanks?${UTM}`,
    photoUrl: `https://unsplash.com/photos/bright-room-with-bookshelves-and-two-desks-by-windows-Mb-lGau6K5U?${UTM}`,
  },
  dining: {
    id: "NCEDlg536CM",
    raw: "https://images.unsplash.com/photo-1762545352529-1e624dad0548?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8M3x8d2FybSUyMG1pbmltYWwlMjBraXRjaGVuJTIwb2FrfGVufDB8fHx8MTc5MzA5NjM4OXww&ixlib=rb-4.1.0",
    width: 3327,
    height: 2218,
    color: "#a6a68c",
    alt: "An open kitchen and dining room with an oval wooden table, dark chairs and a polished concrete floor",
    author: "Clay Banks",
    authorUrl: `https://unsplash.com/@claybanks?${UTM}`,
    photoUrl: `https://unsplash.com/photos/modern-kitchen-and-dining-area-with-wooden-table-NCEDlg536CM?${UTM}`,
  },
  swatches: {
    id: "pdCTX1harH4",
    raw: "https://images.unsplash.com/photo-1667400104764-a5fd01a919b0?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8OXx8aW50ZXJpb3IlMjBkZXNpZ24lMjBtYXRlcmlhbCUyMHNhbXBsZXMlMjBzd2F0Y2hlc3xlbnwwfHx8fDE3OTMwOTY1NDN8MA&ixlib=rb-4.1.0",
    width: 4480,
    height: 6720,
    color: "#d9d9d9",
    alt: "A hand holding a fan of paint colour cards over a set of floor-plan drawings",
    author: "Karolina Grabowska",
    authorUrl: `https://unsplash.com/@kaboompics?${UTM}`,
    photoUrl: `https://unsplash.com/photos/hand-holding-color-swatches-over-blueprints-and-open-book-pdCTX1harH4?${UTM}`,
  },
  linen: {
    id: "lciOncHqNIw",
    raw: "https://images.unsplash.com/photo-1764867256379-3877b9cb5832?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTZ8fGNhbG0lMjBiZWRyb29tJTIwbGluZW4lMjBuZXV0cmFsfGVufDB8fHx8MTc5MzA5NjQ1MXww&ixlib=rb-4.1.0",
    width: 4608,
    height: 3456,
    color: "#8c7373",
    alt: "Linen draped over the back of a chair in soft, dappled afternoon light",
    author: "Efe Kekikciler",
    authorUrl: `https://unsplash.com/@mutanzom?${UTM}`,
    photoUrl: `https://unsplash.com/photos/soft-fabric-draped-with-dappled-light-patterns-lciOncHqNIw?${UTM}`,
  },
  plinth: {
    id: "DwNou1lR25w",
    raw: "https://images.unsplash.com/photo-1717416697965-181d1ed75888?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MjZ8fG1pbmltYWwlMjBiYXRocm9vbSUyMHN0b25lJTIwbmF0dXJhbCUyMGxpZ2h0fGVufDB8fHx8MTc5MzA5NjQyMHww&ixlib=rb-4.1.0",
    width: 3145,
    height: 4718,
    color: "#d9d9d9",
    alt: "A travertine plinth holding a small bowl and a woven sculpture against a white wall",
    author: "José Ángel Ríos",
    authorUrl: `https://unsplash.com/@joseangelriosr?${UTM}`,
    photoUrl: `https://unsplash.com/photos/a-chair-and-a-table-in-a-room-DwNou1lR25w?${UTM}`,
  },
} satisfies Record<string, HollisPhoto>;

export type PhotoKey = keyof typeof PHOTOS;

/** Endereço da foto na largura pedida (o Unsplash redimensiona; `crop` recorta pela proporção). */
export function src(photo: HollisPhoto, width: number, ratio?: number): string {
  const size = ratio
    ? `&w=${width}&h=${Math.round(width / ratio)}&fit=crop&crop=entropy`
    : `&w=${width}&fit=max`;
  return `${photo.raw}&q=72&fm=jpg&auto=format${size}`;
}

/** srcset com larguras fixas (o navegador escolhe pela tela). */
export function srcSet(
  photo: HollisPhoto,
  ratio?: number,
  widths = [480, 768, 1080, 1440, 1920],
): string {
  return widths.map((w) => `${src(photo, w, ratio)} ${w}w`).join(", ");
}
