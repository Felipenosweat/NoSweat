// Convenções dos EUA para o assistente: estados, fusos horários e feriados nacionais.
// Puro (sem React, sem servidor e sem relógio: o ano vem de fora).

export const US_STATES: readonly { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

export const US_TIME_ZONES: readonly { id: string; label: string }[] = [
  { id: "America/New_York", label: "Eastern Time (ET)" },
  { id: "America/Chicago", label: "Central Time (CT)" },
  { id: "America/Denver", label: "Mountain Time (MT)" },
  { id: "America/Phoenix", label: "Arizona (MST, no daylight saving)" },
  { id: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { id: "America/Anchorage", label: "Alaska Time (AKT)" },
  { id: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
];

const BY_STATE: Record<string, string> = {
  // Leste (estados divididos ao meio ficam com o fuso da maior parte).
  CT: "America/New_York",
  DE: "America/New_York",
  DC: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  IN: "America/New_York",
  KY: "America/New_York",
  ME: "America/New_York",
  MD: "America/New_York",
  MA: "America/New_York",
  MI: "America/New_York",
  NH: "America/New_York",
  NJ: "America/New_York",
  NY: "America/New_York",
  NC: "America/New_York",
  OH: "America/New_York",
  PA: "America/New_York",
  RI: "America/New_York",
  SC: "America/New_York",
  VT: "America/New_York",
  VA: "America/New_York",
  WV: "America/New_York",
  // Central.
  AL: "America/Chicago",
  AR: "America/Chicago",
  IL: "America/Chicago",
  IA: "America/Chicago",
  KS: "America/Chicago",
  LA: "America/Chicago",
  MN: "America/Chicago",
  MS: "America/Chicago",
  MO: "America/Chicago",
  NE: "America/Chicago",
  ND: "America/Chicago",
  OK: "America/Chicago",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  WI: "America/Chicago",
  // Montanhas.
  CO: "America/Denver",
  ID: "America/Denver",
  MT: "America/Denver",
  NM: "America/Denver",
  UT: "America/Denver",
  WY: "America/Denver",
  // Arizona não muda para o horário de verão.
  AZ: "America/Phoenix",
  // Pacífico.
  CA: "America/Los_Angeles",
  NV: "America/Los_Angeles",
  OR: "America/Los_Angeles",
  WA: "America/Los_Angeles",
  AK: "America/Anchorage",
  HI: "Pacific/Honolulu",
};

/** Fuso padrão de um estado ("FL" → Eastern); `null` se o estado não é conhecido. */
export function timeZoneForState(state: string | null | undefined): string | null {
  return BY_STATE[(state ?? "").trim().toUpperCase()] ?? null;
}

/** Nome do fuso para mostrar ("Eastern Time (ET)"); o próprio id se não for dos EUA. */
export function timeZoneLabel(id: string): string {
  return US_TIME_ZONES.find((zone) => zone.id === id)?.label ?? id;
}

// ---------- feriados ----------

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

/** n-ésimo dia da semana do mês (weekday 0 = domingo; month 1-12). */
function nthWeekday(year: number, month: number, weekday: number, n: number): string {
  const firstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return iso(year, month, 1 + ((weekday - firstDay + 7) % 7) + (n - 1) * 7);
}

/** Último dia da semana do mês. */
function lastWeekday(year: number, month: number, weekday: number): string {
  const last = new Date(Date.UTC(year, month, 0));
  return iso(year, month, last.getUTCDate() - ((last.getUTCDay() - weekday + 7) % 7));
}

export type Holiday = { id: string; label: string; date: string };

/** Os feriados nacionais mais comuns do ano, em ordem de data ("AAAA-MM-DD"). */
export function usHolidays(year: number): Holiday[] {
  return [
    { id: "new-year", label: "New Year’s Day", date: iso(year, 1, 1) },
    { id: "mlk", label: "Martin Luther King Jr. Day", date: nthWeekday(year, 1, 1, 3) },
    { id: "presidents", label: "Presidents’ Day", date: nthWeekday(year, 2, 1, 3) },
    { id: "memorial", label: "Memorial Day", date: lastWeekday(year, 5, 1) },
    { id: "juneteenth", label: "Juneteenth", date: iso(year, 6, 19) },
    { id: "july4", label: "Independence Day", date: iso(year, 7, 4) },
    { id: "labor", label: "Labor Day", date: nthWeekday(year, 9, 1, 1) },
    { id: "thanksgiving", label: "Thanksgiving", date: nthWeekday(year, 11, 4, 4) },
    { id: "xmas-eve", label: "Christmas Eve", date: iso(year, 12, 24) },
    { id: "xmas", label: "Christmas Day", date: iso(year, 12, 25) },
  ];
}

/** Telefone dos EUA enquanto digita: "5125550100" → "(512) 555-0100" (ignora o +1). */
export function formatUsPhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** CEP de 5 dígitos (só números). */
export function cleanZip(input: string): string {
  return input.replace(/\D/g, "").slice(0, 5);
}
