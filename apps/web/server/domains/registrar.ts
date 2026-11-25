import type { FreeDomainRegistrant } from "@nosweat/schema";
import { z } from "zod";
import { getVercelConfig, type VercelConfig } from "./vercel";

// Registro de domínios (compra) pela Vercel, API REST via fetch, sem SDK. Usado só pelo domínio
// grátis do Premium (free-domain.ts). Endpoints seguidos (docs "Domains Registrar" da REST API,
// https://vercel.com/docs/rest-api/domains-registrar/..., conferidos em nov/2026):
// - POST  /v1/registrar/domains/search            "Get domain availability and pricing"
//         { domains: string[] (1–200) } → { results: [{ domain, available, years?, price?,
//         renewalPrice?, premium? }] } (preços em dólares)
// - GET   /v1/registrar/domains/{domain}/availability → { available }
// - GET   /v1/registrar/domains/{domain}/price?years=1 → { years, purchasePrice, renewalPrice,
//         transferPrice } (dólares)
// - POST  /v1/registrar/domains/{domain}/buy        "Buy a domain"
//         { autoRenew, years, expectedPrice, contactInformation } → { orderId, _links }
//         (400 com códigos como expected_price_mismatch, order_too_expensive...)
// - PATCH /v1/registrar/domains/{domain}/auto-renew { autoRenew }
// Tudo com ?teamId= (o mesmo time de vercel.ts). Testes usam MockRegistrar.

const API = "https://api.vercel.com";

/** Disponibilidade e preço do 1º ano de um domínio. */
export type DomainQuote = {
  domain: string;
  available: boolean;
  /** Preço do 1º ano em centavos (`null` = o registro não informou, ex.: indisponível). */
  priceCents: number | null;
  /** Nome "premium" (preço especial do registro). */
  premium: boolean;
};

export type PurchaseInput = {
  domain: string;
  /** Preço que conferimos antes (centavos); o registro recusa se o preço real for outro. */
  expectedPriceCents: number;
  registrant: FreeDomainRegistrant;
  autoRenew: boolean;
};

export type PurchaseResult = { orderId: string | null };

export interface Registrar {
  /** Disponibilidade + preço de vários domínios numa chamada só. */
  quote(domains: string[]): Promise<DomainQuote[]>;
  isAvailable(domain: string): Promise<boolean>;
  /** Preço do 1º ano em centavos. */
  priceCents(domain: string): Promise<number>;
  purchase(input: PurchaseInput): Promise<PurchaseResult>;
  setAutoRenew(domain: string, autoRenew: boolean): Promise<void>;
}

/**
 * Erro do registro. `definitive`: o registro respondeu que NÃO comprou (4xx); nos outros casos
 * (rede, 5xx, 429, 401/403) quem chama trata como incerto e nunca compra de novo sozinho.
 */
export class RegistrarError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
  }

  get definitive(): boolean {
    // 401/403 são problema nosso (token, permissão): não gastam a tentativa do cliente; o pedido
    // fica `pending` e a equipe é avisada.
    return this.status >= 400 && this.status < 500 && ![401, 403, 429].includes(this.status);
  }
}

/** Dólares (número da API) → centavos inteiros. */
export function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}

// A documentação mostra exemplos com "true" e "123" entre aspas: aceita os dois jeitos.
const Bool = z.union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")]);
const Num = z.coerce.number();

const SearchBody = z.object({
  results: z.array(
    z.object({
      domain: z.string(),
      available: Bool,
      price: Num.optional(),
      premium: Bool.optional(),
    }),
  ),
});
const AvailabilityBody = z.object({ available: Bool });
const PriceBody = z.object({ purchasePrice: Num });
const BuyBody = z.object({ orderId: z.string().optional() });
const ErrorBody = z
  .object({
    error: z.object({ code: z.string().optional(), message: z.string().optional() }).optional(),
    code: z.string().optional(),
    message: z.string().optional(),
  })
  .nullable();

export class VercelRegistrar implements Registrar {
  constructor(
    private readonly config: Pick<VercelConfig, "token" | "teamId">,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async call(method: string, path: string, body?: unknown): Promise<unknown> {
    const url = new URL(path, API);
    url.searchParams.set("teamId", this.config.teamId);
    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      // Rede caiu: não sabemos se o pedido chegou (status 0 = incerto).
      throw new RegistrarError(
        error instanceof Error ? error.message : "Network error",
        "network_error",
        0,
      );
    }
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const parsed = ErrorBody.safeParse(json);
      const data = parsed.success ? parsed.data : null;
      const code = data?.error?.code ?? data?.code ?? "unknown";
      const message = data?.error?.message ?? data?.message ?? `Registrar error (${res.status})`;
      throw new RegistrarError(message, code, res.status);
    }
    return json;
  }

  async quote(domains: string[]): Promise<DomainQuote[]> {
    if (domains.length === 0) return [];
    const body = SearchBody.parse(
      await this.call("POST", "/v1/registrar/domains/search", { domains }),
    );
    return body.results.map((row) => ({
      domain: row.domain.toLowerCase(),
      available: row.available,
      priceCents: row.available && row.price !== undefined ? dollarsToCents(row.price) : null,
      premium: row.premium ?? false,
    }));
  }

  async isAvailable(domain: string): Promise<boolean> {
    const path = `/v1/registrar/domains/${encodeURIComponent(domain)}/availability`;
    return AvailabilityBody.parse(await this.call("GET", path)).available;
  }

  async priceCents(domain: string): Promise<number> {
    const path = `/v1/registrar/domains/${encodeURIComponent(domain)}/price?years=1`;
    // `new URL` mantém o ?years=1 e o call() acrescenta o teamId.
    return dollarsToCents(PriceBody.parse(await this.call("GET", path)).purchasePrice);
  }

  async purchase(input: PurchaseInput): Promise<PurchaseResult> {
    const { registrant } = input;
    const path = `/v1/registrar/domains/${encodeURIComponent(input.domain)}/buy`;
    const json = await this.call("POST", path, {
      autoRenew: input.autoRenew,
      years: 1,
      // A API usa dólares; o registro recusa (expected_price_mismatch) se o preço mudou.
      expectedPrice: input.expectedPriceCents / 100,
      contactInformation: {
        firstName: registrant.firstName,
        lastName: registrant.lastName,
        email: registrant.email,
        phone: registrant.phone,
        address1: registrant.address1,
        ...(registrant.address2 ? { address2: registrant.address2 } : {}),
        city: registrant.city,
        state: registrant.state,
        zip: registrant.zip,
        country: registrant.country,
      },
    });
    // 2xx = o registro aceitou a compra; resposta fora do formato não vira "falhou".
    const body = BuyBody.safeParse(json);
    return { orderId: body.success ? (body.data.orderId ?? null) : null };
  }

  async setAutoRenew(domain: string, autoRenew: boolean): Promise<void> {
    const path = `/v1/registrar/domains/${encodeURIComponent(domain)}/auto-renew`;
    await this.call("PATCH", path, { autoRenew });
  }
}

/**
 * Registro de mentira (dev sem VERCEL_TOKEN e testes): nomes com "taken" estão registrados, com
 * "premium" custam caro; .com US$ 12,03 e .net US$ 13,50 (preços da Vercel em nov/2026).
 */
export class MockRegistrar implements Registrar {
  readonly purchases: PurchaseInput[] = [];
  readonly autoRenew = new Map<string, boolean>();
  quoteCalls = 0;

  private priceOf(domain: string): number {
    if (domain.includes("premium")) return 250_000;
    return domain.endsWith(".net") ? 1350 : 1203;
  }

  private taken(domain: string): boolean {
    return domain.includes("taken") || this.purchases.some((p) => p.domain === domain);
  }

  async quote(domains: string[]): Promise<DomainQuote[]> {
    this.quoteCalls += 1;
    return domains.map((domain) => {
      const available = !this.taken(domain);
      return {
        domain,
        available,
        priceCents: available ? this.priceOf(domain) : null,
        premium: domain.includes("premium"),
      };
    });
  }

  async isAvailable(domain: string): Promise<boolean> {
    return !this.taken(domain);
  }

  async priceCents(domain: string): Promise<number> {
    return this.priceOf(domain);
  }

  async purchase(input: PurchaseInput): Promise<PurchaseResult> {
    if (this.taken(input.domain)) {
      throw new RegistrarError("Domain is not available", "domain_not_available", 400);
    }
    if (input.expectedPriceCents !== this.priceOf(input.domain)) {
      throw new RegistrarError("Price changed", "expected_price_mismatch", 400);
    }
    this.purchases.push(input);
    this.autoRenew.set(input.domain, input.autoRenew);
    return { orderId: `order_mock_${this.purchases.length}` };
  }

  async setAutoRenew(domain: string, autoRenew: boolean): Promise<void> {
    this.autoRenew.set(domain, autoRenew);
  }
}

let mock: MockRegistrar | undefined;

/**
 * Registro a usar: a Vercel com VERCEL_TOKEN; sem ele, o de mentira (só fora da produção).
 * `null` na produção sem token (nada de comprar "de mentira" para um cliente de verdade).
 */
export function getRegistrar(): Registrar | null {
  const vercel = getVercelConfig();
  if (vercel) return new VercelRegistrar(vercel);
  if (process.env.VERCEL_ENV === "production") return null;
  mock ??= new MockRegistrar();
  return mock;
}
