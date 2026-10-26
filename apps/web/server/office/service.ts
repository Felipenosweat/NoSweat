import {
  computeTotals,
  TEAM_COLORS,
  type ClientStage,
  type ConvertEstimateRequest,
  type ConvertEstimateResponse,
  type CreateEstimateRequest,
  type CreateInvoiceRequest,
  type CreateJobRequest,
  type CreatePriceItemRequest,
  type CreateTeamMemberRequest,
  type DocumentParty,
  type Estimate,
  type EstimateStatus,
  type Invoice,
  type InvoiceStatus,
  type Job,
  type JobStatus,
  type LineItem,
  type OfficeSettings,
  type OfficeSummary,
  type Payment,
  type PriceItem,
  type PublicEstimate,
  type PublicInvoice,
  type RecordPaymentRequest,
  type RespondEstimateRequest,
  type TeamColor,
  type TeamMember,
  type UpdateEstimateRequest,
  type UpdateInvoiceRequest,
  type UpdateJobRequest,
  type UpdateOfficeSettingsRequest,
  type UpdatePriceItemRequest,
  type UpdateTeamMemberRequest,
} from "@nosweat/schema";
import { dateKeyIn, formatCents } from "@/lib/clients";
import { addClientActivity, clientsTimeZone, updateClient } from "../clients/service";
import { getClientStore } from "../clients/store";
import type { ClientRecord } from "../clients/types";
import { isValidTimeZone, zonedTimeToUtc } from "../social/service";
import { getSiteStore } from "../store";
import { getOfficeStore, type OfficeStore } from "./store";
import { newPublicToken } from "./tokens";
import {
  OfficeError,
  type EstimatePatch,
  type EstimateRecord,
  type InvoicePatch,
  type InvoiceRecord,
  type JobPatch,
  type JobRecord,
  type OfficeSettingsRecord,
  type PaymentRecord,
  type PriceItemRecord,
  type TeamMemberRecord,
} from "./types";

// Regras do escritório do dono (as rotas /api/office/* e /api/public/* só chamam isto).
// - Totais sempre por `computeTotals` aqui no servidor; o que vier do navegador é ignorado.
// - Números (#1001...) pela RPC `office_next_number` (memória: contadores a partir de 1001).
// - Status calculados na leitura: orçamento `expired`; fatura `partial` / `overdue`.
// - "Hoje" é sempre no fuso da empresa (`settings.timeZone`).
// Erros de regra saem como `OfficeError` (as rotas viram `{ error: { code, message } }`).

const DEFAULT_TIME_ZONE = "America/New_York";
/** Teto do valor previsto de um job (o mesmo `Money` do contrato). */
const MAX_MONEY = 100_000_000;
/** Nome mostrado quando o cliente do documento foi apagado (no banco, o documento vai junto). */
const MISSING_CLIENT = "Deleted client";

const store = (): OfficeStore => getOfficeStore();
const nowIso = () => new Date().toISOString();

// ---------- datas ----------

/** "AAAA-MM-DD" de hoje no fuso pedido. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  try {
    return dateKeyIn(timeZone, now);
  } catch {
    return dateKeyIn(DEFAULT_TIME_ZONE, now);
  }
}

/** Soma dias a uma data sem hora (aritmética em UTC: sem surpresa de horário de verão). */
export function addDays(date: string, days: number): string {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Meia-noite do dia no fuso → instante (ms). */
function startOfDay(date: string, timeZone: string): number {
  return Date.parse(zonedTimeToUtc(date, "00:00", timeZone));
}

/** Data-hora com fuso → ISO em UTC; `null`/`undefined` passam como estão. */
function toInstant(value: string | null | undefined): string | null | undefined {
  if (value === undefined || value === null) return value;
  return new Date(value).toISOString();
}

function checkTimes(startAt: string | null, endAt: string | null): void {
  if (startAt && endAt && Date.parse(endAt) <= Date.parse(startAt)) {
    throw new OfficeError(400, "invalid_request", "The end time must be after the start time.");
  }
}

// ---------- textos ----------

/** Texto opcional: vazio vira `null`; `undefined` continua `undefined` (não mexe). */
function blankToNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

function notFound(what: string): OfficeError {
  return new OfficeError(404, "not_found", `${what} not found.`);
}

// ---------- integração com os clientes ----------

/**
 * Leva o cliente para a etapa `to` (com o item de etapa no histórico, pelo service de clientes),
 * só se ele estiver numa das etapas `from` ("any" = qualquer outra). Nunca derruba a ação
 * principal: o orçamento/pagamento já foi salvo.
 */
async function advanceClientStage(
  ownerId: string,
  clientId: string,
  from: readonly ClientStage[] | "any",
  to: ClientStage,
): Promise<void> {
  try {
    const client = await getClientStore().getClient(ownerId, clientId);
    if (!client || client.stage === to) return;
    if (from !== "any" && !from.includes(client.stage)) return;
    await updateClient(ownerId, clientId, { stage: to });
  } catch (error) {
    console.error("[office] could not update the client stage", error);
  }
}

async function requireClient(ownerId: string, clientId: string): Promise<ClientRecord> {
  const client = await getClientStore().getClient(ownerId, clientId);
  if (!client) throw notFound("Client");
  return client;
}

async function clientNames(ownerId: string): Promise<Map<string, ClientRecord>> {
  const clients = await getClientStore().listClients(ownerId);
  return new Map(clients.map((c) => [c.id, c]));
}

/** Mapa com um cliente só (ou vazio). */
function clientMap(client: ClientRecord | null): Map<string, ClientRecord> {
  const map = new Map<string, ClientRecord>();
  if (client) map.set(client.id, client);
  return map;
}

function partyOf(client: ClientRecord | null): DocumentParty {
  return {
    name: client?.name ?? "",
    email: client?.email ?? null,
    phone: client?.phone ?? null,
    address: client?.address ?? null,
  };
}

// ---------- configurações ----------

function toSettings(record: OfficeSettingsRecord): OfficeSettings {
  return {
    companyName: record.companyName,
    phone: record.phone,
    email: record.email,
    address: record.address,
    defaultTaxRateBps: record.defaultTaxRateBps,
    invoiceDueDays: record.invoiceDueDays,
    estimateValidDays: record.estimateValidDays,
    estimateTerms: record.estimateTerms,
    paymentInstructions: record.paymentInstructions,
    timeZone: record.timeZone,
  };
}

/**
 * Padrões da primeira vez: nome, telefone, e-mail e endereço do site mais recente do dono (se
 * houver) e o fuso das configurações de posts (senão Nova York). Prazos iguais aos da migration.
 */
async function defaultSettings(ownerId: string): Promise<OfficeSettingsRecord> {
  const [sites, timeZone] = await Promise.all([
    getSiteStore()
      .list(ownerId)
      .catch(() => []),
    clientsTimeZone(ownerId),
  ]);
  const latest = [...sites].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  const business = latest?.spec.business;
  const cityState = [business?.city, business?.state].filter(Boolean).join(", ");
  const address = [business?.address, cityState].filter(Boolean).join(", ");
  return {
    ownerId,
    companyName: business?.name?.trim() ?? "",
    phone: business?.phone?.trim() || null,
    email: business?.email?.trim() || null,
    address: address || null,
    defaultTaxRateBps: 0,
    invoiceDueDays: 14,
    estimateValidDays: 30,
    estimateTerms: "",
    paymentInstructions: "",
    timeZone: isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIME_ZONE,
  };
}

/**
 * Configurações do dono, criadas na primeira leitura. Toda criação de documento passa por aqui
 * ANTES de pedir o número: a RPC criaria a linha com os padrões vazios do banco.
 */
async function settingsRecord(ownerId: string): Promise<OfficeSettingsRecord> {
  const found = await store().getSettings(ownerId);
  if (found) return found;
  return store().ensureSettings(await defaultSettings(ownerId));
}

/** Configurações + "hoje" no fuso da empresa. */
async function context(
  ownerId: string,
): Promise<{ settings: OfficeSettingsRecord; today: string }> {
  const settings = await settingsRecord(ownerId);
  return { settings, today: todayIn(settings.timeZone) };
}

export async function getSettings(ownerId: string): Promise<OfficeSettings> {
  return toSettings(await settingsRecord(ownerId));
}

/** Mesmo que getSettings (nome usado pelas páginas). */
export const getOfficeSettings = getSettings;

export async function updateSettings(
  ownerId: string,
  input: UpdateOfficeSettingsRequest,
): Promise<OfficeSettings> {
  await settingsRecord(ownerId);
  if (input.timeZone !== undefined && !isValidTimeZone(input.timeZone)) {
    throw new OfficeError(400, "invalid_request", "Please choose a valid time zone.");
  }
  const updated = await store().updateSettings(ownerId, {
    companyName: input.companyName,
    phone: blankToNull(input.phone),
    email: blankToNull(input.email),
    address: blankToNull(input.address),
    defaultTaxRateBps: input.defaultTaxRateBps,
    invoiceDueDays: input.invoiceDueDays,
    estimateValidDays: input.estimateValidDays,
    estimateTerms: input.estimateTerms,
    paymentInstructions: input.paymentInstructions,
    timeZone: input.timeZone,
  });
  if (!updated) throw new Error("The office settings were not saved.");
  return toSettings(updated);
}

// ---------- tabela de preços ----------

function toPriceItem(record: PriceItemRecord): PriceItem {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    unitPriceCents: record.unitPriceCents,
    unit: record.unit,
    taxable: record.taxable,
    active: record.active,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/** Todos os itens (ativos e inativos), por nome. */
export async function listPriceItems(ownerId: string): Promise<PriceItem[]> {
  return (await store().listPriceItems(ownerId)).map(toPriceItem);
}

export async function createPriceItem(
  ownerId: string,
  input: CreatePriceItemRequest,
): Promise<PriceItem> {
  const record = await store().insertPriceItem({
    ownerId,
    name: input.name.trim(),
    description: input.description ?? "",
    unitPriceCents: input.unitPriceCents,
    unit: input.unit?.trim() || "each",
    taxable: input.taxable ?? true,
    active: true,
  });
  return toPriceItem(record);
}

export async function updatePriceItem(
  ownerId: string,
  id: string,
  input: UpdatePriceItemRequest,
): Promise<PriceItem | null> {
  const record = await store().updatePriceItem(ownerId, id, {
    name: input.name?.trim(),
    description: input.description,
    unitPriceCents: input.unitPriceCents,
    unit: input.unit === undefined ? undefined : input.unit.trim() || "each",
    taxable: input.taxable,
    active: input.active,
  });
  return record ? toPriceItem(record) : null;
}

/** Apaga de vez: os documentos guardam uma cópia das linhas, então nada muda neles. */
export async function deletePriceItem(ownerId: string, id: string): Promise<boolean> {
  return store().deletePriceItem(ownerId, id);
}

// ---------- equipe ----------

function toTeamMember(record: TeamMemberRecord): TeamMember {
  return {
    id: record.id,
    name: record.name,
    phone: record.phone,
    email: record.email,
    role: record.role,
    color: record.color,
    active: record.active,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/** Primeira cor que nenhum membro ativo usa (todas usadas: roda a lista). */
function nextColor(team: readonly TeamMemberRecord[]): TeamColor {
  const used = new Set(team.filter((m) => m.active).map((m) => m.color));
  return (
    TEAM_COLORS.find((c) => !used.has(c)) ?? TEAM_COLORS[team.length % TEAM_COLORS.length] ?? "blue"
  );
}

export async function listTeam(ownerId: string): Promise<TeamMember[]> {
  return (await store().listTeam(ownerId)).map(toTeamMember);
}

export async function createTeamMember(
  ownerId: string,
  input: CreateTeamMemberRequest,
): Promise<TeamMember> {
  const team = await store().listTeam(ownerId);
  const record = await store().insertTeamMember({
    ownerId,
    name: input.name.trim(),
    phone: blankToNull(input.phone) ?? null,
    email: blankToNull(input.email) ?? null,
    role: input.role?.trim() ?? "",
    color: input.color ?? nextColor(team),
    active: true,
  });
  return toTeamMember(record);
}

export async function updateTeamMember(
  ownerId: string,
  id: string,
  input: UpdateTeamMemberRequest,
): Promise<TeamMember | null> {
  const record = await store().updateTeamMember(ownerId, id, {
    name: input.name?.trim(),
    phone: blankToNull(input.phone),
    email: blankToNull(input.email),
    role: input.role?.trim(),
    color: input.color,
    active: input.active,
  });
  return record ? toTeamMember(record) : null;
}

/** Apaga o membro; ele some dos jobs na leitura (o banco não tem chave estrangeira ali). */
export async function deleteTeamMember(ownerId: string, id: string): Promise<boolean> {
  return store().deleteTeamMember(ownerId, id);
}

// ---------- jobs ----------

function toJob(
  record: JobRecord,
  clients: ReadonlyMap<string, ClientRecord>,
  teamIds: ReadonlySet<string>,
): Job {
  return {
    id: record.id,
    number: record.number,
    clientId: record.clientId,
    clientName: clients.get(record.clientId)?.name ?? MISSING_CLIENT,
    title: record.title,
    description: record.description,
    status: record.status,
    startAt: record.startAt,
    endAt: record.endAt,
    address: record.address,
    assigneeIds: record.assigneeIds.filter((id) => teamIds.has(id)),
    notes: record.notes,
    estimateId: record.estimateId,
    invoiceId: record.invoiceId,
    valueCents: record.valueCents,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/** Só ids da equipe do dono, sem repetir (os desconhecidos são descartados). */
function cleanAssignees(
  ids: readonly string[] | undefined,
  team: readonly TeamMemberRecord[],
): string[] {
  const known = new Set(team.map((m) => m.id));
  return [...new Set(ids ?? [])].filter((id) => known.has(id));
}

/** Leitura de um job só (nome do cliente e equipe atual). */
async function jobView(ownerId: string, record: JobRecord): Promise<Job> {
  const [client, team] = await Promise.all([
    getClientStore().getClient(ownerId, record.clientId),
    store().listTeam(ownerId),
  ]);
  return toJob(record, clientMap(client), new Set(team.map((m) => m.id)));
}

/** Ordem da agenda: com horário primeiro (mais cedo antes), depois os mais novos. */
function byStart(a: Job, b: Job): number {
  if (a.startAt && b.startAt) {
    return Date.parse(a.startAt) - Date.parse(b.startAt) || b.number - a.number;
  }
  if (a.startAt) return -1;
  if (b.startAt) return 1;
  return b.number - a.number;
}

/**
 * Início/fim do filtro da agenda. Data sem hora = o dia inteiro no fuso da empresa (`to` inclui o
 * dia); data-hora ISO = o instante exato (`to` exclusivo).
 */
function parseBoundary(value: string, timeZone: string, end: boolean): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return startOfDay(end ? addDays(value, 1) : value, timeZone);
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new OfficeError(
      400,
      "invalid_request",
      "Use a date (YYYY-MM-DD) or an ISO date-time for from and to.",
    );
  }
  return ms;
}

/** O job cai (pelo menos em parte) dentro de [from, to)? */
function overlaps(job: JobRecord, from: number | undefined, to: number | undefined): boolean {
  if (!job.startAt) return false;
  const start = Date.parse(job.startAt);
  const end = job.endAt ? Date.parse(job.endAt) : start;
  if (to !== undefined && start >= to) return false;
  if (from !== undefined && (job.endAt ? end <= from : end < from)) return false;
  return true;
}

export type JobListFilter = {
  from?: string;
  to?: string;
  status?: JobStatus;
  clientId?: string;
};

/**
 * Jobs do dono. Com `from`/`to`, só os que têm horário dentro do período; os sem data só entram
 * quando não há período ou quando o filtro é `status=unscheduled`.
 */
export async function listJobs(ownerId: string, filter: JobListFilter = {}): Promise<Job[]> {
  const settings = await settingsRecord(ownerId);
  const from =
    filter.from !== undefined ? parseBoundary(filter.from, settings.timeZone, false) : undefined;
  const to =
    filter.to !== undefined ? parseBoundary(filter.to, settings.timeZone, true) : undefined;
  const hasRange = from !== undefined || to !== undefined;

  const [records, clients, team] = await Promise.all([
    store().listJobs(ownerId, { status: filter.status, clientId: filter.clientId }),
    clientNames(ownerId),
    store().listTeam(ownerId),
  ]);
  const teamIds = new Set(team.map((m) => m.id));
  return records
    .filter((job) => {
      if (!hasRange) return true;
      if (!job.startAt) return filter.status === "unscheduled";
      return overlaps(job, from, to);
    })
    .map((job) => toJob(job, clients, teamIds))
    .sort(byStart);
}

export async function getJob(ownerId: string, id: string): Promise<Job | null> {
  const record = await store().getJob(ownerId, id);
  return record ? jobView(ownerId, record) : null;
}

export async function createJob(ownerId: string, input: CreateJobRequest): Promise<Job> {
  const client = await requireClient(ownerId, input.clientId);
  await settingsRecord(ownerId);
  const team = await store().listTeam(ownerId);
  const startAt = toInstant(input.startAt) ?? null;
  const endAt = toInstant(input.endAt) ?? null;
  checkTimes(startAt, endAt);

  const number = await store().nextNumber(ownerId, "job");
  const record = await store().insertJob({
    ownerId,
    number,
    clientId: client.id,
    title: input.title.trim(),
    description: input.description ?? "",
    status: startAt ? "scheduled" : "unscheduled",
    startAt,
    endAt,
    address: input.address === undefined ? client.address : (blankToNull(input.address) ?? null),
    assigneeIds: cleanAssignees(input.assigneeIds, team),
    notes: input.notes ?? "",
    estimateId: null,
    invoiceId: null,
    valueCents: input.valueCents ?? null,
    completedAt: null,
  });
  return toJob(record, clientMap(client), new Set(team.map((m) => m.id)));
}

/**
 * Muda o job. Sem `status` no pedido: ganhar horário leva "unscheduled" → "scheduled" e perder o
 * horário volta "scheduled" → "unscheduled". `done` marca `completedAt` (sair de `done` limpa).
 */
export async function updateJob(
  ownerId: string,
  id: string,
  input: UpdateJobRequest,
): Promise<Job | null> {
  const current = await store().getJob(ownerId, id);
  if (!current) return null;

  const patch: JobPatch = {
    title: input.title?.trim(),
    description: input.description,
    address: input.address === undefined ? undefined : (blankToNull(input.address) ?? null),
    notes: input.notes,
    valueCents: input.valueCents,
  };
  if (input.assigneeIds !== undefined) {
    patch.assigneeIds = cleanAssignees(input.assigneeIds, await store().listTeam(ownerId));
  }

  const startAt =
    input.startAt === undefined ? current.startAt : (toInstant(input.startAt) ?? null);
  const endAt = input.endAt === undefined ? current.endAt : (toInstant(input.endAt) ?? null);
  checkTimes(startAt, endAt);
  if (input.startAt !== undefined) patch.startAt = startAt;
  if (input.endAt !== undefined) patch.endAt = endAt;

  let status = input.status;
  if (status === undefined) {
    if (startAt && current.status === "unscheduled") status = "scheduled";
    else if (!startAt && current.status === "scheduled") status = "unscheduled";
  }
  if (status !== undefined && status !== current.status) patch.status = status;
  const finalStatus = status ?? current.status;
  if (finalStatus === "done" && !current.completedAt) patch.completedAt = nowIso();
  if (finalStatus !== "done" && current.completedAt) patch.completedAt = null;

  const updated = await store().updateJob(ownerId, id, patch);
  return updated ? jobView(ownerId, updated) : null;
}

/** Apaga o job; orçamento e fatura ligados continuam, só sem o job. */
export async function deleteJob(ownerId: string, id: string): Promise<boolean> {
  return store().deleteJob(ownerId, id);
}

// ---------- linhas e totais ----------

/**
 * Linhas como o servidor guarda: quantidade com até 2 casas e `priceItemId` só se o item for do
 * dono (senão vira linha digitada).
 */
async function cleanItems(ownerId: string, items: readonly LineItem[]): Promise<LineItem[]> {
  const linked = items.some((i) => i.priceItemId);
  const known = linked
    ? new Set((await store().listPriceItems(ownerId)).map((p) => p.id))
    : new Set<string>();
  return items.map((item) => ({
    priceItemId: item.priceItemId && known.has(item.priceItemId) ? item.priceItemId : null,
    name: item.name.trim(),
    description: item.description.trim(),
    quantity: Math.max(0.01, Math.round(item.quantity * 100) / 100),
    unitPriceCents: item.unitPriceCents,
    taxable: item.taxable,
  }));
}

/** Linha do link público: sem o id interno da tabela de preços. */
function publicLine(item: LineItem): Omit<LineItem, "priceItemId"> {
  return {
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    taxable: item.taxable,
  };
}

// ---------- orçamentos ----------

/** Status mostrado: enviado e com validade antes de hoje (fuso da empresa) = `expired`. */
export function estimateStatus(
  record: Pick<EstimateRecord, "status" | "validUntil">,
  today: string,
): EstimateStatus {
  if (record.status === "sent" && record.validUntil !== null && record.validUntil < today) {
    return "expired";
  }
  return record.status;
}

function toEstimate(record: EstimateRecord, clientName: string, today: string): Estimate {
  return {
    id: record.id,
    number: record.number,
    clientId: record.clientId,
    clientName,
    jobId: record.jobId,
    title: record.title,
    status: estimateStatus(record, today),
    items: record.items,
    taxRateBps: record.taxRateBps,
    subtotalCents: record.subtotalCents,
    discountCents: record.discountCents,
    taxCents: record.taxCents,
    totalCents: record.totalCents,
    message: record.message,
    validUntil: record.validUntil,
    publicToken: record.publicToken,
    sentAt: record.sentAt,
    respondedAt: record.respondedAt,
    approvedByName: record.approvedByName,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function estimateView(ownerId: string, record: EstimateRecord): Promise<Estimate> {
  const [{ today }, client] = await Promise.all([
    context(ownerId),
    getClientStore().getClient(ownerId, record.clientId),
  ]);
  return toEstimate(record, client?.name ?? MISSING_CLIENT, today);
}

export type EstimateListFilter = { status?: EstimateStatus; clientId?: string };

/** Orçamentos do dono, mais novos primeiro (filtro de status já com `expired` calculado). */
export async function listEstimates(
  ownerId: string,
  filter: EstimateListFilter = {},
): Promise<Estimate[]> {
  const [{ today }, records, clients] = await Promise.all([
    context(ownerId),
    store().listEstimates(ownerId, { clientId: filter.clientId }),
    clientNames(ownerId),
  ]);
  return records
    .map((r) => toEstimate(r, clients.get(r.clientId)?.name ?? MISSING_CLIENT, today))
    .filter((e) => !filter.status || e.status === filter.status)
    .sort((a, b) => b.number - a.number);
}

export async function getEstimate(ownerId: string, id: string): Promise<Estimate | null> {
  const record = await store().getEstimate(ownerId, id);
  return record ? estimateView(ownerId, record) : null;
}

export async function createEstimate(
  ownerId: string,
  input: CreateEstimateRequest,
): Promise<Estimate> {
  const client = await requireClient(ownerId, input.clientId);
  const { settings, today } = await context(ownerId);
  const job = input.jobId ? await store().getJob(ownerId, input.jobId) : null;
  if (input.jobId && !job) throw notFound("Job");

  const items = await cleanItems(ownerId, input.items ?? []);
  const taxRateBps = input.taxRateBps ?? settings.defaultTaxRateBps;
  const totals = computeTotals(items, taxRateBps, input.discountCents ?? 0);
  const number = await store().nextNumber(ownerId, "estimate");
  const record = await store().insertEstimate({
    ownerId,
    number,
    clientId: client.id,
    jobId: job?.id ?? null,
    title: input.title ?? "",
    status: "draft",
    items,
    taxRateBps,
    ...totals,
    message: input.message ?? "",
    validUntil: input.validUntil ?? null,
    publicToken: newPublicToken(),
    sentAt: null,
    respondedAt: null,
    approvedByName: null,
    declineReason: null,
  });
  if (job && !job.estimateId) await store().updateJob(ownerId, job.id, { estimateId: record.id });
  return toEstimate(record, client.name, today);
}

/** Só rascunho e enviado (inclusive vencido) mudam; aprovado/recusado ficam como estão. */
function isOpenEstimate(record: EstimateRecord): boolean {
  return record.status === "draft" || record.status === "sent";
}

/**
 * Muda o orçamento. Linhas, imposto, desconto, textos e validade só em rascunho/enviado (409 nos
 * outros). `status` = o dono marca a resposta que recebeu por fora (aprovar leva o cliente a
 * "won"). `null` se não existir ou for de outro dono.
 */
export async function updateEstimate(
  ownerId: string,
  id: string,
  input: UpdateEstimateRequest,
): Promise<Estimate | null> {
  const current = await store().getEstimate(ownerId, id);
  if (!current) return null;
  const open = isOpenEstimate(current);

  const touchesTotals =
    input.items !== undefined ||
    input.taxRateBps !== undefined ||
    input.discountCents !== undefined;
  const touchesDocument =
    touchesTotals ||
    input.title !== undefined ||
    input.message !== undefined ||
    input.validUntil !== undefined;
  if (touchesDocument && !open) {
    throw new OfficeError(409, "conflict", "Only draft and sent estimates can be edited.");
  }

  const patch: EstimatePatch = {
    title: input.title,
    message: input.message,
    validUntil: input.validUntil,
  };
  if (touchesTotals) {
    const items = input.items ? await cleanItems(ownerId, input.items) : current.items;
    const taxRateBps = input.taxRateBps ?? current.taxRateBps;
    const discount = input.discountCents ?? current.discountCents;
    Object.assign(patch, { items, taxRateBps, ...computeTotals(items, taxRateBps, discount) });
  }

  const approving = input.status === "approved" && current.status !== "approved";
  if (input.status !== undefined && input.status !== current.status) {
    if (!open) throw new OfficeError(409, "conflict", "This estimate was already answered.");
    patch.status = input.status;
    patch.respondedAt = nowIso();
  }

  const updated = await store().updateEstimate(ownerId, id, patch);
  if (!updated) return null;
  if (approving) await advanceClientStage(ownerId, updated.clientId, "any", "won");
  return estimateView(ownerId, updated);
}

/** Apaga o orçamento; job e fatura criados a partir dele continuam (sem o vínculo). */
export async function deleteEstimate(ownerId: string, id: string): Promise<boolean> {
  return store().deleteEstimate(ownerId, id);
}

/** Origem sem "/" no fim + caminho público. */
function publicUrl(origin: string, prefix: "q" | "i", token: string): string {
  return `${origin.replace(/\/+$/, "")}/${prefix}/${token}`;
}

/**
 * Envia (gera o link) do orçamento: rascunho vira enviado e `sentAt` = agora. Em rascunho/enviado
 * sem validade (ou já vencido) a validade vira hoje + `estimateValidDays`: reenviar um orçamento
 * vencido o reabre. Cliente em "new"/"contacted" vai para "quoted". Precisa de pelo menos uma
 * linha. `origin`: endereço da plataforma (ver `appOrigin` em server/notify).
 */
export async function sendEstimate(
  ownerId: string,
  id: string,
  origin: string,
): Promise<{ url: string; estimate: Estimate } | null> {
  const current = await store().getEstimate(ownerId, id);
  if (!current) return null;
  if (current.items.length === 0) {
    throw new OfficeError(400, "invalid_request", "Add at least one line before sending.");
  }
  const { settings, today } = await context(ownerId);
  const open = isOpenEstimate(current);
  const patch: EstimatePatch = { sentAt: nowIso() };
  if (current.status === "draft") patch.status = "sent";
  if (open && (current.validUntil === null || current.validUntil < today)) {
    patch.validUntil = addDays(today, settings.estimateValidDays);
  }
  const updated = await store().updateEstimate(ownerId, id, patch);
  if (!updated) return null;
  if (open) await advanceClientStage(ownerId, updated.clientId, ["new", "contacted"], "quoted");
  return {
    url: publicUrl(origin, "q", updated.publicToken),
    estimate: await estimateView(ownerId, updated),
  };
}

// ---------- faturas ----------

/** Status mostrado: `sent` com saldo vira `overdue` (passou do vencimento) ou `partial`. */
export function invoiceStatus(
  record: Pick<InvoiceRecord, "status" | "dueOn">,
  paidCents: number,
  today: string,
): InvoiceStatus {
  if (record.status !== "sent") return record.status;
  if (record.dueOn !== null && record.dueOn < today) return "overdue";
  if (paidCents > 0) return "partial";
  return "sent";
}

function toPayment(record: PaymentRecord): Payment {
  return {
    id: record.id,
    invoiceId: record.invoiceId,
    amountCents: record.amountCents,
    method: record.method,
    reference: record.reference,
    receivedOn: record.receivedOn,
    createdAt: record.createdAt,
  };
}

const sumPayments = (payments: readonly PaymentRecord[]) =>
  payments.reduce((sum, p) => sum + p.amountCents, 0);

function toInvoice(
  record: InvoiceRecord,
  payments: readonly PaymentRecord[],
  clientName: string,
  today: string,
): Invoice {
  const paid = sumPayments(payments);
  return {
    id: record.id,
    number: record.number,
    clientId: record.clientId,
    clientName,
    jobId: record.jobId,
    estimateId: record.estimateId,
    title: record.title,
    status: invoiceStatus(record, paid, today),
    items: record.items,
    taxRateBps: record.taxRateBps,
    subtotalCents: record.subtotalCents,
    discountCents: record.discountCents,
    taxCents: record.taxCents,
    totalCents: record.totalCents,
    amountPaidCents: paid,
    balanceCents: record.totalCents - paid,
    message: record.message,
    issuedOn: record.issuedOn,
    dueOn: record.dueOn,
    publicToken: record.publicToken,
    sentAt: record.sentAt,
    paidAt: record.paidAt,
    payments: payments.map(toPayment),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function paymentsOf(ownerId: string, invoiceId: string): Promise<PaymentRecord[]> {
  return store().listPayments(ownerId, { invoiceIds: [invoiceId] });
}

async function invoiceView(ownerId: string, record: InvoiceRecord): Promise<Invoice> {
  const [{ today }, client, payments] = await Promise.all([
    context(ownerId),
    getClientStore().getClient(ownerId, record.clientId),
    paymentsOf(ownerId, record.id),
  ]);
  return toInvoice(record, payments, client?.name ?? MISSING_CLIENT, today);
}

/** Pagamentos do dono agrupados por fatura. */
function groupPayments(payments: readonly PaymentRecord[]): Map<string, PaymentRecord[]> {
  const byInvoice = new Map<string, PaymentRecord[]>();
  for (const payment of payments) {
    const list = byInvoice.get(payment.invoiceId) ?? [];
    list.push(payment);
    byInvoice.set(payment.invoiceId, list);
  }
  return byInvoice;
}

export type InvoiceListFilter = { status?: InvoiceStatus; clientId?: string };

/** Faturas do dono, mais novas primeiro (filtro de status já com partial/overdue calculados). */
export async function listInvoices(
  ownerId: string,
  filter: InvoiceListFilter = {},
): Promise<Invoice[]> {
  const [{ today }, records, clients, payments] = await Promise.all([
    context(ownerId),
    store().listInvoices(ownerId, { clientId: filter.clientId }),
    clientNames(ownerId),
    store().listPayments(ownerId),
  ]);
  const byInvoice = groupPayments(payments);
  return records
    .map((r) =>
      toInvoice(
        r,
        byInvoice.get(r.id) ?? [],
        clients.get(r.clientId)?.name ?? MISSING_CLIENT,
        today,
      ),
    )
    .filter((i) => !filter.status || i.status === filter.status)
    .sort((a, b) => b.number - a.number);
}

export async function getInvoice(ownerId: string, id: string): Promise<Invoice | null> {
  const record = await store().getInvoice(ownerId, id);
  return record ? invoiceView(ownerId, record) : null;
}

/** Grava uma fatura nova (rascunho) com totais calculados aqui. */
async function insertInvoice(
  ownerId: string,
  fields: {
    clientId: string;
    jobId: string | null;
    estimateId: string | null;
    title: string;
    items: LineItem[];
    taxRateBps: number;
    discountCents: number;
    message: string;
    issuedOn: string;
    dueOn: string | null;
  },
): Promise<InvoiceRecord> {
  const number = await store().nextNumber(ownerId, "invoice");
  return store().insertInvoice({
    ownerId,
    number,
    clientId: fields.clientId,
    jobId: fields.jobId,
    estimateId: fields.estimateId,
    title: fields.title,
    status: "draft",
    items: fields.items,
    taxRateBps: fields.taxRateBps,
    ...computeTotals(fields.items, fields.taxRateBps, fields.discountCents),
    amountPaidCents: 0,
    message: fields.message,
    issuedOn: fields.issuedOn,
    dueOn: fields.dueOn,
    publicToken: newPublicToken(),
    sentAt: null,
    paidAt: null,
  });
}

/**
 * Fatura nova (rascunho). Emissão padrão: hoje; vencimento padrão: emissão + `invoiceDueDays`.
 * Com `jobId`, o job passa a apontar para ela (se ainda não tiver fatura).
 */
export async function createInvoice(
  ownerId: string,
  input: CreateInvoiceRequest,
): Promise<Invoice> {
  const client = await requireClient(ownerId, input.clientId);
  const { settings, today } = await context(ownerId);
  const job = input.jobId ? await store().getJob(ownerId, input.jobId) : null;
  if (input.jobId && !job) throw notFound("Job");

  const issuedOn = input.issuedOn ?? today;
  const record = await insertInvoice(ownerId, {
    clientId: client.id,
    jobId: job?.id ?? null,
    estimateId: null,
    title: input.title ?? "",
    items: await cleanItems(ownerId, input.items ?? []),
    taxRateBps: input.taxRateBps ?? settings.defaultTaxRateBps,
    discountCents: input.discountCents ?? 0,
    message: input.message ?? "",
    issuedOn,
    dueOn: input.dueOn !== undefined ? input.dueOn : addDays(issuedOn, settings.invoiceDueDays),
  });
  if (job && !job.invoiceId) await store().updateJob(ownerId, job.id, { invoiceId: record.id });
  return toInvoice(record, [], client.name, today);
}

/**
 * Muda a fatura. Linhas/imposto/desconto só sem pagamento registrado; anulada não muda mais.
 * `status: "void"` anula (só sem pagamento: apague os pagamentos antes). `null` se não existir.
 */
export async function updateInvoice(
  ownerId: string,
  id: string,
  input: UpdateInvoiceRequest,
): Promise<Invoice | null> {
  const current = await store().getInvoice(ownerId, id);
  if (!current) return null;
  if (current.status === "void") {
    const onlyVoid = Object.entries(input).every(([k, v]) => k === "status" || v === undefined);
    if (onlyVoid) return invoiceView(ownerId, current);
    throw new OfficeError(409, "conflict", "This invoice is void and can't be changed.");
  }

  const hasPayments = (await paymentsOf(ownerId, id)).length > 0;
  const touchesTotals =
    input.items !== undefined ||
    input.taxRateBps !== undefined ||
    input.discountCents !== undefined;
  if (touchesTotals && hasPayments) {
    throw new OfficeError(
      409,
      "conflict",
      "This invoice has payments, so its lines can't change. Delete the payments first.",
    );
  }
  if (input.status === "void" && hasPayments) {
    throw new OfficeError(
      409,
      "conflict",
      "This invoice has payments, so it can't be voided. Delete the payments first.",
    );
  }

  const patch: InvoicePatch = {
    title: input.title,
    message: input.message,
    issuedOn: input.issuedOn,
    dueOn: input.dueOn,
  };
  if (touchesTotals) {
    const items = input.items ? await cleanItems(ownerId, input.items) : current.items;
    const taxRateBps = input.taxRateBps ?? current.taxRateBps;
    const discount = input.discountCents ?? current.discountCents;
    Object.assign(patch, { items, taxRateBps, ...computeTotals(items, taxRateBps, discount) });
  }
  if (input.status === "void") patch.status = "void";

  const updated = await store().updateInvoice(ownerId, id, patch);
  return updated ? invoiceView(ownerId, updated) : null;
}

/** Envia (gera o link) da fatura: rascunho vira enviada e `sentAt` = agora. */
export async function sendInvoice(
  ownerId: string,
  id: string,
  origin: string,
): Promise<{ url: string; invoice: Invoice } | null> {
  const current = await store().getInvoice(ownerId, id);
  if (!current) return null;
  if (current.status === "void") {
    throw new OfficeError(409, "conflict", "Void invoices can't be sent.");
  }
  if (current.items.length === 0) {
    throw new OfficeError(400, "invalid_request", "Add at least one line before sending.");
  }
  const patch: InvoicePatch = { sentAt: nowIso() };
  if (current.status === "draft") patch.status = "sent";
  const updated = await store().updateInvoice(ownerId, id, patch);
  if (!updated) return null;
  return {
    url: publicUrl(origin, "i", updated.publicToken),
    invoice: await invoiceView(ownerId, updated),
  };
}

/**
 * Apaga a fatura. Com pagamento registrado: 409 (apague os pagamentos antes; anular também exige
 * fatura sem pagamento). O job ligado fica sem fatura.
 */
export async function deleteInvoice(ownerId: string, id: string): Promise<boolean> {
  const current = await store().getInvoice(ownerId, id);
  if (!current) return false;
  if ((await paymentsOf(ownerId, id)).length > 0) {
    throw new OfficeError(
      409,
      "conflict",
      "This invoice has payments. Delete the payments before deleting the invoice.",
    );
  }
  return store().deleteInvoice(ownerId, id);
}

// ---------- pagamentos ----------

/**
 * Registra um pagamento recebido. Não pode passar do saldo (400). Saldo zerado → `paid` e
 * `paidAt`; pagamento numa fatura em rascunho a dá como enviada (`sent`, sem `sentAt`: o dono
 * entregou em mãos). Cada pagamento entra no histórico do cliente como serviço (`job`) com o
 * valor, para o total do cliente e a receita do mês ficarem certos.
 */
export async function recordPayment(
  ownerId: string,
  invoiceId: string,
  input: RecordPaymentRequest,
): Promise<Invoice | null> {
  const current = await store().getInvoice(ownerId, invoiceId);
  if (!current) return null;
  if (current.status === "void") {
    throw new OfficeError(409, "conflict", "This invoice is void.");
  }
  const { today } = await context(ownerId);
  const paid = sumPayments(await paymentsOf(ownerId, invoiceId));
  const balance = current.totalCents - paid;
  if (input.amountCents > balance) {
    throw new OfficeError(
      400,
      "invalid_request",
      balance <= 0
        ? "This invoice is already paid in full."
        : `The payment can't be more than the balance (${formatCents(balance)}).`,
    );
  }

  await store().insertPayment({
    ownerId,
    invoiceId,
    amountCents: input.amountCents,
    method: input.method,
    reference: input.reference ?? "",
    receivedOn: input.receivedOn ?? today,
  });
  const newPaid = paid + input.amountCents;
  const patch: InvoicePatch = { amountPaidCents: newPaid };
  if (newPaid >= current.totalCents) {
    patch.status = "paid";
    patch.paidAt = nowIso();
  } else if (current.status === "draft") {
    patch.status = "sent";
  }
  const updated = await store().updateInvoice(ownerId, invoiceId, patch);

  try {
    await addClientActivity(ownerId, current.clientId, {
      kind: "job",
      body: `Payment for invoice #${current.number}`,
      amountCents: input.amountCents,
    });
  } catch (error) {
    // O pagamento já está salvo; o histórico do cliente é extra.
    console.error("[office] could not add the payment to the client history", error);
  }
  return invoiceView(ownerId, updated ?? current);
}

/**
 * Apaga um pagamento (lançado errado). Se a fatura estava paga e voltou a ter saldo, volta a
 * `sent`. O item que o pagamento criou no histórico do cliente FICA (o histórico é um registro do
 * que aconteceu; o dono pode lançar a correção lá). `null` se a fatura não existir; 404 se o
 * pagamento não for dela.
 */
export async function deletePayment(
  ownerId: string,
  invoiceId: string,
  paymentId: string,
): Promise<Invoice | null> {
  const current = await store().getInvoice(ownerId, invoiceId);
  if (!current) return null;
  if (!(await store().deletePayment(ownerId, invoiceId, paymentId))) throw notFound("Payment");

  const paid = sumPayments(await paymentsOf(ownerId, invoiceId));
  const patch: InvoicePatch = { amountPaidCents: paid };
  if (current.status === "paid" && paid < current.totalCents) {
    patch.status = "sent";
    patch.paidAt = null;
  }
  const updated = await store().updateInvoice(ownerId, invoiceId, patch);
  return invoiceView(ownerId, updated ?? current);
}

// ---------- orçamento → job / fatura ----------

/**
 * Converte um orçamento aprovado (409 nos outros). `createJob`: job sem data com o valor do
 * orçamento e o endereço do cliente. `createInvoice`: fatura em rascunho com as mesmas linhas.
 * Nunca duplica: job já ligado ou fatura (não anulada) já criada a partir dele são devolvidos
 * como estão. A resposta traz o job e a fatura ligados (ou `null`).
 */
export async function convertEstimate(
  ownerId: string,
  id: string,
  input: ConvertEstimateRequest,
): Promise<ConvertEstimateResponse | null> {
  let estimate = await store().getEstimate(ownerId, id);
  if (!estimate) return null;
  if (estimate.status !== "approved") {
    throw new OfficeError(409, "conflict", "Only approved estimates can be converted.");
  }
  const { settings, today } = await context(ownerId);
  const client = await getClientStore().getClient(ownerId, estimate.clientId);

  let job = estimate.jobId ? await store().getJob(ownerId, estimate.jobId) : null;
  if (input.createJob && !job) {
    const number = await store().nextNumber(ownerId, "job");
    job = await store().insertJob({
      ownerId,
      number,
      clientId: estimate.clientId,
      title: estimate.title.trim() || `Estimate #${estimate.number}`,
      description: "",
      status: "unscheduled",
      startAt: null,
      endAt: null,
      address: client?.address ?? null,
      assigneeIds: [],
      notes: "",
      estimateId: estimate.id,
      invoiceId: null,
      valueCents: Math.min(estimate.totalCents, MAX_MONEY),
      completedAt: null,
    });
    estimate = (await store().updateEstimate(ownerId, id, { jobId: job.id })) ?? estimate;
  }

  const existing = await store().listInvoices(ownerId, { estimateId: estimate.id });
  let invoice = existing.find((i) => i.status !== "void") ?? null;
  if (input.createInvoice && !invoice) {
    invoice = await insertInvoice(ownerId, {
      clientId: estimate.clientId,
      jobId: job?.id ?? null,
      estimateId: estimate.id,
      title: estimate.title,
      items: estimate.items,
      taxRateBps: estimate.taxRateBps,
      discountCents: estimate.discountCents,
      message: "",
      issuedOn: today,
      dueOn: addDays(today, settings.invoiceDueDays),
    });
  }
  if (invoice && job) {
    if (!job.invoiceId) {
      job = (await store().updateJob(ownerId, job.id, { invoiceId: invoice.id })) ?? job;
    }
    if (!invoice.jobId) {
      invoice = (await store().updateInvoice(ownerId, invoice.id, { jobId: job.id })) ?? invoice;
    }
  }

  const clientName = client?.name ?? MISSING_CLIENT;
  const clients = clientMap(client);
  const team = job ? await store().listTeam(ownerId) : [];
  return {
    estimate: toEstimate(estimate, clientName, today),
    job: job ? toJob(job, clients, new Set(team.map((m) => m.id))) : null,
    invoice: invoice
      ? toInvoice(invoice, await paymentsOf(ownerId, invoice.id), clientName, today)
      : null,
  };
}

// ---------- resumo do painel ----------

/** Números do painel do escritório, com "hoje" e "este mês" no fuso da empresa. */
export async function getOfficeSummary(ownerId: string): Promise<OfficeSummary> {
  const { settings, today } = await context(ownerId);
  const timeZone = settings.timeZone;
  const [jobs, estimates, invoices, payments, clients, team] = await Promise.all([
    store().listJobs(ownerId),
    store().listEstimates(ownerId),
    store().listInvoices(ownerId),
    store().listPayments(ownerId),
    clientNames(ownerId),
    store().listTeam(ownerId),
  ]);
  const teamIds = new Set(team.map((m) => m.id));

  const dayStart = startOfDay(today, timeZone);
  const dayEnd = startOfDay(addDays(today, 1), timeZone);
  const todayJobs = jobs
    .filter((j) => j.status !== "canceled" && overlaps(j, dayStart, dayEnd))
    .map((j) => toJob(j, clients, teamIds))
    .sort(byStart);

  const awaiting = estimates.filter((e) => estimateStatus(e, today) === "sent");

  const byInvoice = groupPayments(payments);
  let unpaidInvoices = 0;
  let unpaidCents = 0;
  let overdueInvoices = 0;
  let overdueCents = 0;
  for (const record of invoices) {
    const paid = sumPayments(byInvoice.get(record.id) ?? []);
    const status = invoiceStatus(record, paid, today);
    const balance = Math.max(0, record.totalCents - paid);
    if (status !== "sent" && status !== "partial" && status !== "overdue") continue;
    if (balance === 0) continue;
    unpaidInvoices += 1;
    unpaidCents += balance;
    if (status === "overdue") {
      overdueInvoices += 1;
      overdueCents += balance;
    }
  }

  const month = today.slice(0, 7);
  return {
    todayJobs,
    unscheduledJobs: jobs.filter((j) => j.status === "unscheduled").length,
    jobsToInvoice: jobs.filter((j) => j.status === "done" && !j.invoiceId).length,
    estimatesAwaiting: awaiting.length,
    estimatesAwaitingCents: awaiting.reduce((sum, e) => sum + e.totalCents, 0),
    unpaidInvoices,
    unpaidCents,
    overdueInvoices,
    overdueCents,
    collectedThisMonthCents: payments
      .filter((p) => p.receivedOn.slice(0, 7) === month)
      .reduce((sum, p) => sum + p.amountCents, 0),
  };
}

// ---------- links públicos ----------

function companyOf(settings: OfficeSettingsRecord): PublicEstimate["company"] {
  return {
    companyName: settings.companyName,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
  };
}

function toPublicEstimate(
  record: EstimateRecord,
  settings: OfficeSettingsRecord,
  client: ClientRecord | null,
  today: string,
): PublicEstimate {
  return {
    number: record.number,
    title: record.title,
    status: estimateStatus(record, today),
    company: companyOf(settings),
    terms: settings.estimateTerms,
    client: partyOf(client),
    items: record.items.map(publicLine),
    taxRateBps: record.taxRateBps,
    subtotalCents: record.subtotalCents,
    discountCents: record.discountCents,
    taxCents: record.taxCents,
    totalCents: record.totalCents,
    message: record.message,
    validUntil: record.validUntil,
    sentAt: record.sentAt,
    respondedAt: record.respondedAt,
    approvedByName: record.approvedByName,
  };
}

/** Orçamento pelo link (rascunho = não existe). Sem conta. */
async function publicEstimateRecord(token: string): Promise<EstimateRecord | null> {
  const record = await store().getEstimateByToken(token);
  return record && record.status !== "draft" ? record : null;
}

async function publicEstimateView(record: EstimateRecord): Promise<PublicEstimate> {
  const [{ settings, today }, client] = await Promise.all([
    context(record.ownerId),
    getClientStore().getClient(record.ownerId, record.clientId),
  ]);
  return toPublicEstimate(record, settings, client, today);
}

export async function getPublicEstimate(token: string): Promise<PublicEstimate | null> {
  const record = await publicEstimateRecord(token);
  return record ? publicEstimateView(record) : null;
}

/**
 * Resposta do cliente pelo link: só com o orçamento enviado e dentro da validade (409 se já
 * respondido ou vencido). A gravação só acontece se o status ainda for `sent` (duas respostas ao
 * mesmo tempo: a segunda recebe 409). Aprovar leva o cliente a "won". `null` = link não existe.
 */
export async function respondToEstimate(
  token: string,
  input: RespondEstimateRequest,
): Promise<PublicEstimate | null> {
  const record = await publicEstimateRecord(token);
  if (!record) return null;
  const { today } = await context(record.ownerId);
  const status = estimateStatus(record, today);
  if (status === "expired") {
    throw new OfficeError(
      409,
      "conflict",
      "This estimate has expired. Please contact the business for a new one.",
    );
  }
  if (status !== "sent") {
    throw new OfficeError(409, "conflict", "This estimate was already answered.");
  }

  const patch: EstimatePatch =
    input.decision === "approve"
      ? { status: "approved", approvedByName: input.name.trim(), respondedAt: nowIso() }
      : { status: "declined", declineReason: input.reason?.trim() || null, respondedAt: nowIso() };
  const updated = await store().updateEstimate(record.ownerId, record.id, patch, "sent");
  if (!updated) throw new OfficeError(409, "conflict", "This estimate was already answered.");
  if (input.decision === "approve") {
    await advanceClientStage(updated.ownerId, updated.clientId, "any", "won");
  }
  return publicEstimateView(updated);
}

/** Fatura pelo link (rascunho e anulada = não existem). Sem conta. */
export async function getPublicInvoice(token: string): Promise<PublicInvoice | null> {
  const record = await store().getInvoiceByToken(token);
  if (!record || record.status === "draft" || record.status === "void") return null;
  const [{ settings, today }, client, payments] = await Promise.all([
    context(record.ownerId),
    getClientStore().getClient(record.ownerId, record.clientId),
    paymentsOf(record.ownerId, record.id),
  ]);
  const paid = sumPayments(payments);
  return {
    number: record.number,
    title: record.title,
    status: invoiceStatus(record, paid, today),
    company: companyOf(settings),
    paymentInstructions: settings.paymentInstructions,
    client: partyOf(client),
    items: record.items.map(publicLine),
    taxRateBps: record.taxRateBps,
    subtotalCents: record.subtotalCents,
    discountCents: record.discountCents,
    taxCents: record.taxCents,
    totalCents: record.totalCents,
    amountPaidCents: paid,
    balanceCents: record.totalCents - paid,
    message: record.message,
    issuedOn: record.issuedOn,
    dueOn: record.dueOn,
    paidAt: record.paidAt,
  };
}
