import {
  FREE_DOMAIN_TLDS,
  type FreeDomainClaimInfo,
  type FreeDomainOption,
  type FreeDomainRegistrant,
  type FreeDomainSearchResponse,
  type FreeDomainTld,
} from "@nosweat/schema";
import type { FreeDomainClaim, FreeDomainStore } from "./free-domain-store";
import { RegistrarError, type DomainQuote, type Registrar } from "./registrar";

// Domínio grátis do Premium (decisão do fundador, nov/2026): 1 domínio .com (ou .net) por conta,
// PARA SEMPRE, grátis no 1º ano, comprado pela No Sweat no registro da Vercel e ligado sozinho ao
// site. Aqui ficam as regras puras e o passo a passo da compra (testados com o MockRegistrar); quem
// pode (plano, 1º pagamento) mora em free-domain-access.ts.
//
// Renovação: a compra sai com renovação automática LIGADA (o registro exige o campo) e a renovação
// fica por nossa conta enquanto o Premium valer. O cron diário (syncAutoRenew) desliga quando o
// plano acaba e religa se ele voltar.
// TODO: decidir com o fundador o que acontece no 2º ano (cobrar o cliente? manter grátis?).

/** Nomes conferidos por busca (uma chamada só ao registro, com até este tanto de nomes). */
export const MAX_CANDIDATES = 8;
/** Sugestões mostradas quando o nome pedido não sai de graça. */
export const MAX_SUGGESTIONS = 4;
/** Tentativas por conta: a primeira + uma depois de uma recusa do registro. */
export const MAX_ATTEMPTS = 2;
const DEFAULT_MAX_CENTS = 1500;

/** Compra ligada? Só com DOMAIN_PURCHASE_ENABLED=true (custa dinheiro de verdade). */
export function purchaseEnabled(): boolean {
  return process.env.DOMAIN_PURCHASE_ENABLED === "true";
}

/** Teto do preço do 1º ano (centavos), FREE_DOMAIN_MAX_CENTS; padrão US$ 15. */
export function freeDomainMaxCents(): number {
  const value = Number(process.env.FREE_DOMAIN_MAX_CENTS);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_MAX_CENTS;
}

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Parte antes do ".com" válida: letras, números e hífens (sem hífen nas pontas), 2 a 63. */
export function isValidLabel(label: string): boolean {
  // "xn--" (e qualquer "--" na 3ª-4ª posição) é de nome com acento codificado: fora.
  return LABEL.test(label) && label.length >= 2 && label.slice(2, 4) !== "--";
}

/** Texto livre ("Joe's Plumbing & Heating") → "joesplumbingandheating". */
export function labelFrom(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export type ParsedQuery =
  | { ok: true; domain: string; label: string; tld: FreeDomainTld }
  | { ok: false; message: string };

function isFreeTld(value: string): value is FreeDomainTld {
  return (FREE_DOMAIN_TLDS as readonly string[]).includes(value);
}

/**
 * O que a pessoa digitou → domínio .com/.net válido. Aceita "joesplumbing", "Joe's Plumbing",
 * "https://www.joesplumbing.net/". Sem terminação = .com.
 */
export function parseFreeDomainQuery(query: string): ParsedQuery {
  const cleaned = query
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/\.$/, "")
    .replace(/^www\./, "");
  const dot = cleaned.lastIndexOf(".");
  const rawLabel = dot === -1 ? cleaned : cleaned.slice(0, dot);
  const tld = dot === -1 ? "com" : cleaned.slice(dot + 1);
  if (!isFreeTld(tld)) {
    return { ok: false, message: "Your free domain can end in .com or .net." };
  }
  if (rawLabel.includes(".")) {
    return { ok: false, message: "Just the name, please, like joesplumbing.com." };
  }
  // Hífens digitados ficam; espaços, acentos e símbolos saem.
  const label = rawLabel
    .split("-")
    .map(labelFrom)
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (label.length < 2) {
    return { ok: false, message: "That name is too short. Try your business name." };
  }
  if (label.length > 63) {
    return { ok: false, message: "That name is too long. Try something shorter." };
  }
  if (!isValidLabel(label)) {
    return { ok: false, message: "Use only letters, numbers and hyphens." };
  }
  return { ok: true, domain: `${label}.${tld}`, label, tld };
}

/**
 * Nomes para conferir: o pedido primeiro, depois a outra terminação e variações com a cidade e o
 * nome da empresa do site ("pros", "co", "hq"). No máximo `max`, sem repetir, todos válidos.
 */
export function freeDomainCandidates(
  wanted: { label: string; tld: FreeDomainTld },
  hints: { name?: string; city?: string } = {},
  max = MAX_CANDIDATES,
): string[] {
  const { label, tld } = wanted;
  const other: FreeDomainTld = tld === "com" ? "net" : "com";
  const city = hints.city ? labelFrom(hints.city) : "";
  const name = hints.name ? labelFrom(hints.name) : "";
  const withCity = city && !label.includes(city) ? `${label}${city}` : "";
  const list = [
    `${label}.${tld}`,
    `${label}.${other}`,
    withCity && `${withCity}.com`,
    !label.endsWith("pros") && `${label}pros.com`,
    `${label}co.com`,
    `${label}hq.com`,
    name && name !== label && `${name}.com`,
    withCity && `${withCity}.net`,
    `get${label}.com`,
  ];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const domain of list) {
    if (!domain || seen.has(domain)) continue;
    const [candidateLabel] = domain.split(".");
    if (!candidateLabel || !isValidLabel(candidateLabel)) continue;
    seen.add(domain);
    result.push(domain);
    if (result.length >= max) break;
  }
  return result;
}

/** Resultado do registro → opção para a tela (grátis só .com/.net, disponível e até o teto). */
export function toOption(quote: DomainQuote, maxCents: number): FreeDomainOption {
  const tld = quote.domain.slice(quote.domain.lastIndexOf(".") + 1);
  if (!quote.available) {
    return {
      domain: quote.domain,
      available: false,
      free: false,
      priceCents: null,
      reason: "taken",
    };
  }
  const free =
    isFreeTld(tld) && !quote.premium && quote.priceCents !== null && quote.priceCents <= maxCents;
  return {
    domain: quote.domain,
    available: true,
    free,
    priceCents: quote.priceCents,
    reason: free ? null : "premium",
  };
}

/** Recusa pronta para virar `{ error: { code, message } }` na rota. */
export type Refusal = { ok: false; status: number; code: string; message: string };

const refuse = (status: number, code: string, message: string): Refusal => ({
  ok: false,
  status,
  code,
  message,
});

export type FreeDomainDeps = {
  store: FreeDomainStore;
  registrar: Registrar;
  maxCents: number;
};

/**
 * Busca: confere o nome pedido e as variações numa chamada só ao registro (até MAX_CANDIDATES
 * nomes) e devolve o resultado + só as sugestões disponíveis e grátis.
 */
export async function searchFreeDomain(
  deps: Pick<FreeDomainDeps, "registrar" | "maxCents">,
  query: string,
  hints: { name?: string; city?: string } = {},
): Promise<{ ok: true; response: FreeDomainSearchResponse } | Refusal> {
  const parsed = parseFreeDomainQuery(query);
  if (!parsed.ok) return refuse(400, "invalid_request", parsed.message);
  const candidates = freeDomainCandidates(parsed, hints);
  let quotes: DomainQuote[];
  try {
    quotes = await deps.registrar.quote(candidates);
  } catch (error) {
    console.error("[free-domain] search failed", describe(error));
    return refuse(502, "domain_error", "We couldn't check domains right now. Please try again.");
  }
  const byDomain = new Map(quotes.map((quote) => [quote.domain, quote]));
  const wanted = byDomain.get(parsed.domain);
  // Sem resposta para o nome pedido: tratamos como indisponível (nunca prometer o que não vimos).
  const result = wanted
    ? toOption(wanted, deps.maxCents)
    : toOption(
        { domain: parsed.domain, available: false, priceCents: null, premium: false },
        deps.maxCents,
      );
  const suggestions = result.free
    ? []
    : candidates
        .slice(1)
        .map((domain) => byDomain.get(domain))
        .filter((quote): quote is DomainQuote => quote !== undefined)
        .map((quote) => toOption(quote, deps.maxCents))
        .filter((option) => option.free)
        .slice(0, MAX_SUGGESTIONS);
  return { ok: true, response: { result, suggestions } };
}

/** Linha da tabela → o que a tela mostra. */
export function toClaimInfo(claim: FreeDomainClaim): FreeDomainClaimInfo {
  return {
    domain: claim.domain,
    status: claim.status,
    siteId: claim.siteId,
    purchasedAt: claim.purchasedAt,
    canRetry: claim.status === "failed" && claim.attempts < MAX_ATTEMPTS,
  };
}

/** Mensagem curta do erro, sem dados pessoais (só código e status do registro). */
function describe(error: unknown): string {
  if (error instanceof RegistrarError) return `${error.code} (${error.status})`;
  return error instanceof Error ? error.name : "unknown";
}

export type ClaimInput = {
  userId: string;
  siteId: string;
  domain: string;
  /** Vai direto para o registro; NUNCA é gravado. */
  registrant: FreeDomainRegistrant;
};

export type ClaimOutcome =
  | { ok: true; claim: FreeDomainClaim; connected: boolean }
  /** A compra pode ter saído (rede/5xx): o pedido fica `pending` para a equipe conferir. */
  | { ok: false; status: number; code: string; message: string; uncertain?: boolean };

/**
 * Pede o domínio grátis (quem chama já conferiu o plano e se o site é da conta):
 * 1. confere o nome, a disponibilidade e o preço real (só leitura);
 * 2. grava o pedido `pending` ANTES de comprar (clique duplo/nova tentativa batem nele);
 * 3. compra no nome do cliente; recusa do registro = `failed` (pode tentar mais uma vez);
 *    erro incerto (rede, 5xx) = continua `pending` e NUNCA compra de novo sozinho;
 * 4. liga ao site (`connect`), sem a prova de dono (fomos nós que compramos).
 */
export async function claimFreeDomain(
  deps: FreeDomainDeps & { connect: (domain: string) => Promise<void> },
  input: ClaimInput,
): Promise<ClaimOutcome> {
  const parsed = parseFreeDomainQuery(input.domain);
  if (!parsed.ok) return refuse(400, "invalid_request", parsed.message);
  const domain = parsed.domain;

  const existing = await deps.store.get(input.userId);
  if (existing && existing.status !== "failed") {
    return refuse(
      409,
      "conflict",
      existing.status === "purchased"
        ? `You already claimed your free domain (${existing.domain}).`
        : `We're still setting up ${existing.domain}. We'll let you know when it's ready.`,
    );
  }
  if (existing && existing.attempts >= MAX_ATTEMPTS) {
    return refuse(
      409,
      "conflict",
      "We couldn't register your free domain. Please contact us and we'll sort it out.",
    );
  }

  // Disponível e no teto, conferido agora (o preço da busca pode ter mudado).
  let priceCents: number;
  try {
    if (!(await deps.registrar.isAvailable(domain))) {
      return refuse(409, "domain_taken", `${domain} was just taken. Please pick another name.`);
    }
    priceCents = await deps.registrar.priceCents(domain);
  } catch (error) {
    console.error("[free-domain] pre-check failed", describe(error));
    return refuse(502, "domain_error", "We couldn't reach the domain registry. Please try again.");
  }
  if (priceCents > deps.maxCents) {
    return refuse(
      400,
      "invalid_request",
      `${domain} is a premium name with a special price, so it isn't included. Please pick another name.`,
    );
  }

  const reserve = { userId: input.userId, siteId: input.siteId, domain, priceCents };
  const claim = existing
    ? await deps.store.retry(reserve, existing.attempts)
    : await deps.store.start(reserve);
  if (!claim) {
    return refuse(409, "conflict", "Your free domain is already being set up.");
  }

  let orderId: string | null;
  try {
    ({ orderId } = await deps.registrar.purchase({
      domain,
      expectedPriceCents: priceCents,
      registrant: input.registrant,
      // Renovação por nossa conta enquanto o Premium valer (ver syncAutoRenew).
      autoRenew: true,
    }));
  } catch (error) {
    const reason = describe(error);
    if (error instanceof RegistrarError && error.definitive) {
      await deps.store.markFailed(input.userId, reason);
      console.info("[free-domain] purchase refused", claim.id, reason);
      const retry = claim.attempts < MAX_ATTEMPTS ? " You can try one more time." : "";
      return refuse(
        409,
        "domain_error",
        `The registry couldn't register ${domain}. Please check your details or pick another name.${retry}`,
      );
    }
    // Incerto: pode ter comprado. Fica `pending` (ninguém compra de novo) e a equipe confere.
    await deps.store.note(input.userId, `uncertain: ${reason}`).catch(() => undefined);
    console.error("[free-domain] purchase uncertain", claim.id, reason);
    return {
      ok: false,
      status: 502,
      code: "domain_error",
      message:
        "We're confirming your domain with the registry. Our team will finish it and let you know. Please don't try again.",
      uncertain: true,
    };
  }

  await deps.store.markPurchased(input.userId, orderId);
  console.info("[free-domain] purchased", claim.id, `.${parsed.tld}`, priceCents);

  let connected = true;
  try {
    await deps.connect(domain);
  } catch (error) {
    connected = false;
    // Comprado, mas não ligou: o cliente liga em "Your own domain" (sem a prova de dono).
    console.error("[free-domain] could not connect", claim.id, describe(error));
    await deps.store
      .note(input.userId, `connect_failed: ${error instanceof Error ? error.message : "unknown"}`)
      .catch(() => undefined);
  }
  const saved = (await deps.store.get(input.userId)) ?? claim;
  return { ok: true, claim: saved, connected };
}

/**
 * Renovação automática no registro igual a "o dono ainda tem o recurso" (Premium ativo): desliga
 * quando o plano acaba, religa se voltar. Uma falha numa conta não para as outras.
 */
export async function syncAutoRenew(deps: {
  store: FreeDomainStore;
  registrar: Registrar;
  keepRenewing: (userId: string) => Promise<boolean>;
}): Promise<{ checked: number; changed: number; failed: number }> {
  const claims = await deps.store.listPurchased();
  let changed = 0;
  let failed = 0;
  for (const claim of claims) {
    try {
      const keep = await deps.keepRenewing(claim.userId);
      if (keep === claim.autoRenew) continue;
      await deps.registrar.setAutoRenew(claim.domain, keep);
      await deps.store.setAutoRenew(claim.userId, keep);
      changed += 1;
    } catch (error) {
      failed += 1;
      console.error("[free-domain] auto-renew sync failed", claim.id, describe(error));
    }
  }
  return { checked: claims.length, changed, failed };
}
