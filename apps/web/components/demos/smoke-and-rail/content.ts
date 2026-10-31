// Fatos da demonstração Smoke & Rail BBQ. Fonte única: o brief do site-modelo em
// packages/fixtures/src/library/smoke-and-rail-bbq.ts (regra 8: nada de nota, prêmio, "desde"
// ou "o melhor"). Se um fato não está lá, não está aqui. O negócio é FICTÍCIO; o endereço e os
// bairros de Kansas City são lugares reais, usados como cenário.

export const BUSINESS = {
  name: "Smoke & Rail BBQ",
  phone: "(816) 555-0128",
  phoneHref: "tel:+18165550128",
  email: "smoke@smokeandrail.example.com",
  street: "1500 Genessee St",
  city: "Kansas City, MO",
  neighborhood: "West Bottoms",
  order: "https://order.smokeandrail.example.com",
  directions:
    "https://www.google.com/maps/dir/?api=1&destination=1500+Genessee+St%2C+Kansas+City%2C+MO",
} as const;

/** Capítulos do menu em tela cheia e das âncoras da página. */
export const CHAPTERS = [
  { id: "pit", label: "Fourteen hours" },
  { id: "menu", label: "The menu" },
  { id: "find", label: "Where to find us" },
  { id: "story", label: "The rail yard" },
  { id: "catering", label: "Catering & the truck" },
  { id: "questions", label: "Questions" },
] as const;

export type StageScene = {
  key: string;
  /** hora do contador (0–14) em que a cena está no centro do palco */
  hour: number;
  label: string;
  /** nome curto da estação na linha de trilho */
  station: string;
  title: string;
  body: string;
};

// As quatro cenas do palco preso. Descrevem a comida e o lugar com palavras simples; os
// números (14 horas, hickory, $16) são do dono.
export const SCENES: StageScene[] = [
  {
    key: "fire",
    hour: 1,
    label: "The fire",
    station: "Fire",
    title: "Hickory in the firebox",
    body: "Every brisket we sell spends fourteen hours over hickory. It starts with the fire.",
  },
  {
    key: "smoke",
    hour: 5,
    label: "The smoke",
    station: "Smoke",
    title: "Hours of smoke",
    body: "The pit sits at 1500 Genessee St in the West Bottoms, next to the rail yard. The brisket stays in the smoke for most of the day.",
  },
  {
    key: "bark",
    hour: 10,
    label: "The bark",
    station: "Bark",
    title: "The outside turns black",
    body: "That dark crust is the bark. Burnt ends are cut from the point of the brisket, on Thursdays and Saturdays only.",
  },
  {
    key: "cut",
    hour: 14,
    label: "Hour fourteen",
    station: "Cut",
    title: "Cut to order, fatty or lean",
    body: "We slice it when you order: $16 a half pound, sauce on the side. When it's gone, it's gone.",
  },
];

export type MenuItem = {
  key: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  /** aviso em cor de brasa na coluna de situação (só fatos do dono) */
  status?: string;
  photo: "whole" | "bark" | "ribs" | "pork" | "tray" | "sliced";
};

export const MENU: MenuItem[] = [
  {
    key: "brisket",
    name: "Brisket",
    description: "Smoked 14 hours over hickory and cut to order, fatty or lean.",
    price: "$16",
    unit: "half lb",
    photo: "sliced",
  },
  {
    key: "burnt-ends",
    name: "Burnt ends",
    description: "Cut from the point of the brisket.",
    price: "$15",
    unit: "half lb",
    status: "Thu & Sat only",
    photo: "bark",
  },
  {
    key: "ribs-half",
    name: "Spare ribs",
    description: "Smoked spare ribs, by the half slab.",
    price: "$19",
    unit: "half slab",
    photo: "ribs",
  },
  {
    key: "ribs-full",
    name: "Spare ribs",
    description: "The full slab.",
    price: "$34",
    unit: "full slab",
    photo: "ribs",
  },
  {
    key: "pork",
    name: "Pulled pork sandwich",
    description: "Pulled pork on a bun with vinegar slaw.",
    price: "$12",
    unit: "each",
    photo: "pork",
  },
  {
    key: "sides",
    name: "Sides",
    description: "Cheesy corn, pit beans with brisket, vinegar slaw, mac and cheese.",
    price: "$4",
    unit: "each",
    photo: "tray",
  },
  {
    key: "whole",
    name: "Whole brisket to go",
    description: "A whole smoked brisket to take home.",
    price: "$95",
    unit: "whole",
    status: "48 hrs notice",
    photo: "whole",
  },
];

export const SIDES = ["Cheesy corn", "Pit beans with brisket", "Vinegar slaw", "Mac and cheese"];

export type ServiceDay = {
  /** 0 = domingo (Date.getDay) */
  day: number;
  short: string;
  long: string;
  where?: string;
  place?: string;
  time?: string;
  note?: string;
};

// Semana inteira. Segunda e domingo não têm pit nem truck no brief: a linha diz só isso.
export const WEEK: ServiceDay[] = [
  { day: 1, short: "Mon", long: "Monday" },
  {
    day: 2,
    short: "Tue",
    long: "Tuesday",
    where: "The truck",
    place: "The Crossroads",
    time: "11 AM – 2 PM",
  },
  {
    day: 3,
    short: "Wed",
    long: "Wednesday",
    where: "The truck",
    place: "River Market",
    time: "11 AM – 2 PM",
  },
  {
    day: 4,
    short: "Thu",
    long: "Thursday",
    where: "The pit",
    place: "1500 Genessee St",
    time: "11 AM – sold out",
    note: "Burnt ends",
  },
  {
    day: 5,
    short: "Fri",
    long: "Friday",
    where: "The pit",
    place: "1500 Genessee St",
    time: "11 AM – sold out",
  },
  {
    day: 6,
    short: "Sat",
    long: "Saturday",
    where: "The pit",
    place: "1500 Genessee St",
    time: "11 AM – sold out",
    note: "Burnt ends",
  },
  { day: 0, short: "Sun", long: "Sunday" },
];

export const TIMELINE = [
  {
    year: "2011",
    title: "The backyard",
    body: "Darnell Hayes starts smoking meat in his backyard.",
  },
  { year: "2018", title: "The truck", body: "The truck goes on the road." },
  {
    year: "2022",
    title: "The pit",
    body: "The pit opens at 1500 Genessee St, next to the West Bottoms rail yard.",
  },
] as const;

export const PEOPLE = [
  { name: "Darnell Hayes", role: "Pitmaster & owner" },
  { name: "Keisha Hayes", role: "Catering & the truck" },
] as const;

// Palavras de clientes que o próprio dono passou no brief (com nome). Nada além disso.
export const QUOTES = {
  ray: {
    quote:
      "Got there at 1:30 and the burnt ends were gone, so I came back Thursday at 11 sharp. It was worth it.",
    author: "Ray T.",
  },
  wedding: {
    quote: "Keisha ran our wedding catering for 140 and nobody went home hungry.",
    author: "Alyssa & Jordan",
  },
} as const;

export const OFFERS = [
  {
    key: "catering",
    name: "Catering",
    price: "$22",
    unit: "per person",
    body: "Two meats, two sides, bread and sauce.",
    terms: ["25 guests minimum", "One week notice"],
  },
  {
    key: "truck",
    name: "The truck at your event",
    price: "$1,500",
    unit: "and up",
    body: "We bring the truck and serve up to 100 guests.",
    terms: ["Up to 100 guests", "Book a month ahead"],
  },
  {
    key: "whole",
    name: "Whole brisket to go",
    price: "$95",
    unit: "each",
    body: "A whole smoked brisket to take home.",
    terms: ["48 hours notice"],
  },
] as const;

export const FAQ = [
  {
    q: "When do you close?",
    a: "The pit opens Thursday to Saturday at 11 AM and stays open until we sell out. If you're coming later in the day, preorder.",
  },
  {
    q: "Where's the truck this week?",
    a: "Tuesdays at the Crossroads and Wednesdays at River Market, 11 AM – 2 PM.",
  },
  {
    q: "Can I preorder so I don't miss out?",
    a: "Yes, preorder online and pick up at the pit. Whole briskets need 48 hours notice.",
  },
  { q: "Is the sauce on everything?", a: "No, the sauce always comes on the side." },
  {
    q: "How much notice for catering?",
    a: "One week, with a 25 guest minimum. If you want the truck at your event, book a month ahead.",
  },
] as const;
