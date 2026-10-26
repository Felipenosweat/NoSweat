// Fotos da demonstração Aurelia Royal Estate (Unsplash, hotlink com crédito, como pedem as
// regras do Unsplash). Gerado a partir da busca na API do Unsplash (2026-10-26); o texto
// alternativo foi reescrito à mão. Nenhuma foto mostra um prédio famoso identificável.

export type AureliaPhoto = {
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
  hero: {
    id: "krAQD5gGBSM",
    raw: "https://images.unsplash.com/photo-1775346098928-cab0ac41b9a2?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Mnx8Y2hhbmRlbGllciUyMGJhbGxyb29tfGVufDF8MHx8fDE3OTMwMDk5MjR8MA&ixlib=rb-4.1.0",
    width: 5394,
    height: 3973,
    color: "#59400c",
    alt: "A gilded ballroom lit by crystal chandeliers, its polished floor reflecting the light",
    author: "mana5280",
    authorUrl: `https://unsplash.com/@mana5280?${UTM}`,
    photoUrl: `https://unsplash.com/photos/grand-ballroom-with-ornate-chandeliers-and-polished-floor-krAQD5gGBSM?${UTM}`,
  },
  salon: {
    id: "Sb7KiQ-ZfXQ",
    raw: "https://images.unsplash.com/photo-1792117889873-a16fd75d0ff6?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTN8fGNoYW5kZWxpZXIlMjBiYWxscm9vbXxlbnwxfDB8fHwxNzkzMDA5OTI0fDA&ixlib=rb-4.1.0",
    width: 6857,
    height: 4426,
    color: "#40260c",
    alt: "A gold-trimmed salon with a crystal chandelier and silk-panelled walls",
    author: "Mehmet Uzut",
    authorUrl: `https://unsplash.com/@mehmetuzut?${UTM}`,
    photoUrl: `https://unsplash.com/photos/ornate-room-with-gold-trimmed-walls-Sb7KiQ-ZfXQ?${UTM}`,
  },
  hall: {
    id: "iblAaJVKopI",
    raw: "https://images.unsplash.com/photo-1790501028651-b62b529c4e1d?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8N3x8Y2hhbmRlbGllciUyMGJhbGxyb29tfGVufDF8MHx8fDE3OTMwMDk5MjR8MA&ixlib=rb-4.1.0",
    width: 9229,
    height: 6166,
    color: "#594026",
    alt: "A long hall of marble columns and arched windows under a row of chandeliers",
    author: "Adrien Olichon",
    authorUrl: `https://unsplash.com/@adrienolichon?${UTM}`,
    photoUrl: `https://unsplash.com/photos/grand-ballroom-with-marble-columns-iblAaJVKopI?${UTM}`,
  },
  crystals: {
    id: "CyUvgLHACUU",
    raw: "https://images.unsplash.com/photo-1771549981582-08e3093422b4?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Nnx8Y2hhbmRlbGllciUyMGJhbGxyb29tfGVufDF8MHx8fDE3OTMwMDk5MjR8MA&ixlib=rb-4.1.0",
    width: 5886,
    height: 3924,
    color: "#260c0c",
    alt: "Close view of chandelier crystals glowing amber",
    author: "Evan Marvell",
    authorUrl: `https://unsplash.com/@evan_marvell?${UTM}`,
    photoUrl: `https://unsplash.com/photos/close-up-of-a-crystal-chandelier-with-warm-lighting-CyUvgLHACUU?${UTM}`,
  },
  stair: {
    id: "DS8f4Gzj-Q8",
    raw: "https://images.unsplash.com/photo-1599778022144-a35ed12f24a1?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MXx8bWFyYmxlJTIwc3RhaXJjYXNlJTIwcGFsYWNlfGVufDF8MHx8fDE3OTMwMDk5MjR8MA&ixlib=rb-4.1.0",
    width: 6000,
    height: 4000,
    color: "#402626",
    alt: "A double staircase of carved stone with a red runner rising to a gilded landing",
    author: "Mert Kahveci",
    authorUrl: `https://unsplash.com/@mertkahveci?${UTM}`,
    photoUrl: `https://unsplash.com/photos/brown-and-white-concrete-staircase-DS8f4Gzj-Q8?${UTM}`,
  },
  lion: {
    id: "bJMv_PQ0Vl8",
    raw: "https://images.unsplash.com/photo-1784648778415-9f03f8f67d2c?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTR8fGdvbGQlMjBvcm5hbWVudCUyMGRldGFpbHxlbnwxfHx8fDE3OTMwMTAwNTJ8MA&ixlib=rb-4.1.0",
    width: 6240,
    height: 4160,
    color: "#404026",
    alt: "A gilded lion's head carved on a marble pillar",
    author: "Jina Oh",
    authorUrl: `https://unsplash.com/@jina5?${UTM}`,
    photoUrl: `https://unsplash.com/photos/a-golden-lion-head-carving-on-a-decorative-pillar-bJMv_PQ0Vl8?${UTM}`,
  },
  coffer: {
    id: "X2kgWOk6Bwc",
    raw: "https://images.unsplash.com/photo-1583829893112-58e651ff8528?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MXx8Z29sZCUyMG9ybmFtZW50JTIwZGV0YWlsfGVufDF8fHx8MTc5MzAxMDA1Mnww&ixlib=rb-4.1.0",
    width: 2939,
    height: 4408,
    color: "#c0c0c0",
    alt: "A coffered ceiling of gold and cream rosettes",
    author: "David Tip",
    authorUrl: `https://unsplash.com/@david113?${UTM}`,
    photoUrl: `https://unsplash.com/photos/brown-and-white-floral-ceiling-X2kgWOk6Bwc?${UTM}`,
  },
  library: {
    id: "2P_ifaetDm0",
    raw: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MXx8bHV4dXJ5JTIwaG90ZWwlMjBzdWl0ZSUyMGNsYXNzaWN8ZW58MXwwfHx8MTc5MzAwOTkyNXww&ixlib=rb-4.1.0",
    width: 5939,
    height: 3959,
    color: "#260c0c",
    alt: "A wood-panelled suite with reading lamps, a portrait and a deep sofa",
    author: "Rod Long",
    authorUrl: `https://unsplash.com/@rodlong?${UTM}`,
    photoUrl: `https://unsplash.com/photos/hotel-room-with-wood-paneling-in-stockholm-2P_ifaetDm0?${UTM}`,
  },
  armchair: {
    id: "8y3aDqzGv6I",
    raw: "https://images.unsplash.com/photo-1557149559-f5ee3514db38?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTZ8fGx1eHVyeSUyMGhvdGVsJTIwc3VpdGUlMjBjbGFzc2ljfGVufDF8MHx8fDE3OTMwMDk5MjV8MA&ixlib=rb-4.1.0",
    width: 6036,
    height: 4024,
    color: "#d9d9d9",
    alt: "A brocade armchair beside a gold lamp in soft window light",
    author: "CHUTTERSNAP",
    authorUrl: `https://unsplash.com/@chuttersnap?${UTM}`,
    photoUrl: `https://unsplash.com/photos/white-and-gold-table-lamp-on-round-table-in-between-sofa-chair-and-sofa-8y3aDqzGv6I?${UTM}`,
  },
  bed: {
    id: "7VopMuTM9Ms",
    raw: "https://images.unsplash.com/photo-1583333004011-fe5ff9bcea0e?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MjB8fGx1eHVyeSUyMGhvdGVsJTIwc3VpdGUlMjBjbGFzc2ljfGVufDF8MHx8fDE3OTMwMDk5MjV8MA&ixlib=rb-4.1.0",
    width: 7952,
    height: 5304,
    color: "#c0c0c0",
    alt: "Turned-down bed linen in ivory and blush",
    author: "engin akyurt",
    authorUrl: `https://unsplash.com/@enginakyurt?${UTM}`,
    photoUrl: `https://unsplash.com/photos/person-in-blue-denim-jeans-sitting-on-white-and-brown-bed-linen-7VopMuTM9Ms?${UTM}`,
  },
  dining: {
    id: "onkrndO6sXc",
    raw: "https://images.unsplash.com/photo-1498676077434-7540603d2dda?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTd8fGNhbmRsZWxpdCUyMGZpbmUlMjBkaW5pbmclMjB0YWJsZXxlbnwxfHx8fDE3OTMwMTAwNTF8MA&ixlib=rb-4.1.0",
    width: 6675,
    height: 4455,
    color: "#260c0c",
    alt: "A long dining table set beneath brass lamps",
    author: "Simon Mumenthaler",
    authorUrl: `https://unsplash.com/@mumenthalers?${UTM}`,
    photoUrl: `https://unsplash.com/photos/highball-glasses-on-brown-wooden-table-onkrndO6sXc?${UTM}`,
  },
  feast: {
    id: "fb0_wj2MZk4",
    raw: "https://images.unsplash.com/photo-1536392706976-e486e2ba97af?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8NHx8Y2FuZGxlbGl0JTIwZmluZSUyMGRpbmluZyUyMHRhYmxlfGVufDF8fHx8MTc5MzAxMDA1MXww&ixlib=rb-4.1.0",
    width: 4974,
    height: 3316,
    color: "#260c0c",
    alt: "A candlelit banquet table with flowers in a dark room",
    author: "M F",
    authorUrl: `https://unsplash.com/@mfe1?${UTM}`,
    photoUrl: `https://unsplash.com/photos/long-dining-table-with-festive-flowers-fb0_wj2MZk4?${UTM}`,
  },
  hammam: {
    id: "Z5mqw90TL0M",
    raw: "https://images.unsplash.com/photo-1657086002136-7e08e17ef08e?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTZ8fG1hcmJsZSUyMHNwYSUyMHBvb2x8ZW58MXx8fHwxNzkzMDEwMDUxfDA&ixlib=rb-4.1.0",
    width: 4000,
    height: 2248,
    color: "#404026",
    alt: "A tiled bathing hall with carved lattice windows",
    author: "mohammad nasr",
    authorUrl: `https://unsplash.com/@mohammad_nasr?${UTM}`,
    photoUrl: `https://unsplash.com/photos/a-large-room-with-a-pool-and-large-windows-Z5mqw90TL0M?${UTM}`,
  },
  pool: {
    id: "DSx48dBRx-w",
    raw: "https://images.unsplash.com/photo-1568920461785-4e40a0d70bbb?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTd8fG1hcmJsZSUyMHNwYSUyMHBvb2x8ZW58MXx8fHwxNzkzMDEwMDUxfDA&ixlib=rb-4.1.0",
    width: 2687,
    height: 3916,
    color: "#d9f3f3",
    alt: "A still indoor pool before tall glass doors",
    author: "Jacques Benazra",
    authorUrl: `https://unsplash.com/@upgreyed?${UTM}`,
    photoUrl: `https://unsplash.com/photos/closed-white-door-DSx48dBRx-w?${UTM}`,
  },
  allee: {
    id: "yOCCI7heL04",
    raw: "https://images.unsplash.com/photo-1624301269612-805e48c4d3da?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8NXx8cGFsYWNlJTIwZ2FyZGVuJTIwZm91bnRhaW58ZW58MXwwfHx8MTc5MzAwOTkyNXww&ixlib=rb-4.1.0",
    width: 6000,
    height: 4000,
    color: "#59730c",
    alt: "A lawn between two clipped avenues of trees",
    author: "Jan Zinnbauer",
    authorUrl: `https://unsplash.com/@jan_zinnbauer?${UTM}`,
    photoUrl: `https://unsplash.com/photos/green-grass-field-with-trees-under-white-clouds-during-daytime-yOCCI7heL04?${UTM}`,
  },
  canal: {
    id: "3BuMi2d-6zU",
    raw: "https://images.unsplash.com/photo-1624301466553-cb1721edab2a?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8N3x8cGFsYWNlJTIwZ2FyZGVuJTIwZm91bnRhaW58ZW58MXwwfHx8MTc5MzAwOTkyNXww&ixlib=rb-4.1.0",
    width: 6000,
    height: 4000,
    color: "#d9d9d9",
    alt: "A long ornamental canal leading to a pale palace",
    author: "Jan Zinnbauer",
    authorUrl: `https://unsplash.com/@jan_zinnbauer?${UTM}`,
    photoUrl: `https://unsplash.com/photos/white-concrete-building-surrounded-by-green-grass-field-3BuMi2d-6zU?${UTM}`,
  },
  stone: {
    id: "5nh-yvzPDgQ",
    raw: "https://images.unsplash.com/photo-1758966107932-402e4d1a0158?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8MTR8fHBhbGFjZSUyMGhvdGVsJTIwZmFjYWRlfGVufDF8MHx8fDE3OTMwMDk5MjN8MA&ixlib=rb-4.1.0",
    width: 3240,
    height: 2160,
    color: "#8c7373",
    alt: "Carved pink stone around an arched window",
    author: "c gom",
    authorUrl: `https://unsplash.com/@chgr?${UTM}`,
    photoUrl: `https://unsplash.com/photos/ornate-architectural-details-on-a-stone-building-exterior-5nh-yvzPDgQ?${UTM}`,
  },
  balcony: {
    id: "hkRL3nKCrTk",
    raw: "https://images.unsplash.com/photo-1786018121252-cf5aea37ed2b?ixid=M3wxMTEzMjkxfDB8MXxzZWFyY2h8Mnx8cGFsYWNlJTIwaG90ZWwlMjBmYWNhZGV8ZW58MXwwfHx8MTc5MzAwOTkyM3ww&ixlib=rb-4.1.0",
    width: 6205,
    height: 4137,
    color: "#c0c0c0",
    alt: "An ornate facade of carved columns and blue-glazed balconies",
    author: "Mahmut Y\u0131ld\u0131z",
    authorUrl: `https://unsplash.com/@iammahmutyildiz?${UTM}`,
    photoUrl: `https://unsplash.com/photos/an-ornate-building-facade-with-balconies-and-blue-windows-hkRL3nKCrTk?${UTM}`,
  },
} satisfies Record<string, AureliaPhoto>;

export type PhotoKey = keyof typeof PHOTOS;

/** Endereço da foto na largura pedida (o Unsplash redimensiona; `crop` recorta pela proporção). */
export function src(photo: AureliaPhoto, width: number, ratio?: number): string {
  const size = ratio
    ? `&w=${width}&h=${Math.round(width / ratio)}&fit=crop&crop=entropy`
    : `&w=${width}&fit=max`;
  return `${photo.raw}${photo.raw.includes("?") ? "" : "?"}&q=72&fm=jpg&auto=format${size}`;
}

/** srcset com larguras fixas (o navegador escolhe pela tela). */
export function srcSet(
  photo: AureliaPhoto,
  ratio?: number,
  widths = [640, 960, 1440, 1920, 2560],
): string {
  return widths.map((w) => `${src(photo, w, ratio)} ${w}w`).join(", ");
}
