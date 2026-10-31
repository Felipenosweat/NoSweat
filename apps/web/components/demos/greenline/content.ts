import { PHOTOS, type GreenlinePhoto } from "./photos";

// Conteúdo da demonstração Greenline Landscaping. Negócio FICTÍCIO: todo fato aqui vem do
// brief da fixture `packages/fixtures/src/library/greenline-landscaping.ts` (nomes, cidades,
// horário, preços, estações, telefone 555). Nada de nota, prêmio, "anos de mercado" ou garantia
// (regra 8). Onde o brief fala só em estação ("na primavera"), o calendário mostra a estação
// inteira e diz que os meses são aproximados.

export const BUSINESS = {
  name: "Greenline Landscaping",
  city: "Charlotte, NC",
  phone: "(704) 555-0128",
  phoneHref: "tel:+17045550128",
  email: "crew@greenline.example.com",
  instagram: "https://instagram.example.com/greenlinecharlotte",
  founded: "2015",
};

export const HOURS = [
  { days: "Mon–Fri", label: "Monday to Friday", time: "7 AM – 6 PM" },
  { days: "Sat", label: "Saturday", time: "8 AM – 1 PM" },
];

export const TOWNS = [
  "Charlotte",
  "Matthews",
  "Mint Hill",
  "Huntersville",
  "Pineville",
  "Fort Mill",
];

export const NAV = [
  { href: "#services", label: "Services" },
  { href: "#year", label: "The year" },
  { href: "#area", label: "Area & hours" },
  { href: "#people", label: "About" },
];

export type Service = {
  id: string;
  name: string;
  body: string;
  when?: string;
  price?: string;
};

export const SERVICE_GROUPS: { title: string; items: Service[] }[] = [
  {
    title: "Lawn care",
    items: [
      {
        id: "mowing",
        name: "Weekly mowing",
        body: "Mow, edge, string-trim and blow off the driveway and walks. Clippings are mulched back into the lawn; bagging is $10 more a visit.",
        when: "March through November · same crew every week",
        price: "from $45 a visit",
      },
      {
        id: "trimming",
        name: "Shrub and hedge trimming",
        body: "Shrubs and hedges, trimmed in spring and again in late summer.",
        when: "Spring and late summer",
        price: "from $120",
      },
    ],
  },
  {
    title: "Projects",
    items: [
      {
        id: "design",
        name: "Landscape design and installs",
        body: "Kevin draws the plan for beds, plants and stone, and you get a fixed price before we dig.",
        when: "Drawn plan first",
        price: "Fixed price",
      },
      {
        id: "sod",
        name: "Sod and seeding",
        body: "Fescue goes down in the fall; Bermuda and zoysia in late spring.",
        when: "Fall and late spring",
      },
      {
        id: "straw",
        name: "Pine straw and mulch",
        body: "Pine straw or mulch, installed in your beds.",
        price: "from $8 a bale",
      },
    ],
  },
  {
    title: "Irrigation and fall",
    items: [
      {
        id: "irrigation",
        name: "Irrigation repairs and start-ups",
        body: "Broken heads, leaking valves and zones that stopped running, checked by a North Carolina licensed irrigation contractor.",
        when: "Spring start-ups",
        price: "from $85",
      },
      {
        id: "leaves",
        name: "Fall leaf cleanup",
        body: "Leaves cleared out of the beds and off the lawn.",
        when: "Fall",
        price: "from $225",
      },
    ],
  },
];

export const ALL_SERVICES = SERVICE_GROUPS.flatMap((group) => group.items);

export const GOOD_TO_KNOW = [
  { q: "Contracts", a: "None. Cancel weekly service anytime with a week's notice." },
  {
    q: "Clippings",
    a: "Mulched back into the lawn. Bagged, if you'd rather, for $10 more a visit.",
  },
  { q: "Being home", a: "Not needed. Leave the gate unlocked on your service day." },
  { q: "Fescue", a: "Aerate and overseed from September to mid-October." },
];

export const PEOPLE = [
  {
    name: "Andre Simmons",
    role: "Co-owner · irrigation",
    note: "North Carolina licensed irrigation contractor.",
  },
  {
    name: "Kevin Simmons",
    role: "Co-owner · design and installs",
    note: "Draws every plan and runs the install crew.",
  },
  {
    name: "Brenda Ortiz",
    role: "Schedule and billing",
    note: "Runs the schedule and the billing.",
  },
];

export const QUOTES = [
  {
    quote: "Same two guys every Thursday for three years. I have not thought about my lawn since.",
    author: "Jenna W.",
    place: "Matthews",
  },
  {
    quote:
      "Andre found the broken sprinkler zone that two other companies missed, and fixed it the same visit.",
    author: "Robert D.",
    place: "Huntersville",
  },
];

// ---------- O ano no quintal ----------

export type SeasonId = "spring" | "summer" | "fall" | "winter";

export type Season = {
  id: SeasonId;
  name: string;
  months: string;
  /** meses (0 = janeiro) que a estação cobre no calendário. */
  span: number[];
  photo: GreenlinePhoto;
  line: string;
  tasks: string[];
};

export const SEASONS: Season[] = [
  {
    id: "spring",
    name: "Spring",
    months: "March – May",
    span: [2, 3, 4],
    photo: PHOTOS.sprinkler,
    line: "The mowers come back out.",
    tasks: [
      "Weekly mowing starts in March.",
      "Shrub and hedge trimming, from $120.",
      "Irrigation spring start-ups, from $85.",
      "Bermuda and zoysia sod in late spring.",
    ],
  },
  {
    id: "summer",
    name: "Summer",
    months: "June – August",
    span: [5, 6, 7],
    photo: PHOTOS.mown,
    line: "Dry heat, and fescue that browns out by July.",
    tasks: [
      "Weekly mowing with the same crew every week.",
      "Every yard is planned around the drought and the red clay.",
      "Hedges and shrubs get a second trim in late summer.",
    ],
  },
  {
    id: "fall",
    name: "Fall",
    months: "September – November",
    span: [8, 9, 10],
    photo: PHOTOS.leaves,
    line: "The best window for fescue, and the leaves.",
    tasks: [
      "Aeration and overseeding for fescue, September to mid-October.",
      "Fescue sod and seeding.",
      "Fall leaf cleanup, from $225.",
      "Weekly mowing runs through November.",
    ],
  },
  {
    id: "winter",
    name: "Winter",
    months: "December – February",
    span: [11, 0, 1],
    photo: PHOTOS.frost,
    line: "No weekly mowing until March.",
    tasks: [
      "Weekly mowing is off from December to February.",
      "Design isn't tied to a season: Kevin draws the plan and you get a fixed price before we dig.",
    ],
  },
];

/** Linhas do calendário: início e fim em meses fracionários (0 = 1º de janeiro, 12 = fim de dezembro). */
export type AlmanacRow = {
  label: string;
  bars: { from: number; to: number; note: string }[];
  tone?: "pine" | "clay";
};

export const ALMANAC: AlmanacRow[] = [
  { label: "Weekly mowing", bars: [{ from: 2, to: 11, note: "March through November" }] },
  {
    label: "Shrub and hedge trimming",
    bars: [
      { from: 2, to: 5, note: "Spring" },
      { from: 7, to: 9, note: "Late summer" },
    ],
  },
  { label: "Irrigation start-ups", bars: [{ from: 2, to: 5, note: "Spring" }] },
  {
    label: "Sod and seeding",
    bars: [
      { from: 4, to: 6, note: "Bermuda and zoysia, late spring" },
      { from: 8, to: 11, note: "Fescue, fall" },
    ],
  },
  {
    label: "Aerate and overseed fescue",
    bars: [{ from: 8, to: 9.5, note: "September to mid-October" }],
  },
  { label: "Fall leaf cleanup", bars: [{ from: 9, to: 11, note: "Fall" }] },
  {
    label: "Fescue browns out",
    tone: "clay",
    bars: [{ from: 6, to: 8, note: "By July, in a dry summer" }],
  },
];

export const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ---------- Pedido de orçamento ----------

export const YARD_SIZES = [
  { id: "small", name: "Small", detail: "Under ¼ acre", lot: 0.42 },
  { id: "medium", name: "Medium", detail: "¼ to ½ acre", lot: 0.62 },
  { id: "large", name: "Large", detail: "½ to 1 acre", lot: 0.82 },
  { id: "xl", name: "Over an acre", detail: "More than 1 acre", lot: 1 },
] as const;
