// EXPERIMENTO "caminho A": limpeza do HTML que a IA escreveu, antes de salvar ou mostrar.
//
// Isto é uma SEGUNDA camada. A proteção principal é a prévia isolada: o HTML só abre num
// <iframe sandbox="allow-scripts"> SEM allow-same-origin, então o código gerado roda numa origem
// opaca e não lê cookies, sessão nem o DOM da No Sweat, não envia formulários (sem allow-forms),
// não abre janelas (sem allow-popups) e não navega a página de cima (sem allow-top-navigation).
// Por isso JavaScript inline (<script> sem src) e atributos on* (onclick...) são MANTIDOS: o
// experimento quer ver o que a IA faz com um pouco de JS, e o sandbox o contém.
//
// O que sai aqui: <script src> de hosts fora da lista, <iframe>/<frame>/<frameset>/<object>/
// <embed>/<applet>/<portal>/<base>, <meta http-equiv="refresh">, atributos action/formaction,
// URLs javascript:/vbscript:/data:text/html, <link> para hosts fora da lista (só Google Fonts) e
// imagens de fora da lista de fotos permitidas (sem hotlink).
//
// Feito com expressões regulares (sem dependência nova). Não é um parser HTML completo: serve
// para o experimento com o sandbox por trás, NÃO para publicar código livre em produção (para isso
// seria preciso um parser de verdade e hospedagem em outra origem; ver README.md).
// Roda também direto no Node (script freeform-batch.mts): sem imports.

export type SanitizeOptions = {
  /** Hosts de onde um <script src> pode vir. Padrão: nenhum (o pedido proíbe scripts externos). */
  scriptHosts?: string[];
  /** URLs EXATAS de onde um <script src> pode vir (ex.: FREEFORM_SCRIPT_URLS, versão fixa). */
  scriptUrls?: readonly string[];
  /** Hosts permitidos em <link href> (fontes). Padrão: Google Fonts. */
  linkHosts?: readonly string[];
  /** URLs exatas de fotos que o site pode usar (a lista passada à IA). */
  imageUrls?: string[];
};

export type SanitizeResult = {
  html: string;
  /** O que foi removido ou trocado, para o relatório do lote. */
  removed: string[];
};

const DEFAULT_LINK_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

/** Elementos que saem inteiros, com o conteúdo. */
const BLOCKED_WITH_CONTENT = ["iframe", "object", "frameset", "applet", "portal", "noembed"];
/** Elementos vazios (ou cujo fechamento sobra) que saem. */
const BLOCKED_TAGS = new Set([...BLOCKED_WITH_CONTENT, "embed", "base", "frame"]);
/** Atributos que levam URL e são conferidos contra javascript: e afins. */
const URL_ATTRIBUTES = new Set([
  "href",
  "src",
  "xlink:href",
  "poster",
  "data",
  "background",
  "cite",
  "ping",
  "srcdoc",
]);

const TAG_PATTERN =
  /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/g;
const ATTRIBUTE_PATTERN = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

type Attribute = { name: string; value: string | null; raw: string };

export function sanitizeFreeformHtml(input: string, options: SanitizeOptions = {}): SanitizeResult {
  const scriptHosts = new Set((options.scriptHosts ?? []).map((host) => host.toLowerCase()));
  const scriptUrls = new Set(options.scriptUrls ?? []);
  const scriptAllowed = (src: string) => {
    const trimmed = decodeAmp(src.trim());
    if (scriptUrls.has(trimmed)) return true;
    const host = hostOf(trimmed);
    return host !== null && scriptHosts.has(host);
  };
  const linkHosts = new Set((options.linkHosts ?? DEFAULT_LINK_HOSTS).map((h) => h.toLowerCase()));
  const imageUrls = new Set(options.imageUrls ?? []);
  const removed: string[] = [];
  // \u0000 marca os blocos guardados no passo 1; um NUL vindo de fora não pode imitá-lo.
  let html = input.replace(/\u0000/g, "");

  // 1. <script>: com src só de host permitido; inline fica (contido pelo sandbox).
  //    O conteúdo de <script> e <style> é guardado à parte para os passos 2 e 3 não mexerem em código
  //    (um "a<b" dentro do JS pareceria uma tag).
  const rawBlocks: string[] = [];
  html = html.replace(
    /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>/gi,
    (_whole, attrs: string, body: string) => {
      const src = readAttributes(attrs).find((attribute) => attribute.name === "src");
      if (src) {
        if (!scriptAllowed(src.value ?? "")) {
          removed.push(`<script src="${src.value ?? ""}">`);
          return "";
        }
      }
      rawBlocks.push(body);
      return `<script${attrs}>\u0000${rawBlocks.length - 1}\u0000</script>`;
    },
  );
  html = html.replace(
    /(<style\b(?:[^>"']|"[^"]*"|'[^']*')*>)([\s\S]*?)(<\/style\s*>)/gi,
    (_whole, open: string, body: string, close: string) => {
      rawBlocks.push(body);
      return `${open}\u0000${rawBlocks.length - 1}\u0000${close}`;
    },
  );

  // 2. Elementos perigosos inteiros (com o que tiver dentro).
  for (const tag of BLOCKED_WITH_CONTENT) {
    const pattern = new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}\\s*>`, "gi");
    html = html.replace(pattern, () => {
      removed.push(`<${tag}> element`);
      return "";
    });
  }

  // 3. Cada tag: tira as proibidas e limpa os atributos.
  html = html.replace(
    TAG_PATTERN,
    (whole, closing: string, rawName: string, attrs: string, selfClose: string) => {
      const name = rawName.toLowerCase();
      if (BLOCKED_TAGS.has(name)) {
        if (!closing) removed.push(`<${name}>`);
        return "";
      }
      if (closing) return whole;

      const attributes = readAttributes(attrs);
      const get = (attr: string) => attributes.find((a) => a.name === attr)?.value ?? null;

      if (name === "meta" && (get("http-equiv") ?? "").trim().toLowerCase() === "refresh") {
        removed.push('<meta http-equiv="refresh">');
        return "";
      }
      if (name === "script" && get("src") !== null) {
        // <script src> sem fechamento (o passo 1 só pega os fechados).
        if (!scriptAllowed(get("src") ?? "")) {
          removed.push(`<script src="${get("src") ?? ""}">`);
          return "";
        }
      }
      if (name === "link") {
        const href = get("href") ?? "";
        if (!isAllowedLink(href, linkHosts)) {
          removed.push(`<link href="${href}">`);
          return "";
        }
      }
      if (name === "img") {
        const src = get("src") ?? "";
        if (!isAllowedImage(src, imageUrls)) {
          removed.push(`<img src="${src}">`);
          return "";
        }
      }

      let changed = false;
      const kept: string[] = [];
      for (const attribute of attributes) {
        if (attribute.name === "action" || attribute.name === "formaction") {
          removed.push(`${attribute.name} attribute on <${name}>`);
          changed = true;
          continue;
        }
        if (URL_ATTRIBUTES.has(attribute.name) && isDangerousUrl(attribute.value ?? "")) {
          removed.push(`${attribute.name}="${attribute.value ?? ""}" on <${name}>`);
          changed = true;
          // Link continua link (só sem destino); nos outros o atributo some.
          if (attribute.name === "href") kept.push('href="#"');
          continue;
        }
        if ((attribute.name === "srcset" || attribute.name === "imagesrcset") && attribute.value) {
          const urls = srcsetUrls(attribute.value);
          if (!urls.every((url) => isAllowedImage(url, imageUrls))) {
            removed.push(`${attribute.name} on <${name}>`);
            changed = true;
            continue;
          }
        }
        kept.push(attribute.raw);
      }
      if (!changed) return whole;
      const attributeText = kept.length > 0 ? ` ${kept.join(" ")}` : "";
      return `<${rawName}${attributeText}${selfClose ? " /" : ""}>`;
    },
  );

  // 4. Devolve o conteúdo de <script>/<style>.
  html = html.replace(
    /\u0000(\d+)\u0000/g,
    (_whole, index: string) => rawBlocks[Number(index)] ?? "",
  );

  return { html, removed };
}

function readAttributes(text: string): Attribute[] {
  const attributes: Attribute[] = [];
  for (const match of text.matchAll(ATTRIBUTE_PATTERN)) {
    const value = match[2] ?? match[3] ?? match[4] ?? null;
    attributes.push({ name: (match[1] ?? "").toLowerCase(), value, raw: match[0] });
  }
  return attributes;
}

/** Desfaz entidades e tira espaços/controles, como o navegador faz antes de ler o esquema. */
function normalizeUrl(value: string): string {
  const decoded = value
    .replace(/&#x([0-9a-f]+);?/gi, (_m, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_m, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&colon;/gi, ":")
    .replace(/&tab;/gi, "\t")
    .replace(/&newline;/gi, "\n");
  return decoded.replace(/[\u0000- ]/g, "").toLowerCase();
}

export function isDangerousUrl(value: string): boolean {
  const url = normalizeUrl(value);
  if (url.startsWith("javascript:") || url.startsWith("vbscript:")) return true;
  // data: só para imagens (favicon, fundos em SVG); data:text/html e afins viram documento.
  return url.startsWith("data:") && !url.startsWith("data:image/");
}

function hostOf(value: string): string | null {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed.startsWith("//") ? `https:${trimmed}` : trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isAllowedLink(href: string, hosts: Set<string>): boolean {
  const url = normalizeUrl(href);
  if (url.startsWith("data:image/")) return true; // favicon inline
  if (url.startsWith("#") || url === "") return true;
  const host = hostOf(href);
  return host !== null && hosts.has(host);
}

function isAllowedImage(src: string, urls: Set<string>): boolean {
  const url = normalizeUrl(src);
  if (url.startsWith("data:image/")) return true;
  if (url === "") return true;
  return urls.has(src.trim()) || urls.has(decodeAmp(src.trim()));
}

function decodeAmp(value: string): string {
  return value.replace(/&amp;/g, "&");
}

function srcsetUrls(value: string): string[] {
  return value
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/)[0] ?? "")
    .filter(Boolean);
}
