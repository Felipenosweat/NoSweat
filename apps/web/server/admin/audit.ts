import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { requestIpHash } from "../ip";
import { normalizeSupabaseUrl } from "../store/supabase";

// Registro das ações do admin (tabela public.admin_audit_log, migration 0030). Só ACRESCENTA:
// no banco não há UPDATE nem DELETE (permissões revogadas + gatilho que recusa). Antes estas
// ações só iam para o console.info (logs da Vercel: retenção curta e editáveis por quem tem o
// projeto). Supabase em produção, memória no dev/testes (mesma regra do server/store).
// O /admin/audit mostra as últimas 100 linhas.

export const ADMIN_AUDIT_ACTIONS = [
  "mfa.enroll",
  "mfa.verify",
  "view_as.start",
  "view_as.stop",
  "site.access",
  "site.delete",
  "site.unpublish",
  "guest_drafts.delete",
  "credits.adjust",
  "access.grant",
  "access.revoke",
  "social.tester",
  "account.login_disabled",
  "account.login_enabled",
  "account.delete",
  "test_account.create",
  "expense.create",
  "expense.update",
  "expense.delete",
  "prospects.status",
  "prospects.export",
  "model.create",
  "model.delete",
  "model.status",
] as const;
export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export type AdminAuditTarget = "user" | "site" | "expense" | "prospect" | "model" | "guest_sites";

export type AdminAuditEntry = {
  id: string;
  adminId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  ipHash: string | null;
  createdAt: string;
};

export type NewAdminAuditEntry = Omit<AdminAuditEntry, "id" | "createdAt">;

export interface AdminAuditStore {
  insert(entry: NewAdminAuditEntry): Promise<void>;
  /** As mais novas primeiro. */
  listRecent(limit: number): Promise<AdminAuditEntry[]>;
}

/** Motivo do "ver como" (e de outras ações que pedirem): obrigatório, curto. */
export const AuditReason = z
  .string()
  .trim()
  .min(3, "Tell us why (at least 3 characters).")
  .max(300, "Keep the reason under 300 characters.");

// ---------- Supabase ----------

const Row = z.object({
  id: z.string(),
  admin_id: z.string(),
  action: z.string(),
  target_type: z.string().nullable(),
  target_id: z.string().nullable(),
  reason: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  ip_hash: z.string().nullable(),
  created_at: z.string(),
});

function toEntry(row: z.infer<typeof Row>): AdminAuditEntry {
  return {
    id: row.id,
    adminId: row.admin_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    metadata: row.metadata ?? {},
    ipHash: row.ip_hash,
    createdAt: row.created_at,
  };
}

export class SupabaseAdminAuditStore implements AdminAuditStore {
  private readonly endpoint: string;

  constructor(
    private readonly config: { url: string; serviceKey: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.endpoint = `${normalizeSupabaseUrl(config.url)}/rest/v1/admin_audit_log`;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      apikey: this.config.serviceKey,
      Authorization: `Bearer ${this.config.serviceKey}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }

  async insert(entry: NewAdminAuditEntry): Promise<void> {
    const res = await this.fetchImpl(this.endpoint, {
      method: "POST",
      cache: "no-store",
      headers: this.headers({ Prefer: "return=minimal" }),
      body: JSON.stringify({
        admin_id: entry.adminId,
        action: entry.action,
        target_type: entry.targetType,
        target_id: entry.targetId,
        reason: entry.reason,
        metadata: entry.metadata,
        ip_hash: entry.ipHash,
      }),
    });
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
  }

  async listRecent(limit: number): Promise<AdminAuditEntry[]> {
    const safe = Math.max(1, Math.min(500, Math.floor(limit)));
    const res = await this.fetchImpl(
      `${this.endpoint}?select=*&order=created_at.desc&limit=${safe}`,
      { cache: "no-store", headers: this.headers() },
    );
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    return z
      .array(Row)
      .parse(await res.json())
      .map(toEntry);
  }
}

// ---------- memória (dev e testes) ----------

const globalForAudit = globalThis as typeof globalThis & {
  __nosweatAdminAudit?: AdminAuditEntry[];
};

export class MemoryAdminAuditStore implements AdminAuditStore {
  private get rows(): AdminAuditEntry[] {
    globalForAudit.__nosweatAdminAudit ??= [];
    return globalForAudit.__nosweatAdminAudit;
  }

  async insert(entry: NewAdminAuditEntry): Promise<void> {
    this.rows.push({
      ...entry,
      metadata: { ...entry.metadata },
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
  }

  async listRecent(limit: number): Promise<AdminAuditEntry[]> {
    return this.rows
      .slice()
      .reverse()
      .slice(0, limit)
      .map((row) => ({ ...row, metadata: { ...row.metadata } }));
  }
}

let store: AdminAuditStore | undefined;

export function getAdminAuditStore(): AdminAuditStore {
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
    url && serviceKey
      ? new SupabaseAdminAuditStore({ url, serviceKey })
      : new MemoryAdminAuditStore();
  return store;
}

/** Só para testes: limpa a memória entre um teste e outro. */
export function resetMemoryAdminAuditStore(): void {
  globalForAudit.__nosweatAdminAudit = undefined;
}

// ---------- registrar ----------

export type RecordAdminActionInput = {
  adminId: string;
  action: AdminAuditAction;
  targetType?: AdminAuditTarget | null;
  targetId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

/** IP (hash) e navegador do request atual; fora de um request (testes, scripts), nada. */
async function requestContext(): Promise<{ ipHash: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    return {
      ipHash: await requestIpHash(h),
      userAgent: h.get("user-agent")?.slice(0, 200) ?? null,
    };
  } catch {
    return { ipHash: null, userAgent: null };
  }
}

/**
 * Grava uma ação do admin. Normalmente NÃO lança (falha no banco vira console.error e a linha
 * vai para o log da Vercel, para não perder o rastro). Com `strict: true` lança: use quando a
 * ação não pode acontecer sem registro (ex.: "ver como").
 */
export async function recordAdminAction(
  input: RecordAdminActionInput,
  options: { strict?: boolean; store?: AdminAuditStore } = {},
): Promise<void> {
  const { ipHash, userAgent } = await requestContext();
  const entry: NewAdminAuditEntry = {
    adminId: input.adminId,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    reason: input.reason?.trim() ? input.reason.trim().slice(0, 500) : null,
    metadata: { ...(input.metadata ?? {}), ...(userAgent ? { userAgent } : {}) },
    ipHash,
  };
  try {
    await (options.store ?? getAdminAuditStore()).insert(entry);
  } catch (error) {
    console.error("[admin-audit] could not record", { ...entry, metadata: undefined }, error);
    if (options.strict) throw error;
  }
}

/**
 * Grava depois da resposta (`after` do Next), para leituras que não devem esperar o banco
 * (ex.: o admin abrindo o site de um cliente). Fora de um request, grava na hora sem esperar.
 */
export function recordAdminActionLater(input: RecordAdminActionInput): void {
  const task = () => recordAdminAction(input);
  try {
    after(task);
  } catch {
    void task();
  }
}

// Acesso do admin ao site de outra pessoa: uma linha por admin + site a cada 15 minutos (abrir o
// editor faz vários pedidos; sem isto o registro viraria ruído). Por instância do servidor.
const SITE_ACCESS_WINDOW_MS = 15 * 60 * 1000;
const recentSiteAccess = new Map<string, number>();

export function noteAdminSiteAccess(
  adminId: string,
  site: { id: string; ownerId: string | null },
  now: number = Date.now(),
): boolean {
  const key = `${adminId}:${site.id}`;
  const last = recentSiteAccess.get(key);
  if (last !== undefined && now - last < SITE_ACCESS_WINDOW_MS) return false;
  if (recentSiteAccess.size > 5000) recentSiteAccess.clear();
  recentSiteAccess.set(key, now);
  recordAdminActionLater({
    adminId,
    action: "site.access",
    targetType: "site",
    targetId: site.id,
    metadata: { ownerId: site.ownerId },
  });
  return true;
}
