// Fatos da North Loop Coffee (café FICTÍCIO de Minneapolis). Fonte única: o site-modelo
// `packages/fixtures/src/library/north-loop-coffee.ts`. Nada aqui foi inventado (regra 8):
// pessoas, endereço, horários, cardápio e preços, torra, Wi-Fi, cachorros, estacionamento,
// as duas falas de clientes, telefone 555 e e-mail de exemplo vêm de lá.

export const CAFE = {
  name: "North Loop Coffee",
  street: "418 Washington Ave N",
  area: "North Loop",
  city: "Minneapolis",
  state: "MN",
  phone: "(612) 555-0137",
  phoneHref: "tel:+16125550137",
  email: "hello@northloopcoffee.example.com",
  orderHost: "order.northloopcoffee.example.com",
  opened: 2017,
  directionsHref:
    "https://www.google.com/maps/dir/?api=1&destination=418+Washington+Ave+N%2C+Minneapolis%2C+MN",
} as const;

/** 0 = domingo ... 6 = sábado (como Date.getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Minutos desde a meia-noite (hora de Minneapolis). Mon–Fri 6:30–3, Sat–Sun 7:30–3. */
export const HOURS: Record<Weekday, { open: number; close: number }> = {
  0: { open: 7 * 60 + 30, close: 15 * 60 },
  1: { open: 6 * 60 + 30, close: 15 * 60 },
  2: { open: 6 * 60 + 30, close: 15 * 60 },
  3: { open: 6 * 60 + 30, close: 15 * 60 },
  4: { open: 6 * 60 + 30, close: 15 * 60 },
  5: { open: 6 * 60 + 30, close: 15 * 60 },
  6: { open: 7 * 60 + 30, close: 15 * 60 },
};

export const HOURS_ROWS = [
  { days: "Mon–Fri", time: "6:30 AM – 3 PM", weekdays: [1, 2, 3, 4, 5] },
  { days: "Sat–Sun", time: "7:30 AM – 3 PM", weekdays: [0, 6] },
] as const;

/** Dias de torra: segunda e quinta. */
export const ROAST_DAYS: Weekday[] = [1, 4];
/** O sanduíche de ovo é servido até 13h. */
export const EGG_UNTIL = 13 * 60;
/** Aos sábados os pães de cardamomo costumam acabar até as 10h. */
export const BUNS_GONE_SAT = 10 * 60;

export type MenuItem = {
  id: string;
  name: string;
  /** centavos */
  price: number;
  description: string;
  /** fato curto em mono ("12 oz", "Until 1 PM") */
  tags?: string[];
  /** opção que muda o preço ou o pedido (só as que o dono citou) */
  option?:
    | { kind: "addon"; id: string; label: string; price: number }
    | { kind: "grind"; choices: [string, string] };
  /** não entra no pedido online (precisa de aviso prévio) */
  noOrder?: string;
};

export type MenuGroup = { id: string; title: string; note?: string; items: MenuItem[] };

export const MENU: MenuGroup[] = [
  {
    id: "espresso",
    title: "Espresso bar",
    items: [
      {
        id: "cortado",
        name: "Cortado",
        price: 425,
        description: "Espresso with an equal amount of steamed milk.",
      },
      {
        id: "oat-latte",
        name: "Oat milk latte",
        price: 550,
        description: "Espresso and steamed oat milk. We don't charge extra for oat.",
        tags: ["12 oz", "No oat upcharge"],
      },
      {
        id: "pour-over",
        name: "Pour-over",
        price: 500,
        description: "The single origin of the week, brewed by the cup.",
        tags: ["Ask what's on"],
      },
    ],
  },
  {
    id: "pastry",
    title: "Pastry case",
    note: "Theo bakes the pastry case every morning.",
    items: [
      {
        id: "cardamom-bun",
        name: "Cardamom bun",
        price: 475,
        description:
          "Made from Hannah's grandmother's recipe. They usually sell out early on Saturdays.",
        tags: ["Gone by 10 on Saturdays"],
      },
      {
        id: "muffin",
        name: "Blueberry corn muffin",
        price: 375,
        description: "A blueberry muffin made with cornmeal.",
      },
    ],
  },
  {
    id: "breakfast",
    title: "Breakfast",
    items: [
      {
        id: "egg-cheddar",
        name: "Egg & cheddar",
        price: 850,
        description: "Egg, cheddar and chive butter on an English muffin.",
        tags: ["Until 1 PM"],
        option: { kind: "addon", id: "bacon", label: "Add bacon", price: 200 },
      },
      {
        id: "lox-toast",
        name: "Lox toast",
        price: 1100,
        description: "Lox on rye toast.",
      },
    ],
  },
  {
    id: "beans",
    title: "Beans to go",
    note: "Roasted here on Mondays and Thursdays.",
    items: [
      {
        id: "house-blend",
        name: "House blend, 12 oz",
        price: 1700,
        description: "Our house blend, roasted here. We'll grind it for free if you ask.",
        option: { kind: "grind", choices: ["Whole bean", "Ground, free"] },
      },
      {
        id: "office-bag",
        name: "House blend, 5 lb",
        price: 7500,
        description: "Bags for offices.",
        tags: ["A week's notice"],
        noOrder: "Call or email with a week's notice",
      },
    ],
  },
];

export const PEOPLE = [
  {
    name: "Hannah Lindqvist",
    role: "Owner & roaster",
    note: "Roasts every bean on the 12-kilo roaster in the back, Mondays and Thursdays.",
  },
  {
    name: "Theo Lindqvist",
    role: "Owner & kitchen",
    note: "Runs the kitchen and bakes the pastry case every morning.",
  },
  {
    name: "Ramón Ortiz",
    role: "Head barista",
    note: "Trains everyone who works the bar.",
  },
] as const;

export const QUOTES = [
  {
    quote:
      "I've had the same cortado every weekday for three years and they still ask if I want it for here.",
    author: "Jess K.",
  },
  {
    quote: "The cardamom buns are gone by ten on Saturdays. Get there early.",
    author: "Dan P.",
  },
] as const;

export const FAQ = [
  { q: "Can I order ahead?", a: "Yes. Order online and pick it up at the end of the bar." },
  { q: "Is it OK to work from the cafe?", a: "Yes. Wi-Fi is free and every table has outlets." },
  { q: "Can I bring my dog?", a: "Dogs are welcome on the patio." },
  {
    q: "Do you sell beans for offices?",
    a: "Yes, 5 lb bags of the house blend are $75 with a week's notice.",
  },
  {
    q: "Where do I park?",
    a: "Metered street parking on Washington Ave N. We're also a short walk from the Target Field light rail station.",
  },
] as const;

export function money(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/** Sempre com centavos (recibo). */
export function money2(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
