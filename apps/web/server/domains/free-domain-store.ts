import type { FreeDomainClaimStatus } from "@nosweat/schema";
import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";

// Pedidos do domínio grátis do Premium (tabela public.free_domain_claims, migration 0033).
// Supabase em produção, memória no dev/testes (mesma regra do server/store). Nada de endereço nem
// telefone aqui: esses dados vão direto para o registro.

export type FreeDomainClaim = {
  id: string;
  userId: string;
  siteId: string | null;
  domain: string;
  status: FreeDomainClaimStatus;
  priceCents: number;
  attempts: number;
  orderId: string | null;
  autoRenew: boolean;
  error: string | null;
  createdAt: string;
  purchasedAt: string | null;
};

export type ClaimInput = { userId: string; siteId: string; domain: string; priceCents: number };

export interface FreeDomainStore {
  get(userId: string): Promise<FreeDomainClaim | null>;
  /** Pedidos comprados (cron da renovação automática). */
  listPurchased(): Promise<FreeDomainClaim[]>;
  /**
   * Grava o pedido `pending` ANTES da compra. `null` se a conta já tem um pedido (o banco recusa:
   * user_id é único) ou se o domínio já está num pedido vivo de outra conta.
   */
  start(input: ClaimInput): Promise<FreeDomainClaim | null>;
  /**
   * Nova tentativa depois de uma recusa: `failed` → `pending` só se `attempts` ainda for
   * `seenAttempts` (troca condicional). `null` se outro pedido chegou antes.
   */
  retry(input: ClaimInput, seenAttempts: number): Promise<FreeDomainClaim | null>;
  /** `pending` → `purchased`. */
  markPurchased(userId: string, orderId: string | null): Promise<void>;
  /** `pending` → `failed` (o registro recusou de verdade). `error`: só o código. */
  markFailed(userId: string, error: string): Promise<void>;
  /** Anota um problema sem mudar o status (ex.: compra incerta, ligar ao site falhou). */
  note(userId: string, error: string | null): Promise<void>;
  setAutoRenew(userId: string, autoRenew: boolean): Promise<void>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const Row = z.object({
  id: z.string(),
  user_id: z.string(),
  site_id: z.string().nullable(),
  domain: z.string(),
  status: z.enum(["pending", "purchased", "failed"]),
  price_cents: z.number(),
  attempts: z.number(),
  order_id: z.string().nullable(),
  auto_renew: z.boolean(),
  error: z.string().nullable(),
  created_at: z.string(),
  purchased_at: z.string().nullable(),
});

function toClaim(row: z.infer<typeof Row>): FreeDomainClaim {
  return {
    id: row.id,
    userId: row.user_id,
    siteId: row.site_id,
    domain: row.domain,
    status: row.status,
    priceCents: row.price_cents,
    attempts: row.attempts,
    orderId: row.order_id,
    autoRenew: row.auto_renew,
    error: row.error,
    createdAt: row.created_at,
    purchasedAt: row.purchased_at,
  };
}

/** Corta mensagens longas (a coluna aceita até 500). */
const clip = (value: string | null) => (value === null ? null : value.slice(0, 500));

export class SupabaseFreeDomainStore implements FreeDomainStore {
  private readonly endpoint: string;

  constructor(
    private readonly config: { url: string; serviceKey: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.endpoint = `${normalizeSupabaseUrl(config.url)}/rest/v1/free_domain_claims`;
  }

  /** `null` quando o banco recusou por conflito (409: linha que já existe). */
  private async call(query: string, init: RequestInit = {}): Promise<unknown> {
    const res = await this.fetchImpl(`${this.endpoint}${query}`, {
      ...init,
      cache: "no-store",
      headers: {
        apikey: this.config.serviceKey,
        Authorization: `Bearer ${this.config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    });
    if (res.status === 409) return null;
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    return res.json();
  }

  private async rows(query: string, init?: RequestInit): Promise<FreeDomainClaim[]> {
    const json = await this.call(query, init);
    return json === null ? [] : z.array(Row).parse(json).map(toClaim);
  }

  private async patch(query: string, body: Record<string, unknown>): Promise<FreeDomainClaim[]> {
    return this.rows(query, {
      method: "PATCH",
      body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
    });
  }

  async get(userId: string): Promise<FreeDomainClaim | null> {
    if (!UUID.test(userId)) return null;
    const [claim] = await this.rows(`?user_id=eq.${userId}&select=*&limit=1`);
    return claim ?? null;
  }

  async listPurchased(): Promise<FreeDomainClaim[]> {
    // TODO: paginar quando houver mais de 1000 domínios grátis.
    return this.rows("?status=eq.purchased&select=*&order=created_at.asc&limit=1000");
  }

  async start(input: ClaimInput): Promise<FreeDomainClaim | null> {
    if (!UUID.test(input.userId)) throw new Error(`Invalid user id: ${input.userId}`);
    // INSERT simples (sem merge): se a conta já tem linha, o banco devolve 409 → `null`.
    const [claim] = await this.rows("?select=*", {
      method: "POST",
      body: JSON.stringify({
        user_id: input.userId,
        site_id: UUID.test(input.siteId) ? input.siteId : null,
        domain: input.domain,
        status: "pending",
        price_cents: input.priceCents,
        attempts: 1,
      }),
    });
    return claim ?? null;
  }

  async retry(input: ClaimInput, seenAttempts: number): Promise<FreeDomainClaim | null> {
    if (!UUID.test(input.userId)) return null;
    const [claim] = await this.patch(
      `?user_id=eq.${input.userId}&status=eq.failed&attempts=eq.${seenAttempts}&select=*`,
      {
        site_id: UUID.test(input.siteId) ? input.siteId : null,
        domain: input.domain,
        status: "pending",
        price_cents: input.priceCents,
        attempts: seenAttempts + 1,
        error: null,
      },
    );
    return claim ?? null;
  }

  async markPurchased(userId: string, orderId: string | null): Promise<void> {
    if (!UUID.test(userId)) return;
    await this.patch(`?user_id=eq.${userId}&status=eq.pending`, {
      status: "purchased",
      order_id: clip(orderId),
      purchased_at: new Date().toISOString(),
      error: null,
    });
  }

  async markFailed(userId: string, error: string): Promise<void> {
    if (!UUID.test(userId)) return;
    await this.patch(`?user_id=eq.${userId}&status=eq.pending`, {
      status: "failed",
      error: clip(error),
    });
  }

  async note(userId: string, error: string | null): Promise<void> {
    if (!UUID.test(userId)) return;
    await this.patch(`?user_id=eq.${userId}`, { error: clip(error) });
  }

  async setAutoRenew(userId: string, autoRenew: boolean): Promise<void> {
    if (!UUID.test(userId)) return;
    await this.patch(`?user_id=eq.${userId}`, { auto_renew: autoRenew });
  }
}

const globalForClaims = globalThis as typeof globalThis & {
  __nosweatFreeDomainClaims?: Map<string, FreeDomainClaim>;
};

/** Em memória. Os testes passam um Map novo; o app usa um só (sobrevive ao hot reload). */
export class MemoryFreeDomainStore implements FreeDomainStore {
  constructor(private readonly rows: Map<string, FreeDomainClaim> = new Map()) {}

  async get(userId: string): Promise<FreeDomainClaim | null> {
    const claim = this.rows.get(userId);
    return claim ? { ...claim } : null;
  }

  async listPurchased(): Promise<FreeDomainClaim[]> {
    return [...this.rows.values()]
      .filter((claim) => claim.status === "purchased")
      .map((claim) => ({ ...claim }));
  }

  async start(input: ClaimInput): Promise<FreeDomainClaim | null> {
    if (this.rows.has(input.userId)) return null;
    const live = [...this.rows.values()].some(
      (claim) => claim.domain === input.domain && claim.status !== "failed",
    );
    if (live) return null;
    const claim: FreeDomainClaim = {
      id: crypto.randomUUID(),
      userId: input.userId,
      siteId: input.siteId,
      domain: input.domain,
      status: "pending",
      priceCents: input.priceCents,
      attempts: 1,
      orderId: null,
      autoRenew: true,
      error: null,
      createdAt: new Date().toISOString(),
      purchasedAt: null,
    };
    this.rows.set(input.userId, claim);
    return { ...claim };
  }

  async retry(input: ClaimInput, seenAttempts: number): Promise<FreeDomainClaim | null> {
    const current = this.rows.get(input.userId);
    if (!current || current.status !== "failed" || current.attempts !== seenAttempts) return null;
    const next: FreeDomainClaim = {
      ...current,
      siteId: input.siteId,
      domain: input.domain,
      status: "pending",
      priceCents: input.priceCents,
      attempts: seenAttempts + 1,
      error: null,
    };
    this.rows.set(input.userId, next);
    return { ...next };
  }

  async markPurchased(userId: string, orderId: string | null): Promise<void> {
    const current = this.rows.get(userId);
    if (!current || current.status !== "pending") return;
    this.rows.set(userId, {
      ...current,
      status: "purchased",
      orderId,
      purchasedAt: new Date().toISOString(),
      error: null,
    });
  }

  async markFailed(userId: string, error: string): Promise<void> {
    const current = this.rows.get(userId);
    if (!current || current.status !== "pending") return;
    this.rows.set(userId, { ...current, status: "failed", error: clip(error) });
  }

  async note(userId: string, error: string | null): Promise<void> {
    const current = this.rows.get(userId);
    if (current) this.rows.set(userId, { ...current, error: clip(error) });
  }

  async setAutoRenew(userId: string, autoRenew: boolean): Promise<void> {
    const current = this.rows.get(userId);
    if (current) this.rows.set(userId, { ...current, autoRenew });
  }
}

let store: FreeDomainStore | undefined;

export function getFreeDomainStore(): FreeDomainStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Como em getSiteStore: na produção da Vercel, sem Supabase é erro (a memória perderia tudo).
  if (!(url && serviceKey) && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Supabase is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  if (url && serviceKey) {
    store = new SupabaseFreeDomainStore({ url, serviceKey });
  } else {
    globalForClaims.__nosweatFreeDomainClaims ??= new Map();
    store = new MemoryFreeDomainStore(globalForClaims.__nosweatFreeDomainClaims);
  }
  return store;
}
