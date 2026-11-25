import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";

// Pedidos de avaliação automáticos (tabelas da migration 0034): a chave liga/desliga do dono e um
// registro por pedido. Supabase em produção, memória no dev/testes (mesma regra dos outros stores).

/** Dias sem pedir de novo ao mesmo cliente (não encher a caixa de quem volta sempre). */
export const AUTO_REVIEW_COOLDOWN_DAYS = 30;

export type AutoReviewClaim = {
  ownerId: string;
  jobId: string;
  clientId: string;
  email: string;
};

export type AutoReviewStatus = "sent" | "failed";

export interface ReviewRequestStore {
  /** Pedido automático ligado? Sem configuração gravada = ligado. */
  getAutoEnabled(ownerId: string): Promise<boolean>;
  setAutoEnabled(ownerId: string, enabled: boolean): Promise<void>;
  /**
   * Reserva o pedido do job ANTES do envio. `null` = o job já teve pedido, ou o cliente recebeu
   * um (pendente ou enviado) nos últimos `AUTO_REVIEW_COOLDOWN_DAYS` dias.
   */
  claim(input: AutoReviewClaim): Promise<string | null>;
  /** Resultado do envio da linha reservada. */
  finish(id: string, status: AutoReviewStatus): Promise<void>;
  /** Quantos pedidos automáticos saíram (enviados) desde `sinceIso`. */
  countSent(ownerId: string, sinceIso: string): Promise<number>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: string) => UUID.test(value);
const DAY_MS = 24 * 60 * 60 * 1000;
/** Teto da contagem do mês (só um número na tela). */
const COUNT_LIMIT = 1000;

const SettingsRow = z.object({ auto_enabled: z.boolean() });
const IdRow = z.object({ id: z.string() });

export class SupabaseReviewRequestStore implements ReviewRequestStore {
  private readonly base: string;

  constructor(
    private readonly config: { url: string; serviceKey: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.base = `${normalizeSupabaseUrl(config.url)}/rest/v1`;
  }

  private async call(path: string, init: RequestInit & { prefer?: string } = {}): Promise<unknown> {
    const { prefer, ...rest } = init;
    const res = await this.fetchImpl(`${this.base}${path}`, {
      ...rest,
      cache: "no-store",
      headers: {
        apikey: this.config.serviceKey,
        Authorization: `Bearer ${this.config.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: prefer ?? "return=representation",
      },
    });
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async getAutoEnabled(ownerId: string) {
    if (!isUuid(ownerId)) return true;
    const rows = z
      .array(SettingsRow)
      .parse(
        (await this.call(
          `/review_request_settings?owner_id=eq.${ownerId}&select=auto_enabled&limit=1`,
        )) ?? [],
      );
    return rows[0]?.auto_enabled ?? true;
  }

  async setAutoEnabled(ownerId: string, enabled: boolean) {
    if (!isUuid(ownerId)) return;
    await this.call("/review_request_settings?on_conflict=owner_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify({
        owner_id: ownerId,
        auto_enabled: enabled,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  async claim(input: AutoReviewClaim) {
    if (![input.ownerId, input.jobId, input.clientId].every(isUuid)) return null;
    const id = await this.call("/rpc/claim_auto_review_request", {
      method: "POST",
      body: JSON.stringify({
        p_owner: input.ownerId,
        p_job: input.jobId,
        p_client: input.clientId,
        p_email: input.email,
        p_cooldown_days: AUTO_REVIEW_COOLDOWN_DAYS,
      }),
    });
    return z.string().nullable().parse(id ?? null);
  }

  async finish(id: string, status: AutoReviewStatus) {
    if (!isUuid(id)) return;
    await this.call(`/auto_review_requests?id=eq.${id}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({
        status,
        sent_at: status === "sent" ? new Date().toISOString() : null,
      }),
    });
  }

  async countSent(ownerId: string, sinceIso: string) {
    if (!isUuid(ownerId) || Number.isNaN(Date.parse(sinceIso))) return 0;
    const rows = z
      .array(IdRow)
      .parse(
        (await this.call(
          `/auto_review_requests?owner_id=eq.${ownerId}&status=eq.sent` +
            `&created_at=gte.${encodeURIComponent(sinceIso)}&select=id&limit=${COUNT_LIMIT}`,
        )) ?? [],
      );
    return rows.length;
  }
}

// ---------- Memória (dev e testes) ----------

type MemoryRequest = AutoReviewClaim & {
  id: string;
  status: "pending" | AutoReviewStatus;
  createdAt: number;
};

type MemoryState = { settings: Map<string, boolean>; requests: MemoryRequest[] };

const globalForReviews = globalThis as typeof globalThis & {
  __nosweatReviewRequests?: MemoryState;
};

export class MemoryReviewRequestStore implements ReviewRequestStore {
  private get state(): MemoryState {
    globalForReviews.__nosweatReviewRequests ??= { settings: new Map(), requests: [] };
    return globalForReviews.__nosweatReviewRequests;
  }

  async getAutoEnabled(ownerId: string) {
    return this.state.settings.get(ownerId) ?? true;
  }

  async setAutoEnabled(ownerId: string, enabled: boolean) {
    this.state.settings.set(ownerId, enabled);
  }

  /** Mesmas regras da função SQL `claim_auto_review_request`. `now` só para testes. */
  async claim(input: AutoReviewClaim, now: number = Date.now()) {
    const { requests } = this.state;
    if (requests.some((r) => r.jobId === input.jobId)) return null;
    const since = now - AUTO_REVIEW_COOLDOWN_DAYS * DAY_MS;
    const recent = requests.some(
      (r) =>
        r.ownerId === input.ownerId &&
        r.clientId === input.clientId &&
        r.status !== "failed" &&
        r.createdAt > since,
    );
    if (recent) return null;
    const id = crypto.randomUUID();
    requests.push({ ...input, id, status: "pending", createdAt: now });
    return id;
  }

  async finish(id: string, status: AutoReviewStatus) {
    const row = this.state.requests.find((r) => r.id === id);
    if (row) row.status = status;
  }

  async countSent(ownerId: string, sinceIso: string) {
    const since = Date.parse(sinceIso);
    return this.state.requests.filter(
      (r) => r.ownerId === ownerId && r.status === "sent" && r.createdAt >= since,
    ).length;
  }
}

let store: ReviewRequestStore | undefined;

export function getReviewRequestStore(): ReviewRequestStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Como nos outros stores: na produção da Vercel, sem Supabase é erro (a memória perderia tudo).
  if (!(url && serviceKey) && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Supabase is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  store =
    url && serviceKey
      ? new SupabaseReviewRequestStore({ url, serviceKey })
      : new MemoryReviewRequestStore();
  return store;
}

/** Só para testes: limpa a memória entre um teste e outro. */
export function resetMemoryReviewRequestStore(): void {
  globalForReviews.__nosweatReviewRequests = undefined;
}
