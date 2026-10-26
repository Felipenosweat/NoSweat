import type {
  Client,
  ClientActivity,
  ClientStage,
  CreateClientActivityRequest,
  CreateClientRequest,
  UpdateClientRequest,
} from "@nosweat/schema";
import { CLIENTS_TIME_ZONE, dateKeyIn } from "@/lib/clients";
import { getOfficeStore } from "../office/store";
import { OfficeError } from "../office/types";
import { isValidTimeZone } from "../social/service";
import { getSocialStore } from "../social/store";
import { getSiteStore, type LeadRecord } from "../store";
import { byLastActivityDesc, getClientStore, type ClientStore } from "./store";
import {
  normalizeEmail,
  normalizePhone,
  normalizeTags,
  type ClientActivityRecord,
  type ClientPatch,
  type ClientRecord,
} from "./types";

// Regras do módulo de clientes (as rotas /api/clients/* e as páginas só chamam isto).
// Todo pedido do formulário do site vira um cliente sozinho (sync abaixo); o dono também cadastra
// à mão, anota, registra serviços e muda a etapa.

export function toPublicClient(record: ClientRecord): Client {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    address: record.address,
    stage: record.stage,
    source: record.source,
    siteId: record.siteId,
    notes: record.notes,
    followUpOn: record.followUpOn,
    lastActivityAt: record.lastActivityAt,
    totalJobsCents: record.totalJobsCents,
    jobsCount: record.jobsCount,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    tags: record.tags ?? [],
  };
}

export function toPublicActivity(record: ClientActivityRecord): ClientActivity {
  return {
    id: record.id,
    clientId: record.clientId,
    kind: record.kind,
    body: record.body,
    amountCents: record.amountCents,
    leadId: record.leadId,
    siteId: record.siteId,
    occurredAt: record.occurredAt,
    createdAt: record.createdAt,
  };
}

/** A mais recente de duas datas ISO (comparadas como instantes). */
function laterOf(a: string, b: string): string {
  return Date.parse(b) > Date.parse(a) ? b : a;
}

/** Texto opcional do formulário: vazio vira `null`; `undefined` continua `undefined` (não mexe). */
function blankToNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

/**
 * Fuso da empresa para "hoje" dos retornos: o mesmo das configurações de posts (a conta ainda não
 * tem um fuso próprio). Sem configuração, fuso inválido ou erro: Nova York, como antes.
 */
export async function clientsTimeZone(ownerId: string): Promise<string> {
  try {
    const { timezone } = await getSocialStore().getSettings(ownerId);
    return timezone && isValidTimeZone(timezone) ? timezone : CLIENTS_TIME_ZONE;
  } catch {
    return CLIENTS_TIME_ZONE;
  }
}

// ---------- sync dos pedidos do site ----------

/** Cliente do dono com o mesmo e-mail ou telefone (normalizados) do pedido. */
function findMatch(clients: ClientRecord[], lead: LeadRecord): ClientRecord | undefined {
  const email = normalizeEmail(lead.email);
  const phone = normalizePhone(lead.phone);
  if (!email && !phone) return undefined;
  return clients.find(
    (c) =>
      (email !== null && normalizeEmail(c.email) === email) ||
      (phone !== null && normalizePhone(c.phone) === phone),
  );
}

async function importLead(
  store: ClientStore,
  ownerId: string,
  lead: LeadRecord,
  clients: ClientRecord[],
): Promise<void> {
  const email = blankToNull(lead.email) ?? null;
  const phone = blankToNull(lead.phone) ?? null;
  let client = findMatch(clients, lead);
  let created = false;
  if (!client) {
    client = await store.insertClient({
      ownerId,
      name: lead.name.trim() || email || phone || "Website visitor",
      email,
      phone,
      address: null,
      stage: "new",
      source: "website",
      siteId: lead.siteId,
      notes: "",
      followUpOn: null,
      lastActivityAt: lead.createdAt,
    });
    created = true;
    clients.push(client);
  }

  const activity = await store.insertActivity({
    ownerId,
    clientId: client.id,
    kind: "lead",
    body: lead.message,
    amountCents: null,
    leadId: lead.id,
    siteId: lead.siteId,
    occurredAt: lead.createdAt,
  });

  if (!activity) {
    // Outro sync (ao mesmo tempo) importou este pedido primeiro. O cliente que acabamos de criar
    // está vazio: sai, para não sobrar um cliente duplicado.
    if (created) {
      await store.deleteClient(ownerId, client.id);
      clients.splice(clients.indexOf(client), 1);
    }
    return;
  }
  if (created) return;

  // Cliente que já existia: o último contato avança e ganha o e-mail/telefone que faltava.
  const patch: ClientPatch = {};
  const lastActivityAt = laterOf(client.lastActivityAt, lead.createdAt);
  if (lastActivityAt !== client.lastActivityAt) patch.lastActivityAt = lastActivityAt;
  if (!client.email && email) patch.email = email;
  if (!client.phone && phone) patch.phone = phone;
  if (Object.keys(patch).length === 0) return;
  const updated = await store.updateClient(ownerId, client.id, patch);
  if (updated) clients[clients.indexOf(client)] = updated;
}

/**
 * Traz para os clientes os pedidos do formulário de todos os sites do dono que ainda não entraram.
 * Junta pelo e-mail (sem diferença de maiúsculas) ou pelo telefone (só dígitos). Pode rodar
 * quantas vezes for: pedido já importado (ou de cliente apagado) não entra de novo.
 * `ownerEmail` (e-mail da conta): pedido com esse e-mail é o teste do próprio dono ("Send a test
 * request" do checklist). Não vira cliente e vai para a lápide, para não voltar.
 */
export async function syncLeadsToClients(
  ownerId: string,
  ownerEmail?: string | null,
): Promise<void> {
  const siteStore = getSiteStore();
  const sites = await siteStore.list(ownerId);
  if (sites.length === 0) return;

  const store = getClientStore();
  const [handled, leadLists] = await Promise.all([
    store.handledLeadIds(ownerId),
    Promise.all(sites.map((site) => siteStore.listLeads(site.id))),
  ]);
  const pending = leadLists
    .flat()
    .filter((lead) => !handled.has(lead.id))
    // Do mais antigo para o mais novo: o primeiro pedido define o nome e o site do cliente.
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  if (pending.length === 0) return;

  const ownEmail = normalizeEmail(ownerEmail);
  const clients = await store.listClients(ownerId);
  for (const lead of pending) {
    if (ownEmail !== null && normalizeEmail(lead.email) === ownEmail) {
      await store.dismissLead(ownerId, lead.id);
      continue;
    }
    await importLead(store, ownerId, lead, clients);
  }
}

// ---------- leitura ----------

type Searchable = Pick<Client, "name" | "email" | "phone" | "address"> & { tags?: string[] };

function matchesQuery(client: Searchable, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const text = [
    client.name,
    client.email ?? "",
    client.phone ?? "",
    client.address ?? "",
    ...(client.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
  if (text.includes(needle)) return true;
  // "(512) 555" acha "512-555-0100": compara também só os dígitos.
  const digits = needle.replace(/\D/g, "");
  return digits.length >= 3 && (client.phone ?? "").replace(/\D/g, "").includes(digits);
}

/** Busca por nome, e-mail, telefone (também só os dígitos), endereço ou etiqueta. */
export function searchClients<T extends Searchable>(clients: readonly T[], q: string): T[] {
  return clients.filter((client) => matchesQuery(client, q));
}

/**
 * Clientes do dono (pedidos novos do site entram antes), último contato primeiro. `ownerEmail`:
 * e-mail da conta, para o teste do próprio dono não virar cliente (ver `syncLeadsToClients`).
 */
export async function listClients(
  ownerId: string,
  opts: { stage?: ClientStage; q?: string; ownerEmail?: string | null } = {},
): Promise<Client[]> {
  await syncLeadsToClients(ownerId, opts.ownerEmail);
  const clients = await getClientStore().listClients(ownerId);
  return clients
    .filter((c) => !opts.stage || c.stage === opts.stage)
    .filter((c) => !opts.q || matchesQuery(c, opts.q))
    .sort(byLastActivityDesc)
    .map(toPublicClient);
}

/** Cliente com o histórico (mais novo primeiro). `null` se não existir ou for de outro dono. */
export async function getClientDetail(
  ownerId: string,
  id: string,
): Promise<{ client: Client; activities: ClientActivity[] } | null> {
  const store = getClientStore();
  const client = await store.getClient(ownerId, id);
  if (!client) return null;
  const activities = await store.listActivities(ownerId, client.id);
  return { client: toPublicClient(client), activities: activities.map(toPublicActivity) };
}

/**
 * Resumo para o painel: quantos clientes estão em "new" e os retornos vencidos (até `today`,
 * "AAAA-MM-DD"), dos mais atrasados para os mais recentes, no máximo 5. Ganhos e perdidos não
 * entram.
 */
export async function clientsNeedingAttention(
  ownerId: string,
  today: string,
  ownerEmail?: string | null,
): Promise<{ newCount: number; followUpsDue: Client[] }> {
  await syncLeadsToClients(ownerId, ownerEmail);
  const clients = await getClientStore().listClients(ownerId);
  const newCount = clients.filter((c) => c.stage === "new").length;
  const followUpsDue = clients
    .filter(
      (c): c is ClientRecord & { followUpOn: string } =>
        c.followUpOn !== null && c.followUpOn <= today && c.stage !== "won" && c.stage !== "lost",
    )
    .sort((a, b) => a.followUpOn.localeCompare(b.followUpOn) || byLastActivityDesc(a, b))
    .slice(0, 5)
    .map(toPublicClient);
  return { newCount, followUpsDue };
}

// ---------- resumo do mês ----------

export type ClientsSummary = {
  /** Clientes em "new" (ninguém respondeu ainda). */
  newCount: number;
  /** Retornos marcados para hoje / já vencidos (ganhos e perdidos não contam). */
  followUpsToday: number;
  followUpsOverdue: number;
  /** Clientes que viraram "won" neste mês (e continuam "won"). */
  wonThisMonth: number;
  /**
   * Soma dos serviços e pagamentos registrados neste mês, em centavos (só o que o dono informou).
   */
  revenueThisMonthCents: number;
  /** Serviços (`job`) do mês; pagamentos não contam aqui. */
  jobsThisMonth: number;
  /** "AAAA-MM" do mês do resumo. */
  month: string;
};

/** Retorno em aberto (cliente que ainda está no funil). */
function isOpen(client: Pick<Client, "stage">): boolean {
  return client.stage !== "won" && client.stage !== "lost";
}

/**
 * Conta o resumo a partir dos clientes e do histórico (puro, para testar sem banco). `today` é
 * "AAAA-MM-DD" no fuso da empresa; o mês do histórico também é contado nesse fuso.
 */
export function summarizeClients(input: {
  clients: readonly Client[];
  activities: readonly Pick<
    ClientActivity,
    "clientId" | "kind" | "body" | "amountCents" | "occurredAt"
  >[];
  today: string;
  timeZone: string;
}): ClientsSummary {
  const { clients, activities, today, timeZone } = input;
  const month = today.slice(0, 7);
  const inMonth = (iso: string) => dateKeyIn(timeZone, new Date(iso)).slice(0, 7) === month;

  let newCount = 0;
  let followUpsToday = 0;
  let followUpsOverdue = 0;
  const wonNow = new Set<string>();
  for (const client of clients) {
    if (client.stage === "new") newCount += 1;
    if (client.stage === "won") wonNow.add(client.id);
    if (client.followUpOn && isOpen(client)) {
      if (client.followUpOn === today) followUpsToday += 1;
      else if (client.followUpOn < today) followUpsOverdue += 1;
    }
  }

  const won = new Set<string>();
  let revenueThisMonthCents = 0;
  let jobsThisMonth = 0;
  for (const activity of activities) {
    if (!inMonth(activity.occurredAt)) continue;
    if (activity.kind === "job") {
      jobsThisMonth += 1;
      revenueThisMonthCents += activity.amountCents ?? 0;
    } else if (activity.kind === "payment") {
      revenueThisMonthCents += activity.amountCents ?? 0;
    } else if (activity.kind === "stage" && activity.body.trim() === "won") {
      if (wonNow.has(activity.clientId)) won.add(activity.clientId);
    }
  }
  // Cadastrado à mão já como "won" neste mês: não tem item de etapa no histórico.
  for (const client of clients) {
    if (client.stage === "won" && client.source === "manual" && inMonth(client.createdAt)) {
      won.add(client.id);
    }
  }

  return {
    newCount,
    followUpsToday,
    followUpsOverdue,
    wonThisMonth: won.size,
    revenueThisMonthCents,
    jobsThisMonth,
    month,
  };
}

/**
 * Resumo do topo da página de clientes. Lê o histórico do mês (serviços, pagamentos e mudanças de
 * etapa) de todos os clientes do dono; `clients` é a lista já sincronizada (de `listClients`).
 */
export async function getClientsSummary(
  ownerId: string,
  clients: readonly Client[],
  today: string,
  timeZone: string,
): Promise<ClientsSummary> {
  const [y = 2000, m = 1] = today.split("-").map(Number);
  // Um dia antes do dia 1 em UTC cobre qualquer fuso; o filtro fino é feito pela data no fuso.
  const since = new Date(Date.UTC(y, m - 1, 0)).toISOString();
  const activities = await getClientStore().listActivitiesSince(ownerId, since, [
    "job",
    "payment",
    "stage",
  ]);
  return summarizeClients({ clients, activities, today, timeZone });
}

// ---------- escrita ----------

/** Cadastro manual. E-mail, telefone ou endereço vazios viram `null`. */
export async function createClient(ownerId: string, input: CreateClientRequest): Promise<Client> {
  const client = await getClientStore().insertClient({
    ownerId,
    name: input.name.trim(),
    email: blankToNull(input.email) ?? null,
    phone: blankToNull(input.phone) ?? null,
    address: blankToNull(input.address) ?? null,
    stage: input.stage ?? "new",
    source: "manual",
    siteId: null,
    notes: input.notes ?? "",
    followUpOn: input.followUpOn ?? null,
    tags: normalizeTags(input.tags),
  });
  return toPublicClient(client);
}

/**
 * Altera os dados do cliente. Mudança de etapa vira um item `stage` no histórico (e conta como
 * último contato). `null` se o cliente não existir ou for de outro dono.
 */
export async function updateClient(
  ownerId: string,
  id: string,
  input: UpdateClientRequest,
): Promise<Client | null> {
  const store = getClientStore();
  const current = await store.getClient(ownerId, id);
  if (!current) return null;

  const patch: ClientPatch = {
    name: input.name?.trim(),
    email: blankToNull(input.email),
    phone: blankToNull(input.phone),
    address: blankToNull(input.address),
    notes: input.notes,
    followUpOn: input.followUpOn,
    tags: input.tags === undefined ? undefined : normalizeTags(input.tags),
  };
  if (input.stage !== undefined && input.stage !== current.stage) {
    patch.stage = input.stage;
    const activity = await store.insertActivity({
      ownerId,
      clientId: current.id,
      kind: "stage",
      body: input.stage,
      amountCents: null,
      leadId: null,
      siteId: null,
    });
    if (activity) patch.lastActivityAt = laterOf(current.lastActivityAt, activity.occurredAt);
  }

  const updated = await store.updateClient(ownerId, current.id, patch);
  return updated ? toPublicClient(updated) : null;
}

/** Itens que somam no total do cliente (`totalJobsCents`). */
const COUNTS_AS_REVENUE = new Set<ClientActivity["kind"]>(["job", "payment"]);

/**
 * Totais do cliente a partir do histórico (sem somar em cima do valor antigo): `jobsCount` conta só
 * os serviços (`job`); `totalJobsCents` soma serviços e pagamentos do escritório (`payment`).
 */
export function clientTotals(activities: readonly Pick<ClientActivity, "kind" | "amountCents">[]): {
  jobsCount: number;
  totalJobsCents: number;
} {
  let jobsCount = 0;
  let totalJobsCents = 0;
  for (const activity of activities) {
    if (activity.kind === "job") jobsCount += 1;
    if (COUNTS_AS_REVENUE.has(activity.kind)) totalJobsCents += activity.amountCents ?? 0;
  }
  return { jobsCount, totalJobsCents };
}

/** Recalcula e grava os totais do cliente (depois de entrar ou sair um serviço/pagamento). */
async function refreshClientTotals(
  store: ClientStore,
  ownerId: string,
  clientId: string,
  extra: ClientPatch = {},
): Promise<ClientRecord | null> {
  const totals = clientTotals(await store.listActivities(ownerId, clientId));
  return store.updateClient(ownerId, clientId, { ...extra, ...totals });
}

/**
 * Nota ou serviço no histórico. O valor só vale para `job`; os totais são recalculados a partir do
 * histórico (`clientTotals`). `null` se o cliente não for do dono.
 */
export async function addClientActivity(
  ownerId: string,
  clientId: string,
  input: CreateClientActivityRequest,
): Promise<{ activity: ClientActivity; client: Client } | null> {
  const store = getClientStore();
  const client = await store.getClient(ownerId, clientId);
  if (!client) return null;

  const activity = await store.insertActivity({
    ownerId,
    clientId: client.id,
    kind: input.kind,
    body: input.body.trim(),
    amountCents: input.kind === "job" ? (input.amountCents ?? null) : null,
    leadId: null,
    siteId: null,
    occurredAt: input.occurredAt ? new Date(input.occurredAt).toISOString() : undefined,
  });
  if (!activity) throw new Error("The activity was not saved.");

  const patch: ClientPatch = {
    lastActivityAt: laterOf(client.lastActivityAt, activity.occurredAt),
  };
  const updated =
    activity.kind === "job"
      ? await refreshClientTotals(store, ownerId, client.id, patch)
      : await store.updateClient(ownerId, client.id, patch);
  if (!updated) return null;
  return { activity: toPublicActivity(activity), client: toPublicClient(updated) };
}

/**
 * Pagamento do escritório no histórico do cliente (item `payment`, com o id do pagamento). Soma no
 * total do cliente, mas não conta como serviço. `null` se o cliente não for do dono.
 */
export async function addClientPayment(
  ownerId: string,
  clientId: string,
  input: { paymentId: string; amountCents: number; body: string },
): Promise<ClientActivity | null> {
  const store = getClientStore();
  const client = await store.getClient(ownerId, clientId);
  if (!client) return null;
  const activity = await store.insertActivity({
    ownerId,
    clientId: client.id,
    kind: "payment",
    body: input.body.trim(),
    amountCents: input.amountCents,
    leadId: null,
    siteId: null,
    paymentId: input.paymentId,
  });
  if (!activity) throw new Error("The payment activity was not saved.");
  await refreshClientTotals(store, ownerId, client.id, {
    lastActivityAt: laterOf(client.lastActivityAt, activity.occurredAt),
  });
  return toPublicActivity(activity);
}

/**
 * Pagamento apagado no escritório: o item dele sai do histórico e os totais são recalculados.
 * `clientId` (o cliente da fatura) é recalculado mesmo sem item encontrado: no Supabase o item já
 * pode ter saído pelo `on delete cascade` de `payment_id`.
 */
export async function removeClientPayment(
  ownerId: string,
  paymentId: string,
  clientId?: string,
): Promise<void> {
  const store = getClientStore();
  const affected = new Set(await store.deletePaymentActivities(ownerId, paymentId));
  if (clientId) affected.add(clientId);
  for (const id of affected) {
    if (await store.getClient(ownerId, id)) await refreshClientTotals(store, ownerId, id);
  }
}

/** Mensagem do 409 ao apagar um cliente com documentos do escritório. */
export const CLIENT_HAS_DOCUMENTS =
  "This client has estimates, jobs or invoices. Delete or void those first.";

/**
 * Apaga o cliente e o histórico. Os pedidos do site dele não voltam no próximo sync. Cliente com
 * orçamento, job ou fatura (não anulada) no escritório: 409 (`OfficeError`), para não apagar
 * documentos de dinheiro junto (o banco também recusa: chave estrangeira sem cascade, migration
 * 0023). Faturas anuladas (nunca têm pagamento) são apagadas antes, como o 409 promete.
 */
export async function deleteClient(ownerId: string, id: string): Promise<boolean> {
  const store = getClientStore();
  const client = await store.getClient(ownerId, id);
  if (!client) return false;
  const office = getOfficeStore();
  if (await office.clientHasDocuments(ownerId, client.id)) {
    throw new OfficeError(409, "conflict", CLIENT_HAS_DOCUMENTS);
  }
  for (const invoice of await office.listInvoices(ownerId, { clientId: client.id })) {
    if (invoice.status === "void") await office.deleteInvoice(ownerId, invoice.id);
  }
  return store.deleteClient(ownerId, client.id);
}
