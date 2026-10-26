import { PHOTOS, type AureliaPhoto } from "./photos";

// Conteúdo da demonstração Aurelia Royal Estate: um hotel-palácio FICTÍCIO (nome, lago, datas,
// suítes e preços inventados para a demonstração, coerentes entre si). Nada aqui fala de um
// lugar, prêmio ou parceiro de verdade. Texto em inglês (a interface do produto é em inglês).

export const ESTATE = {
  name: "Aurelia Royal Estate",
  place: "Lake Valcora",
  founded: "1789",
  address: "Via dei Cedri 1, Lake Valcora",
  email: "concierge@aurelia.example",
};

export const FACTS = [
  { value: "48", label: "Suites and apartments" },
  { value: "212", label: "Acres of gardens" },
  { value: "1789", label: "Year the palace was finished" },
];

export type Suite = {
  id: string;
  name: string;
  short: string;
  photo: AureliaPhoto;
  size: string;
  view: string;
  guests: string;
  from: string;
  body: string;
};

export const SUITES: Suite[] = [
  {
    id: "queens-apartment",
    name: "The Queen’s Apartment",
    short: "Queen’s Apartment",
    photo: PHOTOS.library,
    size: "142 m²",
    view: "Lake and allée",
    guests: "Up to 4 guests",
    from: "€2,400",
    body: "Three rooms of walnut panelling on the piano nobile, with the library the queen used for her letters and a balcony over the water.",
  },
  {
    id: "orangery-suite",
    name: "The Orangery Suite",
    short: "Orangery Suite",
    photo: PHOTOS.armchair,
    size: "86 m²",
    view: "Citrus garden",
    guests: "Up to 2 guests",
    from: "€1,450",
    body: "Brocade, morning light and the scent of the lemon trees below. A writing desk faces the garden; breakfast arrives on the terrace.",
  },
  {
    id: "lake-chamber",
    name: "The Lake Chamber",
    short: "Lake Chamber",
    photo: PHOTOS.bed,
    size: "64 m²",
    view: "Lake Valcora",
    guests: "Up to 2 guests",
    from: "€980",
    body: "Our quietest rooms, set in the old summer wing. Linen dressed by hand each evening and shutters that open onto the lake at dawn.",
  },
  {
    id: "ballroom-residence",
    name: "The Ballroom Residence",
    short: "Ballroom Residence",
    photo: PHOTOS.salon,
    size: "210 m²",
    view: "Courtyard and ballroom",
    guests: "Up to 6 guests",
    from: "€5,200",
    body: "The private salons above the ballroom, restored with their gilding and chandeliers, with a dining room for twelve and a butler on call.",
  },
];

export type Experience = {
  id: string;
  numeral: string;
  name: string;
  photo: AureliaPhoto;
  body: string;
  details: string[];
};

export const EXPERIENCES: Experience[] = [
  {
    id: "gilded-table",
    numeral: "I",
    name: "The Gilded Table",
    photo: PHOTOS.dining,
    body: "Dinner is served in the long gallery under brass lamps. The kitchen cooks from the estate’s gardens and the fishermen of the lake.",
    details: ["Dinner from 7:30 pm", "Tasting menu and à la carte", "Jacket requested"],
  },
  {
    id: "hammam",
    numeral: "II",
    name: "The Hammam",
    photo: PHOTOS.hammam,
    body: "Warm marble, carved lattice and steam. Rituals take ninety minutes and begin with a scrub of olive soap and lake salt.",
    details: ["Open 9 am to 9 pm", "Rituals by appointment", "Indoor pool for guests"],
  },
  {
    id: "allee",
    numeral: "III",
    name: "The Allée",
    photo: PHOTOS.allee,
    body: "Two hundred acres of clipped avenues, a canal and a lemon house. Our gardeners lead a walk each morning before the heat.",
    details: ["Garden walk at 8 am", "Picnics on request", "Rowing boats at the canal"],
  },
  {
    id: "ballroom",
    numeral: "IV",
    name: "Evenings in the Ballroom",
    photo: PHOTOS.hall,
    body: "On Saturdays the ballroom opens for a string quartet and dancing. It can also be reserved for weddings and private dinners.",
    details: ["Saturdays from 9 pm", "Private events for up to 220", "Ask the concierge"],
  },
];

export const GALLERY: { photo: AureliaPhoto; caption: string; shape: "arch" | "frame" }[] = [
  { photo: PHOTOS.stair, caption: "The grand staircase", shape: "arch" },
  { photo: PHOTOS.crystals, caption: "Chandelier, east salon", shape: "frame" },
  { photo: PHOTOS.balcony, caption: "The lake facade", shape: "frame" },
  { photo: PHOTOS.coffer, caption: "Ceiling of the chapel", shape: "arch" },
  { photo: PHOTOS.feast, caption: "A wedding supper", shape: "frame" },
  { photo: PHOTOS.canal, caption: "The canal at evening", shape: "frame" },
  { photo: PHOTOS.lion, caption: "Gilding in the throne room", shape: "arch" },
  { photo: PHOTOS.pool, caption: "The winter pool", shape: "frame" },
  { photo: PHOTOS.stone, caption: "The garden gate", shape: "arch" },
];

export const NAV = [
  { href: "#estate", label: "The Estate" },
  { href: "#suites", label: "Suites" },
  { href: "#experiences", label: "Experiences" },
  { href: "#gallery", label: "Gallery" },
];
