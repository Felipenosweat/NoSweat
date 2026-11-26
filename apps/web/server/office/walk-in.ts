import type { Job, WalkInRequest } from "@nosweat/schema";
import { getClientStore } from "../clients/store";
import { createJob, listPriceItems } from "./service";
import { OfficeError } from "./types";

// Walk-in: cliente que chegou sem marcar. Vira um serviço (job) normal da agenda, pelo mesmo
// caminho de `createJob`, então o horário some do agendamento online na hora (a disponibilidade
// só desconta serviços não cancelados). Sem nome, usa o cliente genérico "Walk-in".

const GENERIC_NAME = "Walk-in";

/** Cliente do dono com este nome (sem olhar maiúsculas) ou um novo, sem telefone nem e-mail. */
async function clientFor(ownerId: string, name: string): Promise<string> {
  const store = getClientStore();
  const key = name.trim().toLowerCase();
  const found = (await store.listClients(ownerId)).find((c) => c.name.trim().toLowerCase() === key);
  if (found) return found.id;
  const created = await store.insertClient({
    ownerId,
    name: name.trim(),
    email: null,
    phone: null,
    address: null,
    // Já está atendido: não entra na lista de "novos clientes que esperam resposta".
    stage: "contacted",
    source: "manual",
    siteId: null,
    notes: "",
    followUpOn: null,
    tags: [],
  });
  return created.id;
}

export async function createWalkIn(ownerId: string, input: WalkInRequest): Promise<Job> {
  const startMs = Date.parse(input.startAt);
  if (!Number.isFinite(startMs))
    throw new OfficeError(400, "invalid_request", "Pick a start time.");
  const endAt = new Date(startMs + input.durationMinutes * 60_000).toISOString();

  let title = GENERIC_NAME;
  let valueCents: number | null = null;
  if (input.serviceId) {
    const item = (await listPriceItems(ownerId)).find((p) => p.id === input.serviceId);
    if (!item) throw new OfficeError(404, "not_found", "Service not found.");
    title = item.name;
    valueCents = item.unitPriceCents > 0 ? item.unitPriceCents : null;
  }

  const clientId = await clientFor(ownerId, input.name?.trim() || GENERIC_NAME);
  return createJob(ownerId, {
    clientId,
    title,
    description: "Walk-in",
    startAt: new Date(startMs).toISOString(),
    endAt,
    assigneeIds: input.assigneeId ? [input.assigneeId] : [],
    valueCents,
  });
}
