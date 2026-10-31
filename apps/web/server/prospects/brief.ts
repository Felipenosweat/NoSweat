import type { ProspectRecord } from "./types";

// Pedido (brief) da prévia de um prospect: SÓ os fatos públicos que o Google Places devolveu
// (nome, ramo, cidade/estado, telefone, endereço, horário). Nada de nota, número de avaliações,
// e-mail ou site antigo: a regra 8 do CLAUDE.md proíbe afirmações que não vieram do dono, e a nota
// do Google não é dele. A última frase lembra o gerador de não inventar nada.

const MAX_BRIEF = 1900;

const clean = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim();

function sentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

export const NO_INVENTION_NOTE =
  "Use only the facts above. Do not add testimonials, ratings, reviews, awards, licenses, guarantees, years in business, prices or same-day promises.";

export type BriefFacts = Pick<
  ProspectRecord,
  "name" | "category" | "city" | "state" | "phone" | "address" | "hours"
> & {
  /** O ramo que o admin buscou ("plumber"), usado quando o Places não tem categoria. */
  trade?: string | null;
};

export function buildPreviewBrief(facts: BriefFacts): string {
  const name = clean(facts.name);
  const trade = clean(facts.category) || clean(facts.trade);
  const location = [clean(facts.city), clean(facts.state).toUpperCase()].filter(Boolean).join(", ");
  // Começa pelo nome ("Joe's Plumbing is a plumber business based in Austin, TX."): é o formato
  // que o gerador (e o modo sem IA) reconhece melhor.
  const intro = [
    name,
    trade
      ? `is ${/^[aeiou]/i.test(trade) ? "an" : "a"} ${trade.toLowerCase()} business`
      : "is a local business",
    location ? `based in ${location}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const parts = [
    sentence(intro),
    clean(facts.phone) ? sentence(`Phone: ${clean(facts.phone)}`) : "",
    clean(facts.address) ? sentence(`Address: ${clean(facts.address)}`) : "",
  ].filter(Boolean);
  const hours = facts.hours.map(clean).filter(Boolean);
  const paragraphs = [parts.join(" ")];
  if (hours.length) paragraphs.push(`Hours: ${hours.join("; ")}.`);
  paragraphs.push(NO_INVENTION_NOTE);
  const brief = paragraphs.join("\n\n");
  return brief.length > MAX_BRIEF ? brief.slice(0, MAX_BRIEF) : brief;
}

/** "plumber in Austin, TX" → "plumber" (o ramo da busca que achou o prospect). */
export function tradeFromSearch(search: string | null): string | null {
  const match = /^(.*?)\s+in\s+/i.exec(search ?? "");
  const trade = match?.[1]?.trim() || null;
  // Busca "qualquer empresa": o ramo de verdade é a categoria de cada uma, não "local businesses".
  return trade && trade.toLowerCase() === "local businesses" ? null : trade;
}
