import type { Client, ClientStage } from "@nosweat/schema";

// Peças puras do módulo de clientes (sem React e sem servidor): rótulos das etapas, datas sem
// hora e dinheiro. Servem para server e client components.

/** Fuso usado para "hoje" (retornos combinados). PROVISÓRIO: a conta ainda não tem fuso próprio. */
export const CLIENTS_TIME_ZONE = "America/New_York";

/** Ordem das etapas no filtro e no seletor. */
export const CLIENT_STAGES: readonly ClientStage[] = ["new", "contacted", "quoted", "won", "lost"];

export const STAGE_LABELS: Record<ClientStage, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

/** Cor do selo de cada etapa (tons que o `StatusBadge` já tem). */
export const STAGE_TONES: Record<ClientStage, "info" | "neutral" | "pending" | "live" | "draft"> = {
  new: "info",
  contacted: "neutral",
  quoted: "pending",
  won: "live",
  lost: "draft",
};

/** A string é uma etapa conhecida? (o histórico guarda a etapa como texto). */
export function isClientStage(value: string): value is ClientStage {
  return (CLIENT_STAGES as readonly string[]).includes(value);
}

/** "AAAA-MM-DD" de um instante no fuso pedido. */
export function dateKeyIn(timeZone: string, at: Date): string {
  // en-CA formata como 2026-10-15.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** "Oct 21" (ou "Oct 21, 2027" se for de outro ano) de uma data sem hora. */
export function formatDateOnly(date: string, today?: string): string {
  const [y = 2000, m = 1, d = 1] = date.split("-").map(Number);
  const sameYear = today ? today.slice(0, 4) === date.slice(0, 4) : false;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export type FollowUpState = "overdue" | "today" | "upcoming";

/** Situação do retorno em relação a hoje (datas "AAAA-MM-DD" comparam como texto). */
export function followUpState(followUpOn: string, today: string): FollowUpState {
  if (followUpOn < today) return "overdue";
  if (followUpOn === today) return "today";
  return "upcoming";
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/** Centavos → "$1,250.00". */
export function formatCents(cents: number): string {
  return money.format(cents / 100);
}

/**
 * Texto digitado ("$1,250.50", "120") → centavos. `null` = vazio; `undefined` = inválido.
 */
export function parseDollars(input: string): number | null | undefined {
  const clean = input.replace(/[$,\s]/g, "");
  if (clean === "") return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(clean)) return undefined;
  const cents = Math.round(Number(clean) * 100);
  // Mesmo teto do contrato (US$ 1 milhão).
  return cents <= 100_000_000 ? cents : undefined;
}

/** Telefone só com dígitos e "+", para os links tel: e sms:. */
export function phoneHref(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/** Link de busca do Google Maps para um endereço. */
export function mapsHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// ---------- ordem da lista ----------

/** Ordens da lista de clientes (`?sort=` na URL). */
export const CLIENT_SORTS = ["recent", "name", "value"] as const;
export type ClientSort = (typeof CLIENT_SORTS)[number];

export const SORT_LABELS: Record<ClientSort, string> = {
  recent: "Recent activity",
  name: "Name (A–Z)",
  value: "Highest value",
};

export function isClientSort(value: string): value is ClientSort {
  return (CLIENT_SORTS as readonly string[]).includes(value);
}

type Sortable = Pick<Client, "id" | "name" | "lastActivityAt" | "totalJobsCents">;

const byRecent = (a: Sortable, b: Sortable) =>
  Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt) || a.id.localeCompare(b.id);

/**
 * Nova lista na ordem pedida: "recent" = último contato primeiro; "name" = A–Z sem diferença de
 * maiúsculas e acentos; "value" = maior soma de serviços primeiro (empate: último contato).
 */
export function sortClients<T extends Sortable>(clients: readonly T[], sort: ClientSort): T[] {
  const list = [...clients];
  if (sort === "name") {
    return list.sort(
      (a, b) => a.name.localeCompare(b.name, "en-US", { sensitivity: "base" }) || byRecent(a, b),
    );
  }
  if (sort === "value") {
    return list.sort((a, b) => b.totalJobsCents - a.totalJobsCents || byRecent(a, b));
  }
  return list.sort(byRecent);
}

/** Letras do avatar: iniciais do primeiro e do último nome ("Ana Lima" → "AL"). */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.charAt(0) ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/** Link do Google Maps com a rota até o endereço (abre o app de mapas no celular). */
export function directionsHref(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

/** Texto das etiquetas digitado com vírgulas → lista (a limpeza final é do servidor). */
export function parseTagsInput(input: string): string[] {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

// ---------- responder ao cliente (botão "Reply") ----------

export type ReplyTemplateId = "confirm" | "details" | "quote";

export const REPLY_TEMPLATES: readonly { id: ReplyTemplateId; label: string }[] = [
  { id: "confirm", label: "Confirm the job" },
  { id: "details", label: "Ask for details" },
  { id: "quote", label: "Send a quote soon" },
];

/** Dia e hora marcados pelo dono ("AAAA-MM-DD" e "HH:MM", ambos opcionais). */
export type ReplyWhen = { date: string; time: string };

/** "Tuesday, Oct 21 at 2:30 PM" (só a parte preenchida). Vazio se nada foi escolhido. */
export function formatReplyWhen(when: ReplyWhen): string {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(when.date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(when.time);
  let day = "";
  if (dateMatch) {
    const [, y, m, d] = dateMatch;
    day = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))));
  }
  let clock = "";
  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = timeMatch[2];
    clock = `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${hours < 12 ? "AM" : "PM"}`;
  }
  if (day && clock) return `${day} at ${clock}`;
  return day || (clock ? `at ${clock}` : "");
}

/**
 * Assunto e texto prontos de cada modelo de resposta. Só entra o que o dono informou: nome da
 * empresa, telefone e o dia/hora que ele escolheu (sem data escolhida, o texto não promete data).
 */
export function buildReplyTemplate({
  template,
  firstName,
  company,
  phone,
  when,
}: {
  template: ReplyTemplateId;
  firstName?: string | null;
  company?: string | null;
  phone?: string | null;
  when?: ReplyWhen | null;
}): { subject: string; message: string } {
  const name = firstName?.trim() || "there";
  const business = company?.trim() || "us";
  const contact = phone?.trim()
    ? `Reply here or call ${phone.trim()}`
    : "Just reply to this message";
  const subject = company?.trim()
    ? `Your request with ${company.trim()}`
    : "Your request";

  if (template === "details") {
    return {
      subject,
      message: `Hi ${name}, thanks for reaching out to ${business}! To get you on the schedule, could you tell us a bit more about the job, like what needs to be done and the address? ${contact} with any details.`,
    };
  }
  if (template === "quote") {
    return {
      subject,
      message: `Hi ${name}, thanks for reaching out to ${business}! We received your request and will send you a quote soon. ${contact} if you want to add anything.`,
    };
  }
  const whenText = when ? formatReplyWhen(when) : "";
  const plan = whenText
    ? `We can do it ${whenText.startsWith("at ") ? "" : "on "}${whenText}. We'll see you then.`
    : "We'd be glad to help and will confirm a day and time with you shortly.";
  return {
    subject: whenText
      ? company?.trim()
        ? `Confirming your request with ${company.trim()}`
        : "Confirming your request"
      : subject,
    message: `Hi ${name}, thanks for reaching out to ${business}! We received your request. ${plan} ${contact} to change anything.`,
  };
}
