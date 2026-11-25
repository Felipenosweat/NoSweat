import type { Business, SectionOf, SiteSpec, TemplateId } from "@nosweat/schema";

// Dados estruturados (schema.org) do negócio de um site publicado, só com o que está no SiteSpec.
// Regra 8: nada inventado. Sem nota/estrelas (`aggregateRating`), sem depoimentos (`review`), sem
// preço que o dono não escreveu. O que não dá para ler com segurança (horário em texto livre,
// preço "a combinar", ramo vago) simplesmente fica de fora.

type JsonObject = { [key: string]: unknown };

// ---------- subtipo do LocalBusiness ----------

/** Tipos de comida: só eles aceitam `hasMenu` no schema.org (FoodEstablishment). */
const FOOD_TYPES = new Set([
  "FoodEstablishment",
  "Restaurant",
  "Bakery",
  "CafeOrCoffeeShop",
  "BarOrPub",
  "Brewery",
  "Winery",
  "IceCreamShop",
]);

/**
 * Ramo (business.category, em minúsculas) → subtipo do LocalBusiness. A primeira regra que bate
 * vale, então as mais específicas vêm antes ("nail salon" antes de "salon", "barbershop" antes de
 * "bar"). `templates` restringe palavras ambíguas ("painter" só é pintor de casa em home-services).
 * Ramos sem subtipo bom no schema.org (limpeza, fotografia, design, tutoria...) ficam LocalBusiness.
 */
const TYPE_RULES: { pattern: RegExp; type: string; templates?: TemplateId[] }[] = [
  // Casa e obra.
  { pattern: /\bplumb/, type: "Plumber" },
  { pattern: /\belectric(ian|al)\b/, type: "Electrician" },
  { pattern: /\b(hvac|heating|air condition|furnace)/, type: "HVACBusiness" },
  { pattern: /\broof/, type: "RoofingContractor" },
  { pattern: /\bhouse paint|\bpaint(er|ing) contractor/, type: "HousePainter" },
  { pattern: /\bpaint(er|ing)\b/, type: "HousePainter", templates: ["home-services"] },
  { pattern: /\blocksmith/, type: "Locksmith" },
  { pattern: /\b(movers|moving company)\b/, type: "MovingCompany" },
  { pattern: /\b(general contractor|remodel)/, type: "GeneralContractor" },
  {
    pattern: /\b(handyman|landscap|lawn care|contractor|construction|carpent)/,
    type: "HomeAndConstructionBusiness",
  },
  // Carro.
  { pattern: /\b(auto body|collision)/, type: "AutoBodyShop" },
  { pattern: /\b(auto repair|car repair|mechanic|auto shop)/, type: "AutoRepair" },
  // Beleza.
  { pattern: /\bbarber/, type: "BarberShop" },
  { pattern: /\bnail/, type: "NailSalon" },
  { pattern: /\btattoo/, type: "TattooParlor" },
  { pattern: /\b(hair|blow ?dry|blowout)/, type: "HairSalon" },
  { pattern: /\b(day spa|med spa|spa|massage)\b/, type: "DaySpa" },
  { pattern: /\b(salon|beauty|lash|brow|makeup|esthetic|aesthetic)/, type: "BeautySalon" },
  // Comida.
  { pattern: /\b(coffee|cafe|café|espresso)/, type: "CafeOrCoffeeShop" },
  { pattern: /\b(bakery|bakeries|baker|pastry|patisserie)/, type: "Bakery" },
  { pattern: /\bice cream|\bgelato/, type: "IceCreamShop" },
  { pattern: /\bbrewery/, type: "Brewery" },
  { pattern: /\bwinery/, type: "Winery" },
  { pattern: /\b(juice|smoothie)/, type: "FoodEstablishment" },
  // "bar" sozinho é ambíguo ("brow bar", "blow dry bar"): só no ramo de comida.
  { pattern: /\b(bar|pub|tavern)\b/, type: "BarOrPub", templates: ["restaurant"] },
  {
    pattern:
      /\b(restaurant|pizz|bistro|diner|grill|taqueria|barbecue|bbq|steakhouse|sushi|eatery|food truck)/,
    type: "Restaurant",
  },
  { pattern: /\bcater/, type: "FoodEstablishment" },
  // Saúde.
  { pattern: /\b(dentist|dental|orthodont)/, type: "Dentist" },
  { pattern: /\b(physical therap|physiotherap)/, type: "Physiotherapy" },
  { pattern: /\b(optometr|optician|eyewear)/, type: "Optician" },
  { pattern: /\b(veterinar|animal hospital)/, type: "VeterinaryCare" },
  { pattern: /\bchiropract/, type: "MedicalBusiness" },
  // Escritórios.
  { pattern: /\b(law|lawyer|attorney|legal)\b/, type: "LegalService" },
  {
    pattern: /\b(accounting|accountant|bookkeep|cpa|tax prep|tax practice)/,
    type: "AccountingService",
  },
  { pattern: /\binsurance/, type: "InsuranceAgency" },
  { pattern: /\b(real estate|realtor)/, type: "RealEstateAgent" },
  // Outros.
  { pattern: /\b(gym|fitness|crossfit|pilates|yoga)/, type: "ExerciseGym" },
  { pattern: /\bflorist/, type: "Florist" },
  { pattern: /\b(child ?care|daycare)/, type: "ChildCare" },
];

/**
 * Subtipo do schema.org para o negócio: pelo ramo escrito (`business.category`) quando uma regra
 * bate; senão, o template "restaurant" garante pelo menos FoodEstablishment; senão LocalBusiness.
 */
export function schemaTypeFor(category: string | undefined, template: TemplateId): string {
  const text = (category ?? "").trim().toLowerCase();
  if (text) {
    for (const rule of TYPE_RULES) {
      if (rule.templates && !rule.templates.includes(template)) continue;
      if (rule.pattern.test(text)) return rule.type;
    }
  }
  return template === "restaurant" ? "FoodEstablishment" : "LocalBusiness";
}

// ---------- horário ----------

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_INDEX: Record<string, number> = {
  mon: 0,
  monday: 0,
  tue: 1,
  tues: 1,
  tuesday: 1,
  wed: 2,
  weds: 2,
  wednesday: 2,
  thu: 3,
  thur: 3,
  thurs: 3,
  thursday: 3,
  fri: 4,
  friday: 4,
  sat: 5,
  saturday: 5,
  sun: 6,
  sunday: 6,
};

const ALL_WEEK = [0, 1, 2, 3, 4, 5, 6];
const DAY_GROUPS: Record<string, number[]> = {
  daily: ALL_WEEK,
  "every day": ALL_WEEK,
  everyday: ALL_WEEK,
  "7 days": ALL_WEEK,
  "7 days a week": ALL_WEEK,
  "seven days a week": ALL_WEEK,
  weekdays: [0, 1, 2, 3, 4],
  weekends: [5, 6],
  weekend: [5, 6],
};

const RANGE_SPLIT = /\s*(?:–|—|-|\bto\b|\bthrough\b|\bthru\b)\s*/;

/** Um dia ("Mon", "Tuesday", "Thu.") → índice 0–6 (segunda = 0). */
function dayIndex(word: string): number | undefined {
  return DAY_INDEX[word.trim().toLowerCase().replace(/\.$/, "")];
}

/**
 * Dias de uma linha do horário ("Mon–Fri", "Mon, Tue, Thu", "Sat & Sun", "Daily", "Weekends")
 * → índices em ordem. Qualquer pedaço desconhecido ("Emergencies", "Wed · truck at the
 * market") = `undefined`: melhor não dizer nada do que dizer errado.
 */
export function parseDays(text: string): number[] | undefined {
  const days = new Set<number>();
  const parts = text
    .trim()
    .toLowerCase()
    .split(/\s*(?:,|&|\+|\/|\band\b)\s*/);
  for (const part of parts) {
    if (!part) return undefined;
    const group = DAY_GROUPS[part];
    if (group) {
      for (const day of group) days.add(day);
      continue;
    }
    const ends = part.split(RANGE_SPLIT);
    if (ends.length === 1) {
      const day = dayIndex(part);
      if (day === undefined) return undefined;
      days.add(day);
    } else if (ends.length === 2) {
      const from = dayIndex(ends[0] ?? "");
      const to = dayIndex(ends[1] ?? "");
      if (from === undefined || to === undefined) return undefined;
      // "Fri–Mon" dá a volta na semana.
      for (let day = from; ; day = (day + 1) % 7) {
        days.add(day);
        if (day === to) break;
      }
    } else return undefined;
  }
  return days.size ? [...days].sort((a, b) => a - b) : undefined;
}

/** "7 AM", "7:30 pm", "noon", "midnight" → "HH:MM" (24 h). Sem AM/PM = ambíguo = `undefined`. */
function parseClock(text: string, role: "opens" | "closes"): string | undefined {
  const value = text.trim().toLowerCase();
  if (value === "noon") return "12:00";
  // Fechar à meia-noite é "23:59" (o Google lê "00:00" no fechamento como o começo do dia).
  if (value === "midnight") return role === "closes" ? "23:59" : "00:00";
  const match = value.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?$/);
  if (!match) return undefined;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (hour < 1 || hour > 12 || minute > 59) return undefined;
  const hour24 = (hour % 12) + (match[3] === "p" ? 12 : 0);
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

type TimeRange = { opens: string; closes: string };

/**
 * Horas de uma linha ("7 AM – 6 PM", "11 AM – 2 PM, 5 PM – 9 PM", "Closed", "Open 24 hours")
 * → faixas. "Closed" = lista vazia (o dia simplesmente não entra). Texto que não é horário
 * ("by appointment", "sold out", "8–5") = `undefined`.
 */
export function parseTimes(text: string): TimeRange[] | undefined {
  const value = text.trim().toLowerCase();
  if (value === "closed") return [];
  if (/^(open )?24 ?(hours|hrs|h)$|^24\/7$/.test(value))
    return [{ opens: "00:00", closes: "23:59" }];
  const ranges: TimeRange[] = [];
  for (const part of value.split(/\s*(?:,|;|&|\band\b)\s*/)) {
    const ends = part.split(RANGE_SPLIT);
    if (ends.length !== 2) return undefined;
    const opens = parseClock(ends[0] ?? "", "opens");
    const closes = parseClock(ends[1] ?? "", "closes");
    if (!opens || !closes) return undefined;
    ranges.push({ opens, closes });
  }
  return ranges.length ? ranges : undefined;
}

/**
 * `openingHoursSpecification` a partir de `business.hours`, só se TODAS as linhas forem lidas com
 * segurança (um horário pela metade pareceria dizer que os outros dias estão fechados).
 */
export function openingHoursSpecification(hours: Business["hours"]): JsonObject[] | undefined {
  if (!hours?.length) return undefined;
  const specs: JsonObject[] = [];
  for (const row of hours) {
    const days = parseDays(row.days);
    const times = parseTimes(row.time);
    if (!days || !times) return undefined;
    for (const range of times) {
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: days.map((day) => WEEK[day]),
        opens: range.opens,
        closes: range.closes,
      });
    }
  }
  return specs.length ? specs : undefined;
}

// ---------- preços ----------

/** Preço lido do texto do dono, em dólares. `open` = "a partir de" (sem teto). */
export type ParsedPrice = { min: number; max: number; open: boolean };

const AMOUNT = String.raw`\$\s?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{2}))?`;
const EXACT = new RegExp(`^${AMOUNT}$`);
const FROM = new RegExp(`^(?:from|starting at|starts at)\\s+${AMOUNT}\\+?$|^${AMOUNT}\\+$`);
const RANGE = new RegExp(
  `^${AMOUNT}\\s*(?:–|—|-|to)\\s*(?:\\$\\s?)?(\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.(\\d{2}))?$`,
);

const amountOf = (whole: string | undefined, cents: string | undefined) =>
  Number(`${(whole ?? "").replace(/,/g, "")}.${cents ?? "00"}`);

/**
 * Só os formatos sem dúvida: "$45", "from $149", "$85+", "$45–$60". "$45/hr", "Call for a
 * quote", "up to $200"... = `undefined` (fica sem preço nos dados estruturados).
 */
export function parsePrice(text: string | undefined): ParsedPrice | undefined {
  const value = text?.trim().toLowerCase();
  if (!value) return undefined;
  let match = value.match(EXACT);
  if (match) {
    const amount = amountOf(match[1], match[2]);
    return { min: amount, max: amount, open: false };
  }
  match = value.match(FROM);
  if (match) {
    const amount = match[1] ? amountOf(match[1], match[2]) : amountOf(match[3], match[4]);
    return { min: amount, max: amount, open: true };
  }
  match = value.match(RANGE);
  if (match) {
    const min = amountOf(match[1], match[2]);
    const max = amountOf(match[3], match[4]);
    return max > min ? { min, max, open: false } : undefined;
  }
  return undefined;
}

/** 45 → "45"; 12.5 → "12.50". */
const money = (amount: number) => (Number.isInteger(amount) ? String(amount) : amount.toFixed(2));

/** Oferta do schema.org para um preço lido (preço exato ou faixa). */
function offerPrice(price: ParsedPrice): JsonObject {
  if (price.min === price.max && !price.open) {
    return { price: money(price.min), priceCurrency: "USD" };
  }
  return {
    priceSpecification: {
      "@type": "PriceSpecification",
      priceCurrency: "USD",
      minPrice: money(price.min),
      maxPrice: price.open ? undefined : money(price.max),
    },
  };
}

/**
 * `priceRange` ("$12–$320", "$149+") só com os preços que o dono escreveu e que deu para ler.
 * Nenhum preço = `undefined` (nunca "$$" adivinhado).
 */
export function priceRangeOf(prices: ParsedPrice[]): string | undefined {
  if (!prices.length) return undefined;
  const low = Math.min(...prices.map((p) => p.min));
  const high = Math.max(...prices.map((p) => p.max));
  // O mais alto só tem "a partir de": a faixa fica aberta.
  const open = prices.some((p) => p.open && p.max === high);
  if (low === high) return `$${money(low)}${open ? "+" : ""}`;
  return `$${money(low)}–$${money(high)}${open ? "+" : ""}`;
}

// ---------- área atendida ----------

const AREA_NOTE = /^(nearby|surrounding|the surrounding|more|and more|other)\b/i;

/**
 * Lugares da área atendida ("Austin, Round Rock and nearby" → ["Austin", "Round Rock"]). Mesma
 * regra de `areaPlaces` em packages/templates (compositions/shared.tsx), que o site mostra.
 */
export function areaServedOf(serviceArea: string | undefined): string | string[] | undefined {
  const places = (serviceArea ?? "")
    .split(/\s*(?:,|;|\/|\band\b|&)\s*/i)
    .map((part) => part.trim())
    .filter((part) => part && !AREA_NOTE.test(part));
  if (places.length === 0) return serviceArea?.trim() || undefined;
  return places.length === 1 ? places[0] : places;
}

// ---------- endereço ----------

const US_STATES = new Set(
  (
    "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ " +
    "NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC PR GU VI AS MP"
  ).split(" "),
);

function postalAddress(business: Business): JsonObject | undefined {
  if (!business.address && !business.city && !business.state) return undefined;
  const state = business.state?.toUpperCase();
  return {
    "@type": "PostalAddress",
    streetAddress: business.address || undefined,
    addressLocality: business.city || undefined,
    addressRegion: business.state || undefined,
    // Sigla de estado dos EUA: o país é dedução, não invenção.
    addressCountry: state && US_STATES.has(state) ? "US" : undefined,
  };
}

// ---------- serviços / cardápio ----------

type ServiceItem = SectionOf<"services">["items"][number];

function serviceItems(spec: SiteSpec): { title?: string; items: ServiceItem[] } {
  const sections = spec.sections.filter(
    (section): section is SectionOf<"services"> => section.type === "services",
  );
  return {
    title: sections.find((section) => section.title)?.title,
    items: sections.flatMap((section) => section.items).filter((item) => item.name.trim()),
  };
}

function menuItem(item: ServiceItem): JsonObject {
  const price = parsePrice(item.price);
  return {
    "@type": "MenuItem",
    name: item.name,
    description: item.description || undefined,
    offers: price ? { "@type": "Offer", ...offerPrice(price) } : undefined,
  };
}

/** Cardápio: o link do dono (`links.menu`) ou os itens da seção de serviços, por grupo. */
function menuOf(spec: SiteSpec, items: ServiceItem[], title?: string): unknown {
  if (spec.business.links?.menu) return spec.business.links.menu;
  if (!items.length) return undefined;
  const loose = items.filter((item) => !item.group);
  const groups = new Map<string, ServiceItem[]>();
  for (const item of items) {
    if (!item.group) continue;
    groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
  }
  return {
    "@type": "Menu",
    name: title || undefined,
    hasMenuSection: groups.size
      ? [...groups].map(([name, list]) => ({
          "@type": "MenuSection",
          name,
          hasMenuItem: list.map(menuItem),
        }))
      : undefined,
    hasMenuItem: loose.length ? loose.map(menuItem) : undefined,
  };
}

function offerCatalogOf(items: ServiceItem[], title?: string): JsonObject | undefined {
  if (!items.length) return undefined;
  return {
    "@type": "OfferCatalog",
    name: title || "Services",
    itemListElement: items.map((item) => {
      const price = parsePrice(item.price);
      return {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: item.name,
          description: item.description || undefined,
        },
        ...(price ? offerPrice(price) : {}),
      };
    }),
  };
}

// ---------- tudo junto ----------

/** Redes e perfis do dono que viram `sameAs` (agendar, pedir e cardápio não são perfis). */
const PROFILE_LINKS = ["instagram", "facebook", "tiktok", "google", "yelp", "linkedin"] as const;

/** Foto do site → endereço absoluto (as fotos dos exemplos ficam em /photos na plataforma). */
function absoluteUrl(url: string, origin: string): string {
  return url.startsWith("/") ? `${origin}${url}` : url;
}

export type BusinessJsonLdOptions = {
  /** Endereço oficial do site (canonical). */
  url: string;
  /** Origem da plataforma (para as fotos em /photos e o ícone). */
  origin: string;
  /** Ícone do site (180 px), caminho a partir da origem. Vira o `logo`. */
  logoPath?: string;
};

/**
 * Objeto JSON-LD do negócio (sem escapar). Só campos com dado do dono; `undefined` some no
 * JSON.stringify.
 */
export function businessJsonLd(spec: SiteSpec, options: BusinessJsonLdOptions): JsonObject {
  const { business } = spec;
  const type = schemaTypeFor(business.category, spec.template);
  const hero = spec.sections.find(
    (section): section is SectionOf<"hero"> => section.type === "hero",
  );
  const { title, items } = serviceItems(spec);
  const prices = items.flatMap((item) => parsePrice(item.price) ?? []);
  const sameAs = PROFILE_LINKS.flatMap((key) => business.links?.[key] ?? []);
  const food = FOOD_TYPES.has(type);

  return {
    "@context": "https://schema.org",
    "@type": type,
    name: business.name,
    description: hero?.subtitle.trim() || undefined,
    url: options.url,
    telephone: business.phone || undefined,
    email: business.email || undefined,
    address: postalAddress(business),
    areaServed: areaServedOf(business.serviceArea),
    openingHoursSpecification: openingHoursSpecification(business.hours),
    image: hero?.image ? absoluteUrl(hero.image.url, options.origin) : undefined,
    logo: options.logoPath ? `${options.origin}${options.logoPath}` : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    priceRange: priceRangeOf(prices),
    hasMenu: food ? menuOf(spec, items, title) : undefined,
    hasOfferCatalog: food ? undefined : offerCatalogOf(items, title),
  };
}
