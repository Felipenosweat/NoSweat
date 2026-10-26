import type {
  Estimate,
  EstimateStatus,
  Invoice,
  InvoiceStatus,
  LineItem,
  PaymentMethod,
} from "@nosweat/schema";
import { dateKeyIn, formatCents, formatDateOnly, parseDollars, phoneHref } from "./clients";

// Peças puras do "escritório" (orçamentos, faturas, tabela de preços): rótulos e cores de status,
// filtros das listas, imposto em % ↔ pontos-base, links de SMS/e-mail. Sem React e sem servidor:
// servem para server e client components. Dinheiro sempre em centavos.

export { dateKeyIn, formatCents, formatDateOnly, parseDollars, phoneHref };

/** Tons do <GlassBadge /> usados pelos status. */
export type StatusTone = "live" | "draft" | "pending" | "info" | "danger" | "neutral";

// ---------- orçamentos ----------

export const ESTIMATE_STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: "Draft",
  sent: "Waiting",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
};

export const ESTIMATE_STATUS_TONES: Record<EstimateStatus, StatusTone> = {
  draft: "draft",
  sent: "info",
  approved: "live",
  declined: "danger",
  expired: "neutral",
};

/** Filtros da lista de orçamentos (`?status=` na URL). */
export const ESTIMATE_FILTERS = ["all", "draft", "waiting", "approved", "declined"] as const;
export type EstimateFilter = (typeof ESTIMATE_FILTERS)[number];

export const ESTIMATE_FILTER_LABELS: Record<EstimateFilter, string> = {
  all: "All",
  draft: "Drafts",
  waiting: "Waiting",
  approved: "Approved",
  declined: "Declined",
};

export function isEstimateFilter(value: string): value is EstimateFilter {
  return (ESTIMATE_FILTERS as readonly string[]).includes(value);
}

/**
 * `?status=` da URL → filtro. Aceita também os status do contrato (o painel inicial linka
 * `?status=sent`): sent → Waiting, expired → Declined. Desconhecido = "all".
 */
export function parseEstimateFilter(value: string): EstimateFilter {
  if (isEstimateFilter(value)) return value;
  if (value === "sent") return "waiting";
  if (value === "expired") return "declined";
  return "all";
}

/** O orçamento entra no filtro? "Declined" junta recusados e vencidos (não viraram serviço). */
export function matchesEstimateFilter(status: EstimateStatus, filter: EstimateFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "draft":
      return status === "draft";
    case "waiting":
      return status === "sent";
    case "approved":
      return status === "approved";
    case "declined":
      return status === "declined" || status === "expired";
  }
}

/**
 * Itens só mudam em rascunho e enviado (regra do contrato). "Vencido" é um enviado que passou da
 * validade (calculado na leitura): editar deixa o dono dar mais prazo.
 */
export function estimateItemsEditable(status: EstimateStatus): boolean {
  return status === "draft" || status === "sent" || status === "expired";
}

// ---------- faturas ----------

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Unpaid",
  partial: "Partly paid",
  overdue: "Overdue",
  paid: "Paid",
  void: "Void",
};

export const INVOICE_STATUS_TONES: Record<InvoiceStatus, StatusTone> = {
  draft: "draft",
  sent: "info",
  partial: "pending",
  overdue: "danger",
  paid: "live",
  void: "neutral",
};

/** Filtros da lista de faturas (`?status=` na URL). */
export const INVOICE_FILTERS = ["all", "unpaid", "overdue", "paid", "draft"] as const;
export type InvoiceFilter = (typeof INVOICE_FILTERS)[number];

export const INVOICE_FILTER_LABELS: Record<InvoiceFilter, string> = {
  all: "All",
  unpaid: "Unpaid",
  overdue: "Overdue",
  paid: "Paid",
  draft: "Drafts",
};

export function isInvoiceFilter(value: string): value is InvoiceFilter {
  return (INVOICE_FILTERS as readonly string[]).includes(value);
}

/**
 * `?status=` da URL → filtro. Aceita também os status do contrato: sent/partial → Unpaid.
 * Desconhecido (inclusive "void") = "all".
 */
export function parseInvoiceFilter(value: string): InvoiceFilter {
  if (isInvoiceFilter(value)) return value;
  if (value === "sent" || value === "partial") return "unpaid";
  return "all";
}

/** Fatura enviada que ainda tem saldo (inclui as vencidas e as pagas em parte). */
export function isUnpaidStatus(status: InvoiceStatus): boolean {
  return status === "sent" || status === "partial" || status === "overdue";
}

export function matchesInvoiceFilter(status: InvoiceStatus, filter: InvoiceFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "unpaid":
      return isUnpaidStatus(status);
    case "overdue":
      return status === "overdue";
    case "paid":
      return status === "paid";
    case "draft":
      return status === "draft";
  }
}

/** Itens da fatura só mudam sem pagamento registrado e antes de paga/anulada. */
export function invoiceItemsEditable(invoice: Pick<Invoice, "status" | "payments">): boolean {
  return invoice.payments.length === 0 && invoice.status !== "paid" && invoice.status !== "void";
}

/** "$X unpaid · $Y overdue" do topo da lista (saldo, não o total). */
export function invoiceBalances(invoices: readonly Pick<Invoice, "status" | "balanceCents">[]): {
  unpaidCents: number;
  unpaidCount: number;
  overdueCents: number;
  overdueCount: number;
} {
  let unpaidCents = 0;
  let unpaidCount = 0;
  let overdueCents = 0;
  let overdueCount = 0;
  for (const invoice of invoices) {
    if (!isUnpaidStatus(invoice.status)) continue;
    const balance = Math.max(0, invoice.balanceCents);
    unpaidCents += balance;
    unpaidCount += 1;
    if (invoice.status === "overdue") {
      overdueCents += balance;
      overdueCount += 1;
    }
  }
  return { unpaidCents, unpaidCount, overdueCents, overdueCount };
}

// ---------- pagamentos ----------

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  "cash",
  "check",
  "card",
  "zelle",
  "venmo",
  "cashapp",
  "other",
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  check: "Check",
  card: "Card",
  zelle: "Zelle",
  venmo: "Venmo",
  cashapp: "Cash App",
  other: "Other",
};

/** Dica do campo "Reference" para cada forma de pagamento. */
export const PAYMENT_REFERENCE_HINTS: Record<PaymentMethod, string> = {
  cash: "Optional note",
  check: "Check number",
  card: "Last 4 digits",
  zelle: "Confirmation code",
  venmo: "Transaction ID",
  cashapp: "Transaction ID",
  other: "Optional note",
};

// ---------- imposto (% ↔ pontos-base) ----------

/** Teto do contrato: 30%. */
export const MAX_TAX_RATE_BPS = 3000;

/** 825 → "8.25"; 800 → "8"; 0 → "0" (para o campo de texto). */
export function bpsToPercentInput(bps: number): string {
  return String(Number((bps / 100).toFixed(2)));
}

/** 825 → "8.25%". */
export function formatTaxRate(bps: number): string {
  return `${bpsToPercentInput(bps)}%`;
}

/**
 * "8.25" ou "8.25%" → 825. `null` = vazio; `undefined` = inválido (mais de 2 casas ou acima de 30%).
 */
export function parsePercentToBps(input: string): number | null | undefined {
  const clean = input.replace(/[%\s]/g, "");
  if (clean === "") return null;
  if (!/^\d{1,2}(\.\d{1,2})?$|^\.\d{1,2}$/.test(clean)) return undefined;
  const bps = Math.round(Number(clean) * 100);
  return bps <= MAX_TAX_RATE_BPS ? bps : undefined;
}

// ---------- quantidade e linhas ----------

/** "1.5" → 1.5. Até 2 casas, maior que zero e até 100.000 (contrato). `undefined` = inválido. */
export function parseQuantity(input: string): number | undefined {
  const clean = input.replace(/[,\s]/g, "");
  if (!/^\d{1,6}(\.\d{1,2})?$|^\.\d{1,2}$/.test(clean)) return undefined;
  const value = Number(clean);
  return value > 0 && value <= 100_000 ? value : undefined;
}

/** 1.5 → "1.5"; 2 → "2". */
export function formatQuantity(quantity: number): string {
  return String(Number(quantity.toFixed(2)));
}

/** Valor da linha (mesma regra do `computeTotals`). */
export function lineTotalCents(item: Pick<LineItem, "quantity" | "unitPriceCents">): number {
  return Math.round(item.quantity * item.unitPriceCents);
}

/** Centavos → texto do campo de dinheiro ("1250.5" vira "1250.50"; 0 vira ""). */
export function centsToInput(cents: number, emptyWhenZero = false): string {
  if (emptyWhenZero && cents === 0) return "";
  return (cents / 100).toFixed(2);
}

// ---------- datas ----------

/** "2026-10-26" + 30 dias → "2026-11-25" (sem fuso: conta em UTC). */
export function addDays(date: string, days: number): string {
  const [y = 2000, m = 1, d = 1] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return next.toISOString().slice(0, 10);
}

// ---------- listas ----------

/** Endereço da lista com os filtros (o padrão "all" e a busca vazia saem da URL). */
export function officeListHref(base: string, params: { status: string; q: string }): string {
  const search = new URLSearchParams();
  if (params.status !== "all") search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

/** Primeiro valor de um parâmetro da URL (`?q=a&q=b` → "a"). */
export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

// ---------- números e busca ----------

export function estimateLabel(number: number): string {
  return `Estimate #${number}`;
}

export function invoiceLabel(number: number): string {
  return `Invoice #${number}`;
}

type SearchableDocument = { number: number; clientName: string; title: string };

/** Busca por cliente, título ou número ("1004", "#1004"), sem diferença de maiúsculas. */
export function searchDocuments<T extends SearchableDocument>(list: readonly T[], q: string): T[] {
  const query = q.trim().toLowerCase();
  if (!query) return [...list];
  const digits = query.replace(/^#/, "");
  return list.filter(
    (doc) =>
      doc.clientName.toLowerCase().includes(query) ||
      doc.title.toLowerCase().includes(query) ||
      (/^\d+$/.test(digits) && String(doc.number).includes(digits)),
  );
}

/** Soma do total de uma lista de orçamentos. */
export function sumTotals(list: readonly Pick<Estimate, "totalCents">[]): number {
  return list.reduce((sum, doc) => sum + doc.totalCents, 0);
}

// ---------- compartilhar o link ----------

/** Mensagem curta para SMS/e-mail com o link do documento. */
export function shareMessage(input: {
  kind: "estimate" | "invoice";
  companyName: string;
  clientName: string;
  number: number;
  url: string;
  totalCents?: number;
}): string {
  const first = input.clientName.trim().split(/\s+/)[0] ?? "";
  const hi = first ? `Hi ${first}, ` : "Hi, ";
  const from = input.companyName.trim() ? ` from ${input.companyName.trim()}` : "";
  const what =
    input.kind === "estimate"
      ? `here's your estimate #${input.number}${from}`
      : `here's your invoice #${input.number}${from}`;
  const amount =
    input.totalCents !== undefined && input.totalCents > 0
      ? ` (${formatCents(input.totalCents)})`
      : "";
  return `${hi}${what}${amount}: ${input.url}`;
}

/**
 * Link de SMS com texto pronto. "?&body=" funciona no iPhone e no Android; sem telefone abre o
 * app de mensagens para a pessoa escolher o contato.
 */
export function smsHref(phone: string | null, body: string): string {
  const to = phone ? phoneHref(phone) : "";
  return `sms:${to}?&body=${encodeURIComponent(body)}`;
}

export function mailtoHref(email: string | null, subject: string, body: string): string {
  const to = email ? encodeURIComponent(email).replace(/%40/g, "@") : "";
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---------- fusos dos EUA ----------

export const US_TIME_ZONES: readonly { value: string; label: string }[] = [
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Phoenix", label: "Mountain Time (Arizona, no DST)" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
  { value: "America/Puerto_Rico", label: "Atlantic Time (Puerto Rico)" },
];
