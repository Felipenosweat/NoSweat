import type { PlanId } from "@nosweat/schema";
import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";

// Acesso liberado à mão pelo admin (tabela public.access_grants, migration 0012): quem pagou
// por Pix/WhatsApp ganha um plano até uma data. Supabase em produção, memória no dev/testes.

export type AccessGrant = {
  userId: string;
  plan: PlanId;
  expiresAt: string;
  note: string | null;
  grantedBy: string | null;
  updatedAt: string;
};

export interface GrantStore {
  get(userId: string): Promise<AccessGrant | null>;
  listAll(): Promise<AccessGrant[]>;
  /** Cria ou substitui o acesso da conta (chave: userId). */
  upsert(grant: AccessGrant): Promise<void>;
  remove(userId: string): Promise<void>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const Row = z.object({
  user_id: z.string(),
  plan: z.enum(["starter", "pro", "premium"]),
  expires_at: z.string(),
  note: z.string().nullable(),
  granted_by: z.string().nullable(),
  updated_at: z.string(),
});

const toGrant = (row: z.infer<typeof Row>): AccessGrant => ({
  userId: row.user_id,
  plan: row.plan,
  expiresAt: row.expires_at,
  note: row.note,
  grantedBy: row.granted_by,
  updatedAt: row.updated_at,
});

/** `true` enquanto a data final não passou. */
export function isGrantActive(grant: AccessGrant | null, now = new Date()): grant is AccessGrant {
  return grant !== null && new Date(grant.expiresAt).getTime() > now.getTime();
}

/**
 * Nova data final ao liberar `days` dias: soma ao que ainda falta (renovar antes de vencer não
 * perde dias); se já venceu, conta a partir de agora.
 */
export function extendExpiry(current: AccessGrant | null, days: number, now = new Date()): string {
  const start = isGrantActive(current, now) ? new Date(current.expiresAt) : now;
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export class SupabaseGrantStore implements GrantStore {
  private readonly endpoint: string;

  constructor(
    private readonly config: { url: string; serviceKey: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.endpoint = `${normalizeSupabaseUrl(config.url)}/rest/v1/access_grants`;
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

  async get(userId: string): Promise<AccessGrant | null> {
    if (!UUID.test(userId)) return null;
    const [row] = z.array(Row).parse(await this.call(`?user_id=eq.${userId}&select=*&limit=1`));
    return row ? toGrant(row) : null;
  }

  async listAll(): Promise<AccessGrant[]> {
    return z
      .array(Row)
      .parse(await this.call("?select=*"))
      .map(toGrant);
  }

  async upsert(grant: AccessGrant): Promise<void> {
    if (!UUID.test(grant.userId)) throw new Error(`Invalid user id: ${grant.userId}`);
    await this.call("?on_conflict=user_id", {
      method: "POST",
      body: JSON.stringify({
        user_id: grant.userId,
        plan: grant.plan,
        expires_at: grant.expiresAt,
        note: grant.note,
        granted_by: grant.grantedBy && UUID.test(grant.grantedBy) ? grant.grantedBy : null,
        updated_at: grant.updatedAt,
      }),
    });
  }

  async remove(userId: string): Promise<void> {
    if (!UUID.test(userId)) return;
    await this.call(`?user_id=eq.${userId}`, { method: "DELETE" });
  }
}

const globalForGrants = globalThis as typeof globalThis & {
  __nosweatGrants?: Map<string, AccessGrant>;
};

export class MemoryGrantStore implements GrantStore {
  private get rows(): Map<string, AccessGrant> {
    globalForGrants.__nosweatGrants ??= new Map();
    return globalForGrants.__nosweatGrants;
  }

  async get(userId: string): Promise<AccessGrant | null> {
    return this.rows.get(userId) ?? null;
  }

  async listAll(): Promise<AccessGrant[]> {
    return [...this.rows.values()];
  }

  async upsert(grant: AccessGrant): Promise<void> {
    this.rows.set(grant.userId, { ...grant });
  }

  async remove(userId: string): Promise<void> {
    this.rows.delete(userId);
  }
}

let store: GrantStore | undefined;

export function getGrantStore(): GrantStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  store = url && serviceKey ? new SupabaseGrantStore({ url, serviceKey }) : new MemoryGrantStore();
  return store;
}
