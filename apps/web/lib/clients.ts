import type { ClientStage } from "@nosweat/schema";

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
