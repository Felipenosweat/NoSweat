// Fatos da demo Bright Spark Electric. TUDO aqui vem de
// packages/fixtures/src/library/bright-spark-electric.ts (o "brief" do dono e o SiteSpec): nomes,
// preços, horário, cidades, telefone, e-mail, as duas falas de clientes e o passo a passo da troca
// de quadro. Nada de "24/7", emergência, prazo de resposta, garantia, nota ou número de licença:
// a fixture não traz. Se um fato não está aqui, a página não o diz (regra 8 do CLAUDE.md).

export const BUSINESS = {
  name: "Bright Spark Electric",
  short: "Bright Spark",
  category: "Residential electrician",
  city: "Phoenix",
  state: "AZ",
  phone: "(602) 555-0137",
  tel: "+16025550137",
  email: "office@brightspark.example.com",
  since: 2006,
  founded: 2014,
} as const;

export const HOURS = [
  { days: "Mon–Fri", short: "Mon–Fri", from: 7, to: 17, label: "7 AM – 5 PM", big: "7–5" },
  { days: "Saturday", short: "Sat", from: 8, to: 12, label: "8 AM – 12 PM", big: "8–12" },
] as const;

export const CITIES = ["Phoenix", "Tempe", "Scottsdale", "Mesa", "Chandler", "Glendale"] as const;

export const HIGHLIGHTS = [
  "Licensed with the Arizona ROC",
  "Bonded and insured",
  "Written quote before we start",
] as const;

export type ServiceId = "panel" | "ev" | "rewire" | "lighting" | "trouble";

export type Service = {
  id: ServiceId;
  /** Número do disjuntor no quadro (só rótulo visual, como num quadro de verdade). */
  slot: string;
  name: string;
  /** O que vai escrito no disjuntor: o preço ou o fato curto da fixture. */
  rating: string;
  price: string;
  priceNote: string;
  summary: string;
  included: string[];
  photo: "panel" | "ev" | "rewire" | "lighting" | "trouble";
};

export const SERVICES: Service[] = [
  {
    id: "panel",
    slot: "01",
    name: "Panel upgrades",
    rating: "200 A",
    price: "$2,400",
    priceNote: "from",
    summary:
      "We replace old or undersized panels with 200-amp service and pull the permit when the job needs one.",
    included: [
      "Old or undersized panels replaced with 200-amp service.",
      "Marcus looks at the panel and meter first and writes the quote.",
      "We pull the permit, and Tasha schedules the city inspection.",
    ],
    photo: "panel",
  },
  {
    id: "ev",
    slot: "02",
    name: "EV charger installs",
    rating: "Level 2",
    price: "$650",
    priceNote: "from",
    summary: "Level 2 chargers from Tesla, ChargePoint or whatever brand you already bought.",
    included: [
      "Any brand you bought: Tesla, ChargePoint or another one.",
      "Written quote before we start.",
      "We pull the permit when the job needs one.",
    ],
    photo: "ev",
  },
  {
    id: "rewire",
    slot: "03",
    name: "Whole-home rewiring",
    rating: "Walkthrough",
    price: "Quoted",
    priceNote: "after a walkthrough",
    summary: "New wiring for older houses, quoted after Marcus walks through the house with you.",
    included: [
      "Marcus walks through the house with you first.",
      "Then you get a written quote.",
      "We pull the permit when the job needs one.",
    ],
    photo: "rewire",
  },
  {
    id: "lighting",
    slot: "04",
    name: "Lighting and ceiling fans",
    rating: "Fans · cans",
    price: "$175",
    priceNote: "from",
    summary: "Recessed cans, light fixtures and ceiling fans.",
    included: ["Recessed cans.", "Light fixtures.", "Ceiling fans."],
    photo: "lighting",
  },
  {
    id: "trouble",
    slot: "05",
    name: "Troubleshooting",
    rating: "Service call",
    price: "$95",
    priceNote: "service call",
    summary: "For breakers that keep tripping and outlets that went dead.",
    included: [
      "Breakers that keep tripping.",
      "Outlets that went dead.",
      "You get a written quote before any repair.",
    ],
    photo: "trouble",
  },
];

export const REVIEWS = [
  {
    quote:
      "Marcus upgraded our 1970s panel in one day and walked me through every breaker before he left.",
    name: "Rachel K.",
    city: "Tempe",
  },
  {
    quote:
      "The EV charger quote was $650 and the bill was $650. Tasha even scheduled the inspection for us.",
    name: "Omar H.",
    city: "Chandler",
  },
] as const;

export const FAQ = [
  {
    q: "Do I get a price before you start?",
    a: "Yes. You get a written quote before any work begins.",
  },
  {
    q: "What does a service call cost?",
    a: "The service call is $95, and you get a written quote before any repair.",
  },
  {
    q: "Do you handle permits?",
    a: "Yes. When the job needs a permit, we pull it and Tasha schedules the inspection.",
  },
  {
    q: "Can you install the EV charger I already bought?",
    a: "Yes. We install Level 2 chargers from Tesla, ChargePoint or any other brand, starting at $650.",
  },
] as const;

/** Seções da página na ordem: cada uma é um "circuito" que a linha do fio liga ao chegar. */
export const CIRCUITS = [
  { id: "services", no: "01", label: "Services & prices" },
  { id: "panel-day", no: "02", label: "A panel upgrade day" },
  { id: "area", no: "03", label: "Area & hours" },
  { id: "people", no: "04", label: "Who answers" },
  { id: "quote", no: "05", label: "Quote request" },
] as const;

export type CircuitId = (typeof CIRCUITS)[number]["id"];
