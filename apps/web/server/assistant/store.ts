import type { AssistantConversationSummary, AssistantMessage } from "@nosweat/schema";
import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";

// Conversas do atendente de IA (tabelas site_assistants, assistant_conversations e
// assistant_messages, migration 0032). Supabase em produção, memória no dev/testes.
// Nada do visitante além do que ele digitou: sem IP, cookie ou user agent.

export type ConversationRecord = AssistantConversationSummary & {
  siteId: string;
  ownerId: string;
  leadId: string | null;
};

export interface AssistantStore {
  /** Atendente ligado no site (sem linha = desligado). */
  isEnabled(siteId: string): Promise<boolean>;
  setEnabled(siteId: string, enabled: boolean): Promise<void>;
  createConversation(siteId: string, ownerId: string): Promise<ConversationRecord>;
  /** Conversa `id` DESTE site, ou `null` (id de outro site conta como inexistente). */
  getConversation(id: string, siteId: string): Promise<ConversationRecord | null>;
  countConversationsSince(siteId: string, sinceIso: string): Promise<number>;
  /**
   * Grava a mensagem do visitante e soma 1 na contagem, sem corrida (só se a conversa é deste
   * site e tem menos de `max`). Devolve a nova contagem, ou `null` (não achou ou já no limite).
   */
  addVisitorMessage(id: string, siteId: string, text: string, max: number): Promise<number | null>;
  addAssistantMessage(id: string, text: string): Promise<void>;
  /** Marca a conversa como paga até `needed` créditos; devolve quantos ESTE pedido deve cobrar. */
  claimCharge(id: string, needed: number): Promise<number>;
  /** Desfaz `credits` da cobrança (sem saldo ou a IA falhou). */
  releaseCharge(id: string, credits: number): Promise<void>;
  setLead(id: string, leadId: string): Promise<void>;
  /** Conversas do site, da mais nova para a mais antiga. */
  listConversations(siteId: string, limit: number): Promise<ConversationRecord[]>;
  listMessages(id: string): Promise<AssistantMessage[]>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PREVIEW_MAX = 200;
/** O banco aceita até 2000 caracteres por mensagem (o visitante manda no máximo 500). */
const TEXT_MAX = 2000;

const ConversationRow = z.object({
  id: z.string(),
  site_id: z.string(),
  owner_id: z.string(),
  created_at: z.string(),
  last_message_at: z.string(),
  visitor_messages: z.coerce.number(),
  credits_charged: z.coerce.number(),
  preview: z.string().nullable(),
  lead_id: z.string().nullable(),
});

const MessageRow = z.object({
  role: z.enum(["visitor", "assistant"]),
  text: z.string(),
  created_at: z.string(),
});

const toConversation = (row: z.infer<typeof ConversationRow>): ConversationRecord => ({
  id: row.id,
  siteId: row.site_id,
  ownerId: row.owner_id,
  createdAt: row.created_at,
  lastMessageAt: row.last_message_at,
  visitorMessages: row.visitor_messages,
  creditsCharged: row.credits_charged,
  preview: row.preview,
  leadCaptured: row.lead_id !== null,
  leadId: row.lead_id,
});

export class SupabaseAssistantStore implements AssistantStore {
  private readonly base: string;

  constructor(
    private readonly config: { url: string; serviceKey: string },
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.base = `${normalizeSupabaseUrl(config.url)}/rest/v1`;
  }

  private headers(prefer?: string): Record<string, string> {
    return {
      apikey: this.config.serviceKey,
      Authorization: `Bearer ${this.config.serviceKey}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    };
  }

  private async call(path: string, init: RequestInit = {}, prefer?: string): Promise<unknown> {
    const res = await this.fetchImpl(`${this.base}${path}`, {
      ...init,
      cache: "no-store",
      headers: this.headers(prefer),
    });
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? (JSON.parse(text) as unknown) : null;
  }

  async isEnabled(siteId: string) {
    if (!UUID.test(siteId)) return false;
    const rows = z
      .array(z.object({ enabled: z.boolean() }))
      .parse(await this.call(`/site_assistants?site_id=eq.${siteId}&select=enabled`));
    return rows[0]?.enabled ?? false;
  }

  async setEnabled(siteId: string, enabled: boolean) {
    if (!UUID.test(siteId)) throw new Error(`Invalid site id: ${siteId}`);
    await this.call(
      "/site_assistants?on_conflict=site_id",
      {
        method: "POST",
        body: JSON.stringify({ site_id: siteId, enabled, updated_at: new Date().toISOString() }),
      },
      "resolution=merge-duplicates,return=minimal",
    );
  }

  async createConversation(siteId: string, ownerId: string) {
    if (!UUID.test(siteId) || !UUID.test(ownerId)) throw new Error("Invalid site or owner id.");
    const rows = z.array(ConversationRow).parse(
      await this.call(
        "/assistant_conversations",
        {
          method: "POST",
          body: JSON.stringify({ id: crypto.randomUUID(), site_id: siteId, owner_id: ownerId }),
        },
        "return=representation",
      ),
    );
    const row = rows[0];
    if (!row) throw new Error("Supabase did not return the new conversation.");
    return toConversation(row);
  }

  async getConversation(id: string, siteId: string) {
    if (!UUID.test(id) || !UUID.test(siteId)) return null;
    const rows = z
      .array(ConversationRow)
      .parse(await this.call(`/assistant_conversations?id=eq.${id}&site_id=eq.${siteId}&select=*`));
    return rows[0] ? toConversation(rows[0]) : null;
  }

  async countConversationsSince(siteId: string, sinceIso: string) {
    if (!UUID.test(siteId)) return 0;
    const since = encodeURIComponent(new Date(sinceIso).toISOString());
    // HEAD + count=exact: o total vem no Content-Range (sem baixar as linhas).
    const res = await this.fetchImpl(
      `${this.base}/assistant_conversations?site_id=eq.${siteId}&created_at=gte.${since}&select=id`,
      { method: "HEAD", cache: "no-store", headers: this.headers("count=exact") },
    );
    if (!res.ok) throw new Error(`Supabase count failed (${res.status})`);
    const total = Number(res.headers.get("content-range")?.split("/")[1]);
    if (!Number.isFinite(total)) throw new Error("Supabase did not return a row count.");
    return total;
  }

  async addVisitorMessage(id: string, siteId: string, text: string, max: number) {
    if (!UUID.test(id) || !UUID.test(siteId)) return null;
    const result = await this.call("/rpc/assistant_add_visitor_message", {
      method: "POST",
      body: JSON.stringify({
        p_conversation: id,
        p_site: siteId,
        p_text: text.slice(0, TEXT_MAX),
        p_max: max,
      }),
    });
    return typeof result === "number" ? result : null;
  }

  async addAssistantMessage(id: string, text: string) {
    if (!UUID.test(id)) return;
    await this.call(
      "/assistant_messages",
      {
        method: "POST",
        body: JSON.stringify({
          conversation_id: id,
          role: "assistant",
          text: text.slice(0, TEXT_MAX),
        }),
      },
      "return=minimal",
    );
  }

  async claimCharge(id: string, needed: number) {
    if (!UUID.test(id)) return 0;
    const result = await this.call("/rpc/assistant_claim_charge", {
      method: "POST",
      body: JSON.stringify({ p_conversation: id, p_needed: needed }),
    });
    return typeof result === "number" ? result : 0;
  }

  async releaseCharge(id: string, credits: number) {
    if (!UUID.test(id) || credits <= 0) return;
    await this.call("/rpc/assistant_release_charge", {
      method: "POST",
      body: JSON.stringify({ p_conversation: id, p_credits: credits }),
    });
  }

  async setLead(id: string, leadId: string) {
    if (!UUID.test(id) || !UUID.test(leadId)) return;
    await this.call(
      `/assistant_conversations?id=eq.${id}`,
      { method: "PATCH", body: JSON.stringify({ lead_id: leadId }) },
      "return=minimal",
    );
  }

  async listConversations(siteId: string, limit: number) {
    if (!UUID.test(siteId)) return [];
    const take = Math.max(1, Math.min(100, Math.floor(limit)));
    return z
      .array(ConversationRow)
      .parse(
        await this.call(
          `/assistant_conversations?site_id=eq.${siteId}&visitor_messages=gt.0&select=*&order=created_at.desc&limit=${take}`,
        ),
      )
      .map(toConversation);
  }

  async listMessages(id: string) {
    if (!UUID.test(id)) return [];
    return z
      .array(MessageRow)
      .parse(
        await this.call(
          `/assistant_messages?conversation_id=eq.${id}&select=role,text,created_at&order=id.asc&limit=200`,
        ),
      )
      .map((row) => ({ role: row.role, text: row.text, createdAt: row.created_at }));
  }
}

// ---------- Memória (dev e testes) ----------

type MemoryState = {
  enabled: Map<string, boolean>;
  conversations: Map<string, ConversationRecord>;
  messages: Map<string, AssistantMessage[]>;
};

const globalForAssistant = globalThis as typeof globalThis & {
  __nosweatAssistant?: MemoryState;
};

export class MemoryAssistantStore implements AssistantStore {
  private get state(): MemoryState {
    globalForAssistant.__nosweatAssistant ??= {
      enabled: new Map(),
      conversations: new Map(),
      messages: new Map(),
    };
    return globalForAssistant.__nosweatAssistant;
  }

  async isEnabled(siteId: string) {
    return this.state.enabled.get(siteId) ?? false;
  }

  async setEnabled(siteId: string, enabled: boolean) {
    this.state.enabled.set(siteId, enabled);
  }

  async createConversation(siteId: string, ownerId: string) {
    const now = new Date().toISOString();
    const record: ConversationRecord = {
      id: crypto.randomUUID(),
      siteId,
      ownerId,
      createdAt: now,
      lastMessageAt: now,
      visitorMessages: 0,
      creditsCharged: 0,
      preview: null,
      leadCaptured: false,
      leadId: null,
    };
    this.state.conversations.set(record.id, record);
    this.state.messages.set(record.id, []);
    return { ...record };
  }

  async getConversation(id: string, siteId: string) {
    const record = this.state.conversations.get(id);
    return record && record.siteId === siteId ? { ...record } : null;
  }

  async countConversationsSince(siteId: string, sinceIso: string) {
    let total = 0;
    for (const record of this.state.conversations.values()) {
      if (record.siteId === siteId && record.createdAt >= sinceIso) total++;
    }
    return total;
  }

  async addVisitorMessage(id: string, siteId: string, text: string, max: number) {
    const record = this.state.conversations.get(id);
    if (!record || record.siteId !== siteId || record.visitorMessages >= max) return null;
    const now = new Date().toISOString();
    record.visitorMessages += 1;
    record.lastMessageAt = now;
    record.preview ??= text.slice(0, PREVIEW_MAX);
    this.state.messages
      .get(id)
      ?.push({ role: "visitor", text: text.slice(0, TEXT_MAX), createdAt: now });
    return record.visitorMessages;
  }

  async addAssistantMessage(id: string, text: string) {
    this.state.messages
      .get(id)
      ?.push({
        role: "assistant",
        text: text.slice(0, TEXT_MAX),
        createdAt: new Date().toISOString(),
      });
  }

  async claimCharge(id: string, needed: number) {
    const record = this.state.conversations.get(id);
    if (!record || record.creditsCharged >= needed) return 0;
    const claimed = needed - record.creditsCharged;
    record.creditsCharged = needed;
    return claimed;
  }

  async releaseCharge(id: string, credits: number) {
    const record = this.state.conversations.get(id);
    if (record && credits > 0) record.creditsCharged = Math.max(0, record.creditsCharged - credits);
  }

  async setLead(id: string, leadId: string) {
    const record = this.state.conversations.get(id);
    if (record) {
      record.leadId = leadId;
      record.leadCaptured = true;
    }
  }

  async listConversations(siteId: string, limit: number) {
    return [...this.state.conversations.values()]
      .filter((record) => record.siteId === siteId && record.visitorMessages > 0)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((record) => ({ ...record }));
  }

  async listMessages(id: string) {
    return (this.state.messages.get(id) ?? []).map((message) => ({ ...message }));
  }

  /** Só para testes: apaga tudo. */
  clear(): void {
    this.state.enabled.clear();
    this.state.conversations.clear();
    this.state.messages.clear();
  }
}

let store: AssistantStore | undefined;

export function getAssistantStore(): AssistantStore {
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
      ? new SupabaseAssistantStore({ url, serviceKey })
      : new MemoryAssistantStore();
  return store;
}
