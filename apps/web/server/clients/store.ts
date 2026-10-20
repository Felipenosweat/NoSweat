import { ClientActivityKind, ClientSource, ClientStage } from "@nosweat/schema";
import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";
import {
  normalizeEmail,
  normalizePhone,
  type ClientActivityRecord,
  type ClientPatch,
  type ClientRecord,
  type NewClient,
  type NewClientActivity,
} from "./types";

// Persistência do módulo de clientes (tabelas da migration 0017). Supabase em produção, memória
// no dev/testes (mesma regra do server/store e do server/social/store).
// Toda leitura e escrita recebe o dono: cliente de outra pessoa simplesmente não existe aqui.

export interface ClientStore {
  /** Clientes do dono, último contato primeiro. */
  listClients(ownerId: string): Promise<ClientRecord[]>;
  getClient(ownerId: string, id: string): Promise<ClientRecord | null>;
  insertClient(client: NewClient): Promise<ClientRecord>;
  updateClient(ownerId: string, id: string, patch: ClientPatch): Promise<ClientRecord | null>;
  /**
   * Apaga o cliente e o histórico dele. Os pedidos do site que estavam no histórico ficam na
   * "lápide" (`client_dismissed_leads`) para o sync não trazê-los de volta. `false` se não existir.
   */
  deleteClient(ownerId: string, id: string): Promise<boolean>;
  /** Histórico do cliente, mais novo primeiro. */
  listActivities(ownerId: string, clientId: string): Promise<ClientActivityRecord[]>;
  /** Grava um item do histórico. `null` se for um pedido do site (`leadId`) já importado. */
  insertActivity(activity: NewClientActivity): Promise<ClientActivityRecord | null>;
  /** Pedidos do site que o sync não deve importar: já importados ou descartados pelo dono. */
  handledLeadIds(ownerId: string): Promise<Set<string>>;
  /**
   * Põe um pedido do site na "lápide" sem criar cliente (ex.: o teste que o próprio dono mandou
   * pelo formulário). Repetir não faz nada.
   */
  dismissLead(ownerId: string, leadId: string): Promise<void>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: string) => UUID.test(value);
const nowIso = () => new Date().toISOString();

/** Ordem da lista: último contato primeiro (datas comparadas como instantes, não como texto). */
export function byLastActivityDesc(a: ClientRecord, b: ClientRecord): number {
  return Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt);
}

/** Ordem do histórico: mais novo primeiro (empate: o gravado por último primeiro). */
export function byOccurredDesc(a: ClientActivityRecord, b: ClientActivityRecord): number {
  return (
    Date.parse(b.occurredAt) - Date.parse(a.occurredAt) ||
    Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

// ---------- Supabase ----------

const ClientRow = z.object({
  id: z.string(),
  owner_id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  stage: ClientStage,
  source: ClientSource,
  site_id: z.string().nullable(),
  notes: z.string(),
  follow_up_on: z.string().nullable(),
  last_activity_at: z.string(),
  total_jobs_cents: z.coerce.number(),
  jobs_count: z.coerce.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

function toClient(row: z.infer<typeof ClientRow>): ClientRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    stage: row.stage,
    source: row.source,
    siteId: row.site_id,
    notes: row.notes,
    followUpOn: row.follow_up_on,
    lastActivityAt: row.last_activity_at,
    totalJobsCents: row.total_jobs_cents,
    jobsCount: row.jobs_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const ActivityRow = z.object({
  id: z.string(),
  owner_id: z.string(),
  client_id: z.string(),
  kind: ClientActivityKind,
  body: z.string(),
  amount_cents: z.coerce.number().nullable(),
  lead_id: z.string().nullable(),
  site_id: z.string().nullable(),
  occurred_at: z.string(),
  created_at: z.string(),
});

function toActivity(row: z.infer<typeof ActivityRow>): ClientActivityRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    clientId: row.client_id,
    kind: row.kind,
    body: row.body,
    amountCents: row.amount_cents,
    leadId: row.lead_id,
    siteId: row.site_id,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}

const LeadIdRow = z.object({ lead_id: z.string().nullable() });

const CLIENT_COLUMNS: Record<keyof ClientPatch, string> = {
  name: "name",
  email: "email",
  phone: "phone",
  address: "address",
  stage: "stage",
  notes: "notes",
  followUpOn: "follow_up_on",
  lastActivityAt: "last_activity_at",
  totalJobsCents: "total_jobs_cents",
  jobsCount: "jobs_count",
};

function patchToRow(patch: ClientPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch) as [keyof ClientPatch, unknown][]) {
    if (value !== undefined && CLIENT_COLUMNS[key]) row[CLIENT_COLUMNS[key]] = value;
  }
  if (patch.email !== undefined) row.email_norm = normalizeEmail(patch.email);
  if (patch.phone !== undefined) row.phone_norm = normalizePhone(patch.phone);
  return row;
}

/** Tamanho da página nas leituras longas (o PostgREST do Supabase corta em 1000 linhas). */
const PAGE = 1000;

export class SupabaseClientStore implements ClientStore {
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

  private async clients(path: string, init?: RequestInit): Promise<ClientRecord[]> {
    return z
      .array(ClientRow)
      .parse((await this.call(path, init)) ?? [])
      .map(toClient);
  }

  private async activities(
    path: string,
    init?: RequestInit & { prefer?: string },
  ): Promise<ClientActivityRecord[]> {
    return z
      .array(ActivityRow)
      .parse((await this.call(path, init)) ?? [])
      .map(toActivity);
  }

  /** Todos os `lead_id` de uma consulta, página por página. */
  private async leadIds(path: string): Promise<string[]> {
    const ids: string[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const rows = z
        .array(LeadIdRow)
        .parse((await this.call(`${path}&order=lead_id.asc&limit=${PAGE}&offset=${offset}`)) ?? []);
      for (const row of rows) if (row.lead_id) ids.push(row.lead_id);
      if (rows.length < PAGE) return ids;
    }
  }

  async listClients(ownerId: string) {
    if (!isUuid(ownerId)) return [];
    const all: ClientRecord[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const rows = await this.clients(
        `/clients?owner_id=eq.${ownerId}&select=*&order=last_activity_at.desc,id.asc&limit=${PAGE}&offset=${offset}`,
      );
      all.push(...rows);
      if (rows.length < PAGE) return all;
    }
  }

  async getClient(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    const [row] = await this.clients(
      `/clients?id=eq.${id}&owner_id=eq.${ownerId}&select=*&limit=1`,
    );
    return row ?? null;
  }

  async insertClient(client: NewClient) {
    if (!isUuid(client.ownerId)) throw new Error("Invalid owner id.");
    if (client.siteId !== null && !isUuid(client.siteId)) throw new Error("Invalid site id.");
    const [row] = await this.clients("/clients", {
      method: "POST",
      body: JSON.stringify({
        owner_id: client.ownerId,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        stage: client.stage,
        source: client.source,
        site_id: client.siteId,
        notes: client.notes,
        follow_up_on: client.followUpOn,
        last_activity_at: client.lastActivityAt ?? nowIso(),
        email_norm: normalizeEmail(client.email),
        phone_norm: normalizePhone(client.phone),
      }),
    });
    if (!row) throw new Error("Supabase did not return the new client.");
    return row;
  }

  async updateClient(ownerId: string, id: string, patch: ClientPatch) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    const [row] = await this.clients(`/clients?id=eq.${id}&owner_id=eq.${ownerId}`, {
      method: "PATCH",
      body: JSON.stringify({ ...patchToRow(patch), updated_at: nowIso() }),
    });
    return row ?? null;
  }

  async deleteClient(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return false;
    const leadIds = await this.leadIds(
      `/client_activities?client_id=eq.${id}&owner_id=eq.${ownerId}&lead_id=not.is.null&select=lead_id`,
    );
    if (leadIds.length) {
      await this.call("/client_dismissed_leads", {
        method: "POST",
        prefer: "resolution=ignore-duplicates,return=minimal",
        body: JSON.stringify(leadIds.map((leadId) => ({ lead_id: leadId, owner_id: ownerId }))),
      });
    }
    // O histórico vai junto (on delete cascade).
    const deleted = await this.clients(`/clients?id=eq.${id}&owner_id=eq.${ownerId}`, {
      method: "DELETE",
    });
    return deleted.length > 0;
  }

  async listActivities(ownerId: string, clientId: string) {
    if (!isUuid(ownerId) || !isUuid(clientId)) return [];
    return this.activities(
      `/client_activities?client_id=eq.${clientId}&owner_id=eq.${ownerId}&select=*&order=occurred_at.desc,created_at.desc&limit=${PAGE}`,
    );
  }

  async insertActivity(activity: NewClientActivity) {
    if (!isUuid(activity.ownerId) || !isUuid(activity.clientId)) {
      throw new Error("Invalid id.");
    }
    const body = JSON.stringify({
      owner_id: activity.ownerId,
      client_id: activity.clientId,
      kind: activity.kind,
      body: activity.body,
      amount_cents: activity.amountCents,
      lead_id: activity.leadId,
      site_id: activity.siteId,
      occurred_at: activity.occurredAt ?? nowIso(),
    });
    // Pedido do site: o índice único em lead_id garante uma importação só. Se outro sync chegou
    // antes, o PostgREST ignora a linha e devolve a lista vazia.
    const [row] = activity.leadId
      ? await this.activities("/client_activities?on_conflict=lead_id", {
          method: "POST",
          prefer: "resolution=ignore-duplicates,return=representation",
          body,
        })
      : await this.activities("/client_activities", { method: "POST", body });
    if (row) return row;
    if (activity.leadId) return null;
    throw new Error("Supabase did not return the new activity.");
  }

  async handledLeadIds(ownerId: string) {
    if (!isUuid(ownerId)) return new Set<string>();
    const [imported, dismissed] = await Promise.all([
      this.leadIds(`/client_activities?owner_id=eq.${ownerId}&lead_id=not.is.null&select=lead_id`),
      this.leadIds(`/client_dismissed_leads?owner_id=eq.${ownerId}&select=lead_id`),
    ]);
    return new Set([...imported, ...dismissed]);
  }

  async dismissLead(ownerId: string, leadId: string) {
    if (!isUuid(ownerId) || !isUuid(leadId)) return;
    await this.call("/client_dismissed_leads", {
      method: "POST",
      prefer: "resolution=ignore-duplicates,return=minimal",
      body: JSON.stringify([{ lead_id: leadId, owner_id: ownerId }]),
    });
  }
}

// ---------- memória ----------

type MemoryState = {
  clients: Map<string, ClientRecord>;
  activities: Map<string, ClientActivityRecord>;
  /** lead_id → dono (a "lápide" dos pedidos de clientes apagados). */
  dismissedLeads: Map<string, string>;
};

const globalForClients = globalThis as typeof globalThis & { __nosweatClients?: MemoryState };

export class MemoryClientStore implements ClientStore {
  private get state(): MemoryState {
    globalForClients.__nosweatClients ??= {
      clients: new Map(),
      activities: new Map(),
      dismissedLeads: new Map(),
    };
    return globalForClients.__nosweatClients;
  }

  async listClients(ownerId: string) {
    return [...this.state.clients.values()]
      .filter((c) => c.ownerId === ownerId)
      .map((c) => ({ ...c }))
      .sort(byLastActivityDesc);
  }

  async getClient(ownerId: string, id: string) {
    const client = this.state.clients.get(id);
    return client && client.ownerId === ownerId ? { ...client } : null;
  }

  async insertClient(client: NewClient) {
    const now = nowIso();
    const record: ClientRecord = {
      id: crypto.randomUUID(),
      ownerId: client.ownerId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      stage: client.stage,
      source: client.source,
      siteId: client.siteId,
      notes: client.notes,
      followUpOn: client.followUpOn,
      lastActivityAt: client.lastActivityAt ?? now,
      totalJobsCents: 0,
      jobsCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.state.clients.set(record.id, record);
    return { ...record };
  }

  async updateClient(ownerId: string, id: string, patch: ClientPatch) {
    const current = this.state.clients.get(id);
    if (!current || current.ownerId !== ownerId) return null;
    const updated: ClientRecord = { ...current, updatedAt: nowIso() };
    for (const [key, value] of Object.entries(patch) as [keyof ClientPatch, unknown][]) {
      if (value !== undefined) Object.assign(updated, { [key]: value });
    }
    this.state.clients.set(id, updated);
    return { ...updated };
  }

  async deleteClient(ownerId: string, id: string) {
    const current = this.state.clients.get(id);
    if (!current || current.ownerId !== ownerId) return false;
    for (const activity of [...this.state.activities.values()]) {
      if (activity.clientId !== id) continue;
      if (activity.leadId) this.state.dismissedLeads.set(activity.leadId, ownerId);
      this.state.activities.delete(activity.id);
    }
    this.state.clients.delete(id);
    return true;
  }

  async listActivities(ownerId: string, clientId: string) {
    return [...this.state.activities.values()]
      .filter((a) => a.ownerId === ownerId && a.clientId === clientId)
      .map((a) => ({ ...a }))
      .sort(byOccurredDesc);
  }

  async insertActivity(activity: NewClientActivity) {
    const leadId = activity.leadId;
    if (leadId && [...this.state.activities.values()].some((a) => a.leadId === leadId)) {
      return null;
    }
    const now = nowIso();
    const record: ClientActivityRecord = {
      id: crypto.randomUUID(),
      ownerId: activity.ownerId,
      clientId: activity.clientId,
      kind: activity.kind,
      body: activity.body,
      amountCents: activity.amountCents,
      leadId: activity.leadId,
      siteId: activity.siteId,
      occurredAt: activity.occurredAt ?? now,
      createdAt: now,
    };
    this.state.activities.set(record.id, record);
    return { ...record };
  }

  async handledLeadIds(ownerId: string) {
    const ids = new Set<string>();
    for (const activity of this.state.activities.values()) {
      if (activity.ownerId === ownerId && activity.leadId) ids.add(activity.leadId);
    }
    for (const [leadId, owner] of this.state.dismissedLeads) {
      if (owner === ownerId) ids.add(leadId);
    }
    return ids;
  }

  async dismissLead(ownerId: string, leadId: string) {
    this.state.dismissedLeads.set(leadId, ownerId);
  }
}

let store: ClientStore | undefined;

export function getClientStore(): ClientStore {
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
    url && serviceKey ? new SupabaseClientStore({ url, serviceKey }) : new MemoryClientStore();
  return store;
}

/** Só para testes: limpa a memória entre um teste e outro. */
export function resetMemoryClientStore(): void {
  globalForClients.__nosweatClients = undefined;
}
