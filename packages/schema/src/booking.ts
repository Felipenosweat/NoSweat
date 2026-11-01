import { z } from "zod";

// Agendamento online (o cliente do dono escolhe o horário no site). Contrato entre o servidor
// (server/booking), as rotas públicas /api/public/booking/*, as telas do dono (/office/booking) e
// a seção "booking" dos sites. Datas e horas sempre no fuso da empresa (office settings).
// Só acrescenta campos opcionais ao resto do schema.

/** "AAAA-MM-DD". */
export const BookingDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-12-31.");
/** "HH:MM" (24 horas). */
export const ClockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 09:30.");

export const TimeRange = z
  .object({ start: ClockTime, end: ClockTime })
  .refine((range) => range.start < range.end, { message: "The end must be after the start." });
export type TimeRange = z.infer<typeof TimeRange>;

/** Duração aceita de um serviço agendável (minutos). */
export const DurationMinutes = z.number().int().min(5).max(480);

/**
 * Regras de agendamento do dono. `weekly[0]` = domingo ... `weekly[6]` = sábado; lista vazia =
 * fechado. Vários intervalos no mesmo dia (almoço): [{09:00-12:00},{13:00-18:00}].
 */
export const BookingSettings = z.object({
  enabled: z.boolean(),
  weekly: z.array(z.array(TimeRange).max(4)).length(7),
  /** Passo entre os horários oferecidos (minutos). */
  slotStepMinutes: z.number().int().min(5).max(120),
  /** Folga depois de cada atendimento (minutos). */
  bufferMinutes: z.number().int().min(0).max(120),
  /** Antecedência mínima para marcar (horas). */
  minNoticeHours: z.number().int().min(0).max(336),
  /** Até quantos dias à frente o cliente pode marcar. */
  maxDaysAhead: z.number().int().min(1).max(365),
  /** Dias fechados (feriados, folgas). */
  closedDates: z.array(BookingDate).max(366),
  /** Texto curto mostrado ao cliente na hora de marcar (ex.: "Please arrive 5 minutes early."). */
  note: z.string().max(300),
});
export type BookingSettings = z.infer<typeof BookingSettings>;

export const UpdateBookingSettingsRequest = BookingSettings.partial();
export type UpdateBookingSettingsRequest = z.infer<typeof UpdateBookingSettingsRequest>;

export const BookingSettingsResponse = z.object({ settings: BookingSettings });
export type BookingSettingsResponse = z.infer<typeof BookingSettingsResponse>;

/** Padrão de um dono novo: desligado, seg-sáb 9h-17h, passo de 30 min. */
export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  enabled: false,
  weekly: [
    [],
    [{ start: "09:00", end: "17:00" }],
    [{ start: "09:00", end: "17:00" }],
    [{ start: "09:00", end: "17:00" }],
    [{ start: "09:00", end: "17:00" }],
    [{ start: "09:00", end: "17:00" }],
    [{ start: "09:00", end: "17:00" }],
  ],
  slotStepMinutes: 30,
  bufferMinutes: 0,
  minNoticeHours: 2,
  maxDaysAhead: 30,
  closedDates: [],
  note: "",
};

// ---------- o que o cliente vê (rotas públicas, sem login) ----------

/** Serviço da tabela de preços marcado como agendável (PriceItem.bookable + durationMinutes). */
export const BookableService = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  durationMinutes: DurationMinutes,
  /** Preço da tabela, em centavos (null = não mostrar). */
  priceCents: z.number().int().nonnegative().nullable(),
});
export type BookableService = z.infer<typeof BookableService>;

/** Pessoa da equipe que atende (membro ativo). Sem equipe cadastrada: lista vazia = agenda única. */
export const BookingStaff = z.object({ id: z.string(), name: z.string() });
export type BookingStaff = z.infer<typeof BookingStaff>;

/** `GET /api/public/booking/[siteId]`: 404 se o site não está no ar ou o agendamento está desligado. */
export const PublicBookingInfo = z.object({
  businessName: z.string(),
  businessPhone: z.string().nullable(),
  /** Fuso da empresa (IANA): todas as horas mostradas ao cliente são deste fuso. */
  timeZone: z.string(),
  services: z.array(BookableService),
  staff: z.array(BookingStaff),
  maxDaysAhead: z.number().int(),
  note: z.string(),
});
export type PublicBookingInfo = z.infer<typeof PublicBookingInfo>;

/** `GET /api/public/booking/[siteId]/availability?serviceId=&from=AAAA-MM-DD&days=7&staffId=`. */
export const AvailabilityQuery = z.object({
  serviceId: z.string().min(1),
  from: BookingDate,
  days: z.coerce.number().int().min(1).max(14).default(7),
  /** Sem `staffId` = qualquer pessoa livre. */
  staffId: z.string().min(1).optional(),
});
export type AvailabilityQuery = z.infer<typeof AvailabilityQuery>;

export const BookingSlot = z.object({
  /** ISO com fuso (offset do fuso da empresa). */
  startAt: z.string(),
  endAt: z.string(),
  /** Quem atenderia (null = agenda única, sem equipe). Com "qualquer pessoa", já vem escolhida. */
  staffId: z.string().nullable(),
});
export type BookingSlot = z.infer<typeof BookingSlot>;

export const AvailabilityDay = z.object({ date: BookingDate, slots: z.array(BookingSlot) });
export const AvailabilityResponse = z.object({
  timeZone: z.string(),
  days: z.array(AvailabilityDay),
  /** Primeiro horário livre depois do período pedido (para "próxima vaga"), se existir. */
  nextAvailableAt: z.string().nullable(),
});
export type AvailabilityResponse = z.infer<typeof AvailabilityResponse>;

/** `POST /api/public/booking/[siteId]/book`. */
export const CreateBookingRequest = z.object({
  serviceId: z.string().min(1),
  /** Início escolhido (um `BookingSlot.startAt` devolvido pela disponibilidade). */
  startAt: z.iso.datetime({ offset: true }),
  staffId: z.string().min(1).nullable().optional(),
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  phone: z.string().trim().min(7, "Please enter a phone number.").max(40),
  email: z.union([z.literal(""), z.email().max(200)]).optional(),
  notes: z.string().trim().max(500).optional(),
  /** Campo-isca anti-robô (deve vir vazio). */
  website: z.string().max(0).optional(),
});
export type CreateBookingRequest = z.infer<typeof CreateBookingRequest>;

export const BookingStatus = z.enum(["confirmed", "canceled"]);
export type BookingStatus = z.infer<typeof BookingStatus>;

/** Marcação vista pelo cliente (link com `token`, sem login): confirmação e cancelamento. */
export const PublicBooking = z.object({
  token: z.string(),
  status: BookingStatus,
  serviceName: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  staffName: z.string().nullable(),
  customerName: z.string(),
  businessName: z.string(),
  businessPhone: z.string().nullable(),
  businessAddress: z.string().nullable(),
  timeZone: z.string(),
  /** Ainda dá para cancelar pelo link (no futuro e não cancelada). */
  canCancel: z.boolean(),
});
export type PublicBooking = z.infer<typeof PublicBooking>;

export const PublicBookingResponse = z.object({ booking: PublicBooking });
export type PublicBookingResponse = z.infer<typeof PublicBookingResponse>;
