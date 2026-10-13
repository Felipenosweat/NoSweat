import type { FixtureSlug } from "@nosweat/fixtures";

// Dados da "Ordem de serviço" do hero (docs/design/v4-direction.md): a frase que o dono
// digitaria, com trechos numerados, e onde cada trecho aparece no site gerado.
// As caixas (em % da captura) foram MEDIDAS no navegador com o mesmo tamanho das capturas
// em public/shots (1280×860 e 390×844). Se as capturas forem refeitas, medir de novo.
// Todos os negócios são fictícios (fixtures) e aparecem rotulados.

/** Onde o trecho aparece no site. */
export type PinKey = "name" | "headline" | "area" | "offer" | "phone";

/** Caixa em % da imagem: x, y = canto superior esquerdo; w, h = tamanho. */
export type Box = { x: number; y: number; w: number; h: number };

/** Pedaço da frase: texto solto ou trecho ligado a um pino. */
export type Segment = string | { text: string; pin: PinKey };

export type WorkOrder = {
  slug: FixtureSlug;
  /** Rótulo da aba (o ofício). */
  trade: string;
  /** Número da ficha: só decoração, derivado do telefone fictício (555). */
  ticket: string;
  sentence: Segment[];
  /** Texto de "onde foi parar" de cada pino, com o texto real do site. */
  lands: Record<PinKey, string>;
  desktop: Record<PinKey, Box>;
  phone: Record<PinKey, Box>;
};

/** Ordem dos pinos (o número mostrado é a posição + 1). */
export const PIN_ORDER: PinKey[] = ["name", "headline", "area", "offer", "phone"];

export const PIN_LABEL: Record<PinKey, string> = {
  name: "Business name",
  headline: "What you do",
  area: "Where you work",
  offer: "Your offer",
  phone: "Phone",
};

export const WORK_ORDERS: WorkOrder[] = [
  {
    slug: "joes-plumbing",
    trade: "Plumber",
    ticket: "0142",
    sentence: [
      { text: "Joe’s Plumbing", pin: "name" },
      ", ",
      { text: "family plumbers for leaks, drains and water heaters", pin: "headline" },
      " in ",
      { text: "Austin, TX", pin: "area" },
      ". ",
      { text: "Free estimates", pin: "offer" },
      ". Call ",
      { text: "(512) 555-0142", pin: "phone" },
      ".",
    ],
    lands: {
      name: "Top of every page",
      headline: "Your headline: “Austin’s Trusted Plumbers, On Time Every Time”",
      area: "“Serving Austin, TX”",
      offer: "The main button: “Get a Free Estimate”",
      phone: "A tap-to-call button on every page",
    },
    desktop: {
      name: { x: 11.4, y: 8, w: 9.7, h: 2.6 },
      headline: { x: 7.5, y: 30.8, w: 34.9, h: 23.4 },
      area: { x: 7.5, y: 25.2, w: 13.6, h: 4 },
      offer: { x: 7.5, y: 69.3, w: 17.6, h: 7 },
      phone: { x: 78.6, y: 6.7, w: 13.9, h: 5.1 },
    },
    phone: {
      name: { x: 16.9, y: 7.3, w: 28.3, h: 2.4 },
      headline: { x: 4.1, y: 25, w: 68.8, h: 14.3 },
      area: { x: 4.1, y: 19.1, w: 44.8, h: 4 },
      offer: { x: 4.1, y: 61.7, w: 91.8, h: 6.6 },
      phone: { x: 84.6, y: 5.9, w: 11.3, h: 5.2 },
    },
  },
  {
    slug: "sparkle-cleaning",
    trade: "Cleaner",
    ticket: "0217",
    sentence: [
      { text: "Sparkle & Co. Cleaning", pin: "name" },
      ": ",
      { text: "weekly, biweekly and move-out house cleaning", pin: "headline" },
      " in ",
      { text: "Worcester and nearby towns", pin: "area" },
      ". ",
      { text: "Clear quote before the first visit", pin: "offer" },
      ". ",
      { text: "(508) 555-0142", pin: "phone" },
      ".",
    ],
    lands: {
      name: "Top of every page",
      headline: "Your headline: “A Spotless Home Without Lifting a Finger”",
      area: "“Serving Worcester and nearby towns”",
      offer: "The main button: “Get a Cleaning Quote”",
      phone: "A tap-to-call button on every page",
    },
    desktop: {
      name: { x: 11.4, y: 8, w: 15.2, h: 2.6 },
      headline: { x: 7.5, y: 36.8, w: 34.8, h: 23.3 },
      area: { x: 7.5, y: 31.2, w: 22.1, h: 4 },
      offer: { x: 7.5, y: 75.3, w: 18.1, h: 7 },
      phone: { x: 79.4, y: 6.7, w: 13.1, h: 5.1 },
    },
    phone: {
      name: { x: 16.9, y: 7.3, w: 44.3, h: 2.4 },
      headline: { x: 4.1, y: 25, w: 68.5, h: 14.2 },
      area: { x: 4.1, y: 19.1, w: 72.4, h: 4 },
      offer: { x: 4.1, y: 58.3, w: 91.8, h: 6.6 },
      phone: { x: 84.6, y: 5.9, w: 11.3, h: 5.2 },
    },
  },
  {
    slug: "glow-salon",
    trade: "Salon",
    ticket: "0187",
    sentence: [
      { text: "Glow Salon", pin: "name" },
      ": ",
      { text: "cuts, color and treatments in our Wynwood studio", pin: "headline" },
      ", ",
      { text: "Miami, FL", pin: "area" },
      ". ",
      { text: "Clients book appointments", pin: "offer" },
      " or call ",
      { text: "(305) 555-0187", pin: "phone" },
      ".",
    ],
    lands: {
      name: "Top of every page",
      headline: "Your headline: “Hair That Turns Heads in Miami”",
      area: "“Serving Miami, FL”",
      offer: "The main button: “Book Your Appointment”",
      phone: "A tap-to-call button on every page",
    },
    desktop: {
      name: { x: 11.4, y: 8, w: 6.9, h: 2.6 },
      headline: { x: 7.5, y: 35.7, w: 33.4, h: 16.6 },
      area: { x: 7.5, y: 30.5, w: 13.1, h: 4 },
      offer: { x: 7.5, y: 64, w: 20.1, h: 7 },
      phone: { x: 79.4, y: 6.7, w: 13.1, h: 5.1 },
    },
    phone: {
      name: { x: 16.9, y: 7.3, w: 20.1, h: 2.4 },
      headline: { x: 4.1, y: 24.8, w: 65.8, h: 10.2 },
      area: { x: 4.1, y: 19.1, w: 43.1, h: 4 },
      offer: { x: 4.1, y: 50.5, w: 91.8, h: 6.6 },
      phone: { x: 84.6, y: 5.9, w: 11.3, h: 5.2 },
    },
  },
  {
    slug: "rosas-kitchen",
    trade: "Restaurant",
    ticket: "0163",
    sentence: [
      { text: "Rosa’s Kitchen", pin: "name" },
      ", ",
      { text: "homestyle Mexican cooking from family recipes", pin: "headline" },
      " in ",
      { text: "San Diego", pin: "area" },
      ". ",
      { text: "We take reservations", pin: "offer" },
      ". ",
      { text: "(619) 555-0163", pin: "phone" },
      ".",
    ],
    lands: {
      name: "Top of every page",
      headline: "Your headline: “Homestyle Mexican Cooking in the Heart of San Diego”",
      area: "“Serving San Diego, CA”",
      offer: "The main button: “Reserve a Table”",
      phone: "A tap-to-call button on every page",
    },
    desktop: {
      name: { x: 11.4, y: 8, w: 8.5, h: 2.6 },
      headline: { x: 7.5, y: 32.5, w: 39.3, h: 23 },
      area: { x: 7.5, y: 26.8, w: 15.1, h: 4 },
      offer: { x: 7.5, y: 67.6, w: 15, h: 7 },
      phone: { x: 78.6, y: 6.7, w: 13.9, h: 5.1 },
    },
    phone: {
      name: { x: 16.9, y: 7.3, w: 24.8, h: 2.4 },
      headline: { x: 4.1, y: 25.1, w: 77.3, h: 14.1 },
      area: { x: 4.1, y: 19.1, w: 49.6, h: 4 },
      offer: { x: 4.1, y: 55, w: 91.8, h: 6.6 },
      phone: { x: 84.6, y: 5.9, w: 11.3, h: 5.2 },
    },
  },
];
