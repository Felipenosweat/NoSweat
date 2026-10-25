import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";

// Movimentos de créditos (tabela public.credit_ledger, migration 0019). Supabase em produção,
// memória no dev/testes (mesma regra de server/billing/store.ts).

export type CreditBucket = "monthly" | "topup";
export type CreditReason = "monthly_grant" | "spend" | "topup" | "admin_adjust" | "refund";

export type CreditEntry = {
  id: string;
  userId: string;
  /** Negativo = gasto; positivo = devolução, compra ou bônus. */
  delta: number;
  bucket: CreditBucket;
  reason: CreditReason;
  action: string | null;
  siteId: string | null;
  createdAt: string;
  meta: Record<string, unknown>;
};

export type NewCreditEntry = Omit<CreditEntry, "id" | "createdAt">;

/** Somas usadas no saldo (ver `credit_sums` na migration 0019). */
export type CreditSums = {
  /** Saldo comprado/ajustado (todos os tempos). */
  topup: number;
  /** Gasto líquido da cota mensal desde `periodStart` (gastos menos devoluções). */
  monthlySpent: number;
  /** Bônus somados à cota deste mês (`monthly_grant` e ajustes no bucket mensal). */
  monthlyGranted: number;
};

export interface CreditStore {
  /** Grava vários movimentos de uma vez (um gasto pode sair da cota e do top-up). */
  insert(entries: NewCreditEntry[]): Promise<void>;
  sums(userId: string, periodStartIso: string): Promise<CreditSums>;
  /** Movimentos da conta desde `sinceIso`, do mais novo para o mais antigo. */
  listSince(userId: string, sinceIso: string): Promise<CreditEntry[]>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const Row = z.object({
  id: z.string(),
  user_id: z.string(),
  delta: z.number().int(),
  bucket: z.enum(["monthly", "topup"]),
  reason: z.enum(["monthly_grant", "spend", "topup", "admin_adjust", "refund"]),
  action: z.string().nullable(),
  site_id: z.string().nullable(),
  created_at: z.string(),
  meta: z.record(z.string(), z.unknown()).nullable(),
});

const SumsRow = z.object({
  topup: z.coerce.number(),
  monthly_spent: z.coerce.number(),
  monthly_granted: z.coerce.number(),
});

const toEntry = (row: z.infer<typeof Row>): CreditEntry => ({
  id: row.id,
  userId: row.user_id,
  delta: row.delta,
  bucket: row.bucket,
  reason: row.reason,
  action: row.action,
  siteId: row.site_id,
  createdAt: row.created_at,
  meta: row.meta ?? {},
});

export class SupabaseCreditStore implements CreditStore {
  private readonly base: string;

  constructor(
    private readonly config: { url: string; serviceKey: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.base = `${normalizeSupabaseUrl(config.url)}/rest/v1`;
  }

  private async call(path: string, init: RequestInit = {}, prefer?: string): Promise<unknown> {
    const res = await this.fetchImpl(`${this.base}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        apikey: this.config.serviceKey,
        Authorization: `Bearer ${this.config.serviceKey}`,
        "Content-Type": "application/json",
        ...(prefer ? { Prefer: prefer } : {}),
      },
    });
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    const text = await res.text();
    return text ? (JSON.parse(text) as unknown) : null;
  }

  async insert(entries: NewCreditEntry[]): Promise<void> {
    if (entries.length === 0) return;
    for (const entry of entries) {
      if (!UUID.test(entry.userId)) throw new Error(`Invalid user id: ${entry.userId}`);
    }
    // Um POST só com a lista: o Postgres grava tudo ou nada.
    await this.call(
      "/credit_ledger",
      {
        method: "POST",
        body: JSON.stringify(
          entries.map((entry) => ({
            user_id: entry.userId,
            delta: entry.delta,
            bucket: entry.bucket,
            reason: entry.reason,
            action: entry.action,
            site_id: entry.siteId,
            meta: entry.meta,
          })),
        ),
      },
      "return=minimal",
    );
  }

  async sums(userId: string, periodStartIso: string): Promise<CreditSums> {
    if (!UUID.test(userId)) return { topup: 0, monthlySpent: 0, monthlyGranted: 0 };
    const rows = z.array(SumsRow).parse(
      await this.call("/rpc/credit_sums", {
        method: "POST",
        body: JSON.stringify({ p_user_id: userId, p_period_start: periodStartIso }),
      }),
    );
    const row = rows[0];
    return {
      topup: row?.topup ?? 0,
      monthlySpent: row?.monthly_spent ?? 0,
      monthlyGranted: row?.monthly_granted ?? 0,
    };
  }

  async listSince(userId: string, sinceIso: string): Promise<CreditEntry[]> {
    if (!UUID.test(userId)) return [];
    const since = encodeURIComponent(sinceIso);
    return z
      .array(Row)
      .parse(
        await this.call(
          `/credit_ledger?user_id=eq.${userId}&created_at=gte.${since}&select=*&order=created_at.desc&limit=200`,
        ),
      )
      .map(toEntry);
  }
}

const globalForCredits = globalThis as typeof globalThis & {
  __nosweatCreditLedger?: CreditEntry[];
};

export class MemoryCreditStore implements CreditStore {
  private get rows(): CreditEntry[] {
    globalForCredits.__nosweatCreditLedger ??= [];
    return globalForCredits.__nosweatCreditLedger;
  }

  async insert(entries: NewCreditEntry[]): Promise<void> {
    const createdAt = new Date().toISOString();
    for (const entry of entries) {
      this.rows.push({ ...entry, id: crypto.randomUUID(), createdAt, meta: { ...entry.meta } });
    }
  }

  async sums(userId: string, periodStartIso: string): Promise<CreditSums> {
    const start = Date.parse(periodStartIso);
    const sums: CreditSums = { topup: 0, monthlySpent: 0, monthlyGranted: 0 };
    for (const row of this.rows) {
      if (row.userId !== userId) continue;
      if (row.bucket === "topup") {
        sums.topup += row.delta;
        continue;
      }
      if (Date.parse(row.createdAt) < start) continue;
      if (row.reason === "spend" || row.reason === "refund") sums.monthlySpent -= row.delta;
      if (row.reason === "monthly_grant" || row.reason === "admin_adjust") {
        sums.monthlyGranted += row.delta;
      }
    }
    return sums;
  }

  async listSince(userId: string, sinceIso: string): Promise<CreditEntry[]> {
    const since = Date.parse(sinceIso);
    return this.rows
      .filter((row) => row.userId === userId && Date.parse(row.createdAt) >= since)
      .reverse()
      .map((row) => ({ ...row, meta: { ...row.meta } }));
  }
}

let store: CreditStore | undefined;

export function getCreditStore(): CreditStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Como em getSiteStore: na produção da Vercel, sem Supabase é erro (a memória perderia tudo).
  if (!(url && serviceKey) && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Supabase is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  store =
    url && serviceKey ? new SupabaseCreditStore({ url, serviceKey }) : new MemoryCreditStore();
  return store;
}
