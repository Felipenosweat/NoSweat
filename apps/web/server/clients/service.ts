import type {
  Client,
  ClientActivity,
  ClientStage,
  CreateClientActivityRequest,
  CreateClientRequest,
  UpdateClientRequest,
} from "@nosweat/schema";
import { CLIENTS_TIME_ZONE } from "@/lib/clients";
import { isValidTimeZone } from "../social/service";
import { getSocialStore } from "../social/store";
import { getSiteStore, type LeadRecord } from "../store";
import { byLastActivityDesc, getClientStore, type ClientStore } from "./store";
import {
  normalizeEmail,
  normalizePhone,
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

function matchesQuery(client: ClientRecord, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const text = [client.name, client.email ?? "", client.phone ?? ""].join(" ").toLowerCase();
  if (text.includes(needle)) return true;
  // "(512) 555" acha "512-555-0100": compara também só os dígitos.
  const digits = needle.replace(/\D/g, "");
  return digits.length >= 3 && (client.phone ?? "").replace(/\D/g, "").includes(digits);
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
    followUpOn: null,
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

/**
 * Nota ou serviço no histórico. O valor só vale para `job`; os totais de serviços são recalculados
 * a partir do histórico (sem somar em cima do valor antigo). `null` se o cliente não for do dono.
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
  if (activity.kind === "job") {
    const jobs = (await store.listActivities(ownerId, client.id)).filter((a) => a.kind === "job");
    patch.jobsCount = jobs.length;
    patch.totalJobsCents = jobs.reduce((sum, job) => sum + (job.amountCents ?? 0), 0);
  }
  const updated = await store.updateClient(ownerId, client.id, patch);
  if (!updated) return null;
  return { activity: toPublicActivity(activity), client: toPublicClient(updated) };
}

/** Apaga o cliente e o histórico. Os pedidos do site dele não voltam no próximo sync. */
export async function deleteClient(ownerId: string, id: string): Promise<boolean> {
  return getClientStore().deleteClient(ownerId, id);
}
