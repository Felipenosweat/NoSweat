// Fotos documentais da landing "On the job" (Unsplash, hotlink em images.unsplash.com como pedem
// as regras do Unsplash). São ilustrativas: o texto alternativo descreve a cena e NUNCA diz que a
// pessoa é cliente da No Sweat. Todas aparecem com crédito no rodapé (PhotoCredits em Footer.tsx).
// `focus` = object-position por tamanho de tela, escolhido olhando cada foto para nunca cortar
// o rosto (celular 4:5, tablet e computador têm recortes diferentes).

export type PhotoKey =
  | "carpenter"
  | "cook"
  | "barber"
  | "baker"
  | "electrician"
  | "lawn"
  | "stylist"
  | "shopOwner"
  | "handyman";

export type LandingPhoto = {
  /** id da foto no Unsplash. */
  id: string;
  /** URL crua (sem parâmetros); o loader de UnsplashImage acrescenta largura e formato. */
  src: string;
  width: number;
  height: number;
  alt: string;
  /** object-position por faixa de largura (base = celular). */
  focus: { base: string; md?: string; lg?: string };
  photographer: string;
  /** Perfil do fotógrafo no Unsplash. */
  profile: string;
  /** Página da foto no Unsplash. */
  page: string;
};

export const PHOTOS: Record<PhotoKey, LandingPhoto> = {
  carpenter: {
    id: "K-f_gTvdwTM",
    src: "https://images.unsplash.com/photo-1687422811062-a966b55cb217",
    width: 7360,
    height: 4912,
    alt: "A carpenter in a dusty T-shirt laughs at his phone in a workshop stacked with lumber, one fist raised.",
    focus: { base: "46% 50%", md: "50% 34%", lg: "46% 50%" },
    photographer: "Ali Mkumbwa",
    profile: "https://unsplash.com/@mkumbwajr",
    page: "https://unsplash.com/photos/a-man-smiles-while-looking-at-his-cell-phone-K-f_gTvdwTM",
  },
  cook: {
    id: "uk3ey_vhDKA",
    src: "https://images.unsplash.com/photo-1687422808248-f807f4ea2a2e",
    width: 5760,
    height: 3840,
    alt: "A cook in a blue apron smiles at his phone at the counter of his food stand.",
    focus: { base: "54% 40%", lg: "54% 40%" },
    photographer: "Ali Mkumbwa",
    profile: "https://unsplash.com/@mkumbwajr",
    page: "https://unsplash.com/photos/a-man-in-an-apron-looking-at-a-cell-phone-uk3ey_vhDKA",
  },
  barber: {
    id: "J99pG-3RHwc",
    src: "https://images.unsplash.com/photo-1593702295094-aea22597af65",
    width: 5184,
    height: 3456,
    alt: "A barber in a white shirt and flat cap trims a client’s hair in a brick-walled shop.",
    focus: { base: "66% 40%" },
    photographer: "Michael DeMoya",
    profile: "https://unsplash.com/@demoya",
    page: "https://unsplash.com/photos/man-in-white-dress-shirt-cutting-hair-of-man-J99pG-3RHwc",
  },
  baker: {
    id: "CceG6jpl19M",
    src: "https://images.unsplash.com/photo-1560427183-4efd29c38997",
    width: 6000,
    height: 4000,
    alt: "A baker in a flat cap slides a loaf into a brick oven, with rows of fresh bread in front of him.",
    focus: { base: "62% 30%", md: "70% 30%", lg: "70% 28%" },
    photographer: "DDP",
    profile: "https://unsplash.com/@moino007",
    page: "https://unsplash.com/photos/man-wearing-white-polo-shirt-CceG6jpl19M",
  },
  electrician: {
    id: "GXLPLG3_Vf4",
    src: "https://images.unsplash.com/photo-1660330589693-99889d60181e",
    width: 5600,
    height: 3150,
    alt: "An electrician in a neon yellow shirt works on an open electrical panel with a screwdriver.",
    focus: { base: "72% 40%" },
    photographer: "Raze Solar",
    profile: "https://unsplash.com/@razesolar",
    page: "https://unsplash.com/photos/electrician-working-on-electrical-panel-GXLPLG3_Vf4",
  },
  lawn: {
    id: "bsld7GjQwjI",
    src: "https://images.unsplash.com/photo-1734303023491-db8037a21f09",
    width: 4000,
    height: 1868,
    alt: "Two workers mow and edge a striped green lawn along a row of shrubs.",
    focus: { base: "40% 60%" },
    photographer: "Michael Smith",
    profile: "https://unsplash.com/@cutabovelandscapingnc",
    page: "https://unsplash.com/photos/a-man-mowing-a-lawn-with-a-lawn-mower-bsld7GjQwjI",
  },
  stylist: {
    id: "WXmHwPcFamo",
    src: "https://images.unsplash.com/photo-1562322140-8baeececf3df",
    width: 6016,
    height: 4016,
    alt: "A hair stylist smiles while blow-drying a client’s hair in a bright salon.",
    focus: { base: "86% 40%" },
    photographer: "Adam Winger",
    profile: "https://unsplash.com/@awcreativeut",
    page: "https://unsplash.com/photos/woman-holding-hair-dryer-WXmHwPcFamo",
  },
  shopOwner: {
    id: "EOkN2pRjFsg",
    src: "https://images.unsplash.com/photo-1687422808311-a776f467a468",
    width: 5760,
    height: 3840,
    alt: "A shopkeeper sits at the counter of her small store, shelves full of goods behind her.",
    focus: { base: "44% 50%" },
    photographer: "Ali Mkumbwa",
    profile: "https://unsplash.com/@mkumbwajr",
    page: "https://unsplash.com/photos/a-woman-sitting-at-a-counter-in-a-store-EOkN2pRjFsg",
  },
  handyman: {
    id: "UovTD1dG-lA",
    src: "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0",
    width: 6000,
    height: 4000,
    alt: "A handyman in a cap and work vest drives a screw into a wall with a power drill.",
    focus: { base: "90% 45%" },
    photographer: "Jimmy Nilsson Masth",
    profile: "https://unsplash.com/@jimmynilssonmasth",
    page: "https://unsplash.com/photos/a-man-with-a-driller-and-a-hat-on-UovTD1dG-lA",
  },
};

/** Fotógrafos sem repetir, na ordem em que as fotos aparecem (linha de créditos do rodapé). */
export function photoCredits(): { name: string; profile: string }[] {
  const seen = new Map<string, string>();
  for (const photo of Object.values(PHOTOS)) {
    if (!seen.has(photo.photographer)) seen.set(photo.photographer, photo.profile);
  }
  return [...seen].map(([name, profile]) => ({ name, profile }));
}

/** Link com os parâmetros de atribuição que o Unsplash pede (utm_source/utm_medium). */
export function unsplashLink(url: string): string {
  return `${url}?utm_source=nosweat&utm_medium=referral`;
}
