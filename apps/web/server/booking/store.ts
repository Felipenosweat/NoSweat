import { BookingSettings } from "@nosweat/schema";
import { z } from "zod";
import { normalizeSupabaseUrl } from "../store/supabase";
import { getOfficeStore } from "../office/store";
import { appliesTo, bookingBusy, conflicts, jobBusy } from "./availability";
import { BookingRecord, type BookSlotResult, type NewBooking } from "./types";

// Persistência do agendamento (tabelas da migration 0027). Supabase em produção, memória no
// dev/testes (mesma regra de server/office/store.ts). Toda leitura e escrita recebe o dono: só a
// busca pelo `token` (link público do cliente) é feita sem dono.
//
// Marcar sem marcar duas vezes: `bookSlot` é ATÔMICO. No Supabase é a RPC `book_slot`, que trava o
// dono (pg_advisory_xact_lock), confere se o horário bate com marcações e serviços da agenda e só
// então grava. Na memória, a mesma conferência roda dentro de uma fila (mutex).

export type BookingRules = {
  /** Folga depois de cada atendimento (a das configurações do dono). */
  bufferMinutes: number;
};

export interface BookingStore {
  getSettings(ownerId: string): Promise<BookingSettings | null>;
  saveSettings(ownerId: string, settings: BookingSettings): Promise<BookingSettings>;
  /** Marcações confirmadas do dono que tocam [fromIso, toIso). */
  listActive(ownerId: string, fromIso: string, toIso: string): Promise<BookingRecord[]>;
  /** Busca pelo link público (sem dono: o token é o segredo). */
  getByToken(token: string): Promise<BookingRecord | null>;
  /** Grava a marcação se o horário estiver livre (atômico). Ver o comentário no topo. */
  bookSlot(booking: NewBooking, rules: BookingRules): Promise<BookSlotResult>;
  /** Liga a marcação ao serviço (job) criado na agenda. */
  attachJob(ownerId: string, id: string, jobId: string): Promise<BookingRecord | null>;
  /** Confirmada → cancelada. `null` se não existe ou já estava cancelada. */
  cancel(ownerId: string, id: string): Promise<BookingRecord | null>;
  /** O dono cancelou (ou apagou) o serviço: cancela a marcação ligada a ele, se houver. */
  cancelByJobId(ownerId: string, jobId: string): Promise<BookingRecord | null>;
  /** O dono remarcou o serviço: a marcação ligada passa a ter o mesmo horário. */
  updateTimesByJobId(
    ownerId: string,
    jobId: string,
    startAt: string,
    endAt: string,
  ): Promise<BookingRecord | null>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: string) => UUID.test(value);
const nowIso = () => new Date().toISOString();
const clone = <T>(value: T): T => structuredClone(value);

// ---------- Supabase ----------

const SettingsRow = z.object({ ownerId: z.string(), settings: z.unknown() });

/** Resposta da RPC `book_slot`. */
const BookSlotRpc = z.object({ conflict: z.boolean(), booking: z.unknown().optional() });

function toCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** Linha do banco (snake_case) → objeto do código (camelCase), só o primeiro nível. */
function fromRow(row: unknown): unknown {
  if (!row || typeof row !== "object") return row;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    out[toCamel(key)] = value;
  }
  return out;
}

export class SupabaseBookingStore implements BookingStore {
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
      Prefer: prefer ?? "return=representation",
    };
  }

  private async call(path: string, init: RequestInit & { prefer?: string } = {}): Promise<unknown> {
    const { prefer, ...rest } = init;
    const res = await this.fetchImpl(`${this.base}${path}`, {
      ...rest,
      cache: "no-store",
      headers: this.headers(prefer),
    });
    if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  private async bookings(
    path: string,
    init?: RequestInit & { prefer?: string },
  ): Promise<BookingRecord[]> {
    const data = z.array(z.unknown()).parse((await this.call(path, init)) ?? []);
    return data.map((row) => BookingRecord.parse(fromRow(row)));
  }

  private async patchBookings(path: string, values: Record<string, unknown>) {
    const [row] = await this.bookings(path, { method: "PATCH", body: JSON.stringify(values) });
    return row ?? null;
  }

  async getSettings(ownerId: string) {
    if (!isUuid(ownerId)) return null;
    const data = z
      .array(z.unknown())
      .parse((await this.call(`/booking_settings?owner_id=eq.${ownerId}&select=*&limit=1`)) ?? []);
    if (data.length === 0) return null;
    const row = SettingsRow.parse(fromRow(data[0]));
    const parsed = BookingSettings.safeParse(row.settings);
    // Configuração gravada que não passa mais no contrato: volta para os padrões (o dono salva de novo).
    return parsed.success ? parsed.data : null;
  }

  async saveSettings(ownerId: string, settings: BookingSettings) {
    if (!isUuid(ownerId)) throw new Error("Invalid owner id.");
    await this.call("/booking_settings?on_conflict=owner_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify({ owner_id: ownerId, settings, updated_at: nowIso() }),
    });
    return settings;
  }

  async listActive(ownerId: string, fromIso: string, toIso: string) {
    if (!isUuid(ownerId)) return [];
    return this.bookings(
      `/bookings?owner_id=eq.${ownerId}&status=eq.confirmed` +
        `&start_at=lt.${encodeURIComponent(toIso)}&end_at=gt.${encodeURIComponent(fromIso)}` +
        "&select=*&order=start_at.asc,id.asc&limit=1000",
    );
  }

  async getByToken(token: string) {
    const [row] = await this.bookings(
      `/bookings?token=eq.${encodeURIComponent(token)}&select=*&limit=1`,
    );
    return row ?? null;
  }

  async bookSlot(booking: NewBooking, rules: BookingRules): Promise<BookSlotResult> {
    if (!isUuid(booking.ownerId) || !isUuid(booking.siteId) || !isUuid(booking.serviceId)) {
      throw new Error("Invalid id.");
    }
    const result = BookSlotRpc.parse(
      await this.call("/rpc/book_slot", {
        method: "POST",
        body: JSON.stringify({
          p_owner: booking.ownerId,
          p_site: booking.siteId,
          p_token: booking.token,
          p_client: booking.clientId,
          p_service_id: booking.serviceId,
          p_service_name: booking.serviceName,
          p_staff: booking.staffId,
          p_start: booking.startAt,
          p_end: booking.endAt,
          p_buffer_minutes: rules.bufferMinutes,
          p_customer_name: booking.customerName,
          p_customer_phone: booking.customerPhone,
          p_customer_email: booking.customerEmail,
          p_notes: booking.notes,
        }),
      }),
    );
    if (result.conflict) return { ok: false, reason: "conflict" };
    return { ok: true, booking: BookingRecord.parse(fromRow(result.booking)) };
  }

  async attachJob(ownerId: string, id: string, jobId: string) {
    if (!isUuid(ownerId) || !isUuid(id) || !isUuid(jobId)) return null;
    return this.patchBookings(`/bookings?id=eq.${id}&owner_id=eq.${ownerId}`, { job_id: jobId });
  }

  async cancel(ownerId: string, id: string) {
    if (!isUuid(ownerId) || !isUuid(id)) return null;
    return this.patchBookings(`/bookings?id=eq.${id}&owner_id=eq.${ownerId}&status=eq.confirmed`, {
      status: "canceled",
      canceled_at: nowIso(),
    });
  }

  async cancelByJobId(ownerId: string, jobId: string) {
    if (!isUuid(ownerId) || !isUuid(jobId)) return null;
    return this.patchBookings(
      `/bookings?job_id=eq.${jobId}&owner_id=eq.${ownerId}&status=eq.confirmed`,
      { status: "canceled", canceled_at: nowIso() },
    );
  }

  async updateTimesByJobId(ownerId: string, jobId: string, startAt: string, endAt: string) {
    if (!isUuid(ownerId) || !isUuid(jobId)) return null;
    return this.patchBookings(
      `/bookings?job_id=eq.${jobId}&owner_id=eq.${ownerId}&status=eq.confirmed`,
      { start_at: startAt, end_at: endAt },
    );
  }
}

// ---------- memória ----------

type MemoryState = {
  settings: Map<string, BookingSettings>;
  bookings: Map<string, BookingRecord>;
};

const globalForBooking = globalThis as typeof globalThis & { __nosweatBooking?: MemoryState };

function memoryState(): MemoryState {
  globalForBooking.__nosweatBooking ??= { settings: new Map(), bookings: new Map() };
  return globalForBooking.__nosweatBooking;
}

/** Fila: uma chamada de cada vez (o "pg_advisory_xact_lock" da memória). */
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

export class MemoryBookingStore implements BookingStore {
  private get state(): MemoryState {
    return memoryState();
  }

  async getSettings(ownerId: string) {
    const found = this.state.settings.get(ownerId);
    return found ? clone(found) : null;
  }

  async saveSettings(ownerId: string, settings: BookingSettings) {
    this.state.settings.set(ownerId, clone(settings));
    return clone(settings);
  }

  async listActive(ownerId: string, fromIso: string, toIso: string) {
    const from = Date.parse(fromIso);
    const to = Date.parse(toIso);
    return [...this.state.bookings.values()]
      .filter(
        (b) =>
          b.ownerId === ownerId &&
          b.status === "confirmed" &&
          Date.parse(b.startAt) < to &&
          Date.parse(b.endAt) > from,
      )
      .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt) || a.id.localeCompare(b.id))
      .map(clone);
  }

  async getByToken(token: string) {
    const found = [...this.state.bookings.values()].find((b) => b.token === token);
    return found ? clone(found) : null;
  }

  bookSlot(booking: NewBooking, rules: BookingRules): Promise<BookSlotResult> {
    return exclusive(async () => {
      const candidate = { startMs: Date.parse(booking.startAt), endMs: Date.parse(booking.endAt) };
      const bufferMs = rules.bufferMinutes * 60_000;
      // Mesma regra do SQL `book_slot`: marcações confirmadas e serviços não cancelados.
      const busy = [
        ...[...this.state.bookings.values()]
          .filter((b) => b.ownerId === booking.ownerId && b.status === "confirmed")
          .map(bookingBusy),
        ...(await getOfficeStore().listJobs(booking.ownerId)).flatMap((job) => {
          const interval = jobBusy(job);
          return interval ? [interval] : [];
        }),
      ];
      if (busy.some((b) => appliesTo(b, booking.staffId) && conflicts(candidate, b, bufferMs))) {
        return { ok: false as const, reason: "conflict" as const };
      }
      const record: BookingRecord = {
        ...clone(booking),
        id: crypto.randomUUID(),
        jobId: null,
        status: "confirmed",
        createdAt: nowIso(),
        canceledAt: null,
      };
      this.state.bookings.set(record.id, record);
      return { ok: true as const, booking: clone(record) };
    });
  }

  async attachJob(ownerId: string, id: string, jobId: string) {
    const current = this.state.bookings.get(id);
    if (!current || current.ownerId !== ownerId) return null;
    const updated = { ...current, jobId };
    this.state.bookings.set(id, updated);
    return clone(updated);
  }

  private cancelWhere(match: (booking: BookingRecord) => boolean): BookingRecord | null {
    const current = [...this.state.bookings.values()].find(
      (b) => b.status === "confirmed" && match(b),
    );
    if (!current) return null;
    const updated: BookingRecord = { ...current, status: "canceled", canceledAt: nowIso() };
    this.state.bookings.set(current.id, updated);
    return clone(updated);
  }

  async cancel(ownerId: string, id: string) {
    return this.cancelWhere((b) => b.id === id && b.ownerId === ownerId);
  }

  async cancelByJobId(ownerId: string, jobId: string) {
    return this.cancelWhere((b) => b.jobId === jobId && b.ownerId === ownerId);
  }

  async updateTimesByJobId(ownerId: string, jobId: string, startAt: string, endAt: string) {
    const current = [...this.state.bookings.values()].find(
      (b) => b.status === "confirmed" && b.jobId === jobId && b.ownerId === ownerId,
    );
    if (!current) return null;
    const updated = { ...current, startAt, endAt };
    this.state.bookings.set(current.id, updated);
    return clone(updated);
  }
}

let store: BookingStore | undefined;

export function getBookingStore(): BookingStore {
  if (store) return store;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Como em getOfficeStore: na produção da Vercel, sem Supabase é erro (a memória perderia tudo).
  if (!(url && serviceKey) && process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Supabase is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  store =
    url && serviceKey ? new SupabaseBookingStore({ url, serviceKey }) : new MemoryBookingStore();
  return store;
}

/** Só para testes: limpa a memória entre um teste e outro. */
export function resetMemoryBookingStore(): void {
  globalForBooking.__nosweatBooking = undefined;
}
