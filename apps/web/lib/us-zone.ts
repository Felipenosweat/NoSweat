// Nome e sigla americanos do fuso da empresa ("Eastern Time", "ET") para e-mails e telas do cliente.
// Mesma lista de packages/templates/src/sections/booking-format.ts (os sites usam a de lá).

const US_ZONES: Record<string, { name: string; abbr: string }> = {
  "America/New_York": { name: "Eastern Time", abbr: "ET" },
  "America/Chicago": { name: "Central Time", abbr: "CT" },
  "America/Denver": { name: "Mountain Time", abbr: "MT" },
  "America/Phoenix": { name: "Mountain Standard Time", abbr: "MST" },
  "America/Los_Angeles": { name: "Pacific Time", abbr: "PT" },
  "America/Anchorage": { name: "Alaska Time", abbr: "AKT" },
  "Pacific/Honolulu": { name: "Hawaii Time", abbr: "HT" },
  "America/Puerto_Rico": { name: "Atlantic Standard Time", abbr: "AST" },
};

/** "ET", "PT"...; fuso fora da lista: a abreviação do Intl ("GMT+1") ou o próprio nome. */
export function zoneAbbr(iso: string, timeZone: string): string {
  const us = US_ZONES[timeZone];
  if (us) return us.abbr;
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
      .formatToParts(new Date(iso))
      .find((item) => item.type === "timeZoneName");
    return part?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}
