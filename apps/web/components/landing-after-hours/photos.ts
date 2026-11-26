// Fotos da landing "After hours" (Unsplash, hotlink em images.unsplash.com como pedem as regras do
// Unsplash): lojas à noite e de manhã, nenhuma pessoa posando (no café do fim há gente sentada,
// de costas). São ilustrativas: o texto alternativo descreve a cena e NUNCA diz que o lugar é cliente da No Sweat. Todas aparecem com
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
  // Neon "open" branco dentro de um anel laranja, num fundo quase preto (3:2). O anel ocupa
  // 26%–78% da largura e 12%–88% da altura. Celular: caixa quadrada centrada no anel. Computador:
  // a foto fica à direita e acima do site de exemplo, com o anel à direita do centro.
  hero: {
    id: "FQgI8AD-BSg",
    src: "https://images.unsplash.com/photo-1472898965229-f9b06b9c9bbe",
    width: 5184,
    height: 3456,
    alt: "A neon open sign glowing in a dark shop window.",
    focus: { base: "52% 50%", md: "52% 50%", lg: "30% 50%" },
    photographer: "Finn Hackshaw",
    profile: "https://unsplash.com/@finnhackshaw",
    page: "https://unsplash.com/photos/white-and-orange-open-led-signage-turned-on-FQgI8AD-BSg",
  },
  // Pavilhão ao anoitecer, paredes de vidro acesas à direita e embaixo, caminho iluminado e céu
  // vazio no alto à esquerda (4:3). Os cartões ficam na coluna da esquerda, longe das janelas.
  overnight: {
    id: "WvHrrR1C5Po",
    src: "https://images.unsplash.com/photo-1606402179428-a57976d71fa4",
    width: 4000,
    height: 3000,
    alt: "A building at dusk with its windows lit and a lit path leading to it.",
    focus: { base: "70% 55%", md: "60% 55%", lg: "50% 58%" },
    photographer: "zero take",
    profile: "https://unsplash.com/@zerotake",
    page: "https://unsplash.com/photos/brown-wooden-building-near-trees-during-night-time-WvHrrR1C5Po",
  },
  // Vitrine de barbearia de dia, com BARBER no vidro, a bicicleta vermelha e o banco (3:2). Recorte
  // quadrado puxado para a esquerda: a bicicleta inteira e as letras no quadro.
  office: {
    id: "cg599DTeS8w",
    src: "https://images.unsplash.com/photo-1516470930795-6ba2564824aa",
    width: 4240,
    height: 2832,
    alt: "A barbershop window in daylight with a bicycle parked by the bench.",
    focus: { base: "5% 50%" },
    photographer: "Guus Baggermans",
    profile: "https://unsplash.com/@guusbaggermans",
    page: "https://unsplash.com/photos/red-city-bike-leaning-on-bench-cg599DTeS8w",
  },
  // Café grande na luz do dia, janelas altas (muito claras, à esquerda) e o balcão de doces aceso
  // (3:2). As janelas são a parte mais clara: o título fica em ink no painel branco.
  closing: {
    id: "pNIgH0y3upM",
    src: "https://images.unsplash.com/photo-1542181961-9590d0c79dab",
    width: 6000,
    height: 4000,
    alt: "A busy café in morning light with tall windows and a pastry counter.",
    focus: { base: "66% 60%", md: "60% 55%", lg: "50% 55%" },
    photographer: "RR Abrot",
    profile: "https://unsplash.com/@rr_abrot",
    page: "https://unsplash.com/photos/people-sitting-inside-establishment-pNIgH0y3upM",
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
