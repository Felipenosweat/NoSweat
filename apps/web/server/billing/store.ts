import type { BillingInterval, PlanId } from "@nosweat/schema";
import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";

// Assinaturas por conta (tabela public.subscriptions, migration 0011). Supabase em produção,
// memória no dev/testes (mesma regra do server/store).

export type SubscriptionRecord = {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  plan: PlanId | null;
  interval: BillingInterval | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export interface BillingStore {
  get(userId: string): Promise<SubscriptionRecord | null>;
  getByCustomer(stripeCustomerId: string): Promise<SubscriptionRecord | null>;
  /** Todas as assinaturas (painel do admin). */
  listAll(): Promise<SubscriptionRecord[]>;
  /** Cria ou atualiza a linha da conta (chave: userId). */
  upsert(record: SubscriptionRecord): Promise<void>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CUSTOMER = /^cus_[A-Za-z0-9]+$/;

const Row = z.object({
  user_id: z.string(),
  stripe_customer_id: z.string(),
  stripe_subscription_id: z.string().nullable(),
  plan: z.enum(["starter", "pro", "premium"]).nullable(),
  billing_interval: z.enum(["monthly", "annual"]).nullable(),
  status: z.string().nullable(),
  current_period_end: z.string().nullable(),
  cancel_at_period_end: z.boolean(),
});

function toRecord(row: z.infer<typeof Row>): SubscriptionRecord {
  return {
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    plan: row.plan,
    interval: row.billing_interval,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
  };
}

export class SupabaseBillingStore implements BillingStore {
  private readonly endpoint: string;

  constructor(
    private readonly config: { url: string; serviceKey: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.endpoint = `${normalizeSupabaseUrl(config.url)}/rest/v1/subscriptions`;
  }

  private async call(query: string, init: RequestInit = {}): Promise<unknown> {
    const res = await this.fetchImpl(`${this.endpoint}${query}`, {
      ...init,
      cache: "no-store",
      headers: {
        apikey: this.config.serviceKey,
        Authorization: `Bearer ${this.config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=merge-duplicates",
      },
    });
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    return res.json();
  }

  private async one(query: string): Promise<SubscriptionRecord | null> {
    const [row] = z.array(Row).parse(await this.call(`${query}&select=*&limit=1`));
    return row ? toRecord(row) : null;
  }

  async get(userId: string): Promise<SubscriptionRecord | null> {
    return UUID.test(userId) ? this.one(`?user_id=eq.${userId}`) : null;
  }

  async getByCustomer(customerId: string): Promise<SubscriptionRecord | null> {
    return CUSTOMER.test(customerId) ? this.one(`?stripe_customer_id=eq.${customerId}`) : null;
  }

  async listAll(): Promise<SubscriptionRecord[]> {
    // TODO: paginar quando houver mais de 1000 assinaturas.
    return z
      .array(Row)
      .parse(await this.call("?select=*&limit=1000"))
      .map(toRecord);
  }

  async upsert(record: SubscriptionRecord): Promise<void> {
    if (!UUID.test(record.userId)) throw new Error(`Invalid user id: ${record.userId}`);
    await this.call("?on_conflict=user_id", {
      method: "POST",
      body: JSON.stringify({
        user_id: record.userId,
        stripe_customer_id: record.stripeCustomerId,
        stripe_subscription_id: record.stripeSubscriptionId,
        plan: record.plan,
        billing_interval: record.interval,
        status: record.status,
        current_period_end: record.currentPeriodEnd,
        cancel_at_period_end: record.cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      }),
    });
  }
}

const globalForBilling = globalThis as typeof globalThis & {
  __nosweatSubscriptions?: Map<string, SubscriptionRecord>;
};

export class MemoryBillingStore implements BillingStore {
  private get rows(): Map<string, SubscriptionRecord> {
    globalForBilling.__nosweatSubscriptions ??= new Map();
    return globalForBilling.__nosweatSubscriptions;
  }

  async get(userId: string): Promise<SubscriptionRecord | null> {
    return this.rows.get(userId) ?? null;
  }

  async getByCustomer(customerId: string): Promise<SubscriptionRecord | null> {
    return [...this.rows.values()].find((r) => r.stripeCustomerId === customerId) ?? null;
  }

  async listAll(): Promise<SubscriptionRecord[]> {
    return [...this.rows.values()].map((r) => ({ ...r }));
  }

  async upsert(record: SubscriptionRecord): Promise<void> {
    this.rows.set(record.userId, { ...record });
  }
}

let store: BillingStore | undefined;

export function getBillingStore(): BillingStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  store =
    url && serviceKey ? new SupabaseBillingStore({ url, serviceKey }) : new MemoryBillingStore();
  return store;
}
