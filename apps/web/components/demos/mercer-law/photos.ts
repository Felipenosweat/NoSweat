// Fotos da demonstração Mercer Law (Unsplash, hotlink com crédito, como pedem as regras do
// Unsplash). Busca na API em 2026-10-26; texto alternativo e legendas escritos à mão. São
// CENAS (bairro, cidade, papel, mesa), nunca apresentadas como os advogados ou clientes. As
// duas fotos de Columbus têm o lugar dito pelo próprio autor na descrição da foto.

export type MercerPhoto = {
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
  village: {
    id: "45vi7vjAmfI",
    raw: "https://images.unsplash.com/photo-1635717644991-76d692912140?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8N3x8Y29sdW1idXMlMjBvaGlvfGVufDB8fHx8MTc5MzAzMjk5NXww&ixlib=rb-4.1.0",
    width: 8000,
    height: 6000,
    color: "#262626",
    alt: "Aerial view over German Village in autumn: tree-lined streets of brick houses, a small park with a monument, and the downtown Columbus towers on the horizon",
    author: "Shep McAllister",
    authorUrl: `https://unsplash.com/@shep979?${UTM}`,
    photoUrl: `https://unsplash.com/photos/an-aerial-view-of-a-city-with-lots-of-trees-45vi7vjAmfI?${UTM}`,
  },
  ledger: {
    id: "dVtAgmmgtiQ",
    raw: "https://images.unsplash.com/photo-1621835700685-9399a34c3d80?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8M3x8cGFwZXIlMjBkb2N1bWVudHMlMjBwZW4lMjBkZXNrJTIwd2luZG93JTIwbGlnaHR8ZW58MHx8fHwxNzkzMDMyOTI3fDA&ixlib=rb-4.1.0",
    width: 5137,
    height: 3425,
    color: "#7a4a2a",
    alt: "A handwritten ledger lies open on a worn wooden desk under a window, a pen in its fold and an ink bottle beside it",
    author: "Salomé Guruli",
    authorUrl: `https://unsplash.com/@sguruli?${UTM}`,
    photoUrl: `https://unsplash.com/photos/white-printer-paper-on-brown-wooden-table-dVtAgmmgtiQ?${UTM}`,
  },
  kitchen: {
    id: "qUcXRBthiLg",
    raw: "https://images.unsplash.com/photo-1790866443571-10d2f9d0f835?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8M3x8a2l0Y2hlbiUyMHRhYmxlJTIwbW9ybmluZyUyMGxpZ2h0fGVufDB8fHx8MTc5MzAzMjk2N3ww&ixlib=rb-4.1.0",
    width: 3024,
    height: 3780,
    color: "#a68c73",
    alt: "Low sun falls across a wooden kitchen table with four chairs and a small vase of greenery",
    author: "Christopher Stites",
    authorUrl: `https://unsplash.com/@christopherstites?${UTM}`,
    photoUrl: `https://unsplash.com/photos/kitchen-with-wooden-cabinets-and-table-qUcXRBthiLg?${UTM}`,
  },
  signing: {
    id: "wB9iWZKwljw",
    raw: "https://images.unsplash.com/photo-1627518788331-b3b7fdaa382f?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTN8fHNpZ25pbmclMjBkb2N1bWVudHxlbnwwfHx8fDE3OTMwMzI5Mzl8MA&ixlib=rb-4.1.0",
    width: 2500,
    height: 2000,
    color: "#40260c",
    alt: "A hand signs a typed page on a wooden desk in a band of afternoon light",
    author: "Signature Pro",
    authorUrl: `https://unsplash.com/@signaturepro?${UTM}`,
    photoUrl: `https://unsplash.com/photos/person-writing-on-white-paper-wB9iWZKwljw?${UTM}`,
  },
  skyline: {
    id: "1ttZYIpCLe4",
    raw: "https://images.unsplash.com/photo-1654115480560-67642e776a30?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MXx8Y29sdW1idXMlMjBvaGlvfGVufDB8fHx8MTc5MzAzMjk5NXww&ixlib=rb-4.1.0",
    width: 6000,
    height: 4000,
    color: "#4073c0",
    alt: "The Columbus skyline across the Scioto River from the Main Street Bridge, with a park along the bank",
    author: "Jordan Griffith",
    authorUrl: `https://unsplash.com/@jordanpgriffith?${UTM}`,
    photoUrl: `https://unsplash.com/photos/a-view-of-a-city-with-a-bridge-over-a-river-1ttZYIpCLe4?${UTM}`,
  },
} satisfies Record<string, MercerPhoto>;

/** Endereço da foto na largura pedida (o Unsplash redimensiona; `crop` recorta pela proporção). */
export function src(photo: MercerPhoto, width: number, ratio?: number, focus = "entropy"): string {
  const size = ratio
    ? `&w=${width}&h=${Math.round(width / ratio)}&fit=crop&crop=${focus}`
    : `&w=${width}&fit=max`;
  return `${photo.raw}&q=72&fm=jpg&auto=format${size}`;
}

/** srcset com larguras fixas (o navegador escolhe pela tela). */
export function srcSet(
  photo: MercerPhoto,
  ratio?: number,
  focus?: string,
  widths = [480, 768, 1080, 1440, 2048],
): string {
  return widths.map((w) => `${src(photo, w, ratio, focus)} ${w}w`).join(", ");
}
