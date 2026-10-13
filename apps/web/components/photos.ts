// Fotos documentais do site da No Sweat (landing, login, painel vazio).
// São ilustrativas: NUNCA apresentar como clientes, depoimentos ou "trabalho de" alguém.
// Cada foto tem licença permissiva e crédito (ver /credits). Arquivos em public/photos/.

export type PhotoKey =
  | "cleaner"
  | "crew"
  | "plumber"
  | "stylist"
  | "cook"
  | "shopOwner"
  | "landscaper"
  | "storefront";

export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Ponto de foco para object-position (ex.: "50% 30%"). */
  focus: string;
  credit: { name: string; source: string; url: string; license: string };
};

/** Preenchido pela sessão principal com fotos verificadas. Chave ausente = sem foto (o layout se adapta). */
export const PHOTOS: Partial<Record<PhotoKey, Photo>> = {
  cleaner: {
    src: "/photos/cleaner.webp",
    alt: "A cleaner organizing a kitchen cabinet",
    width: 2400,
    height: 1601,
    focus: "60% 40%",
    credit: {
      name: "American Cleaning Institute",
      source: "Unsplash",
      url: "https://unsplash.com/photos/j4rDt1pF6ug",
      license: "Unsplash License",
    },
  },
  crew: {
    src: "/photos/crew.webp",
    alt: "A cleaning crew mopping and wiping a bright kitchen",
    width: 2400,
    height: 1600,
    focus: "50% 45%",
    credit: {
      name: "Tima Miroshnichenko",
      source: "Pexels",
      url: "https://www.pexels.com/photo/6197108/",
      license: "Pexels License",
    },
  },
  plumber: {
    src: "/photos/plumber.webp",
    alt: "A plumber fixing pipes under a sink",
    width: 2400,
    height: 1800,
    focus: "65% 50%",
    credit: {
      name: "Timur Shakerzianov",
      source: "Unsplash",
      url: "https://unsplash.com/photos/c314Gh8dXAo",
      license: "Unsplash License",
    },
  },
  stylist: {
    src: "/photos/stylist.webp",
    alt: "A stylist blow-drying a client’s hair",
    width: 2400,
    height: 1602,
    focus: "45% 40%",
    credit: {
      name: "Adam Winger",
      source: "Unsplash",
      url: "https://unsplash.com/photos/FkAZqQJTbXM",
      license: "Unsplash License",
    },
  },
  cook: {
    src: "/photos/cook.webp",
    alt: "A chef plating food under copper lamps",
    width: 1169,
    height: 1800,
    focus: "50% 55%",
    credit: {
      name: "Louis Hansel",
      source: "Unsplash",
      url: "https://unsplash.com/photos/v3OlBE6-fhU",
      license: "Unsplash License",
    },
  },
  shopOwner: {
    src: "/photos/shop-owner.webp",
    alt: "A baker kneading dough by hand",
    width: 1200,
    height: 1800,
    focus: "50% 40%",
    credit: {
      name: "Adam Bartoszewicz",
      source: "Unsplash",
      url: "https://unsplash.com/photos/AYLSwAtdb90",
      license: "Unsplash License",
    },
  },
  landscaper: {
    src: "/photos/landscaper.webp",
    alt: "A landscaper trimming a hedge",
    width: 2400,
    height: 1600,
    focus: "55% 50%",
    credit: {
      name: "FRAEM GmbH",
      source: "Unsplash",
      url: "https://unsplash.com/photos/rBY5Ek86oOI",
      license: "Unsplash License",
    },
  },
  storefront: {
    src: "/photos/storefront.webp",
    alt: "A small storefront with striped awnings",
    width: 2400,
    height: 1606,
    focus: "50% 50%",
    credit: {
      name: "Zhen Yao",
      source: "Unsplash",
      url: "https://unsplash.com/photos/kHkYP2ERSnk",
      license: "Unsplash License",
    },
  },
};

export function getPhoto(key: PhotoKey): Photo | undefined {
  return PHOTOS[key];
}

/** Todas as fotos em uso, para a página de créditos. */
export function allPhotos(): Photo[] {
  return Object.values(PHOTOS).filter((p): p is Photo => Boolean(p));
}
