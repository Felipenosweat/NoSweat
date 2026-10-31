// Fatos da Sunrise Bakery (demonstração, padaria FICTÍCIA). Fonte única:
// packages/fixtures/src/library/sunrise-bakery.ts (o `brief` do dono). Nada aqui pode ir além
// dele (regra 8): sem notas, prêmios, "o melhor", anos de casa ou "orgânico/local".

export const BAKERY = {
  name: "Sunrise Bakery",
  street: "2415 J St",
  area: "Midtown",
  city: "Sacramento",
  state: "CA",
  phone: "(916) 555-0152",
  phoneHref: "tel:+19165550152",
  email: "hello@sunrisebakery.example.com",
  orderUrl: "https://order.sunrisebakery.example.com",
  orderHost: "order.sunrisebakery.example.com",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=2415+J+St%2C+Sacramento%2C+CA",
  baker: "Mai Tran",
  decorator: "Elena Ruiz",
  marketYear: 2016,
  shopYear: 2020,
  fermentHours: 48,
} as const;

/** Dia da semana como em Date.getDay(): 0 = domingo. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Horário de cada dia, em minutos desde a meia-noite (hora de Sacramento). */
export const HOURS: Record<Weekday, { open: number; close: number } | null> = {
  0: { open: 7 * 60, close: 13 * 60 },
  1: null,
  2: null,
  3: { open: 7 * 60, close: 14 * 60 },
  4: { open: 7 * 60, close: 14 * 60 },
  5: { open: 7 * 60, close: 14 * 60 },
  6: { open: 7 * 60, close: 13 * 60 },
};

export const HOURS_ROWS = [
  { days: "Wed – Fri", time: "7 AM – 2 PM", match: [3, 4, 5] },
  { days: "Sat – Sun", time: "7 AM – 1 PM", match: [6, 0] },
  { days: "Mon – Tue", time: "Closed", match: [1, 2] },
] as const;

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type MenuItem = {
  name: string;
  note: string;
  price: string;
  when?: string;
};

export const MENU: { group: string; items: MenuItem[] }[] = [
  {
    group: "Bread",
    items: [
      {
        name: "Country sourdough",
        note: "Our everyday loaf, fermented for 48 hours.",
        price: "$9",
        when: "Every day from 7 AM",
      },
      {
        name: "Seeded rye",
        note: "A seeded rye loaf for the weekend.",
        price: "$10",
        when: "Fri – Sun",
      },
    ],
  },
  {
    group: "Pastry",
    items: [
      { name: "Butter croissant", note: "A plain butter croissant.", price: "$4.50" },
      {
        name: "Morning bun",
        note: "Rolled with orange zest and cinnamon sugar.",
        price: "$5",
      },
      {
        name: "Kouign-amann",
        note: "The Breton pastry, on weekends.",
        price: "$5.50",
        when: "Sat – Sun",
      },
    ],
  },
  {
    group: "Cakes & preorders",
    items: [
      {
        name: "Custom cake",
        note: "Designed and decorated by Elena. A 6-inch cake serves 8–10.",
        price: "from $55",
        when: "Order 5 days ahead",
      },
      {
        name: "Tiered wedding cake",
        note: "Tiered cakes, with a tasting by appointment.",
        price: "from $350",
        when: "Tasting by appointment",
      },
      {
        name: "Saturday bread box",
        note: "Two loaves and four pastries, picked up on Saturday.",
        price: "$28",
        when: "Order by Thursday noon",
      },
    ],
  },
];

/** Linhas do quadro de cada dia (máximo 20 caracteres, 8 linhas). Só fatos do dono. */
const OPEN_WEEKDAY = "OPEN 7 AM - 2 PM";
const OPEN_WEEKEND = "OPEN 7 AM - 1 PM";
const LOAF = "COUNTRY SOURDOUGH $9";
const RYE = "SEEDED RYE       $10";
const CROISSANT = "CROISSANT      $4.50";
const BUN = "MORNING BUN       $5";
const KOUIGN = "KOUIGN-AMANN   $5.50";

export const BOARD: Record<Weekday, string[]> = {
  3: [OPEN_WEEKDAY, "FIRST LOAVES 7 AM", LOAF, CROISSANT, BUN],
  4: [OPEN_WEEKDAY, "FIRST LOAVES 7 AM", LOAF, CROISSANT, BUN, "BREAD BOX ORDERS", "CLOSE AT NOON"],
  5: [OPEN_WEEKDAY, "FIRST LOAVES 7 AM", LOAF, RYE, CROISSANT, BUN],
  6: [OPEN_WEEKEND, "FIRST LOAVES 7 AM", LOAF, RYE, CROISSANT, BUN, KOUIGN, "BREAD BOX PICKUP"],
  0: [OPEN_WEEKEND, "FIRST LOAVES 7 AM", LOAF, RYE, CROISSANT, BUN, KOUIGN],
  1: ["CLOSED MONDAYS", "", "BACK WEDNESDAY", "AT 7 AM", "", "CAKES: ORDER", "5 DAYS AHEAD"],
  2: ["CLOSED TUESDAYS", "", "BACK TOMORROW", "AT 7 AM", "", "CAKES: ORDER", "5 DAYS AHEAD"],
};

/** Observação embaixo do quadro, por dia (texto corrido, para quem lê o quadro em voz alta). */
export const BOARD_NOTE: Partial<Record<Weekday, string>> = {
  4: "Saturday bread box orders close at noon today.",
  6: "Bread box pickup at the counter. Bread usually sells out by noon on weekends.",
  0: "Bread usually sells out by noon on weekends.",
};

export const BOARD_COLS = 20;
export const BOARD_ROWS = 8;

export const QUOTES = {
  bread: {
    text: "Mai's sourdough ruined grocery-store bread for my whole family.",
    author: "Kara L.",
  },
  cake: {
    text: "Elena matched the cake to my daughter's drawing. She cried. I cried.",
    author: "Jamal W.",
  },
} as const;

export const FAQ = [
  {
    q: "When does the bread sell out?",
    a: "Usually by noon on weekends. If you want to be sure, preorder the Saturday bread box.",
  },
  {
    q: "How do preorders work?",
    a: "Order online by Thursday noon and pick up your box on Saturday at the counter.",
  },
  {
    q: "How far ahead should I order a cake?",
    a: "5 days for a custom cake. For wedding cakes, book a tasting with Elena first.",
  },
  {
    q: "Do you have allergen-free options?",
    a: "Our kitchen uses nuts, wheat, dairy and eggs, so we can't promise anything is allergen-free.",
  },
  {
    q: "Are you open Monday?",
    a: "We're closed Monday and Tuesday. Open Wed–Fri 7 AM – 2 PM and Sat–Sun 7 AM – 1 PM.",
  },
] as const;
