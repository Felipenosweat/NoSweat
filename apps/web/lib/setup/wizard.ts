import {
  SiteSetupRequest,
  type BookingSettings,
  type PriceItem,
  type SetupKind,
  type SiteSpec,
  type TimeRange,
} from "@nosweat/schema";
import { parseDollars } from "../clients";

// Regras puras do assistente de configuração (/sites/[id]/setup): estado das telas → pedido
// `SiteSetupRequest`, valores iniciais (a partir do site e do que o dono já tem), formatação e
// leitura de duração e preço. Sem React e sem servidor: serve o cliente, o servidor e os testes.

/** Ramos que ganham o assistente. */
const SHOP_TEMPLATES = new Set<string>(["beauty", "professional"]);
const HOME_TEMPLATES = new Set<string>(["home-services"]);

/** Que assistente o site ganha (`null` = nenhum: a página manda para o site). */
export function setupKindFor(template: string): SetupKind | null {
  if (SHOP_TEMPLATES.has(template)) return "shop";
  if (HOME_TEMPLATES.has(template)) return "home";
  return null;
}

// ---------- horas e durações ----------

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function fromMinutes(total: number): string {
  const clamped = Math.min(23 * 60 + 59, Math.max(0, total));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

/** "9:00 AM" a partir de "09:00". */
export function clockLabel(time: string): string {
  const total = toMinutes(time);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return minutes === 0
    ? `${twelve} ${suffix}`
    : `${twelve}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** 45 → "45 min"; 60 → "1 hr"; 90 → "1 hr 30 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

/** Duração escrita pelo dono ("45 min", "About 3 hours", "1 hr 30 min") → minutos, ou `null`. */
export function parseDurationText(text: string): number | null {
  const lower = text.toLowerCase();
  let total = 0;
  for (const match of lower.matchAll(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h\b|minutes?|mins?|m\b)/g)) {
    const value = Number(match[1]);
    const unit = match[2] ?? "";
    total += unit.startsWith("h") ? value * 60 : value;
  }
  const rounded = Math.round(total);
  return rounded >= 5 && rounded <= 480 ? rounded : null;
}

/** Centavos → "$45" (ou "$45.50"); com `from`, "from $45". */
export function formatPriceText(cents: number, from = false): string {
  const dollars = cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
  return `${from ? "from " : ""}$${dollars}`;
}

/** Preço escrito no site ("from $85", "$45") → centavos; `null` se não tem valor. */
export function parsePriceText(text: string): { cents: number; from: boolean } | null {
  const matches = [...text.matchAll(/\$\s?(\d[\d,]*(?:\.\d{1,2})?)/g)];
  const first = matches[0]?.[1];
  if (!first) return null;
  const cents = Math.round(Number(first.replace(/,/g, "")) * 100);
  if (!Number.isFinite(cents) || cents > 100_000_000) return null;
  // "from $85" ou "$50 - $80": o valor é um ponto de partida.
  return { cents, from: /\bfrom\b/i.test(text) || matches.length > 1 };
}

/** Chave para casar nomes (maiúsculas e espaços não contam). */
export function nameKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

// ---------- estado das telas ----------

export type DayHours = {
  open: boolean;
  start: string;
  end: string;
  lunch: boolean;
  lunchStart: string;
  lunchEnd: string;
};

/** Janelas de chegada: de `start` a `end`, uma a cada `length` minutos. */
export type ArrivalWindows = { start: string; end: string; length: number };

export type WizardService = {
  key: string;
  name: string;
  description: string;
  durationMinutes: number;
  /** Dólares digitados ("45", "45.50"); vazio = sem preço. */
  price: string;
  priceFrom: boolean;
  /** Já existia (preço agendável ou serviço do site): tirar da lista desliga o agendamento dele. */
  existing: boolean;
};

export type WizardPerson = { key: string; name: string; role: string; bio: string };

export type PolicyPreset = "24h" | "48h" | "custom" | "none";

export type WizardState = {
  kind: SetupKind;
  /** 0 = domingo ... 6 = sábado. */
  days: DayHours[];
  windows: ArrivalWindows;
  closedDates: string[];
  services: WizardService[];
  removed: string[];
  alone: boolean;
  people: WizardPerson[];
  serviceArea: string;
  phone: string;
  policyPreset: PolicyPreset;
  cancellationPolicy: string;
  cancellationHours: number;
  minNoticeHours: number;
  maxDaysAhead: number;
  bufferMinutes: number;
  note: string;
};

export const WINDOW_PRESETS: readonly { label: string; windows: ArrivalWindows }[] = [
  { label: "8–10, 10–12, 12–2, 2–4", windows: { start: "08:00", end: "16:00", length: 120 } },
  { label: "9–12, 12–3, 3–6", windows: { start: "09:00", end: "18:00", length: 180 } },
  { label: "Morning or afternoon", windows: { start: "08:00", end: "16:00", length: 240 } },
];

export const DURATION_CHIPS = [15, 30, 45, 60, 90, 120, 180] as const;

export function policyPresets(kind: SetupKind): {
  id: Exclude<PolicyPreset, "custom" | "none">;
  label: string;
  text: string;
  hours: number;
}[] {
  const what = kind === "home" ? "visit" : "appointment";
  return [
    {
      id: "24h",
      label: "24 hours",
      text: `Free cancellation up to 24 hours before your ${what}.`,
      hours: 24,
    },
    {
      id: "48h",
      label: "48 hours",
      text: `Please give us 48 hours notice if you need to cancel or reschedule your ${what}.`,
      hours: 48,
    },
  ];
}

let counter = 0;
/** Chave estável de uma linha da lista (só para o React). */
export function newKey(): string {
  counter += 1;
  return `row-${counter}`;
}

export function emptyService(durationMinutes: number): WizardService {
  return {
    key: newKey(),
    name: "",
    description: "",
    durationMinutes,
    price: "",
    priceFrom: false,
    existing: false,
  };
}

export function emptyPerson(): WizardPerson {
  return { key: newKey(), name: "", role: "", bio: "" };
}

const DEFAULT_DAY: DayHours = {
  open: false,
  start: "09:00",
  end: "17:00",
  lunch: false,
  lunchStart: "12:00",
  lunchEnd: "13:00",
};

/** Número de janelas que cabem entre `start` e `end`. */
export function windowCount(windows: ArrivalWindows): number {
  if (windows.length <= 0) return 0;
  return Math.max(
    0,
    Math.floor((toMinutes(windows.end) - toMinutes(windows.start)) / windows.length),
  );
}

/** As janelas de chegada, uma a uma ("8 AM – 10 AM"). */
export function listWindows(
  windows: ArrivalWindows,
): { start: string; end: string; label: string }[] {
  const out: { start: string; end: string; label: string }[] = [];
  const first = toMinutes(windows.start);
  for (let i = 0; i < windowCount(windows); i += 1) {
    const start = fromMinutes(first + i * windows.length);
    const end = fromMinutes(first + (i + 1) * windows.length);
    out.push({ start, end, label: `${clockLabel(start)} – ${clockLabel(end)}` });
  }
  return out;
}

/** Horário de um dia no formato do motor: um intervalo, ou dois quando há pausa para o almoço. */
export function rangesForDay(day: DayHours): TimeRange[] {
  if (!day.open) return [];
  if (
    day.lunch &&
    day.start < day.lunchStart &&
    day.lunchStart < day.lunchEnd &&
    day.lunchEnd < day.end
  ) {
    return [
      { start: day.start, end: day.lunchStart },
      { start: day.lunchEnd, end: day.end },
    ];
  }
  return [{ start: day.start, end: day.end }];
}

/**
 * Janelas de chegada no motor que já existe: UM intervalo por dia de trabalho (do começo da
 * primeira janela ao fim da última); o passo e a duração dos serviços é o tamanho da janela.
 */
export function rangesForWindows(day: DayHours, windows: ArrivalWindows): TimeRange[] {
  const count = windowCount(windows);
  if (!day.open || count === 0) return [];
  return [
    {
      start: windows.start,
      end: fromMinutes(toMinutes(windows.start) + count * windows.length),
    },
  ];
}

// ---------- estado → pedido ----------

export type BuildResult = { ok: true; request: SiteSetupRequest } | { ok: false; error: string };

/** Confere o que as telas já sabem conferir antes de ir ao servidor (mensagens para o dono). */
export function stateProblem(state: WizardState): string | null {
  const open = state.days.filter((day) => day.open);
  if (open.length === 0) {
    return state.kind === "home"
      ? "Pick at least one day you work."
      : "Pick at least one day you are open.";
  }
  if (state.kind === "home") {
    if (windowCount(state.windows) === 0) return "Your arrival windows need at least one window.";
  } else {
    for (const day of open) {
      if (day.start >= day.end) return "Every open day must close after it opens.";
      if (
        day.lunch &&
        !(day.start < day.lunchStart && day.lunchStart < day.lunchEnd && day.lunchEnd < day.end)
      ) {
        return "A lunch break must sit inside the open hours.";
      }
    }
  }
  const names = new Set<string>();
  for (const service of state.services) {
    const key = nameKey(service.name);
    if (!key) return "Please name every service.";
    if (names.has(key)) return `“${service.name.trim()}” is listed twice.`;
    names.add(key);
    if (parseDollars(service.price) === undefined) {
      return `The price of “${service.name.trim()}” should look like 45 or 45.50.`;
    }
  }
  if (state.services.length === 0) return "Add at least one service.";
  if (!state.alone) {
    const people = new Set<string>();
    for (const person of state.people) {
      const key = nameKey(person.name);
      if (!key) return "Please name every person, or choose “I work alone”.";
      if (people.has(key)) return `“${person.name.trim()}” is listed twice.`;
      people.add(key);
    }
  }
  return null;
}

/** O pedido para `POST /api/sites/[id]/setup`. */
export function buildSetupRequest(state: WizardState): BuildResult {
  const problem = stateProblem(state);
  if (problem) return { ok: false, error: problem };

  const home = state.kind === "home";
  const weekly = state.days.map((day) =>
    home ? rangesForWindows(day, state.windows) : rangesForDay(day),
  );
  const step = home ? state.windows.length : shopStep(state);

  const candidate = {
    kind: state.kind,
    settings: {
      weekly,
      slotStepMinutes: step,
      bufferMinutes: state.bufferMinutes,
      minNoticeHours: state.minNoticeHours,
      maxDaysAhead: state.maxDaysAhead,
      closedDates: [...new Set(state.closedDates)].sort(),
      note: state.note.trim(),
      cancellationPolicy:
        state.policyPreset === "none" ? undefined : state.cancellationPolicy.trim() || undefined,
      cancellationHours: state.policyPreset === "none" ? undefined : state.cancellationHours,
    },
    services: state.services.map((service) => ({
      name: service.name.trim(),
      description: service.description.trim() || undefined,
      durationMinutes: service.durationMinutes,
      priceCents: parseDollars(service.price) ?? null,
      priceFrom: service.priceFrom || undefined,
    })),
    removedServices: state.removed.length > 0 ? state.removed : undefined,
    team: state.alone
      ? []
      : state.people.map((person) => ({
          name: person.name.trim(),
          role: person.role.trim() || undefined,
          bio: person.bio.trim() || undefined,
        })),
    serviceArea: home ? state.serviceArea.trim() || undefined : undefined,
    phone: home ? state.phone.trim() || undefined : undefined,
  };
  const parsed = SiteSetupRequest.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your answers." };
  }
  return { ok: true, request: parsed.data };
}

/** Passo entre horários de um salão: o maior que divide todas as durações (15, 30 ou 60 min). */
export function shopStep(state: Pick<WizardState, "services">): number {
  const durations = state.services.map((service) => service.durationMinutes);
  for (const step of [60, 30, 15]) {
    if (durations.every((d) => d % step === 0)) return step;
  }
  return 15;
}

// ---------- valores iniciais ----------

function daysFromSettings(weekly: BookingSettings["weekly"]): DayHours[] {
  return weekly.map((ranges) => {
    const first = ranges[0];
    if (!first) return { ...DEFAULT_DAY };
    const last = ranges[ranges.length - 1] ?? first;
    const second = ranges[1];
    return {
      open: true,
      start: first.start,
      end: last.end,
      lunch: Boolean(second),
      lunchStart: second ? first.end : DEFAULT_DAY.lunchStart,
      lunchEnd: second ? second.start : DEFAULT_DAY.lunchEnd,
    };
  });
}

/** Janelas que o dono já tinha (passo e primeiro dia aberto); sem nada, 8 às 16 de 2 em 2 horas. */
function windowsFromSettings(settings: BookingSettings, saved: boolean): ArrivalWindows {
  const fallback = WINDOW_PRESETS[0]?.windows ?? { start: "08:00", end: "16:00", length: 120 };
  if (!saved) return { ...fallback };
  const range = settings.weekly.find((ranges) => ranges.length > 0)?.[0];
  if (!range || settings.slotStepMinutes < 30) return { ...fallback };
  return { start: range.start, end: range.end, length: settings.slotStepMinutes };
}

export type InitialInput = {
  kind: SetupKind;
  spec: SiteSpec;
  settings: BookingSettings;
  /** O dono já salvou regras de agendamento (senão valem os padrões). */
  settingsSaved: boolean;
  priceItems: readonly PriceItem[];
};

/**
 * Valores iniciais: o que o dono já tem (preços agendáveis, regras salvas) e o que o site diz
 * (serviços com preço e duração, pessoas, área atendida, telefone). Nada é inventado.
 */
export function initialState(input: InitialInput): WizardState {
  const { kind, spec, settings, priceItems } = input;
  const windows = windowsFromSettings(settings, input.settingsSaved);
  const defaultMinutes = kind === "home" ? windows.length : 60;

  const services: WizardService[] = [];
  const seen = new Set<string>();
  const items = priceItems.filter((item) => item.active && item.bookable && item.durationMinutes);
  for (const item of items) {
    seen.add(nameKey(item.name));
    services.push({
      key: newKey(),
      name: item.name,
      description: item.description,
      durationMinutes: item.durationMinutes ?? defaultMinutes,
      price: item.unitPriceCents > 0 ? centsToInput(item.unitPriceCents) : "",
      priceFrom: false,
      existing: true,
    });
  }
  const section = spec.sections.find((s) => s.type === "services");
  if (section?.type === "services") {
    for (const item of section.items) {
      const key = nameKey(item.name);
      if (!key || seen.has(key)) {
        // Mesmo serviço da tabela de preços: só aproveita o "from" do texto do site.
        const match = services.find((s) => nameKey(s.name) === key);
        if (match && item.price && parsePriceText(item.price)?.from) match.priceFrom = true;
        continue;
      }
      seen.add(key);
      const price = item.price ? parsePriceText(item.price) : null;
      const parsed = item.detail ? parseDurationText(item.detail) : null;
      services.push({
        key: newKey(),
        name: item.name,
        description: item.description,
        durationMinutes: kind === "home" ? defaultMinutes : (parsed ?? defaultMinutes),
        price: price ? centsToInput(price.cents) : "",
        priceFrom: price?.from ?? false,
        existing: true,
      });
    }
  }

  const about = spec.sections.find((s) => s.type === "about");
  const people: WizardPerson[] =
    about?.type === "about"
      ? (about.people ?? []).map((person) => ({
          key: newKey(),
          name: person.name,
          role: person.role ?? "",
          bio: person.note ?? "",
        }))
      : [];

  const presets = policyPresets(kind);
  const text = settings.cancellationPolicy?.trim() ?? "";
  const preset: PolicyPreset = text
    ? (presets.find((p) => p.text === text)?.id ?? "custom")
    : input.settingsSaved
      ? "none"
      : "24h";
  const first = presets[0];

  return {
    kind,
    days: daysFromSettings(settings.weekly),
    windows,
    closedDates: [...settings.closedDates],
    services: services.length > 0 ? services : [emptyService(defaultMinutes)],
    removed: [],
    alone: people.length === 0,
    people,
    serviceArea: spec.business.serviceArea ?? "",
    phone: spec.business.phone ?? "",
    policyPreset: preset,
    cancellationPolicy: text || first?.text || "",
    cancellationHours: settings.cancellationHours ?? first?.hours ?? 24,
    minNoticeHours: settings.minNoticeHours,
    maxDaysAhead: settings.maxDaysAhead,
    bufferMinutes: settings.bufferMinutes,
    note: settings.note,
  };
}

/** Centavos → texto de campo de preço ("45", "45.50"). */
export function centsToInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}

/** O assistente já foi concluído? Agendamento ligado e ao menos um serviço agendável com duração. */
export function setupDone(
  settings: Pick<BookingSettings, "enabled">,
  items: readonly Pick<PriceItem, "active" | "bookable" | "durationMinutes">[],
): boolean {
  return (
    settings.enabled &&
    items.some((item) => item.active && item.bookable === true && Boolean(item.durationMinutes))
  );
}
