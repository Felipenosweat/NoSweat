import { formatUsPhone, isUsStateCode, phonesIn, type BriefFacts } from "./model-fill";

// Leitura dos fatos do pedido SEM IA (modo modelo e mock do dev). O /create monta o pedido em
// frases fixas (app/(dashboard)/create/brief.ts, composeBrief):
//   "The business is called X." · "<o que faz>." · "Based in Cidade, UF." ·
//   "Service area: …." · "Phone: …."
// Essas frases são lidas primeiro; pedidos livres (da landing ou da API) caem nas expressões
// mais soltas. Nada aqui inventa: cada valor é um pedaço do texto do dono.

/** Abreviações que vêm ANTES de um nome ("St. Louis", "Dr. Lee"): o ponto não fecha a frase. */
const PREFIX_ABBREVIATIONS = new Set(["st", "mt", "ft", "pt", "dr", "mr", "mrs", "ms"]);
/** Abreviações que fecham um nome ("Joe's Plumbing Co."): o ponto faz parte do nome. */
const SUFFIX_ABBREVIATIONS = new Set(["co", "inc", "ltd", "llc", "corp", "bros", "jr", "sr"]);

/**
 * Onde termina a frase que começa em `from`: no fim da linha ou num ".", "!" ou "?" seguido de
 * espaço (ou do fim do texto). Pontos de abreviação ("St.") e de iniciais ("J. Smith") e pontos
 * no meio de números ("512.555.0142") não contam.
 */
function sentenceEnd(text: string, from: number): number {
  for (let i = from; i < text.length; i += 1) {
    const char = text[i];
    if (char === "\n") return i;
    if (char !== "." && char !== "!" && char !== "?") continue;
    const next = text[i + 1];
    if (next !== undefined && !/\s/.test(next)) continue;
    if (char === ".") {
      const word = /(?:^|[^A-Za-z])([A-Za-z]+)$/.exec(text.slice(from, i))?.[1] ?? "";
      if (PREFIX_ABBREVIATIONS.has(word.toLowerCase()) || /^[A-Z]$/.test(word)) continue;
    }
    return i;
  }
  return text.length;
}

type Labeled = { value: string; start: number; end: number };

/**
 * Valor de uma frase com rótulo ("Phone: …", "Based in …"): o texto depois do rótulo até o fim
 * da frase. `start`/`end` cobrem a frase inteira (com a pontuação final), para tirá-la do texto.
 * `isName`: o ponto de "Co."/"Inc." no fim faz parte do nome (num lugar, "CO." é o estado).
 */
function labeled(text: string, label: RegExp, isName = false): Labeled | undefined {
  const match = label.exec(text);
  if (!match) return undefined;
  const valueStart = match.index + match[0].length;
  const stop = sentenceEnd(text, valueStart);
  let value = text.slice(valueStart, stop).trim();
  const closing = text[stop];
  if (closing === "!" || closing === "?") value += closing;
  if (closing === "." && isName) {
    const last = /([A-Za-z]+)$/.exec(value)?.[1]?.toLowerCase() ?? "";
    if (SUFFIX_ABBREVIATIONS.has(last)) value += ".";
  }
  const end = stop < text.length && text[stop] !== "\n" ? stop + 1 : stop;
  return value ? { value, start: match.index, end } : undefined;
}

const NAME_RE = /(?:^|\s)The business is called\s+/;
const LOCATION_RE = /(?:^|\s)Based in\s+/;
const AREA_RE = /(?:^|\s)Service area:\s*/i;
const PHONE_RE = /(?:^|\s)Phone:\s*/i;

/** Primeiras palavras que mostram que o começo do texto é uma frase, não um nome. */
const NOT_A_NAME_START = new Set([
  "the",
  "we",
  "we're",
  "were",
  "our",
  "us",
  "i",
  "i'm",
  "im",
  "my",
  "a",
  "an",
  "this",
  "it",
  "its",
  "it's",
  "you",
  "your",
  "family",
  "local",
  "locally",
  "best",
  "welcome",
  "hello",
  "hi",
  "based",
  "serving",
  "service",
  "services",
  "phone",
  "call",
  "open",
  "type",
  "style",
  "professional",
  "quality",
  "affordable",
]);

/** Palavras que podem ficar em minúsculas dentro de um nome ("House of Fades"). */
const NAME_CONNECTORS = new Set(["&", "and", "of", "the", "de", "la", "del", "y", "on", "at"]);

/** O texto tem cara de nome de negócio? (curto, cada palavra com maiúscula, sem ser uma frase) */
export function looksLikeName(candidate: string): boolean {
  const name = candidate.trim();
  if (!name || name.length > 60 || !/^[A-Z0-9]/.test(name)) return false;
  // Um ponto no meio só vale em abreviação ("St. Louis", "Sparkle & Co. Cleaning") ou inicial.
  const withoutAbbreviations = name.replace(
    /\b(?:St|Mt|Ft|Pt|Dr|Mr|Mrs|Ms|Co|Inc|Ltd|LLC|Corp|Bros|Jr|Sr|[A-Z])\.(?=\s)/g,
    "X",
  );
  if (/[.!?]\s/.test(withoutAbbreviations)) return false;
  const words = name.split(/\s+/);
  if (words.length > 6) return false;
  const first = (words[0] ?? "").toLowerCase().replace(/[’]/g, "'");
  if (NOT_A_NAME_START.has(first)) return false;
  return words.every(
    (word, i) => /^[A-Z0-9&"'“(]/.test(word) || (i > 0 && NAME_CONNECTORS.has(word.toLowerCase())),
  );
}

/** Nome no início de um pedido livre ("Joe's Plumbing in Austin..." → "Joe's Plumbing"). */
function nameAtStart(brief: string): string | undefined {
  const first = brief.split("\n")[0]?.trim() ?? "";
  const cut = [",", " is ", " in ", " at ", " - ", " – ", " — "]
    .map((sep) => first.indexOf(sep))
    .filter((i) => i > 0)
    .sort((a, b) => a - b)[0];
  const name = (cut === undefined ? "" : first.slice(0, cut)).trim();
  return looksLikeName(name) ? name : undefined;
}

/** Nome do negócio: a frase "The business is called X." ou o começo de um pedido livre. */
export function nameFromBrief(brief: string): string | undefined {
  const called = labeled(brief, NAME_RE, true)?.value;
  if (called && called.length <= 80) return called;
  return nameAtStart(brief);
}

/** Telefone do pedido no formato (512) 555-0142: o da frase "Phone:", senão o primeiro. */
export function phoneFromBrief(brief: string): string | undefined {
  const line = labeled(brief, PHONE_RE)?.value;
  const candidates = [...(line ? phonesIn(line) : []), ...phonesIn(brief)];
  for (const candidate of candidates) {
    const formatted = formatUsPhone(candidate);
    if (formatted) return formatted;
  }
  return undefined;
}

const CITY_WORD = "[A-Z][A-Za-z'’-]+";
/** "Austin, TX", "McAllen, TX", "St. Louis, MO", "Winston-Salem, NC" num texto livre. */
const FREE_PLACE_RE = new RegExp(
  `(?:^|[^A-Za-z])((?:(?:St|Mt|Ft|Pt)\\. )?${CITY_WORD}(?: ${CITY_WORD}){0,3}),\\s*([A-Z]{2})\\b`,
  "g",
);

/** Cidade e estado: a frase "Based in Cidade, UF." primeiro; a sigla precisa ser dos EUA. */
export function placeFromBrief(brief: string): { city?: string; state?: string } {
  const based = labeled(brief, LOCATION_RE)?.value;
  if (based) {
    const withState = /^(.+?),\s*([A-Za-z]{2})$/.exec(based);
    const state = withState?.[2]?.toUpperCase();
    if (withState?.[1] && state && isUsStateCode(state)) {
      return { city: withState[1].trim().slice(0, 60), state };
    }
    if (/^[A-Za-z]{2}$/.test(based) && isUsStateCode(based.toUpperCase())) {
      return { state: based.toUpperCase() };
    }
    // Sigla que não é de estado dos EUA: fica só a cidade (que o dono digitou).
    const city = (withState?.[1] ?? based).trim();
    if (/^[A-Za-z]/.test(city) && city.length <= 60) return { city };
  }
  for (const match of brief.matchAll(FREE_PLACE_RE)) {
    const city = match[1]?.trim();
    const state = match[2];
    if (city && state && isUsStateCode(state) && looksLikeName(city)) return { city, state };
  }
  return {};
}

/** Corta no último espaço antes de `max` (sem vírgula, "and" ou "&" pendurados no fim). */
export function cutAtWord(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  const space = clean.lastIndexOf(" ", max);
  const cut = clean.slice(0, space > 0 ? space : max);
  return cut.replace(/(?:[\s,;&/-]+|\s+(?:and|or))+$/i, "").trim();
}

/** Área atendida da frase "Service area: …" (até 120 caracteres, cortada numa palavra). */
export function serviceAreaFromBrief(brief: string): string | undefined {
  const area = labeled(brief, AREA_RE)?.value.replace(/[.\s]+$/, "");
  return area ? cutAtWord(area, 120) || undefined : undefined;
}

const DAY_RE =
  /\b(?:(?:mon|tues|wednes|thurs|fri|satur|sun)days?|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b|\b(?:daily|every day|weekdays|weekends)\b/i;
const MERIDIEM = "(?:\\s?(?:a\\.?m\\.?|p\\.?m\\.?))?";
// Sem dígito colado antes ou depois: "512-555-0142" não é "12-55".
const CLOCK = `(?<![\\d:.])\\d{1,2}(?::\\d{2})?(?!\\d)${MERIDIEM}`;
const TIME_RE = new RegExp(`${CLOCK}\\s*(?:-|–|—|to)\\s*${CLOCK}|\\b24 hours\\b`, "i");
const CLOSED_RE = /\bclosed\b/i;

/** "mon–fri" → "Mon–fri" (primeira letra maiúscula, o resto como o dono escreveu). */
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Horário escrito pelo dono ("Open Mon–Fri 8 AM – 6 PM, Sat 9 AM – 2 PM. Closed Sunday."),
 * em pedaços { days, time } de até 40 caracteres. Só entram pedaços com dia E horário (ou
 * "closed"); o resto é ignorado. Máximo 7.
 */
export function hoursFromBrief(brief: string): BriefFacts["hours"] {
  const hours: NonNullable<BriefFacts["hours"]> = [];
  const sentences = brief.split(/\n|(?<=[.!?])\s+(?=[A-Z])/);
  for (const sentence of sentences) {
    if (!DAY_RE.test(sentence)) continue;
    let carriedDays = "";
    for (const rawPart of sentence.split(/[;,]|\s+\band\b\s+/)) {
      const part = rawPart.trim().replace(/[.\s]+$/, "");
      const day = DAY_RE.exec(part);
      const time = TIME_RE.exec(part);
      if (CLOSED_RE.test(part) && day) {
        const days = part.slice(day.index).replace(CLOSED_RE, "").replace(/\s+/g, " ").trim();
        hours.push({ days: capitalize(days).slice(0, 40), time: "Closed" });
        carriedDays = "";
        continue;
      }
      if (day && time && day.index < time.index) {
        const days = part
          .slice(day.index, time.index)
          .replace(/[:\s]+$/, "")
          .trim();
        hours.push({ days: capitalize(days).slice(0, 40), time: time[0].trim().slice(0, 40) });
        carriedDays = "";
      } else if (day && !time) {
        // "Monday to Friday, 8 to 6": o dia vem num pedaço e o horário no próximo.
        carriedDays = part.slice(day.index).trim();
      } else if (time && carriedDays) {
        hours.push({ days: capitalize(carriedDays).slice(0, 40), time: time[0].trim() });
        carriedDays = "";
      }
    }
  }
  const unique = hours.filter(
    (h, i) => h.days && hours.findIndex((o) => o.days === h.days && o.time === h.time) === i,
  );
  return unique.length ? unique.slice(0, 7) : undefined;
}

/** E-mail escrito no pedido. */
export function emailFromBrief(brief: string): string | undefined {
  return /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.exec(brief)?.[0];
}

/**
 * "O que você faz" do /create: o primeiro parágrafo sem as frases com rótulo (nome, cidade,
 * área, telefone). Só existe quando o pedido veio do /create (tem pelo menos uma dessas
 * frases); pedido livre = `undefined` (não dá para saber onde está a lista de serviços).
 */
export function whatFromBrief(brief: string): string | undefined {
  let intro = brief.split(/\n\s*\n/)[0] ?? "";
  let found = false;
  for (const label of [NAME_RE, LOCATION_RE, AREA_RE, PHONE_RE]) {
    const hit = labeled(intro, label, label === NAME_RE);
    if (!hit) continue;
    found = true;
    intro = `${intro.slice(0, hit.start)} ${intro.slice(hit.end)}`;
  }
  const what = intro.replace(/\s+/g, " ").trim();
  return found && what ? what : undefined;
}

/** Palavras pequenas que ficam em minúsculas no meio de um nome de serviço. */
const SMALL_WORDS = new Set(["and", "or", "of", "for", "the", "a", "an", "to", "in", "on", "with"]);

/** "drain cleaning" → "Drain Cleaning"; siglas e palavras com maiúscula no meio ficam ("HVAC"). */
export function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((word, i) => {
      if (/[A-Z]/.test(word.slice(1))) return word;
      if (i > 0 && SMALL_WORDS.has(word.toLowerCase())) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/** Começos que fazem do pedaço uma frase sobre o negócio, não um serviço. */
const NOT_A_SERVICE_START =
  /^(?:we|we're|we've|i|i'm|i've|our|my|us|you|your|they|it|its|it's|this|that|there|here|a|an|the|located|based|serving|call|open|since|locally|helping|help|selling|sell|buying|buy|making|make|providing|provide|bringing|bring|keeping|keep|getting|get|working|work)\b/i;
/** Pedaços que falam do negócio (quem, onde, desde quando), não de um serviço. */
const ABOUT_THE_BUSINESS =
  /\b(?:serving|based|located|owned|operated|since|years?|our|we|my|us|you|your|their)\b/i;
/** Verbos do começo ("We offer …", "Specializing in …"): saem, o resto é o serviço. */
const LEAD_IN =
  /^(?:(?:we|i)(?:'re|’re| are| am)?\s+(?:also\s+)?(?:do|offer|provide|handle|specialize in|specialise in|focus on|make|sell|teach|bake|cook|serve)\s+|(?:offering|specializing in|specialising in|services include|including|plus|also)\s+)/i;
/** Um pedaço sozinho que é o tipo de negócio ("Plumber", "Hair salon"), não um serviço. */
const BUSINESS_NOUN =
  /(?:er|ers|or|ors|ist|ists|ian|shop|salon|studio|company|business|agency|firm|office|clinic|store|truck|bakery|restaurant|cafe|café|spa|gym|practice)$/i;

/** O pedaço pode ser o nome de um serviço? */
function isServiceName(part: string): boolean {
  return (
    part.length >= 3 &&
    part.length <= 60 &&
    part.split(/\s+/).length <= 5 &&
    !/\d/.test(part) &&
    !part.includes("$") &&
    !NOT_A_SERVICE_START.test(part) &&
    !ABOUT_THE_BUSINESS.test(part) &&
    // "Hair salon in Miami": tem lugar, é a descrição do negócio.
    !/\b(?:in|near|around) [A-Z]/.test(part) &&
    // "Care for back and neck pain": o "and" partiu uma frase, não uma lista.
    !/\b(?:for|from|to|with|by|of)\b/i.test(part)
  );
}

/**
 * Serviços que o dono digitou em "What do you do?" ("Plumbing repairs, drain cleaning and
 * water heater installs"): a primeira frase, separada por vírgula, ";", "and", "or", " & " e
 * linhas; em maiúsculas de título; até 8. Tudo ou nada: se algum pedaço não parece nome de
 * serviço ("Helping families buy and sell homes", "Family-owned bakery making sourdough"), a
 * frase é uma descrição, não uma lista, e a resposta é vazia (o site usa a lista genérica).
 */
export function servicesFromWhat(what: string): string[] {
  const first = what.split(/[.!?](?:\s+|$)/)[0] ?? "";
  const parts = first
    .split(/[,;\n]|\s+&\s+|\s+\band\b\s+|\s+\bor\b\s+/i)
    .map((part) =>
      part
        .trim()
        .replace(LEAD_IN, "")
        .replace(/^(?:and|or|also)\s+/i, "")
        .replace(/["“”()[\]]/g, "")
        .replace(/[\s.:;!?-]+$/, "")
        .trim(),
    )
    .filter(Boolean);
  if (parts.length === 0 || !parts.every(isServiceName)) return [];
  if (parts.length === 1 && parts[0]) {
    const words = parts[0].split(/\s+/).length;
    // Um pedaço só: o tipo do negócio ("Plumber", "Hair salon") ou uma descrição longa.
    if (words > 3 || (words <= 2 && BUSINESS_NOUN.test(parts[0]))) return [];
  }
  const seen = new Set<string>();
  const services: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    services.push(titleCase(part));
  }
  return services.slice(0, 8);
}

/** Todos os fatos que dá para ler do pedido sem IA (ainda passam por verifyFacts). */
export function factsFromBrief(brief: string): BriefFacts {
  const facts: BriefFacts = {};
  const name = nameFromBrief(brief);
  if (name) facts.name = name.slice(0, 80);
  const phone = phoneFromBrief(brief);
  if (phone) facts.phone = phone;
  const email = emailFromBrief(brief);
  if (email) facts.email = email;
  const { city, state } = placeFromBrief(brief);
  if (city) facts.city = city;
  if (state) facts.state = state;
  const serviceArea = serviceAreaFromBrief(brief);
  if (serviceArea) facts.serviceArea = serviceArea;
  const hours = hoursFromBrief(brief);
  if (hours) facts.hours = hours;
  return facts;
}
