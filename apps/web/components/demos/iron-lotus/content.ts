// Fatos da demonstração Iron Lotus Tattoo. Estúdio FICTÍCIO. Tudo aqui vem do brief da fixture
// `packages/fixtures/src/library/iron-lotus-tattoo.ts` (regra 8 do CLAUDE.md): artistas,
// estilos, preços, depósito, idade, horário, endereço, telefone e os dois depoimentos. Nada de
// nota, prêmio, "anos de mercado" ou licença que o dono não tenha dado.
// As peças de flash (FLASH) são desenhos feitos para esta demo (SVG em `flash.tsx`), não
// trabalho dos artistas; o site diz isso onde elas aparecem.

export const STUDIO = {
  name: "Iron Lotus Tattoo",
  street: "2817 Larimer St",
  area: "RiNo",
  city: "Denver",
  state: "CO",
  phone: "(303) 555-0126",
  phoneHref: "tel:+13035550126",
  email: "book@ironlotus.example.com",
  hours: [
    { days: "Tue–Sat", time: "12 PM – 8 PM" },
    { days: "Sun–Mon", time: "Closed" },
  ],
} as const;

export const SECTIONS = [
  { id: "flash", no: "01", label: "Flash" },
  { id: "artists", no: "02", label: "Artists" },
  { id: "prices", no: "03", label: "Prices" },
  { id: "booking", no: "04", label: "Booking" },
  { id: "consult", no: "05", label: "Consult" },
  { id: "visit", no: "06", label: "Visit" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export type ArtistId = "mara" | "theo" | "lena";

export type Artist = {
  id: ArtistId;
  no: string;
  name: string;
  first: string;
  role: string;
  styles: string[];
  note: string;
  price: string;
  quote?: { text: string; author: string };
};

export const ARTISTS: Artist[] = [
  {
    id: "mara",
    no: "01",
    name: "Mara Quinn",
    first: "Mara",
    role: "Owner",
    styles: ["Blackwork", "Large custom"],
    note: "Has tattooed since 2011, mostly blackwork and large custom pieces.",
    price: "Custom work $180 an hour · full-day sessions $1,100 for up to 6 hours",
    quote: {
      text: "Mara took a half-faded name on my arm and turned it into the best thing on my body.",
      author: "Chris D.",
    },
  },
  {
    id: "theo",
    no: "02",
    name: "Theo Banks",
    first: "Theo",
    role: "Artist",
    styles: ["Fine line", "Script"],
    note: "Small, precise work like names, dates and single-needle detail.",
    price: "From $150 · most pieces take 1–2 hours",
    quote: {
      text: "Theo's lines are so clean my mom asked if it was a sticker.",
      author: "Priya N.",
    },
  },
  {
    id: "lena",
    no: "03",
    name: "Lena Ruiz",
    first: "Lena",
    role: "Artist",
    styles: ["Color realism", "Cover-ups"],
    note: "Covers or reworks old tattoos, and looks at yours first in a free consult.",
    price: "Cover-ups & reworks $180 an hour, after a free consult",
  },
];

export type Price = {
  no: string;
  name: string;
  amount: string;
  unit?: string;
  detail: string;
  wide?: boolean;
  red?: boolean;
};

export const PRICES: Price[] = [
  {
    no: "A",
    name: "Custom pieces",
    amount: "$180",
    unit: "an hour",
    detail: "Drawn from scratch. Starts with a consult and a drawing session.",
    wide: true,
  },
  {
    no: "B",
    name: "Fine line & script",
    amount: "$150",
    unit: "and up",
    detail: "Most pieces take 1–2 hours.",
  },
  {
    no: "C",
    name: "Cover-ups & reworks",
    amount: "$180",
    unit: "an hour",
    detail: "After a free consult.",
  },
  {
    no: "D",
    name: "Full-day sessions",
    amount: "$1,100",
    unit: "up to 6 hours",
    detail: "For sleeves and back pieces.",
    wide: true,
  },
  {
    no: "E",
    name: "Flash Fridays",
    amount: "$100",
    unit: "and up",
    detail: "Walk in and pick from the flash. First come.",
    red: true,
  },
  {
    no: "F",
    name: "Touch-ups",
    amount: "Free",
    detail: "Within 6 months.",
  },
];

export const STEPS = [
  {
    no: "01",
    title: "Consult",
    body: "Custom work starts with a consult and a drawing session. Cover-ups get a free consult first.",
  },
  {
    no: "02",
    title: "Deposit",
    body: "A $100 deposit holds your date. It comes off the price of your last session.",
  },
  {
    no: "03",
    title: "The drawing",
    body: "We show it on the day of your appointment, not before, and change it with you until it's right.",
  },
  {
    no: "04",
    title: "Touch-ups",
    body: "Anything that heals patchy gets touched up at no charge within 6 months.",
  },
] as const;

export type FlashId =
  | "lotus"
  | "dagger"
  | "swallow"
  | "star"
  | "rose"
  | "snake"
  | "moth"
  | "heart"
  | "web"
  | "eye"
  | "dice"
  | "moon";

export type FlashPiece = {
  id: FlashId;
  no: string;
  name: string;
  /** Posição na folha do computador (grade 6 × 6): coluna, linha, largura, altura. */
  area: [number, number, number, number];
  /** Inclinação de "colado à mão", em graus. */
  tilt: number;
  /** Profundidade da paralaxe do ponteiro (0–1). */
  depth: number;
};

export const FLASH: FlashPiece[] = [
  { id: "lotus", no: "01", name: "Iron lotus", area: [2, 1, 3, 3], tilt: -3, depth: 0.35 },
  { id: "dagger", no: "02", name: "Dagger", area: [1, 1, 1, 2], tilt: -9, depth: 0.8 },
  { id: "swallow", no: "03", name: "Swallow", area: [5, 1, 2, 2], tilt: 7, depth: 0.6 },
  { id: "star", no: "04", name: "Nautical star", area: [1, 3, 1, 1], tilt: 12, depth: 1 },
  { id: "rose", no: "05", name: "Rose", area: [5, 3, 2, 2], tilt: -5, depth: 0.5 },
  { id: "moth", no: "06", name: "Moth", area: [1, 4, 2, 2], tilt: 4, depth: 0.55 },
  { id: "snake", no: "07", name: "Snake", area: [3, 4, 2, 2], tilt: -6, depth: 0.45 },
  { id: "heart", no: "08", name: "Banner heart", area: [5, 5, 2, 1], tilt: -4, depth: 0.7 },
  { id: "web", no: "09", name: "Spiderweb", area: [1, 6, 1, 1], tilt: 0, depth: 0.9 },
  { id: "eye", no: "10", name: "Eye", area: [2, 6, 2, 1], tilt: 3, depth: 0.75 },
  { id: "dice", no: "11", name: "Dice", area: [4, 6, 1, 1], tilt: -10, depth: 1 },
  { id: "moon", no: "12", name: "Crescent", area: [5, 6, 2, 1], tilt: 6, depth: 0.85 },
];
