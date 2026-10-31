import type { PhotoKey } from "./photos";

// Fatos da demonstração Hollis Interiors. TUDO vem da fixture
// packages/fixtures/src/library/hollis-interiors.ts (regra 8): pessoas, endereço, área, horário,
// serviços, taxas e prazos, os projetos recentes (só nomes, sem fotos), as duas frases de clientes.
// O que NÃO está na fixture e por isso não aparece: prêmios, imprensa, "anos de mercado" além de
// "abriu em 2017", número de clientes, faixas de orçamento. As paletas dos cômodos são lidas das
// próprias fotos de exemplo (cores medidas com quantização do ImageMagick) e a página diz isso.

export const BUSINESS = {
  name: "Hollis Interiors",
  phone: "(615) 555-0134",
  phoneHref: "tel:+16155550134",
  email: "studio@hollisinteriors.example.com",
  street: "1104 Woodland St, Suite 2",
  neighborhood: "East Nashville",
  city: "Nashville, TN",
  area: "Nashville, Franklin, Brentwood and Middle Tennessee",
  remote: "E-design works anywhere in the US.",
  hours: "Mon–Fri, 9 AM – 5 PM, by appointment",
  booking: "hollisinteriors.example.com/consult",
  opened: "2017",
  perYear: "About 10 full projects a year",
} as const;

export type Service = {
  id: "consult" | "full" | "kitchen-bath" | "single" | "edesign";
  n: string;
  name: string;
  group: string;
  price: string;
  time: string;
  description: string;
};

export const SERVICES: Service[] = [
  {
    id: "consult",
    n: "00",
    name: "In-home consultation",
    group: "Start here",
    price: "$350",
    time: "2 hours",
    description:
      "Two hours in your house talking through what you want. Afterward we send a flat quote for the design.",
  },
  {
    id: "full",
    n: "01",
    name: "Full-home design",
    group: "Full projects",
    price: "from $18,000",
    time: "4–9 months",
    description:
      "Floor plans, finishes, lighting, furniture and art, from the first drawings through install day.",
  },
  {
    id: "kitchen-bath",
    n: "02",
    name: "Kitchen & bath",
    group: "Full projects",
    price: "from $7,500",
    time: "Per room · 3–5 months",
    description:
      "Layout, cabinetry drawings, tile, plumbing fixtures and lighting, coordinated with your contractor.",
  },
  {
    id: "single",
    n: "03",
    name: "Single room",
    group: "Full projects",
    price: "from $3,200",
    time: "6–8 weeks",
    description: "One room designed and furnished: a living room, a bedroom, a study.",
  },
  {
    id: "edesign",
    n: "04",
    name: "E-design",
    group: "Remote",
    price: "$950",
    time: "Per room · remote · 3 weeks",
    description:
      "A floor plan, a shopping list with links and a call to walk through it. Anywhere in the US.",
  },
];

export const serviceById = (id: Service["id"]) => SERVICES.find((service) => service.id === id)!;

/** `share`: quantos pixels da foto (reduzida a 200 px) caíram nesta cor, para o tamanho da faixa. */
export type Swatch = { name: string; hex: string; share: number };

export type Room = {
  id: string;
  n: string;
  name: string;
  photo: PhotoKey;
  /** posição do recorte (object-position) para o quadro do palco. */
  focus: string;
  /** qual serviço da fixture cobre este cômodo. */
  service: Service["id"];
  /** uma frase do que a Hollis faz neste cômodo, tirada da descrição do serviço na fixture. */
  scope: string;
  /** 4 tons medidos na foto de exemplo, do mais claro ao mais escuro. */
  palette: Swatch[];
};

export const ROOMS: Room[] = [
  {
    id: "living",
    n: "01",
    name: "Living room",
    photo: "living",
    focus: "60% 60%",
    service: "single",
    scope: "Designed and furnished as a single room, or as part of a full home.",
    palette: [
      { name: "Plaster", hex: "#D2CBC0", share: 4382 },
      { name: "Oatmeal", hex: "#AFA393", share: 7539 },
      { name: "Saddle", hex: "#946B42", share: 2299 },
      { name: "Walnut", hex: "#4B3D29", share: 3575 },
    ],
  },
  {
    id: "kitchen",
    n: "02",
    name: "Kitchen",
    photo: "kitchen",
    focus: "50% 55%",
    service: "kitchen-bath",
    scope:
      "Layout, cabinetry drawings, tile, fixtures and lighting, coordinated with your contractor.",
    palette: [
      { name: "Chalk", hex: "#BFB5A7", share: 5669 },
      { name: "Pale oak", hex: "#A18A71", share: 6443 },
      { name: "Teak", hex: "#926A49", share: 3276 },
      { name: "Dark walnut", hex: "#533015", share: 6578 },
    ],
  },
  {
    id: "bath",
    n: "03",
    name: "Bath",
    photo: "bath",
    focus: "50% 60%",
    service: "kitchen-bath",
    scope:
      "Layout, tile, plumbing fixtures and lighting, coordinated with your contractor. Priced per room.",
    palette: [
      { name: "Limewash", hex: "#E2E5DE", share: 4367 },
      { name: "Plaster", hex: "#C9C6B6", share: 8388 },
      { name: "Sand", hex: "#A9966E", share: 5258 },
      { name: "Stone", hex: "#736A51", share: 1613 },
    ],
  },
  {
    id: "bedroom",
    n: "04",
    name: "Bedroom",
    photo: "bedroom",
    focus: "50% 55%",
    service: "single",
    scope: "One room designed and furnished, on its own or as part of a full home.",
    palette: [
      { name: "Linen", hex: "#D9D9D5", share: 8455 },
      { name: "Bouclé", hex: "#C7BEB2", share: 5451 },
      { name: "Clay", hex: "#8B7767", share: 2531 },
      { name: "Slate", hex: "#65615B", share: 1955 },
    ],
  },
  {
    id: "study",
    n: "05",
    name: "Study",
    photo: "study",
    focus: "55% 55%",
    service: "single",
    scope:
      "A single room, or remotely with e-design: a floor plan, a shopping list with links and a call.",
    palette: [
      { name: "Paper", hex: "#D3CCBD", share: 5196 },
      { name: "Sand", hex: "#B8AA90", share: 4725 },
      { name: "Oak", hex: "#906C48", share: 2979 },
      { name: "Walnut floor", hex: "#4C321B", share: 6055 },
    ],
  },
];

/** Etapas montadas só com o que a fixture diz que acontece, na ordem em que acontece. */
export const PROCESS = [
  {
    n: "01",
    title: "Consultation",
    who: "Claire",
    body: "Two hours in your house, $350, talking through what you want.",
  },
  {
    n: "02",
    title: "A flat quote",
    who: "Claire",
    body: "After the visit we send a flat design fee, so you know the number before we start.",
  },
  {
    n: "03",
    title: "Design",
    who: "Claire",
    body: "Floor plans, finishes, lighting, furniture and art. Cabinetry drawings for kitchens and baths.",
  },
  {
    n: "04",
    title: "Orders",
    who: "Jess",
    body: "Furniture and fixtures ordered at our trade price and passed to you at cost plus 15%.",
  },
  {
    n: "05",
    title: "Install day",
    who: "Jess",
    body: "Jess runs the contractors, the orders and install day.",
  },
];

export const PEOPLE = [
  {
    name: "Claire Hollis",
    role: "Principal designer",
    note: "Opened the studio in 2017 after 8 years at an architecture firm.",
  },
  {
    name: "Jess Tran",
    role: "Project manager",
    note: "Runs contractors, orders and install day.",
  },
];

export const PROJECTS = [
  { name: "1920s Craftsman", place: "East Nashville", year: "2025" },
  { name: "Kitchen and two baths", place: "Belmont-Hillsboro foursquare", year: "2025" },
  { name: "Lake house", place: "Percy Priest Lake", year: "2024" },
  { name: "Loft", place: "Germantown", year: "2024" },
];

export const QUOTES = [
  {
    quote:
      "Claire talked us out of the expensive tile and into the right one. The kitchen feels like it was always there.",
    author: "Rachel & Tom",
    place: "Belmont-Hillsboro",
  },
  {
    quote:
      "Jess ran install day like a stage manager. We left for the weekend and came home to a finished house.",
    author: "David K.",
    place: "Percy Priest Lake",
  },
];

export const FAQ = [
  {
    q: "How do your fees work?",
    a: "Design fees are flat and quoted after the in-home consultation, so you know the number before we start.",
  },
  {
    q: "What about furniture and fixtures?",
    a: "We order at our trade price and pass it to you at cost plus 15%.",
  },
  {
    q: "How long does a project take?",
    a: "A single room takes 6–8 weeks, a kitchen or bath 3–5 months, a full home 4–9 months.",
  },
  {
    q: "Can I visit the studio?",
    a: "Yes, by appointment, Mon–Fri 9 AM – 5 PM, at 1104 Woodland St in East Nashville.",
  },
];

/** Opções do pedido de consulta (demonstração). Sem faixa de orçamento: a fixture não define. */
export const CONSULT_ROOMS = [
  { id: "whole", label: "The whole home" },
  { id: "kitchen", label: "Kitchen" },
  { id: "bath", label: "Bath" },
  { id: "living", label: "Living room" },
  { id: "bedroom", label: "Bedroom" },
  { id: "study", label: "Study" },
  { id: "other", label: "Another room" },
] as const;

export const CONSULT_PLACES = [
  { id: "nashville", label: "Nashville" },
  { id: "franklin", label: "Franklin" },
  { id: "brentwood", label: "Brentwood" },
  { id: "middle-tn", label: "Elsewhere in Middle Tennessee" },
  { id: "remote", label: "Somewhere else in the US" },
] as const;

export const CONSULT_TIMING = [
  { id: "soon", label: "As soon as we can start" },
  { id: "season", label: "In the next few months" },
  { id: "later", label: "Later this year or next" },
  { id: "planning", label: "Just planning for now" },
] as const;
