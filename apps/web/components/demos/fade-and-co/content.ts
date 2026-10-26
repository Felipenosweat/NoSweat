import { MODEL_LIBRARY } from "@nosweat/fixtures";
import type { SectionOf, SectionType } from "@nosweat/schema";

// Fatos da demonstração Fade & Co. Barbers. A fonte é o site-modelo da biblioteca
// (packages/fixtures/src/library/fade-and-co-barbers.ts): nome, endereço, telefone, preços,
// barbeiros, horário e perguntas vêm de lá, nada é reescrito aqui (regra 8: nenhum fato
// inventado). Só roda no servidor (page.tsx); os componentes de cliente recebem os dados prontos.

const entry = MODEL_LIBRARY.find((item) => item.slug === "fade-and-co-barbers");
if (!entry) throw new Error("fade-and-co-barbers não está na biblioteca de fixtures");
const spec = entry.spec;

function section<T extends SectionType>(type: T): SectionOf<T> {
  const found = spec.sections.find((item): item is SectionOf<T> => item.type === type);
  if (!found) throw new Error(`fade-and-co-barbers sem a seção ${type}`);
  return found;
}

export const BUSINESS = spec.business;
export const HERO = section("hero");
export const ABOUT = section("about");
export const REVIEWS = section("testimonials").items;
export const FAQ = section("faq").items;

const servicesSection = section("services");

export type Service = {
  id: string;
  group: string;
  name: string;
  description: string;
  price: string;
  /** "40 min"; vazio quando o dono não informou (corte infantil). */
  detail: string;
  /** Minutos para montar a grade de horários da demonstração (30 quando não informado). */
  minutes: number;
};

export const SERVICES: Service[] = servicesSection.items.map((item) => ({
  id: item.name.toLowerCase().replace(/[^a-z]+/g, "-"),
  group: item.group ?? "",
  name: item.name,
  description: item.description ?? "",
  price: item.price ?? "",
  detail: item.detail ?? "",
  minutes: Number.parseInt(item.detail ?? "", 10) || 30,
}));

export const SERVICE_GROUPS = [...new Set(SERVICES.map((item) => item.group))];

export type Barber = { id: string; first: string; name: string; role: string; note: string };

export const BARBERS: Barber[] = (ABOUT.people ?? []).map((person) => ({
  id: person.name.split(" ")[0]?.toLowerCase() ?? person.name,
  first: person.name.split(" ")[0] ?? person.name,
  name: person.name,
  role: person.role ?? "",
  note: person.note ?? "",
}));

// ---------- Horário: do texto do dono ("Tue–Fri", "10 AM – 8 PM") para números ----------

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function parseTime(text: string): number {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(text.trim());
  if (!match) throw new Error(`horário ilegível: ${text}`);
  const hour = Number(match[1]) % 12;
  const minutes = Number(match[2] ?? 0);
  return (hour + (match[3]?.toUpperCase() === "PM" ? 12 : 0)) * 60 + minutes;
}

function parseDays(text: string): number[] {
  const [from, to] = text.split(/\s*[–-]\s*/);
  const start = DAY_NAMES.indexOf((from ?? "") as (typeof DAY_NAMES)[number]);
  const end = to ? DAY_NAMES.indexOf(to as (typeof DAY_NAMES)[number]) : start;
  if (start < 0 || end < 0) throw new Error(`dias ilegíveis: ${text}`);
  const days: number[] = [];
  for (let day = start; ; day = (day + 1) % 7) {
    days.push(day);
    if (day === end) break;
  }
  return days;
}

/** Abertura e fechamento (minutos desde a meia-noite) por dia da semana (0 = domingo). */
export type OpenHours = Record<number, { open: number; close: number } | undefined>;

export const OPEN_HOURS: OpenHours = {};
for (const row of BUSINESS.hours ?? []) {
  const [open, close] = row.time.split(/\s*[–-]\s*/).map(parseTime);
  if (open === undefined || close === undefined) throw new Error(`horário ilegível: ${row.time}`);
  for (const day of parseDays(row.days)) OPEN_HOURS[day] = { open, close };
}

/** Dias fechados, por extenso ("Monday"), deduzidos do horário. */
export const CLOSED_DAYS = DAY_NAMES.map((_, day) => day)
  .filter((day) => !OPEN_HOURS[day])
  .map((day) =>
    new Date(Date.UTC(2024, 0, 7 + day)).toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }),
  );

/** Fatos práticos do pedido do dono que não têm campo próprio no SiteSpec. */
export const PRACTICAL = {
  walkIns: FAQ.find((item) => item.q.toLowerCase().includes("walk-in"))?.a ?? "",
  cancel: FAQ.find((item) => item.q.toLowerCase().includes("cancel"))?.a ?? "",
  parking: FAQ.find((item) => item.q.toLowerCase().includes("park"))?.a ?? "",
  cards: FAQ.find((item) => item.q.toLowerCase().includes("card"))?.a ?? "",
  specific: FAQ.find((item) => item.q.toLowerCase().includes("specific barber"))?.a ?? "",
};

export const PHONE_HREF = `tel:+1${BUSINESS.phone?.replace(/\D/g, "") ?? ""}`;
export const MAP_HREF = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${BUSINESS.address}, ${BUSINESS.city}, ${BUSINESS.state}`,
)}`;
