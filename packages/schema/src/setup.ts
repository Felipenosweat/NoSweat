import { z } from "zod";
import { BookingDate, DurationMinutes, TimeRange } from "./booking";
import { Job } from "./office";
import { PaymentSettings } from "./payments";

// Assistente de configuração do dono (/sites/[id]/setup): UMA chamada grava horários, serviços
// com duração e preço, equipe e as regras de cancelamento. Só acrescenta tipos novos.

/** "shop" = atende no local (salão, consultório); "home" = vai até o cliente (janelas de chegada). */
export const SetupKind = z.enum(["shop", "home"]);
export type SetupKind = z.infer<typeof SetupKind>;

/** Um serviço do assistente. O preço é em centavos; `null` = não mostrar preço. */
export const SetupService = z.object({
  name: z.string().trim().min(1, "Please name every service.").max(120),
  description: z.string().trim().max(1000).optional(),
  durationMinutes: DurationMinutes,
  priceCents: z.number().int().min(0).max(100_000_000).nullable(),
  /** "from $85" em vez de "$85" no site. */
  priceFrom: z.boolean().optional(),
});
export type SetupService = z.infer<typeof SetupService>;

/** Uma pessoa da equipe (vira membro da agenda e aparece em "Quem somos"). */
export const SetupPerson = z.object({
  name: z.string().trim().min(1, "Please name every person.").max(80),
  role: z.string().trim().max(40).optional(),
  bio: z.string().trim().max(200, "Keep each bio under 200 characters.").optional(),
});
export type SetupPerson = z.infer<typeof SetupPerson>;

/** As regras de agendamento do assistente (`enabled` o servidor liga sozinho). */
export const SetupSettings = z.object({
  weekly: z.array(z.array(TimeRange).max(4)).length(7),
  slotStepMinutes: z.number().int().min(5).max(120),
  bufferMinutes: z.number().int().min(0).max(120),
  minNoticeHours: z.number().int().min(0).max(336),
  maxDaysAhead: z.number().int().min(1).max(365),
  closedDates: z.array(BookingDate).max(366),
  note: z.string().trim().max(300),
  cancellationPolicy: z.string().trim().max(600).optional(),
  cancellationHours: z.number().int().min(0).max(720).optional(),
  /** Lembretes por texto (consentimento no formulário). Ausente = não muda. */
  smsReminders: z.boolean().optional(),
});
export type SetupSettings = z.infer<typeof SetupSettings>;

export const SiteSetupRequest = z.object({
  kind: SetupKind,
  settings: SetupSettings,
  services: z.array(SetupService).min(1, "Add at least one service.").max(40),
  /** Nomes de serviços que o dono tirou da lista: deixam de ser agendáveis (nada é apagado). */
  removedServices: z.array(z.string().trim().min(1).max(120)).max(40).optional(),
  /** Vazio = "I work alone": a equipe e "Quem somos" não mudam. */
  team: z.array(SetupPerson).max(6),
  /** Só "home": área atendida e telefone, gravados no site. */
  serviceArea: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  /** Fuso da agenda (IANA, ex.: "America/Chicago"): vai para as configurações do escritório. */
  timeZone: z.string().trim().min(1).max(64).optional(),
  /** Endereço dos EUA (só "home"): cidade e estado vão para o site; com CEP, para o escritório. */
  city: z.string().trim().max(60).optional(),
  state: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}$/, "Choose a state.")
    .optional(),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Enter a 5-digit ZIP code.")
    .optional(),
  /**
   * Como os clientes pagam (informativo): grava em `business.payments` do RASCUNHO. Ausente = não
   * muda nada; `{ methods: [] }` = tira. Com as instruções de pagamento do escritório vazias, o
   * servidor preenche uma frase curta a partir disto.
   */
  payments: PaymentSettings.optional(),
});
export type SiteSetupRequest = z.infer<typeof SiteSetupRequest>;

/** Partes gravadas, na ordem em que o servidor grava (o agendamento só liga por último). */
export const SETUP_PARTS = ["services", "team", "site", "hours"] as const;
export const SetupPart = z.enum(SETUP_PARTS);
export type SetupPart = z.infer<typeof SetupPart>;

export const SiteSetupResponse = z.object({
  siteId: z.string(),
  saved: z.array(SetupPart),
  /** Quantos serviços e pessoas foram criados ou atualizados. */
  services: z.number().int(),
  people: z.number().int(),
  /** Avisos que não impedem nada (ex.: o site não tem a seção "Quem somos"). */
  notes: z.array(z.string()),
});
export type SiteSetupResponse = z.infer<typeof SiteSetupResponse>;

// ---------- walk-in (cliente que chegou sem marcar: bloqueia o horário na agenda) ----------

export const WalkInRequest = z.object({
  /** Sem nome, o serviço fica no cliente genérico "Walk-in". */
  name: z.string().trim().max(120).optional(),
  /** Serviço agendável da tabela de preços (dá o título do serviço). */
  serviceId: z.string().min(1).optional(),
  startAt: z.iso.datetime({ offset: true }),
  durationMinutes: DurationMinutes,
  /** Quem atende (membro da equipe); sem pessoa, o horário some para todos. */
  assigneeId: z.string().min(1).optional(),
});
export type WalkInRequest = z.infer<typeof WalkInRequest>;

export const WalkInResponse = z.object({ job: Job });
export type WalkInResponse = z.infer<typeof WalkInResponse>;
