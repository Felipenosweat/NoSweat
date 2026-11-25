// Fotos da landing "After hours" (Unsplash, hotlink em images.unsplash.com como pedem as regras do
// Unsplash): lojas à noite e de manhã, nenhuma pessoa posando (só uma barista de perfil, ao fundo,
// no café do fim). São ilustrativas: o texto
// alternativo descreve a cena e NUNCA diz que o lugar é cliente da No Sweat. Todas aparecem com
// crédito no rodapé (PhotoCredits em Footer.tsx).
// `focus` = object-position por faixa de largura. Trocar uma foto só muda este arquivo.

/** Um papel por foto: trocar uma foto só muda este arquivo. */
export type PhotoKey = "hero" | "overnight" | "office" | "closing";

export type LandingPhoto = {
  /** id da foto no Unsplash. */
  id: string;
  /** URL crua (sem parâmetros); o loader de UnsplashImage acrescenta largura, qualidade e formato. */
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
  // Placa "We're open" acesa atrás do vidro, entre plantas (5:4). A placa ocupa 28%–72% da
  // largura e 35%–66% da altura: no celular a caixa é 3:4 (a placa cabe inteira) e no computador
  // a foto fica à direita, com a placa à direita do centro.
  hero: {
    id: "N3SsG7xR-Dg",
    src: "https://images.unsplash.com/photo-1603912699214-92627f304eb6",
    width: 3800,
    height: 3040,
    alt: "A lit ‘We’re open’ sign in a shop window, surrounded by plants.",
    focus: { base: "50% 40%", md: "50% 50%", lg: "50% 50%" },
    photographer: "Clay Banks",
    profile: "https://unsplash.com/@claybanks",
    page: "https://unsplash.com/photos/white-and-black-love-is-love-print-glass-N3SsG7xR-Dg",
  },
  // Floricultura em Nova York à noite, neon OPEN vermelho na porta (3:2).
  overnight: {
    id: "Cx4JPE-ZZQ4",
    src: "https://images.unsplash.com/photo-1575081838238-d06e716afa28",
    width: 7360,
    height: 4912,
    alt: "A flower shop at night with its open sign lit.",
    focus: { base: "56% 45%", md: "56% 50%", lg: "50% 50%" },
    photographer: "Alex Simpson",
    profile: "https://unsplash.com/@m_simpsan",
    page: "https://unsplash.com/photos/closed-flower-shop-Cx4JPE-ZZQ4",
  },
  // Prateleiras brancas de florista com cestos de flores (3:2), recorte 4:5 ao lado da tela real.
  office: {
    id: "TtKZyFJ7XC0",
    src: "https://images.unsplash.com/photo-1567696153410-7ae55f32e4dc",
    width: 5184,
    height: 3456,
    alt: "Woven baskets of fresh flowers on white shelves.",
    focus: { base: "30% 50%" },
    photographer: "Carrie Beth Williams",
    profile: "https://unsplash.com/@caribou15",
    page: "https://unsplash.com/photos/flowers-on-baskets-TtKZyFJ7XC0",
  },
  // Balcão de café na luz da manhã, lâmpadas pendentes (16:9). Foto CLARA: o título fica em ink
  // num painel branco, nunca em branco sobre a foto.
  closing: {
    id: "Kwdp-0pok-I",
    src: "https://images.unsplash.com/photo-1453614512568-c4024d13c247",
    width: 3456,
    height: 1944,
    alt: "A café counter in morning light with pendant bulbs.",
    focus: { base: "62% 40%", md: "60% 45%", lg: "50% 45%" },
    photographer: "Nafinia Putra",
    profile: "https://unsplash.com/@nputra",
    page: "https://unsplash.com/photos/black-kitchen-appliance-on-kitchen-island-with-pendant-lights-Kwdp-0pok-I",
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
