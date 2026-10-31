import type { WebsiteStatus } from "@/lib/prospects";

// Conferência do site de uma empresa (só quando o Places devolve um site): abre a página inicial
// UMA vez (e, se não achou e-mail, uma página de contato), classifica e procura um e-mail público.
// - weak: sem https, sem <meta name="viewport"> (não foi feito para celular), página de domínio
//   estacionado/"coming soon", quase sem conteúdo, ou o "site" é só um perfil de rede social.
// - ok: o resto. unknown: não deu para abrir (erro, demora, página que não é HTML).
// E-mail: só o que está escrito no site (link mailto: ou texto visível). Nunca adivinhar.

export const USER_AGENT = "NoSweatBot/1.0 (+https://www.nosweatfd.com)";
const TIMEOUT_MS = 6_000;
const MAX_BYTES = 1_000_000;
const MAX_REDIRECTS = 5;

export type WebsiteCheck = {
  status: WebsiteStatus;
  notes: string | null;
  email: string | null;
};

// Hosts que são perfil em outra plataforma, não um site da empresa.
const SOCIAL_HOSTS = [
  "facebook.com",
  "instagram.com",
  "yelp.com",
  "linktr.ee",
  "nextdoor.com",
  "tiktok.com",
  "x.com",
  "twitter.com",
  "business.site",
  "google.com",
  "g.page",
];

const PARKED_PATTERNS = [
  /domain (?:is )?(?:for sale|parked)/i,
  /this domain (?:may be|is) for sale/i,
  /buy this domain/i,
  /parked (?:free|domain|page)/i,
  /(?:website|site) (?:is )?coming soon/i,
  /under construction/i,
  /future home of/i,
  /this site can['’]t be reached/i,
  /default web page|welcome to nginx|apache2? (?:ubuntu )?default page|it works!/i,
  /website expired|domain (?:has )?expired/i,
];

const hostMatches = (host: string, domain: string) =>
  host === domain || host.endsWith(`.${domain}`);

/** Perfil de rede social / diretório no lugar do site? */
export function isSocialProfile(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return SOCIAL_HOSTS.some((domain) => hostMatches(host, domain));
  } catch {
    return false;
  }
}

/**
 * Endereço que o servidor pode abrir: http(s), sem usuário/senha, sem IP privado nem nome
 * interno (o endereço vem do Google, mas quem cadastra o site no Google é a empresa).
 */
export function isFetchableUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (url.port && url.port !== "80" && url.port !== "443") return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".")) return false;
  if (/\.(?:local|localhost|internal|lan|home|corp)$/.test(host) || host === "localhost") {
    return false;
  }
  // IP literal: só aceitamos nomes (empresas não divulgam IP como site).
  if (/^\d+(?:\.\d+){3}$/.test(host) || host.startsWith("[")) return false;
  return true;
}

/** Texto visível aproximado: sem <script>, <style>, comentários e tags. */
export function visibleText(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&commat;/gi, "@")
    .replace(/&period;/gi, ".");
}

const EMAIL =
  /[a-z0-9][a-z0-9._%+-]{0,63}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,24}/gi;

// Endereços que aparecem em sites mas não são da empresa (exemplos, ferramentas, imagens @2x).
const IGNORED_DOMAINS = [
  "example.com",
  "domain.com",
  "yourdomain.com",
  "email.com",
  "sentry.io",
  "wixpress.com",
  "sentry-next.wixpress.com",
  "godaddy.com",
  "squarespace.com",
  "wordpress.com",
  "schema.org",
];
const IGNORED_LOCAL = /^(?:no-?reply|donotreply|example|user|name|your-?email|email|test)$/i;
const FILE_LIKE = /\.(?:png|jpe?g|gif|webp|svg|css|js)$/i;

function cleanEmail(raw: string): string | null {
  const email = raw
    .trim()
    .toLowerCase()
    .replace(/^mailto:/, "")
    .split("?")[0]!;
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,24}$/.test(email) || FILE_LIKE.test(email)) return null;
  const [local, domain] = email.split("@") as [string, string];
  if (IGNORED_LOCAL.test(local)) return null;
  if (IGNORED_DOMAINS.includes(domain)) return null;
  return email;
}

/**
 * E-mails públicos de uma página: links mailto: primeiro, depois o texto visível. Em ordem de
 * preferência: do mesmo domínio do site, depois os "de contato" (info@, contact@, office@...).
 */
export function extractEmails(html: string, siteUrl?: string): string[] {
  const found: string[] = [];
  const add = (raw: string) => {
    const email = cleanEmail(decodeURIComponent(raw.replace(/%(?![0-9a-f]{2})/gi, "%25")));
    if (email && !found.includes(email)) found.push(email);
  };
  const decoded = decodeEntities(html);
  for (const match of decoded.matchAll(/href\s*=\s*["']?\s*mailto:([^"'\s>]+)/gi)) {
    add(match[1]!);
  }
  for (const match of visibleText(decoded).matchAll(EMAIL)) add(match[0]);

  let siteHost = "";
  try {
    siteHost = siteUrl ? new URL(siteUrl).hostname.toLowerCase().replace(/^www\./, "") : "";
  } catch {
    siteHost = "";
  }
  const score = (email: string) => {
    const [local, domain] = email.split("@") as [string, string];
    let points = 0;
    if (siteHost && (domain === siteHost || siteHost.endsWith(`.${domain}`))) points += 2;
    if (/^(?:info|contact|hello|office|service|sales|admin|support)$/.test(local)) points += 1;
    return points;
  };
  return found
    .map((email, index) => ({ email, index }))
    .sort((a, b) => score(b.email) - score(a.email) || a.index - b.index)
    .map(({ email }) => email);
}

export function pickEmail(html: string, siteUrl?: string): string | null {
  return extractEmails(html, siteUrl)[0] ?? null;
}

/** Classifica uma página já baixada. `finalUrl` é o endereço depois dos redirecionamentos. */
export function classifyPage(
  finalUrl: string,
  html: string,
): { status: WebsiteStatus; notes: string[] } {
  const notes: string[] = [];
  if (!finalUrl.startsWith("https://")) notes.push("not https");
  if (!/<meta[^>]+name\s*=\s*["']?viewport/i.test(html)) notes.push("no mobile viewport");
  const text = visibleText(html);
  if (PARKED_PATTERNS.some((pattern) => pattern.test(text) || pattern.test(html.slice(0, 5000)))) {
    notes.push("parked or placeholder page");
  } else if (text.length < 200) {
    notes.push("almost no content");
  }
  const year = /(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?((?:19|20)\d{2})/i.exec(html)?.[1];
  const age = year ? new Date().getUTCFullYear() - Number(year) : 0;
  // Só observação (não deixa o site "weak" sozinho).
  if (age >= 5) notes.push(`copyright ${year}`);
  const weak = notes.some((note) => !note.startsWith("copyright"));
  return { status: weak ? "weak" : "ok", notes };
}

type Fetched = { url: string; html: string } | { error: string };

/** Abre uma página seguindo redirecionamentos à mão (cada destino passa por isFetchableUrl). */
export async function fetchPage(
  startUrl: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = TIMEOUT_MS,
): Promise<Fetched> {
  const signal = AbortSignal.timeout(timeoutMs);
  let url = startUrl;
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!isFetchableUrl(url)) return { error: "address not allowed" };
      const res = await fetchImpl(url, {
        redirect: "manual",
        cache: "no-store",
        signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        await res.body?.cancel().catch(() => undefined);
        if (!location) return { error: `HTTP ${res.status}` };
        url = new URL(location, url).toString();
        continue;
      }
      if (!res.ok) {
        await res.body?.cancel().catch(() => undefined);
        return { error: `HTTP ${res.status}` };
      }
      const type = res.headers.get("content-type") ?? "";
      if (type && !/html|xml|text\/plain/i.test(type)) {
        await res.body?.cancel().catch(() => undefined);
        return { error: "not a web page" };
      }
      return { url, html: await readLimited(res, MAX_BYTES) };
    }
    return { error: "too many redirects" };
  } catch (error) {
    return {
      error:
        error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
          ? "timed out"
          : "could not open",
    };
  }
}

/** Lê no máximo `max` bytes do corpo (sites enormes não travam o servidor). */
async function readLimited(res: Response, max: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < max) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
  }
  await reader.cancel().catch(() => undefined);
  const bytes = new Uint8Array(Math.min(size, max));
  let offset = 0;
  for (const chunk of chunks) {
    const part = chunk.subarray(0, Math.min(chunk.byteLength, bytes.byteLength - offset));
    bytes.set(part, offset);
    offset += part.byteLength;
    if (offset >= bytes.byteLength) break;
  }
  return new TextDecoder().decode(bytes);
}

/** Link de contato da própria página (mesmo host), senão "/contact". */
function contactUrl(html: string, pageUrl: string): string | null {
  try {
    const base = new URL(pageUrl);
    for (const match of html.matchAll(
      /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    )) {
      const href = match[1]!;
      const label = visibleText(match[2] ?? "");
      if (!/contact/i.test(href) && !/contact/i.test(label)) continue;
      if (/^(?:mailto|tel|javascript):/i.test(href)) continue;
      const target = new URL(href, base);
      if (target.hostname === base.hostname && target.pathname !== base.pathname) {
        return target.toString();
      }
    }
    return new URL("/contact", base).toString();
  } catch {
    return null;
  }
}

/** Confere o site de uma empresa. `website` nulo = "none" sem abrir nada. */
export async function checkWebsite(
  website: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<WebsiteCheck> {
  if (!website) return { status: "none", notes: null, email: null };
  if (isSocialProfile(website)) {
    return { status: "weak", notes: "only a social or directory page", email: null };
  }
  const home = await fetchPage(website, fetchImpl);
  if ("error" in home) return { status: "unknown", notes: home.error, email: null };

  const { status, notes } = classifyPage(home.url, home.html);
  let email = pickEmail(home.html, home.url);
  if (!email && !notes.includes("parked or placeholder page")) {
    const contact = contactUrl(home.html, home.url);
    if (contact) {
      const page = await fetchPage(contact, fetchImpl);
      if (!("error" in page)) email = pickEmail(page.html, home.url);
    }
  }
  return { status, notes: notes.length ? notes.join(", ") : null, email };
}
