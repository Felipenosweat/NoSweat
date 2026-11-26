import { z } from "zod";

// "Como os clientes pagam": INFORMATIVO. O dono diz que formas aceita (e, para algumas, o
// identificador público); o site, os e-mails de confirmação e as faturas só mostram. Nada é
// cobrado aqui e nenhum número de cartão ou conta é coletado (PCI fora de escopo).
// Só acrescenta campos opcionais ao resto do schema.

export const PAYMENT_METHODS = [
  "cash",
  "card",
  "check",
  "zelle",
  "venmo",
  "cash_app",
  "paypal",
] as const;
export const PaymentMethod = z.enum(PAYMENT_METHODS);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

/** Formas que aceitam um identificador público (as outras não têm campo). */
export const PAYMENT_HANDLE_METHODS = ["zelle", "venmo", "cash_app", "paypal"] as const;

/** Nome mostrado nos pills do site (inglês dos EUA). */
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Credit & debit cards",
  check: "Check",
  zelle: "Zelle",
  venmo: "Venmo",
  cash_app: "Cash App",
  paypal: "PayPal",
};

/** Como a forma entra numa frase ("We accept cash, checks and Zelle"). */
const PAYMENT_PHRASES: Record<PaymentMethod, string> = {
  cash: "cash",
  card: "credit & debit cards",
  check: "checks",
  zelle: "Zelle",
  venmo: "Venmo",
  cash_app: "Cash App",
  paypal: "PayPal",
};

/** Dica de como é o identificador de cada forma (para o assistente do dono). */
export const PAYMENT_HANDLE_HINTS: Record<(typeof PAYMENT_HANDLE_METHODS)[number], string> = {
  zelle: "Phone or e-mail for Zelle",
  venmo: "@username",
  cash_app: "$cashtag",
  paypal: "https://paypal.me/yourname",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const US_PHONE = /^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
const VENMO = /^@[A-Za-z0-9_-]{2,30}$/;
const CASH_TAG = /^\$[A-Za-z][A-Za-z0-9_]{0,19}$/;
const PAYPAL_ME = /^https:\/\/(www\.)?paypal\.me\/[A-Za-z0-9._-]{1,40}$/;

/**
 * Parece número de cartão ou de conta? 12 ou mais dígitos seguidos (aceita um espaço ou hífen
 * entre eles) ou as palavras "routing number" / "account number". Telefone com o código do
 * país (11 dígitos) passa.
 */
export function looksLikeAccountNumber(value: string): boolean {
  return /(?:\d[ -]?){11}\d/.test(value) || /\b(routing|account)\s*(number|no\.?|#)/i.test(value);
}

/** O identificador tem o formato certo para a forma de pagamento? (Solto, de propósito.) */
export function isPaymentHandleValid(method: PaymentMethod, handle: string): boolean {
  const value = handle.trim();
  if (!value || looksLikeAccountNumber(value)) return false;
  switch (method) {
    case "zelle":
      return EMAIL.test(value) || US_PHONE.test(value);
    case "venmo":
      return VENMO.test(value);
    case "cash_app":
      return CASH_TAG.test(value);
    case "paypal":
      return PAYPAL_ME.test(value);
    default:
      return false;
  }
}

/** Mensagem (para pessoas) quando o identificador não vale. */
export function paymentHandleMessage(method: PaymentMethod): string {
  switch (method) {
    case "zelle":
      return "Use the phone number or e-mail you receive Zelle with.";
    case "venmo":
      return "Use your Venmo username, like @yourname.";
    case "cash_app":
      return "Use your Cash App $cashtag, like $yourname.";
    case "paypal":
      return "Use your PayPal.me link, like https://paypal.me/yourname.";
    default:
      return "This payment method does not need a username.";
  }
}

export const PaymentEntry = z
  .object({
    method: PaymentMethod,
    /** Identificador público (Zelle: telefone/e-mail; Venmo: @usuario; Cash App: $cashtag; PayPal: link paypal.me). */
    handle: z.string().trim().max(80).optional(),
  })
  .superRefine((entry, ctx) => {
    if (entry.handle === undefined || entry.handle === "") return;
    if (!isPaymentHandleValid(entry.method, entry.handle)) {
      ctx.addIssue({
        code: "custom",
        path: ["handle"],
        message: paymentHandleMessage(entry.method),
      });
    }
  });
export type PaymentEntry = z.infer<typeof PaymentEntry>;

export const PaymentSettings = z
  .object({
    methods: z.array(PaymentEntry).max(8),
    /** Aviso curto do dono (ex.: "Cash or Zelle only for jobs under $100."). */
    note: z
      .string()
      .trim()
      .max(160)
      .refine((value) => !looksLikeAccountNumber(value), {
        message: "Please don't put card or bank account numbers here.",
      })
      .optional(),
  })
  .superRefine((payments, ctx) => {
    const seen = new Set<PaymentMethod>();
    payments.methods.forEach((entry, index) => {
      if (seen.has(entry.method)) {
        ctx.addIssue({
          code: "custom",
          path: ["methods", index, "method"],
          message: "Each payment method can be listed only once.",
        });
      }
      seen.add(entry.method);
    });
  });
export type PaymentSettings = z.infer<typeof PaymentSettings>;

/** Tira o "https://" (e "www.") de um link para mostrar curto. */
function shortHandle(handle: string | undefined): string {
  return (handle ?? "").trim().replace(/^https:\/\/(www\.)?/, "");
}

/** Texto de um pill: "Cash", "Zelle · (305) 555-0187", "PayPal · paypal.me/glow". */
export function paymentPill(entry: PaymentEntry): string {
  const label = PAYMENT_LABELS[entry.method];
  const handle = shortHandle(entry.handle);
  return handle ? `${label} · ${handle}` : label;
}

/** Os pills de tudo o que o dono aceita (lista vazia = não mostrar nada). */
export function paymentPills(payments: PaymentSettings | undefined): string[] {
  return (payments?.methods ?? []).map(paymentPill);
}

/**
 * Frase pronta ("We accept cash, Zelle (305-555-0187) and Venmo (@glow). Note."): e-mail de
 * confirmação, página da marcação e instruções de pagamento do escritório. Só o que o dono disse.
 */
export function paymentSentence(payments: PaymentSettings | undefined): string {
  const methods = payments?.methods ?? [];
  if (methods.length === 0) return "";
  const parts = methods.map((entry) => {
    const handle = shortHandle(entry.handle);
    return handle ? `${PAYMENT_PHRASES[entry.method]} (${handle})` : PAYMENT_PHRASES[entry.method];
  });
  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  const note = payments?.note?.trim();
  return `We accept ${list}.${note ? ` ${note}` : ""}`;
}
