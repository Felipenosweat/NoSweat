import type { JobStatus } from "@nosweat/schema";
import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";
import {
  EstimateRecord,
  InvoiceRecord,
  JobRecord,
  OfficeSettingsRecord,
  PaymentRecord,
  PriceItemRecord,
  TeamMemberRecord,
  type EstimatePatch,
  type InvoicePatch,
  type JobPatch,
  type NewEstimate,
  type NewInvoice,
  type NewJob,
  type NewPayment,
  type NewPriceItem,
  type NewTeamMember,
  type NumberKind,
  type PriceItemPatch,
  type SettingsPatch,
  type StoredEstimateStatus,
  type TeamMemberPatch,
} from "./types";

// Persistência do escritório (tabelas da migration 0022). Supabase em produção, memória no
// dev/testes (mesma regra de server/clients/store.ts). Toda leitura e escrita recebe o dono:
// registro de outra pessoa simplesmente não existe aqui. As únicas buscas sem dono são as do
// link público (pelo token), usadas só pelas rotas /api/public/*.

export type JobFilter = { status?: JobStatus; clientId?: string };
export type EstimateFilter = { clientId?: string; jobId?: string };
export type InvoiceFilter = { clientId?: string; jobId?: string; estimateId?: string };
export type PaymentFilter = {
  /** Só os pagamentos destas faturas (lista vazia = nenhum). */
  invoiceIds?: readonly string[];
  /** Recebidos a partir deste dia ("AAAA-MM-DD", inclusive). */
  receivedSince?: string;
};

export interface OfficeStore {
  getSettings(ownerId: string): Promise<OfficeSettingsRecord | null>;
  /** Grava as configurações se ainda não existirem (nunca muda as que já existem). */
  ensureSettings(settings: OfficeSettingsRecord): Promise<OfficeSettingsRecord>;
  updateSettings(ownerId: string, patch: SettingsPatch): Promise<OfficeSettingsRecord | null>;
  /** Próximo número (#1001, #1002...) do tipo, por dono, sem repetir mesmo em paralelo. */
  nextNumber(ownerId: string, kind: NumberKind): Promise<number>;

  listPriceItems(ownerId: string): Promise<PriceItemRecord[]>;
  getPriceItem(ownerId: string, id: string): Promise<PriceItemRecord | null>;
  insertPriceItem(item: NewPriceItem): Promise<PriceItemRecord>;
  updatePriceItem(
    ownerId: string,
    id: string,
    patch: PriceItemPatch,
  ): Promise<PriceItemRecord | null>;
  deletePriceItem(ownerId: string, id: string): Promise<boolean>;

  listTeam(ownerId: string): Promise<TeamMemberRecord[]>;
  getTeamMember(ownerId: string, id: string): Promise<TeamMemberRecord | null>;
  insertTeamMember(member: NewTeamMember): Promise<TeamMemberRecord>;
  updateTeamMember(
    ownerId: string,
    id: string,
    patch: TeamMemberPatch,
  ): Promise<TeamMemberRecord | null>;
  deleteTeamMember(ownerId: string, id: string): Promise<boolean>;

  listJobs(ownerId: string, filter?: JobFilter): Promise<JobRecord[]>;
  getJob(ownerId: string, id: string): Promise<JobRecord | null>;
  insertJob(job: NewJob): Promise<JobRecord>;
  updateJob(ownerId: string, id: string, patch: JobPatch): Promise<JobRecord | null>;
  /** Orçamentos e faturas ligados ficam sem o job (on delete set null). */
  deleteJob(ownerId: string, id: string): Promise<boolean>;

  listEstimates(ownerId: string, filter?: EstimateFilter): Promise<EstimateRecord[]>;
  getEstimate(ownerId: string, id: string): Promise<EstimateRecord | null>;
  getEstimateByToken(token: string): Promise<EstimateRecord | null>;
  insertEstimate(estimate: NewEstimate): Promise<EstimateRecord>;
  /**
   * Muda o orçamento. Com `expectedStatus`, só muda se o status guardado ainda for esse (resposta
   * do cliente sem corrida: a segunda resposta não acha a linha e recebe `null`).
   */
  updateEstimate(
    ownerId: string,
    id: string,
    patch: EstimatePatch,
    expectedStatus?: StoredEstimateStatus,
  ): Promise<EstimateRecord | null>;
  /** Jobs e faturas ligados ficam sem o orçamento (on delete set null). */
  deleteEstimate(ownerId: string, id: string): Promise<boolean>;

  listInvoices(ownerId: string, filter?: InvoiceFilter): Promise<InvoiceRecord[]>;
  getInvoice(ownerId: string, id: string): Promise<InvoiceRecord | null>;
  getInvoiceByToken(token: string): Promise<InvoiceRecord | null>;
  insertInvoice(invoice: NewInvoice): Promise<InvoiceRecord>;
  updateInvoice(ownerId: string, id: string, patch: InvoicePatch): Promise<InvoiceRecord | null>;
  /** Apaga a fatura e os pagamentos dela (cascade); o job ligado fica sem fatura. */
  deleteInvoice(ownerId: string, id: string): Promise<boolean>;

  /** Pagamentos do dono, mais antigos primeiro. */
  listPayments(ownerId: string, filter?: PaymentFilter): Promise<PaymentRecord[]>;
  insertPayment(payment: NewPayment): Promise<PaymentRecord>;
  deletePayment(ownerId: string, invoiceId: string, paymentId: string): Promise<boolean>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: string) => UUID.test(value);
const nowIso = () => new Date().toISOString();

// ---------- Supabase ----------

/** unitPriceCents → unit_price_cents (as colunas da 0022 seguem esta regra). */
function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function toCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** Objeto do código → linha do banco (só o primeiro nível; `items` vai como está no jsonb). */
function toRow(values: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) row[toSnake(key)] = value;
  }
  return row;
}

/** Linha do banco → objeto do código. `bigint` pode vir como texto: vira número. */
function fromRow(row: unknown): unknown {
  if (!row || typeof row !== "object") return row;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    const camel = toCamel(key);
    out[camel] =
      typeof value === "string" && /Cents$/.test(camel) && value.trim() !== ""
        ? Number(value)
        : value;
  }
  return out;
}

/** Tamanho da página nas leituras longas (o PostgREST do Supabase corta em 1000 linhas). */
const PAGE = 1000;
/** Ids por consulta `in.(...)` (a URL não pode crescer sem fim). */
const IN_CHUNK = 100;

export class SupabaseOfficeStore implements OfficeStore {
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

  private async rows<T>(
    schema: z.ZodType<T>,
    path: string,
    init?: RequestInit & { prefer?: string },
  ): Promise<T[]> {
    const data = z.array(z.unknown()).parse((await this.call(path, init)) ?? []);
    return data.map((row) => schema.parse(fromRow(row)));
  }

  /** Todas as linhas de uma consulta (que já tem `order=` estável), página por página. */
  private async all<T>(schema: z.ZodType<T>, path: string): Promise<T[]> {
    const out: T[] = [];
    for (let offset = 0; ; offset += PAGE) {
      const page = await this.rows(schema, `${path}&limit=${PAGE}&offset=${offset}`);
      out.push(...page);
      if (page.length < PAGE) return out;
    }
  }

  private async one<T>(schema: z.ZodType<T>, path: string): Promise<T | null> {
    const [row] = await this.rows(schema, `${path}&limit=1`);
    return row ?? null;
  }

  private async insert<T>(
    schema: z.ZodType<T>,
    table: string,
    values: Record<string, unknown>,
  ): Promise<T> {
    const [row] = await this.rows(schema, `/${table}`, {
      method: "POST",
      body: JSON.stringify(toRow(values)),
    });
    if (!row) throw new Error(`Supabase did not return the new ${table} row.`);
    return row;
  }

  private async patch<T>(
    schema: z.ZodType<T>,
    path: string,
    values: Record<string, unknown>,
  ): Promise<T | null> {
    const [row] = await this.rows(schema, path, {
      method: "PATCH",
      body: JSON.stringify({ ...toRow(values), updated_at: nowIso() }),
    });
    return row ?? null;
  }

  private async remove(path: string): Promise<boolean> {
    const deleted = z.array(z.unknown()).parse((await this.call(path, { method: "DELETE" })) ?? []);
    return deleted.length > 0;
  }

  // --- configurações ---

  async getSettings(ownerId: string) {
    if (!isUuid(ownerId)) return null;
    return this.one(OfficeSettingsRecord, `/office_settings?owner_id=eq.${ownerId}&select=*`);
  }

  async ensureSettings(settings: OfficeSettingsRecord) {
    if (!isUuid(settings.ownerId)) throw new Error("Invalid owner id.");
    await this.call("/office_settings?on_conflict=owner_id", {
      method: "POST",
      prefer: "resolution=ignore-duplicates,return=minimal",
      body: JSON.stringify(toRow(settings)),
    });
    const saved = await this.getSettings(settings.ownerId);
    if (!saved) throw new Error("Supabase did not save the office settings.");
    return saved;
  }

  async updateSettings(ownerId: string, patch: SettingsPatch) {
    if (!isUuid(ownerId)) return null;
    return this.patch(OfficeSettingsRecord, `/office_settings?owner_id=eq.${ownerId}`, patch);
  }

  async nextNumber(ownerId: string, kind: NumberKind) {
    if (!isUuid(ownerId)) throw new Error("Invalid owner id.");
    const result = await this.call("/rpc/office_next_number", {
      method: "POST",
      body: JSON.stringify({ p_owner: ownerId, p_kind: kind }),
    });
    return z.coerce.number().int().positive().parse(result);
  }

  // --- tabela de preços ---

  async listPriceItems(ownerId: string) {
    if (!isUuid(ownerId)) return [];
    return this.all(
      PriceItemRecord,
      `/price_items?owner_id=eq.${ownerId}&select=*&order=name.asc,id.asc`,
    );
  }

  async getPriceItem(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    return this.one(PriceItemRecord, `/price_items?id=eq.${id}&owner_id=eq.${ownerId}&select=*`);
  }

  async insertPriceItem(item: NewPriceItem) {
    if (!isUuid(item.ownerId)) throw new Error("Invalid owner id.");
    return this.insert(PriceItemRecord, "price_items", item);
  }

  async updatePriceItem(ownerId: string, id: string, patch: PriceItemPatch) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    return this.patch(PriceItemRecord, `/price_items?id=eq.${id}&owner_id=eq.${ownerId}`, patch);
  }

  async deletePriceItem(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return false;
    return this.remove(`/price_items?id=eq.${id}&owner_id=eq.${ownerId}`);
  }

  // --- equipe ---

  async listTeam(ownerId: string) {
    if (!isUuid(ownerId)) return [];
    return this.all(
      TeamMemberRecord,
      `/team_members?owner_id=eq.${ownerId}&select=*&order=name.asc,id.asc`,
    );
  }

  async getTeamMember(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    return this.one(TeamMemberRecord, `/team_members?id=eq.${id}&owner_id=eq.${ownerId}&select=*`);
  }

  async insertTeamMember(member: NewTeamMember) {
    if (!isUuid(member.ownerId)) throw new Error("Invalid owner id.");
    return this.insert(TeamMemberRecord, "team_members", member);
  }

  async updateTeamMember(ownerId: string, id: string, patch: TeamMemberPatch) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    return this.patch(TeamMemberRecord, `/team_members?id=eq.${id}&owner_id=eq.${ownerId}`, patch);
  }

  async deleteTeamMember(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return false;
    return this.remove(`/team_members?id=eq.${id}&owner_id=eq.${ownerId}`);
  }

  // --- jobs ---

  async listJobs(ownerId: string, filter: JobFilter = {}) {
    if (!isUuid(ownerId)) return [];
    if (filter.clientId !== undefined && !isUuid(filter.clientId)) return [];
    const status = filter.status ? `&status=eq.${filter.status}` : "";
    const client = filter.clientId ? `&client_id=eq.${filter.clientId}` : "";
    return this.all(
      JobRecord,
      `/jobs?owner_id=eq.${ownerId}${status}${client}&select=*&order=created_at.desc,id.asc`,
    );
  }

  async getJob(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    return this.one(JobRecord, `/jobs?id=eq.${id}&owner_id=eq.${ownerId}&select=*`);
  }

  async insertJob(job: NewJob) {
    if (!isUuid(job.ownerId) || !isUuid(job.clientId)) throw new Error("Invalid id.");
    return this.insert(JobRecord, "jobs", job);
  }

  async updateJob(ownerId: string, id: string, patch: JobPatch) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    return this.patch(JobRecord, `/jobs?id=eq.${id}&owner_id=eq.${ownerId}`, patch);
  }

  async deleteJob(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return false;
    return this.remove(`/jobs?id=eq.${id}&owner_id=eq.${ownerId}`);
  }

  // --- orçamentos ---

  async listEstimates(ownerId: string, filter: EstimateFilter = {}) {
    if (!isUuid(ownerId)) return [];
    if (filter.clientId !== undefined && !isUuid(filter.clientId)) return [];
    if (filter.jobId !== undefined && !isUuid(filter.jobId)) return [];
    const client = filter.clientId ? `&client_id=eq.${filter.clientId}` : "";
    const job = filter.jobId ? `&job_id=eq.${filter.jobId}` : "";
    return this.all(
      EstimateRecord,
      `/estimates?owner_id=eq.${ownerId}${client}${job}&select=*&order=created_at.desc,id.asc`,
    );
  }

  async getEstimate(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    return this.one(EstimateRecord, `/estimates?id=eq.${id}&owner_id=eq.${ownerId}&select=*`);
  }

  async getEstimateByToken(token: string) {
    return this.one(
      EstimateRecord,
      `/estimates?public_token=eq.${encodeURIComponent(token)}&select=*`,
    );
  }

  async insertEstimate(estimate: NewEstimate) {
    if (!isUuid(estimate.ownerId) || !isUuid(estimate.clientId)) throw new Error("Invalid id.");
    return this.insert(EstimateRecord, "estimates", estimate);
  }

  async updateEstimate(
    ownerId: string,
    id: string,
    patch: EstimatePatch,
    expectedStatus?: StoredEstimateStatus,
  ) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    const guard = expectedStatus ? `&status=eq.${expectedStatus}` : "";
    return this.patch(
      EstimateRecord,
      `/estimates?id=eq.${id}&owner_id=eq.${ownerId}${guard}`,
      patch,
    );
  }

  async deleteEstimate(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return false;
    return this.remove(`/estimates?id=eq.${id}&owner_id=eq.${ownerId}`);
  }

  // --- faturas ---

  async listInvoices(ownerId: string, filter: InvoiceFilter = {}) {
    if (!isUuid(ownerId)) return [];
    const parts: string[] = [];
    for (const [key, column] of [
      ["clientId", "client_id"],
      ["jobId", "job_id"],
      ["estimateId", "estimate_id"],
    ] as const) {
      const value = filter[key];
      if (value === undefined) continue;
      if (!isUuid(value)) return [];
      parts.push(`&${column}=eq.${value}`);
    }
    return this.all(
      InvoiceRecord,
      `/invoices?owner_id=eq.${ownerId}${parts.join("")}&select=*&order=created_at.desc,id.asc`,
    );
  }

  async getInvoice(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    return this.one(InvoiceRecord, `/invoices?id=eq.${id}&owner_id=eq.${ownerId}&select=*`);
  }

  async getInvoiceByToken(token: string) {
    return this.one(
      InvoiceRecord,
      `/invoices?public_token=eq.${encodeURIComponent(token)}&select=*`,
    );
  }

  async insertInvoice(invoice: NewInvoice) {
    if (!isUuid(invoice.ownerId) || !isUuid(invoice.clientId)) throw new Error("Invalid id.");
    return this.insert(InvoiceRecord, "invoices", invoice);
  }

  async updateInvoice(ownerId: string, id: string, patch: InvoicePatch) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    return this.patch(InvoiceRecord, `/invoices?id=eq.${id}&owner_id=eq.${ownerId}`, patch);
  }

  async deleteInvoice(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return false;
    return this.remove(`/invoices?id=eq.${id}&owner_id=eq.${ownerId}`);
  }

  // --- pagamentos ---

  async listPayments(ownerId: string, filter: PaymentFilter = {}) {
    if (!isUuid(ownerId)) return [];
    const since =
      filter.receivedSince && /^\d{4}-\d{2}-\d{2}$/.test(filter.receivedSince)
        ? `&received_on=gte.${filter.receivedSince}`
        : "";
    const base = `/invoice_payments?owner_id=eq.${ownerId}${since}`;
    const order = "&select=*&order=received_on.asc,created_at.asc,id.asc";
    if (filter.invoiceIds === undefined) return this.all(PaymentRecord, `${base}${order}`);
    const ids = filter.invoiceIds.filter(isUuid);
    const out: PaymentRecord[] = [];
    for (let i = 0; i < ids.length; i += IN_CHUNK) {
      const chunk = ids.slice(i, i + IN_CHUNK).join(",");
      out.push(...(await this.all(PaymentRecord, `${base}&invoice_id=in.(${chunk})${order}`)));
    }
    return out.sort(byReceived);
  }

  async insertPayment(payment: NewPayment) {
    if (!isUuid(payment.ownerId) || !isUuid(payment.invoiceId)) throw new Error("Invalid id.");
    return this.insert(PaymentRecord, "invoice_payments", payment);
  }

  async deletePayment(ownerId: string, invoiceId: string, paymentId: string) {
    if (!isUuid(ownerId) || !isUuid(invoiceId) || !isUuid(paymentId)) return false;
    return this.remove(
      `/invoice_payments?id=eq.${paymentId}&invoice_id=eq.${invoiceId}&owner_id=eq.${ownerId}`,
    );
  }
}

/** Ordem dos pagamentos: dia recebido, depois o gravado primeiro. */
function byReceived(a: PaymentRecord, b: PaymentRecord): number {
  return (
    a.receivedOn.localeCompare(b.receivedOn) || Date.parse(a.createdAt) - Date.parse(b.createdAt)
  );
}

// ---------- memória ----------

type Owned = { id: string; ownerId: string };

type MemoryState = {
  settings: Map<string, OfficeSettingsRecord>;
  counters: Map<string, number>;
  priceItems: Map<string, PriceItemRecord>;
  team: Map<string, TeamMemberRecord>;
  jobs: Map<string, JobRecord>;
  estimates: Map<string, EstimateRecord>;
  invoices: Map<string, InvoiceRecord>;
  payments: Map<string, PaymentRecord>;
};

const globalForOffice = globalThis as typeof globalThis & { __nosweatOffice?: MemoryState };

function memoryState(): MemoryState {
  globalForOffice.__nosweatOffice ??= {
    settings: new Map(),
    counters: new Map(),
    priceItems: new Map(),
    team: new Map(),
    jobs: new Map(),
    estimates: new Map(),
    invoices: new Map(),
    payments: new Map(),
  };
  return globalForOffice.__nosweatOffice;
}

/** Primeiro número de cada tipo (igual ao default da migration). */
const FIRST_NUMBER = 1001;

/** Cópia funda: quem lê nunca mexe no que está guardado. */
const clone = <T>(value: T): T => structuredClone(value);

function listOwned<T extends Owned>(map: Map<string, T>, ownerId: string): T[] {
  return [...map.values()].filter((r) => r.ownerId === ownerId).map(clone);
}

function findOwned<T extends Owned>(map: Map<string, T>, ownerId: string, id: string): T | null {
  const found = map.get(id);
  return found && found.ownerId === ownerId ? clone(found) : null;
}

function insertOwned<T extends Owned & { createdAt: string }>(
  map: Map<string, T>,
  values: Omit<T, "id" | "createdAt" | "updatedAt">,
  withUpdatedAt: boolean,
): T {
  const now = nowIso();
  const record = {
    ...clone(values),
    id: crypto.randomUUID(),
    createdAt: now,
    ...(withUpdatedAt ? { updatedAt: now } : {}),
  } as unknown as T;
  map.set(record.id, record);
  return clone(record);
}

function patchOwned<T extends Owned>(
  map: Map<string, T>,
  ownerId: string,
  id: string,
  patch: Partial<T>,
): T | null {
  const current = map.get(id);
  if (!current || current.ownerId !== ownerId) return null;
  const updated: T = { ...current, updatedAt: nowIso() };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) Object.assign(updated, { [key]: clone(value) });
  }
  map.set(id, updated);
  return clone(updated);
}

function removeOwned<T extends Owned>(map: Map<string, T>, ownerId: string, id: string): boolean {
  const current = map.get(id);
  if (!current || current.ownerId !== ownerId) return false;
  map.delete(id);
  return true;
}

/** Ordem padrão das listas: mais novo primeiro (empate: id). */
function byCreatedDesc(a: { createdAt: string; id: string }, b: { createdAt: string; id: string }) {
  return Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id);
}

const byName = (a: { name: string; id: string }, b: { name: string; id: string }) =>
  a.name.localeCompare(b.name) || a.id.localeCompare(b.id);

export class MemoryOfficeStore implements OfficeStore {
  private get state(): MemoryState {
    return memoryState();
  }

  async getSettings(ownerId: string) {
    const found = this.state.settings.get(ownerId);
    return found ? clone(found) : null;
  }

  async ensureSettings(settings: OfficeSettingsRecord) {
    if (!this.state.settings.has(settings.ownerId)) {
      this.state.settings.set(settings.ownerId, clone(settings));
    }
    return clone(this.state.settings.get(settings.ownerId) ?? settings);
  }

  async updateSettings(ownerId: string, patch: SettingsPatch) {
    const current = this.state.settings.get(ownerId);
    if (!current) return null;
    const updated = { ...current };
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) Object.assign(updated, { [key]: value });
    }
    this.state.settings.set(ownerId, updated);
    return clone(updated);
  }

  async nextNumber(ownerId: string, kind: NumberKind) {
    const key = `${ownerId}:${kind}`;
    const next = this.state.counters.get(key) ?? FIRST_NUMBER;
    this.state.counters.set(key, next + 1);
    return next;
  }

  async listPriceItems(ownerId: string) {
    return listOwned(this.state.priceItems, ownerId).sort(byName);
  }
  async getPriceItem(ownerId: string, id: string) {
    return findOwned(this.state.priceItems, ownerId, id);
  }
  async insertPriceItem(item: NewPriceItem) {
    return insertOwned<PriceItemRecord>(this.state.priceItems, item, true);
  }
  async updatePriceItem(ownerId: string, id: string, patch: PriceItemPatch) {
    return patchOwned<PriceItemRecord>(this.state.priceItems, ownerId, id, patch);
  }
  async deletePriceItem(ownerId: string, id: string) {
    return removeOwned(this.state.priceItems, ownerId, id);
  }

  async listTeam(ownerId: string) {
    return listOwned(this.state.team, ownerId).sort(byName);
  }
  async getTeamMember(ownerId: string, id: string) {
    return findOwned(this.state.team, ownerId, id);
  }
  async insertTeamMember(member: NewTeamMember) {
    return insertOwned<TeamMemberRecord>(this.state.team, member, true);
  }
  async updateTeamMember(ownerId: string, id: string, patch: TeamMemberPatch) {
    return patchOwned<TeamMemberRecord>(this.state.team, ownerId, id, patch);
  }
  async deleteTeamMember(ownerId: string, id: string) {
    return removeOwned(this.state.team, ownerId, id);
  }

  async listJobs(ownerId: string, filter: JobFilter = {}) {
    return listOwned(this.state.jobs, ownerId)
      .filter((j) => !filter.status || j.status === filter.status)
      .filter((j) => filter.clientId === undefined || j.clientId === filter.clientId)
      .sort(byCreatedDesc);
  }
  async getJob(ownerId: string, id: string) {
    return findOwned(this.state.jobs, ownerId, id);
  }
  async insertJob(job: NewJob) {
    return insertOwned<JobRecord>(this.state.jobs, job, true);
  }
  async updateJob(ownerId: string, id: string, patch: JobPatch) {
    return patchOwned<JobRecord>(this.state.jobs, ownerId, id, patch);
  }
  async deleteJob(ownerId: string, id: string) {
    if (!removeOwned(this.state.jobs, ownerId, id)) return false;
    // Como o "on delete set null" do banco.
    for (const e of this.state.estimates.values()) if (e.jobId === id) e.jobId = null;
    for (const i of this.state.invoices.values()) if (i.jobId === id) i.jobId = null;
    return true;
  }

  async listEstimates(ownerId: string, filter: EstimateFilter = {}) {
    return listOwned(this.state.estimates, ownerId)
      .filter((e) => filter.clientId === undefined || e.clientId === filter.clientId)
      .filter((e) => filter.jobId === undefined || e.jobId === filter.jobId)
      .sort(byCreatedDesc);
  }
  async getEstimate(ownerId: string, id: string) {
    return findOwned(this.state.estimates, ownerId, id);
  }
  async getEstimateByToken(token: string) {
    const found = [...this.state.estimates.values()].find((e) => e.publicToken === token);
    return found ? clone(found) : null;
  }
  async insertEstimate(estimate: NewEstimate) {
    return insertOwned<EstimateRecord>(this.state.estimates, estimate, true);
  }
  async updateEstimate(
    ownerId: string,
    id: string,
    patch: EstimatePatch,
    expectedStatus?: StoredEstimateStatus,
  ) {
    const current = this.state.estimates.get(id);
    if (expectedStatus && current && current.status !== expectedStatus) return null;
    return patchOwned<EstimateRecord>(this.state.estimates, ownerId, id, patch);
  }
  async deleteEstimate(ownerId: string, id: string) {
    if (!removeOwned(this.state.estimates, ownerId, id)) return false;
    for (const j of this.state.jobs.values()) if (j.estimateId === id) j.estimateId = null;
    for (const i of this.state.invoices.values()) if (i.estimateId === id) i.estimateId = null;
    return true;
  }

  async listInvoices(ownerId: string, filter: InvoiceFilter = {}) {
    return listOwned(this.state.invoices, ownerId)
      .filter((i) => filter.clientId === undefined || i.clientId === filter.clientId)
      .filter((i) => filter.jobId === undefined || i.jobId === filter.jobId)
      .filter((i) => filter.estimateId === undefined || i.estimateId === filter.estimateId)
      .sort(byCreatedDesc);
  }
  async getInvoice(ownerId: string, id: string) {
    return findOwned(this.state.invoices, ownerId, id);
  }
  async getInvoiceByToken(token: string) {
    const found = [...this.state.invoices.values()].find((i) => i.publicToken === token);
    return found ? clone(found) : null;
  }
  async insertInvoice(invoice: NewInvoice) {
    return insertOwned<InvoiceRecord>(this.state.invoices, invoice, true);
  }
  async updateInvoice(ownerId: string, id: string, patch: InvoicePatch) {
    return patchOwned<InvoiceRecord>(this.state.invoices, ownerId, id, patch);
  }
  async deleteInvoice(ownerId: string, id: string) {
    if (!removeOwned(this.state.invoices, ownerId, id)) return false;
    for (const j of this.state.jobs.values()) if (j.invoiceId === id) j.invoiceId = null;
    for (const p of [...this.state.payments.values()]) {
      if (p.invoiceId === id) this.state.payments.delete(p.id);
    }
    return true;
  }

  async listPayments(ownerId: string, filter: PaymentFilter = {}) {
    const ids = filter.invoiceIds ? new Set(filter.invoiceIds) : null;
    const since = filter.receivedSince;
    return listOwned(this.state.payments, ownerId)
      .filter((p) => !ids || ids.has(p.invoiceId))
      .filter((p) => !since || p.receivedOn >= since)
      .sort(byReceived);
  }
  async insertPayment(payment: NewPayment) {
    return insertOwned<PaymentRecord>(this.state.payments, payment, false);
  }
  async deletePayment(ownerId: string, invoiceId: string, paymentId: string) {
    const current = this.state.payments.get(paymentId);
    if (!current || current.invoiceId !== invoiceId) return false;
    return removeOwned(this.state.payments, ownerId, paymentId);
  }
}

let store: OfficeStore | undefined;

export function getOfficeStore(): OfficeStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Como em getClientStore: na produção da Vercel, sem Supabase é erro (a memória perderia tudo).
  if (!(url && serviceKey) && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Supabase is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  store =
    url && serviceKey ? new SupabaseOfficeStore({ url, serviceKey }) : new MemoryOfficeStore();
  return store;
}

/** Só para testes: limpa a memória entre um teste e outro. */
export function resetMemoryOfficeStore(): void {
  globalForOffice.__nosweatOffice = undefined;
}
