import {
  computeTotals,
  MAX_TOTAL_CENTS,
  TEAM_COLORS,
  type ClientStage,
  type ConvertEstimateRequest,
  type ConvertEstimateResponse,
  type CreateEstimateRequest,
  type DocumentTotals,
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
import { answeredByCustomer, MARKED_PAID_REFERENCE } from "@/lib/office";
import {
  addClientPayment,
  clientsTimeZone,
  removeClientPayment,
  updateClient,
} from "../clients/service";
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
// - Status calculados na leitura: orçamento `expired`; fatura `partial` / `overdue` (e `paid` para
//   a enviada de US$ 0).
// - "Hoje" é sempre no fuso da empresa (`settings.timeZone`).
// Erros de regra saem como `OfficeError` (as rotas viram `{ error: { code, message } }`).

const DEFAULT_TIME_ZONE = "America/New_York";
/** Teto do valor previsto de um job (o mesmo `Money` do contrato). */
const MAX_MONEY = 100_000_000;
/**
 * Nome mostrado quando o cliente do documento não existe mais (desde a 0023 o banco não deixa
 * apagar cliente com documentos; fica para dados antigos e corridas).
 */
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

/** Dias de `from` até `to` (datas sem hora; negativo se `to` vem antes). */
export function daysBetween(from: string, to: string): number {
  const utc = (date: string) => {
    const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
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
 * Configurações do dono. Leitura pura (`persist` falso): sem linha salva, devolve os padrões SEM
 * gravar (páginas lidas no "ver como" do admin não criam nada na conta vista). Escrita (`persist`):
 * grava os padrões na primeira vez. Toda criação de documento passa por aqui com `persist` ANTES
 * de pedir o número: a RPC criaria a linha com os padrões vazios do banco.
 */
async function settingsRecord(ownerId: string, persist = false): Promise<OfficeSettingsRecord> {
  const found = await store().getSettings(ownerId);
  if (found) return found;
  const defaults = await defaultSettings(ownerId);
  return persist ? store().ensureSettings(defaults) : defaults;
}

/** Configurações + "hoje" no fuso da empresa (`persist`: ver `settingsRecord`). */
async function context(
  ownerId: string,
  persist = false,
): Promise<{ settings: OfficeSettingsRecord; today: string }> {
  const settings = await settingsRecord(ownerId, persist);
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
  await settingsRecord(ownerId, true);
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
  await settingsRecord(ownerId, true);
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

/** Status que precisam de horário de início. */
const NEEDS_START = new Set<JobStatus>(["scheduled", "in_progress"]);

/**
 * Muda o job. Sem `status` no pedido: ganhar horário leva "unscheduled" → "scheduled" e perder o
 * horário volta "scheduled" → "unscheduled". "scheduled"/"in_progress" sem início: 400. `done`
 * marca `completedAt` (sair de `done` limpa).
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
  if (NEEDS_START.has(finalStatus) && !startAt) {
    throw new OfficeError(400, "invalid_request", "Pick a start time to schedule this job.");
  }
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

/** Totais pelo `computeTotals`, com teto: acima de US$ 1.000.000 o documento é recusado (400). */
function documentTotals(
  items: readonly LineItem[],
  taxRateBps: number,
  discountCents: number,
): DocumentTotals {
  const totals = computeTotals(items, taxRateBps, discountCents);
  if (totals.totalCents > MAX_TOTAL_CENTS) {
    throw new OfficeError(400, "invalid_request", "Totals over $1,000,000 aren't supported yet.");
  }
  return totals;
}

/** O job existe, é do dono e é do mesmo cliente do documento (senão 404 / 400). */
async function requireJobFor(
  ownerId: string,
  jobId: string | null | undefined,
  clientId: string,
): Promise<JobRecord | null> {
  if (!jobId) return null;
  const job = await store().getJob(ownerId, jobId);
  if (!job) throw notFound("Job");
  if (job.clientId !== clientId) {
    throw new OfficeError(400, "invalid_request", "That job is for a different client.");
  }
  return job;
}

/** O job pode apontar para uma fatura nova? (Sem fatura, ou a dele sumiu ou foi anulada.) */
async function jobInvoiceSlotFree(ownerId: string, job: JobRecord): Promise<boolean> {
  if (!job.invoiceId) return true;
  const linked = await store().getInvoice(ownerId, job.invoiceId);
  return !linked || linked.status === "void";
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
    declineReason: record.declineReason,
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
  const { settings, today } = await context(ownerId, true);
  const job = await requireJobFor(ownerId, input.jobId, client.id);

  const items = await cleanItems(ownerId, input.items ?? []);
  const taxRateBps = input.taxRateBps ?? settings.defaultTaxRateBps;
  const totals = documentTotals(items, taxRateBps, input.discountCents ?? 0);
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
 * "won"; `reopenEstimate` desfaz). A gravação só acontece se o status guardado ainda for o lido
 * (o cliente respondeu no meio: 409). Mudar um orçamento enviado o mantém enviado; o `updatedAt`
 * novo faz o cliente que estava com a versão antiga aberta receber 409 ao responder. `null` se não
 * existir.
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
    Object.assign(patch, { items, taxRateBps, ...documentTotals(items, taxRateBps, discount) });
  }

  const approving = input.status === "approved" && current.status !== "approved";
  if (input.status !== undefined && input.status !== current.status) {
    if (!open) throw new OfficeError(409, "conflict", "This estimate was already answered.");
    patch.status = input.status;
    patch.respondedAt = nowIso();
    // Marcada pelo dono = sem nome e sem motivo (é o que a separa da resposta pelo link).
    patch.approvedByName = null;
    patch.declineReason = null;
  }

  const updated = await store().updateEstimate(ownerId, id, patch, current.status);
  if (!updated) {
    if (!(await store().getEstimate(ownerId, id))) return null;
    throw new OfficeError(
      409,
      "conflict",
      "This estimate was answered or changed meanwhile. Refresh and try again.",
    );
  }
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
  } else if (current.status === "draft" && current.validUntil !== null) {
    // Rascunho guardado por dias: a validade conta a partir do envio (não chega ao cliente com
    // poucos dias sobrando).
    const waited = daysBetween(todayIn(settings.timeZone, new Date(current.createdAt)), today);
    if (waited > 0) patch.validUntil = addDays(current.validUntil, waited);
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

/**
 * Status mostrado: `sent` com saldo vira `overdue` (passou do vencimento) ou `partial`; `sent` sem
 * saldo (total US$ 0, que nenhum pagamento consegue quitar) já é `paid`.
 */
export function invoiceStatus(
  record: Pick<InvoiceRecord, "status" | "dueOn" | "totalCents">,
  paidCents: number,
  today: string,
): InvoiceStatus {
  if (record.status !== "sent") return record.status;
  if (paidCents >= record.totalCents) return "paid";
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
  // Confere o teto antes de gastar um número.
  documentTotals(fields.items, fields.taxRateBps, fields.discountCents);
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
    ...documentTotals(fields.items, fields.taxRateBps, fields.discountCents),
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
 * Com `jobId` (do mesmo cliente; senão 400), o job passa a apontar para ela se ainda não tiver
 * fatura ou se a dele foi anulada.
 */
export async function createInvoice(
  ownerId: string,
  input: CreateInvoiceRequest,
): Promise<Invoice> {
  const client = await requireClient(ownerId, input.clientId);
  const { settings, today } = await context(ownerId, true);
  const job = await requireJobFor(ownerId, input.jobId, client.id);

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
  if (job && (await jobInvoiceSlotFree(ownerId, job))) {
    await store().updateJob(ownerId, job.id, { invoiceId: record.id });
  }
  return toInvoice(record, [], client.name, today);
}

/**
 * Muda a fatura. Linhas/imposto/desconto só sem pagamento registrado; anulada não muda mais.
 * `status: "void"` anula (só sem pagamento: apague os pagamentos antes) e solta os jobs que
 * apontavam para ela (voltam a "para faturar"). `null` se não existir.
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
    Object.assign(patch, { items, taxRateBps, ...documentTotals(items, taxRateBps, discount) });
  }
  if (input.status === "void") patch.status = "void";

  const updated = await store().updateInvoice(ownerId, id, patch);
  if (!updated) return null;
  if (updated.status === "void") await releaseJobs(ownerId, updated.id);
  return invoiceView(ownerId, updated);
}

/** Jobs que apontavam para a fatura (anulada) ficam sem fatura. */
async function releaseJobs(ownerId: string, invoiceId: string): Promise<void> {
  for (const job of await store().listJobs(ownerId, { invoiceId })) {
    await store().updateJob(ownerId, job.id, { invoiceId: null });
  }
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
  if (current.status === "draft") {
    patch.status = "sent";
    // Rascunho antigo (ex.: criado quando o orçamento foi aprovado, semanas antes do serviço): a
    // data da fatura vira hoje e o vencimento anda junto, para não chegar ao cliente já vencida.
    const { today } = await context(ownerId);
    if (current.issuedOn < today) {
      patch.issuedOn = today;
      if (current.dueOn !== null) {
        patch.dueOn = addDays(current.dueOn, daysBetween(current.issuedOn, today));
      }
    }
  }
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
 * entregou em mãos). A conferência do saldo e a gravação são atômicas (`store.recordPayment`; no
 * Supabase a RPC trava a fatura): dois pagamentos ao mesmo tempo nunca passam do total. Cada
 * pagamento entra no histórico do cliente como `payment` (soma no total do cliente e na receita
 * do mês, sem contar como serviço).
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
  const result = await store().recordPayment({
    ownerId,
    invoiceId,
    amountCents: input.amountCents,
    method: input.method,
    reference: input.reference ?? "",
    receivedOn: input.receivedOn ?? today,
  });
  if (!result.ok) {
    if (result.reason === "not_found") return null;
    if (result.reason === "void") throw new OfficeError(409, "conflict", "This invoice is void.");
    throw new OfficeError(
      400,
      "invalid_request",
      result.balanceCents <= 0
        ? "This invoice is already paid in full."
        : `The payment can't be more than the balance (${formatCents(result.balanceCents)}).`,
    );
  }

  try {
    await addClientPayment(ownerId, current.clientId, {
      paymentId: result.payment.id,
      amountCents: result.payment.amountCents,
      body: `Payment for invoice #${current.number}`,
    });
  } catch (error) {
    // O pagamento já está salvo; o histórico do cliente é extra.
    console.error("[office] could not add the payment to the client history", error);
  }
  return invoiceView(ownerId, result.invoice);
}

/**
 * Apaga um pagamento (lançado errado). Se a fatura estava paga e voltou a ter saldo, volta a
 * `sent`. O item `payment` do histórico do cliente sai junto e os totais do cliente são
 * recalculados. `null` se a fatura não existir; 404 se o pagamento não for dela.
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

  try {
    await removeClientPayment(ownerId, paymentId, current.clientId);
  } catch (error) {
    console.error("[office] could not remove the payment from the client history", error);
  }
  return invoiceView(ownerId, updated ?? current);
}

/**
 * "Mark as paid": fecha a fatura que o cliente pagou a menos (ou que o dono dá por quitada) lançando
 * o saldo que falta como pagamento `other` com a referência "Marked paid". O contrato não tem
 * abatimento; o pagamento é o registro (apagar o pagamento desfaz) e segue as regras de
 * `recordPayment` (rascunho vira enviada, entra no histórico do cliente). O saldo é o do servidor
 * na hora do pedido. Já sem saldo (clique duplo, fatura de US$ 0): devolve a fatura como está.
 * Anulada: 409. `null` se não existir.
 */
export async function markInvoicePaid(ownerId: string, invoiceId: string): Promise<Invoice | null> {
  const current = await store().getInvoice(ownerId, invoiceId);
  if (!current) return null;
  if (current.status === "void") {
    throw new OfficeError(409, "conflict", "This invoice is void.");
  }
  const balance = current.totalCents - sumPayments(await paymentsOf(ownerId, invoiceId));
  if (balance <= 0) return invoiceView(ownerId, current);
  try {
    return await recordPayment(ownerId, invoiceId, {
      amountCents: balance,
      method: "other",
      reference: MARKED_PAID_REFERENCE,
    });
  } catch (error) {
    // Outro pagamento entrou no meio: se ele quitou a fatura, o pedido já está atendido.
    if (!(error instanceof OfficeError) || error.status !== 400) throw error;
    const fresh = await getInvoice(ownerId, invoiceId);
    if (fresh && fresh.balanceCents <= 0) return fresh;
    throw error;
  }
}

// ---------- orçamento → job / fatura ----------

/** Fatura não anulada criada a partir do orçamento (no máximo uma: índice único da 0023). */
async function activeInvoiceOf(ownerId: string, estimateId: string): Promise<InvoiceRecord | null> {
  const invoices = await store().listInvoices(ownerId, { estimateId });
  return invoices.find((i) => i.status !== "void") ?? null;
}

/**
 * Converte um orçamento aprovado (409 nos outros). `createJob`: job sem data com o valor do
 * orçamento e o endereço do cliente. `createInvoice`: fatura em rascunho com as mesmas linhas.
 * Nunca duplica, nem com dois pedidos ao mesmo tempo: o job só é ligado se o orçamento ainda
 * estiver sem job (quem perde apaga o seu e usa o do vencedor) e a fatura tem índice único por
 * orçamento (quem perde usa a que já existe). Job ligado a uma fatura anulada passa a apontar para
 * a nova. A resposta traz o job e a fatura ligados (ou `null`).
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
  const { settings, today } = await context(ownerId, true);
  const client = await getClientStore().getClient(ownerId, estimate.clientId);

  let job = estimate.jobId ? await store().getJob(ownerId, estimate.jobId) : null;
  if (input.createJob && !job) {
    const number = await store().nextNumber(ownerId, "job");
    const created = await store().insertJob({
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
    // Só liga se ninguém ligou outro job no meio (o job lido continua o guardado).
    const linked = await store().updateEstimate(
      ownerId,
      id,
      { jobId: created.id },
      { status: "approved", jobId: estimate.jobId },
    );
    if (linked) {
      estimate = linked;
      job = created;
    } else {
      // Outro pedido chegou antes: o job dele vale (o número deste fica sem uso).
      await store().deleteJob(ownerId, created.id);
      estimate = (await store().getEstimate(ownerId, id)) ?? estimate;
      job = estimate.jobId ? await store().getJob(ownerId, estimate.jobId) : null;
    }
  }

  let invoice = await activeInvoiceOf(ownerId, estimate.id);
  if (input.createInvoice && !invoice) {
    try {
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
    } catch (error) {
      // Índice único: outro pedido criou a fatura deste orçamento no meio. Usa a dele.
      const winner = await activeInvoiceOf(ownerId, estimate.id);
      if (!winner) throw error;
      invoice = winner;
    }
  }
  if (invoice && job) {
    if (job.invoiceId !== invoice.id && (await jobInvoiceSlotFree(ownerId, job))) {
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

// ---------- duplicar e reabrir ----------

/**
 * Cópia de um orçamento (qualquer status) como rascunho novo, pelo mesmo caminho de
 * `createEstimate` (número da `office_next_number`, link novo, totais recalculados): mesmo
 * cliente, título, linhas, imposto, desconto e mensagem. `priceItemId` fica se o item ainda
 * existir na tabela de preços (regra de `cleanItems`). Sem job, sem resposta e sem validade (o
 * envio define). `null` se o original não existir.
 */
export async function duplicateEstimate(ownerId: string, id: string): Promise<Estimate | null> {
  const source = await store().getEstimate(ownerId, id);
  if (!source) return null;
  return createEstimate(ownerId, {
    clientId: source.clientId,
    jobId: null,
    title: source.title,
    items: source.items,
    taxRateBps: source.taxRateBps,
    discountCents: source.discountCents,
    message: source.message,
    validUntil: null,
  });
}

/**
 * Cópia de uma fatura (qualquer status, inclusive paga ou anulada) como rascunho novo, pelo mesmo
 * caminho de `createInvoice`: mesmo cliente, título, linhas, imposto, desconto e mensagem; número
 * e link novos, sem job, sem orçamento e sem pagamentos; emissão hoje e vencimento pelas
 * configurações (`invoiceDueDays`). `null` se a original não existir.
 */
export async function duplicateInvoice(ownerId: string, id: string): Promise<Invoice | null> {
  const source = await store().getInvoice(ownerId, id);
  if (!source) return null;
  return createInvoice(ownerId, {
    clientId: source.clientId,
    jobId: null,
    title: source.title,
    items: source.items,
    taxRateBps: source.taxRateBps,
    discountCents: source.discountCents,
    message: source.message,
  });
}

/**
 * Reabre um orçamento que o DONO marcou como aprovado/recusado (engano no "Mark approved"): volta
 * a enviado (ou a rascunho, se nunca foi enviado) e limpa `respondedAt`, `approvedByName` e
 * `declineReason`. Recusado (409) quando:
 * - não está aprovado nem recusado;
 * - o cliente respondeu pelo link (`answeredByCustomer`): a resposta dele nunca é apagada (para
 *   mandar outra versão, duplique);
 * - já tem job ligado ou fatura não anulada criada dele (apague o job / anule a fatura antes).
 * A gravação só acontece se nada mudou desde a leitura (status, versão e job). A etapa do cliente
 * não volta (ele pode estar em "won" por outro motivo). `null` se não existir.
 */
export async function reopenEstimate(ownerId: string, id: string): Promise<Estimate | null> {
  const current = await store().getEstimate(ownerId, id);
  if (!current) return null;
  if (current.status !== "approved" && current.status !== "declined") {
    throw new OfficeError(409, "conflict", "Only approved or declined estimates can be reopened.");
  }
  if (answeredByCustomer(current)) {
    const verb = current.status === "approved" ? "approved" : "declined";
    throw new OfficeError(
      409,
      "conflict",
      `The customer ${verb} this estimate through the link, so it can't be reopened. Duplicate it to send a new one.`,
    );
  }
  if (current.jobId) {
    throw new OfficeError(
      409,
      "conflict",
      "This estimate has a job. Delete the job first to reopen the estimate.",
    );
  }
  if (await activeInvoiceOf(ownerId, current.id)) {
    throw new OfficeError(
      409,
      "conflict",
      "This estimate has an invoice. Void or delete the invoice first to reopen the estimate.",
    );
  }
  const updated = await store().updateEstimate(
    ownerId,
    id,
    {
      status: current.sentAt ? "sent" : "draft",
      respondedAt: null,
      approvedByName: null,
      declineReason: null,
    },
    { status: current.status, updatedAt: current.updatedAt, jobId: null },
  );
  if (!updated) {
    if (!(await store().getEstimate(ownerId, id))) return null;
    throw new OfficeError(
      409,
      "conflict",
      "This estimate was changed meanwhile. Refresh and try again.",
    );
  }
  return estimateView(ownerId, updated);
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
    updatedAt: record.updatedAt,
    timeZone: settings.timeZone,
  };
}

/** Orçamento pelo link (rascunho = não existe). Sem conta. */
async function publicEstimateRecord(token: string): Promise<EstimateRecord | null> {
  const record = await store().getEstimateByToken(token);
  return record && record.status !== "draft" ? record : null;
}

/**
 * Dono e id do orçamento do link (para o aviso por e-mail depois da resposta) e o e-mail da
 * empresa (destino reserva). `null` = rascunho ou token desconhecido.
 */
export async function estimateOwnerByToken(
  token: string,
): Promise<{ ownerId: string; estimateId: string; companyEmail: string | null } | null> {
  const record = await publicEstimateRecord(token);
  if (!record) return null;
  const { settings } = await context(record.ownerId);
  return { ownerId: record.ownerId, estimateId: record.id, companyEmail: settings.email || null };
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

const ESTIMATE_CHANGED = "This estimate was changed. Refresh to see the latest version.";
const ESTIMATE_ANSWERED = "This estimate was already answered.";

/**
 * Resposta do cliente pelo link: só com o orçamento enviado e dentro da validade (409 se já
 * respondido ou vencido). Com `updatedAt` (a versão que o cliente viu), o dono não pode ter mudado
 * o orçamento depois (409 "changed": o cliente nunca aprova um preço que não viu). A gravação só
 * acontece se o status ainda for `sent` e a versão ainda for a vista (duas respostas ao mesmo
 * tempo: a segunda recebe 409). Aprovar leva o cliente a "won". `null` = link não existe.
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
  if (status !== "sent") throw new OfficeError(409, "conflict", ESTIMATE_ANSWERED);
  if (input.updatedAt !== undefined && input.updatedAt !== record.updatedAt) {
    throw new OfficeError(409, "conflict", ESTIMATE_CHANGED);
  }

  // Recusa sem motivo grava "" (não `null`): assim a resposta pelo link nunca se confunde com a
  // marcada pelo dono, que deixa os dois campos `null` (ver `answeredByCustomer` e `reopenEstimate`).
  const patch: EstimatePatch =
    input.decision === "approve"
      ? { status: "approved", approvedByName: input.name.trim(), respondedAt: nowIso() }
      : { status: "declined", declineReason: input.reason?.trim() ?? "", respondedAt: nowIso() };
  const updated = await store().updateEstimate(record.ownerId, record.id, patch, {
    status: "sent",
    updatedAt: input.updatedAt,
  });
  if (!updated) {
    // Mudou no meio: ainda enviado = o dono editou; senão alguém já respondeu.
    const fresh = await store().getEstimate(record.ownerId, record.id);
    const changed = fresh?.status === "sent";
    throw new OfficeError(409, "conflict", changed ? ESTIMATE_CHANGED : ESTIMATE_ANSWERED);
  }
  if (input.decision === "approve") {
    await advanceClientStage(updated.ownerId, updated.clientId, "any", "won");
  }
  return publicEstimateView(updated);
}

/**
 * Fatura pelo link (rascunho = não existe). Anulada continua visível com status `void` (a página
 * mostra o aviso de cancelada, em vez de "não encontrada"). Sem conta.
 */
export async function getPublicInvoice(token: string): Promise<PublicInvoice | null> {
  const record = await store().getInvoiceByToken(token);
  if (!record || record.status === "draft") return null;
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
    timeZone: settings.timeZone,
  };
}
