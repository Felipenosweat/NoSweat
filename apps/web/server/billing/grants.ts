import type { PlanId } from "@nosweat/schema";
import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";

// Acesso liberado à mão pelo admin (tabela public.access_grants, migration 0012): quem pagou
// por Pix/WhatsApp ganha um plano até uma data. Supabase em produção, memória no dev/testes.
// Os lembretes de vencimento (reminders.ts, migration 0018) guardam a última etapa avisada.

/** Etapas do lembrete de vencimento: faltam 7 dias, falta 1 dia, acabou. */
export type ReminderStage = "7d" | "1d" | "ended";

export type AccessGrant = {
  userId: string;
  plan: PlanId;
  expiresAt: string;
  note: string | null;
  grantedBy: string | null;
  updatedAt: string;
  /**
   * Último lembrete enviado e para qual `expiresAt` ele valeu (migration 0018). Opcionais: sem
   * eles no upsert, o banco mantém o que já tinha (e tudo funciona antes da migration rodar).
   * Quando o admin muda a data, `remindedFor` deixa de bater e os lembretes recomeçam.
   */
  reminderStage?: ReminderStage | null;
  remindedFor?: string | null;
};

export interface GrantStore {
  get(userId: string): Promise<AccessGrant | null>;
  listAll(): Promise<AccessGrant[]>;
  /** Cria ou substitui o acesso da conta (chave: userId). */
  upsert(grant: AccessGrant): Promise<void>;
  remove(userId: string): Promise<void>;
  /**
   * Acessos com data final antes de `beforeIso` (e depois de `afterIso`, se dado), do que vence
   * antes para o que vence depois. Usado pelos lembretes de vencimento.
   */
  listExpiringOrExpired(beforeIso: string, afterIso?: string): Promise<AccessGrant[]>;
  /**
   * Grava só a etapa do lembrete (sem tocar na data final nem no resto): se o admin mudar o
   * acesso enquanto o cron roda, nada do que ele salvou é sobrescrito.
   */
  setReminder(
    userId: string,
    stage: ReminderStage | null,
    remindedFor: string | null,
  ): Promise<void>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const Row = z.object({
  user_id: z.string(),
  plan: z.enum(["starter", "pro", "premium"]),
  expires_at: z.string(),
  note: z.string().nullable(),
  granted_by: z.string().nullable(),
  updated_at: z.string(),
  // Colunas da migration 0018: opcionais para a leitura funcionar antes de ela rodar.
  reminder_stage: z.enum(["7d", "1d", "ended"]).nullish(),
  reminded_for: z.string().nullish(),
});

const toGrant = (row: z.infer<typeof Row>): AccessGrant => ({
  userId: row.user_id,
  plan: row.plan,
  expiresAt: row.expires_at,
  note: row.note,
  grantedBy: row.granted_by,
  updatedAt: row.updated_at,
  // `undefined` quando a coluna não existe (antes da migration 0018): assim um upsert feito a
  // partir deste registro não manda colunas que o banco ainda não tem.
  reminderStage: row.reminder_stage,
  remindedFor: row.reminded_for,
});

/** Mesmo instante? (o Postgres devolve `+00:00` onde o JS escreve `Z`.) */
export function sameInstant(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return Date.parse(a) === Date.parse(b);
}

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
        // Só manda as colunas do lembrete quando vieram (undefined = o banco mantém o valor).
        ...(grant.reminderStage !== undefined ? { reminder_stage: grant.reminderStage } : {}),
        ...(grant.remindedFor !== undefined ? { reminded_for: grant.remindedFor } : {}),
      }),
    });
  }

  async listExpiringOrExpired(beforeIso: string, afterIso?: string): Promise<AccessGrant[]> {
    const before = `&expires_at=lt.${encodeURIComponent(beforeIso)}`;
    const after = afterIso ? `&expires_at=gt.${encodeURIComponent(afterIso)}` : "";
    return z
      .array(Row)
      .parse(await this.call(`?select=*${before}${after}&order=expires_at.asc`))
      .map(toGrant);
  }

  async setReminder(
    userId: string,
    stage: ReminderStage | null,
    remindedFor: string | null,
  ): Promise<void> {
    if (!UUID.test(userId)) return;
    await this.call(`?user_id=eq.${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ reminder_stage: stage, reminded_for: remindedFor }),
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
    // Como no Supabase: colunas do lembrete ausentes mantêm o valor que já estava salvo.
    const previous = this.rows.get(grant.userId);
    this.rows.set(grant.userId, {
      ...grant,
      reminderStage:
        grant.reminderStage !== undefined ? grant.reminderStage : (previous?.reminderStage ?? null),
      remindedFor:
        grant.remindedFor !== undefined ? grant.remindedFor : (previous?.remindedFor ?? null),
    });
  }

  async listExpiringOrExpired(beforeIso: string, afterIso?: string): Promise<AccessGrant[]> {
    const before = Date.parse(beforeIso);
    const after = afterIso ? Date.parse(afterIso) : Number.NEGATIVE_INFINITY;
    return [...this.rows.values()]
      .filter((grant) => {
        const at = Date.parse(grant.expiresAt);
        return at < before && at > after;
      })
      .sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));
  }

  async setReminder(
    userId: string,
    stage: ReminderStage | null,
    remindedFor: string | null,
  ): Promise<void> {
    const row = this.rows.get(userId);
    if (row) this.rows.set(userId, { ...row, reminderStage: stage, remindedFor });
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
