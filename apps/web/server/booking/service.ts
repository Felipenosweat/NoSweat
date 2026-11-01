import {
  DEFAULT_BOOKING_SETTINGS,
  isCalendarDate,
  type AvailabilityQuery,
  type AvailabilityResponse,
  type BookableService,
  type BookingSettings,
  type CreateBookingRequest,
  type PublicBooking,
  type PublicBookingInfo,
  type UpdateBookingSettingsRequest,
} from "@nosweat/schema";
import { ownerHasLiveAccess } from "../billing";
import { getClientStore } from "../clients/store";
import { updateClient } from "../clients/service";
import { normalizeEmail, normalizePhone, type ClientRecord } from "../clients/types";
import type { BookingEmailInput } from "../notify/booking-email";
import { createJob, getSettings as getOfficeSettings, updateJob } from "../office/service";
import { getOfficeStore } from "../office/store";
import { newPublicToken } from "../office/tokens";
import { OfficeError, type PriceItemRecord, type TeamMemberRecord } from "../office/types";
import { getSiteStore } from "../store";
import {
  bookingBusy,
  computeAvailability,
  findOfferedSlot,
  jobBusy,
  type AvailabilityInput,
  type BusyInterval,
} from "./availability";
import { getBookingStore } from "./store";
import { addDaysTo, dateKeyOf, isKnownTimeZone, isoInZone, minutesOf, startOfDayMs } from "./time";
import type { BookingRecord } from "./types";

// Regras do agendamento online (as rotas /api/public/booking/* e /api/office/booking-settings só
// chamam isto). O motor de horários é puro (availability.ts); aqui se junta o que vem do banco:
// configurações, serviços agendáveis, equipe, serviços da agenda e marcações.
// Erros de regra saem como `OfficeError` (as rotas viram `{ error: { code, message } }`).

const DEFAULT_TIME_ZONE = "America/New_York";
const SLOT_TAKEN = "That time was just taken. Please pick another one.";

// ---------- configurações do dono ----------

/** As regras do dono; sem nada gravado, os padrões (desligado). */
export async function getBookingSettings(ownerId: string): Promise<BookingSettings> {
  return (await getBookingStore().getSettings(ownerId)) ?? structuredClone(DEFAULT_BOOKING_SETTINGS);
}

/** Intervalos de um dia em ordem, sem se tocar. */
function cleanRanges(
  ranges: BookingSettings["weekly"][number],
  day: number,
): BookingSettings["weekly"][number] {
  const sorted = [...ranges].sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    if (previous && current && minutesOf(current.start) < minutesOf(previous.end)) {
      throw new OfficeError(
        400,
        "invalid_request",
        `The hours for day ${day + 1} of the week overlap. Please fix them.`,
      );
    }
  }
  return sorted;
}

/**
 * Muda só os campos enviados. Horários do mesmo dia não podem se sobrepor (ficam em ordem) e os
 * dias fechados precisam existir no calendário (sem repetir, em ordem).
 */
export async function updateBookingSettings(
  ownerId: string,
  patch: UpdateBookingSettingsRequest,
): Promise<BookingSettings> {
  const current = await getBookingSettings(ownerId);
  const next: BookingSettings = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) Object.assign(next, { [key]: value });
  }
  if (next.closedDates.some((date) => !isCalendarDate(date))) {
    throw new OfficeError(400, "invalid_request", "One of the closed dates doesn't exist.");
  }
  next.closedDates = [...new Set(next.closedDates)].sort();
  next.weekly = next.weekly.map((ranges, day) => cleanRanges(ranges, day));
  next.note = next.note.trim();
  return getBookingStore().saveSettings(ownerId, next);
}

// ---------- o que o site público enxerga ----------

type Business = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  timeZone: string;
};

type PublicContext = {
  siteId: string;
  ownerId: string;
  settings: BookingSettings;
  business: Business;
  /** Agendáveis: ativos, marcados como agendáveis e com duração. */
  services: { item: PriceItemRecord; view: BookableService }[];
  /** Equipe ativa. Vazia = agenda única. */
  team: TeamMemberRecord[];
};

function toBookable(item: PriceItemRecord): BookableService | null {
  if (!item.active || !item.bookable || !item.durationMinutes) return null;
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    durationMinutes: item.durationMinutes,
    priceCents: item.unitPriceCents > 0 ? item.unitPriceCents : null,
  };
}

/** Dados da empresa: o que o dono preencheu no escritório, completado pelo que está no site. */
async function businessFor(
  ownerId: string,
  site: { name: string; phone?: string; email?: string; address: string | null },
): Promise<Business> {
  const office = await getOfficeSettings(ownerId);
  return {
    name: office.companyName.trim() || site.name,
    phone: office.phone?.trim() || site.phone?.trim() || null,
    email: office.email?.trim() || site.email?.trim() || null,
    address: office.address?.trim() || site.address,
    timeZone: isKnownTimeZone(office.timeZone) ? office.timeZone : DEFAULT_TIME_ZONE,
  };
}

function siteAddress(business: {
  address?: string;
  city?: string;
  state?: string;
}): string | null {
  const cityState = [business.city, business.state].filter(Boolean).join(", ");
  return [business.address, cityState].filter(Boolean).join(", ") || null;
}

/**
 * Tudo que o site público precisa, ou `null` (as rotas respondem 404): site no ar, de uma conta
 * com acesso valendo, com o agendamento ligado e ao menos um serviço agendável.
 */
async function publicContext(siteId: string): Promise<PublicContext | null> {
  const site = await getSiteStore().getPublished(siteId);
  if (!site?.ownerId) return null;
  const ownerId = site.ownerId;
  if (!(await ownerHasLiveAccess(ownerId))) return null;
  const settings = await getBookingSettings(ownerId);
  if (!settings.enabled) return null;

  const store = getOfficeStore();
  const [items, team, business] = await Promise.all([
    store.listPriceItems(ownerId),
    store.listTeam(ownerId),
    businessFor(ownerId, {
      name: site.liveSpec.business.name,
      phone: site.liveSpec.business.phone,
      email: site.liveSpec.business.email,
      address: siteAddress(site.liveSpec.business),
    }),
  ]);
  const services = items.flatMap((item) => {
    const view = toBookable(item);
    return view ? [{ item, view }] : [];
  });
  if (services.length === 0) return null;
  return {
    siteId: site.id,
    ownerId,
    settings,
    business,
    services,
    team: team.filter((member) => member.active),
  };
}

function serviceOf(ctx: PublicContext, serviceId: string) {
  const found = ctx.services.find((entry) => entry.view.id === serviceId);
  if (!found) throw new OfficeError(404, "not_found", "Service not found.");
  return found;
}

/** `GET /api/public/booking/[siteId]`: `null` = 404. */
export async function getPublicBookingInfo(siteId: string): Promise<PublicBookingInfo | null> {
  const ctx = await publicContext(siteId);
  if (!ctx) return null;
  return {
    businessName: ctx.business.name,
    businessPhone: ctx.business.phone,
    timeZone: ctx.business.timeZone,
    services: ctx.services.map((entry) => entry.view),
    staff: ctx.team.map((member) => ({ id: member.id, name: member.name })),
    maxDaysAhead: ctx.settings.maxDaysAhead,
    note: ctx.settings.note,
  };
}

/**
 * Entrada do motor: regras + o que está ocupado. Lê serviços (jobs) e marcações de ontem até o
 * fim da janela de `maxDaysAhead` (cobre também a busca da próxima vaga).
 */
async function availabilityInput(
  ctx: PublicContext,
  durationMinutes: number,
  staffId: string | null | undefined,
  now: Date,
): Promise<AvailabilityInput> {
  const { timeZone } = ctx.business;
  const today = dateKeyOf(now.getTime(), timeZone);
  const fromIso = new Date(startOfDayMs(addDaysTo(today, -1), timeZone)).toISOString();
  const toIso = new Date(
    startOfDayMs(addDaysTo(today, ctx.settings.maxDaysAhead + 2), timeZone),
  ).toISOString();
  const [jobs, bookings] = await Promise.all([
    getOfficeStore().listJobs(ctx.ownerId, { startsFrom: fromIso, startsBefore: toIso }),
    getBookingStore().listActive(ctx.ownerId, fromIso, toIso),
  ]);
  const busy: BusyInterval[] = [
    ...jobs.flatMap((job) => {
      const interval = jobBusy(job);
      return interval ? [interval] : [];
    }),
    ...bookings.map(bookingBusy),
  ];
  return {
    settings: ctx.settings,
    timeZone,
    durationMinutes,
    staff: ctx.team.map((member) => ({ id: member.id })),
    staffId,
    busy,
    now,
  };
}

/** Pessoa pedida que não está na equipe ativa: 400 (sem equipe, o pedido é ignorado). */
function checkStaff(ctx: PublicContext, staffId: string | null | undefined): void {
  if (!staffId || ctx.team.length === 0) return;
  if (!ctx.team.some((member) => member.id === staffId)) {
    throw new OfficeError(400, "invalid_request", "That person is not available for booking.");
  }
}

/** `GET /api/public/booking/[siteId]/availability`: `null` = 404 (site sem agendamento). */
export async function getPublicAvailability(
  siteId: string,
  query: AvailabilityQuery,
  now: Date = new Date(),
): Promise<AvailabilityResponse | null> {
  const ctx = await publicContext(siteId);
  if (!ctx) return null;
  if (!isCalendarDate(query.from)) {
    throw new OfficeError(400, "invalid_request", "That date doesn't exist.");
  }
  const { view } = serviceOf(ctx, query.serviceId);
  checkStaff(ctx, query.staffId);
  const input = await availabilityInput(ctx, view.durationMinutes, query.staffId, now);
  return computeAvailability(input, query.from, query.days);
}

// ---------- marcar ----------

/** O que o e-mail precisa (a rota completa com a origem do app). */
export type BookingNotice = Omit<BookingEmailInput, "appOrigin">;

export type CreatedBooking = { booking: PublicBooking; notice: BookingNotice };

/** Cliente do dono com o mesmo e-mail ou telefone; senão cria um (etapa "contacted"). */
async function findOrCreateClient(
  ctx: PublicContext,
  input: { name: string; phone: string; email: string | null },
): Promise<ClientRecord> {
  const store = getClientStore();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const clients = await store.listClients(ctx.ownerId);
  const match = clients.find(
    (c) =>
      (email !== null && normalizeEmail(c.email) === email) ||
      (phone !== null && normalizePhone(c.phone) === phone),
  );
  if (!match) {
    return store.insertClient({
      ownerId: ctx.ownerId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: null,
      stage: "contacted",
      source: "website",
      siteId: ctx.siteId,
      notes: "",
      followUpOn: null,
    });
  }
  // Cliente que já existia: ganha o contato que faltava e sai de "new" (agora já houve contato).
  const patched =
    (!match.email && input.email) || (!match.phone && input.phone)
      ? await store.updateClient(ctx.ownerId, match.id, {
          ...(!match.email && input.email ? { email: input.email } : {}),
          ...(!match.phone && input.phone ? { phone: input.phone } : {}),
        })
      : null;
  const current = patched ?? match;
  if (current.stage === "new") {
    await updateClient(ctx.ownerId, current.id, { stage: "contacted" });
  }
  return current;
}

function toPublicBooking(
  record: BookingRecord,
  business: Business,
  staffName: string | null,
  now: Date,
): PublicBooking {
  const startMs = Date.parse(record.startAt);
  return {
    token: record.token,
    status: record.status,
    serviceName: record.serviceName,
    startAt: isoInZone(startMs, business.timeZone),
    endAt: isoInZone(Date.parse(record.endAt), business.timeZone),
    staffName,
    customerName: record.customerName,
    businessName: business.name,
    businessPhone: business.phone,
    businessAddress: business.address,
    timeZone: business.timeZone,
    canCancel: record.status === "confirmed" && startMs > now.getTime(),
  };
}

/**
 * `POST /api/public/booking/[siteId]/book`. `null` = 404 (site sem agendamento). Refaz a
 * disponibilidade (o horário precisa ser um dos oferecidos agora) e grava de forma atômica
 * (`bookSlot`): 409 `slot_taken` se alguém marcou antes. Depois cria o cliente (ou reaproveita) e o
 * serviço (job "scheduled") na agenda do dono e liga os dois. Se o job falhar, a marcação é desfeita.
 */
export async function createBooking(
  siteId: string,
  input: CreateBookingRequest,
  now: Date = new Date(),
): Promise<CreatedBooking | null> {
  const ctx = await publicContext(siteId);
  if (!ctx) return null;
  const { item, view } = serviceOf(ctx, input.serviceId);
  checkStaff(ctx, input.staffId);

  const startMs = Date.parse(input.startAt);
  const availability = await availabilityInput(ctx, view.durationMinutes, input.staffId, now);
  const slot = findOfferedSlot(availability, startMs);
  if (!slot) throw new OfficeError(409, "slot_taken", SLOT_TAKEN);

  const customer = {
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() ? input.email.trim() : null,
    notes: input.notes?.trim() ?? "",
  };
  const client = await findOrCreateClient(ctx, customer);

  const result = await getBookingStore().bookSlot(
    {
      ownerId: ctx.ownerId,
      siteId: ctx.siteId,
      token: newPublicToken(),
      clientId: client.id,
      serviceId: view.id,
      serviceName: view.name,
      staffId: slot.staffId,
      startAt: new Date(startMs).toISOString(),
      endAt: new Date(Date.parse(slot.endAt)).toISOString(),
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      notes: customer.notes,
    },
    { bufferMinutes: ctx.settings.bufferMinutes },
  );
  if (!result.ok) throw new OfficeError(409, "slot_taken", SLOT_TAKEN);

  let record = result.booking;
  try {
    const job = await createJob(ctx.ownerId, {
      clientId: client.id,
      title: `${view.name}: ${customer.name}`,
      startAt: record.startAt,
      endAt: record.endAt,
      assigneeIds: slot.staffId ? [slot.staffId] : [],
      valueCents: item.unitPriceCents > 0 ? item.unitPriceCents : null,
      notes: customer.notes ? `Booked online\n${customer.notes}` : "Booked online",
    });
    record = (await getBookingStore().attachJob(ctx.ownerId, record.id, job.id)) ?? record;
  } catch (error) {
    // Sem o serviço na agenda a marcação ficaria invisível para o dono: desfaz e avisa o cliente.
    await getBookingStore()
      .cancel(ctx.ownerId, record.id)
      .catch(() => null);
    throw error;
  }

  const staffName = ctx.team.find((member) => member.id === record.staffId)?.name ?? null;
  return {
    booking: toPublicBooking(record, ctx.business, staffName, now),
    notice: {
      ownerId: ctx.ownerId,
      businessName: ctx.business.name,
      businessPhone: ctx.business.phone,
      businessEmail: ctx.business.email,
      serviceName: record.serviceName,
      staffName,
      startAt: record.startAt,
      timeZone: ctx.business.timeZone,
      customer,
      token: record.token,
    },
  };
}

// ---------- link do cliente (sem login) ----------

/** Marcação vista pelo link. Funciona mesmo se o site saiu do ar: o cliente ainda vê a dele. */
async function viewOf(record: BookingRecord, now: Date): Promise<PublicBooking> {
  const [site, team] = await Promise.all([
    getSiteStore().get(record.siteId),
    getOfficeStore().listTeam(record.ownerId),
  ]);
  const spec = site?.publishedSpec ?? site?.spec;
  const business = await businessFor(record.ownerId, {
    name: spec?.business.name ?? "",
    phone: spec?.business.phone,
    email: spec?.business.email,
    address: spec ? siteAddress(spec.business) : null,
  });
  const staffName = team.find((member) => member.id === record.staffId)?.name ?? null;
  return toPublicBooking(record, business, staffName, now);
}

/** `GET /api/public/booking/token/[token]`: `null` = 404. */
export async function getBookingByToken(
  token: string,
  now: Date = new Date(),
): Promise<PublicBooking | null> {
  const record = await getBookingStore().getByToken(token);
  return record ? viewOf(record, now) : null;
}

/**
 * `POST /api/public/booking/token/[token]/cancel`. `null` = 404. Cancelar de novo devolve a marcação
 * como está (sem erro). Só no futuro: depois do início, 409. O serviço ligado também é cancelado,
 * então o horário reabre para outros clientes.
 */
export async function cancelBookingByToken(
  token: string,
  now: Date = new Date(),
): Promise<PublicBooking | null> {
  const store = getBookingStore();
  const record = await store.getByToken(token);
  if (!record) return null;
  if (record.status === "canceled") return viewOf(record, now);
  if (Date.parse(record.startAt) <= now.getTime()) {
    throw new OfficeError(
      409,
      "conflict",
      "This appointment has already started, so it can't be canceled online. Please call us.",
    );
  }
  // `null` = outro pedido cancelou ao mesmo tempo: relê e mostra como está.
  const canceled = await store.cancel(record.ownerId, record.id);
  if (canceled?.jobId) {
    try {
      await updateJob(record.ownerId, canceled.jobId, { status: "canceled" });
    } catch (error) {
      // A marcação já está cancelada (e o horário livre para o site); o dono ainda vê o serviço.
      console.error("[booking] could not cancel the job of a canceled booking", error);
    }
  }
  return viewOf(canceled ?? (await store.getByToken(token)) ?? record, now);
}
