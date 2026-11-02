import { replyFromAddress } from "./client-reply-email";
import {
  DEFAULT_LEADS_FROM,
  findOwnerEmail,
  type NotifyEnv,
  type NotifyResult,
} from "./lead-email";

// Avisos de uma marcação feita pelo site (agendamento online): um e-mail para o DONO (nova
// marcação) e outro para o CLIENTE que informou e-mail (detalhes + link para cancelar). Mesma API
// HTTP da Resend dos outros avisos (sem SDK); sem RESEND_API_KEY não faz nada e nunca lança erro:
// a marcação já foi salva e aparece na agenda do dono de qualquer jeito.

const TIMEOUT_MS = 5_000;

export type BookingEmailInput = {
  ownerId: string;
  businessName: string;
  businessPhone: string | null;
  /** E-mail da empresa: "Responder" do cliente chega nele; também é o destino se não acharmos o da conta. */
  businessEmail: string | null;
  serviceName: string;
  staffName: string | null;
  /** Início da marcação (ISO). */
  startAt: string;
  /** Fuso da empresa (IANA): a hora dos e-mails é a dela. */
  timeZone: string;
  customer: { name: string; phone: string; email: string | null; notes: string };
  /** Link público do cliente: `${appOrigin}/booking/<token>`. */
  token: string;
  /** Origem do app (ex.: https://nosweatfd.com). */
  appOrigin: string;
};

export type BookingEmailResult = { owner: NotifyResult; customer: NotifyResult };

function oneLine(value: string, max = 80): string {
  return value
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, max);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** "Tue Dec 3, 3:30 PM" no fuso da empresa (montado à mão: o espaço antes de AM/PM é um espaço comum). */
export function formatWhen(startAt: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(startAt));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("weekday")} ${get("month")} ${get("day")}, ${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
}

const origin = (input: BookingEmailInput) => input.appOrigin.replace(/\/+$/, "");
export const bookingLink = (input: BookingEmailInput) =>
  `${origin(input)}/booking/${encodeURIComponent(input.token)}`;

const WRAP =
  "font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;max-width:560px";

function table(rows: [string, string][]): string {
  return `<table cellpadding="4" style="border-collapse:collapse">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="color:#666;padding-right:12px">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`,
  )
  .join("\n")}
</table>`;
}

/** E-mail para o dono: "New booking: Haircut · Ana Lima · Tue Dec 3, 3:30 PM". */
export function buildOwnerBookingEmail(input: BookingEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const when = formatWhen(input.startAt, input.timeZone);
  const { customer } = input;
  const rows: [string, string][] = [
    ["Service", input.serviceName],
    ["When", when],
    ...(input.staffName ? ([["With", input.staffName]] as [string, string][]) : []),
    ["Name", customer.name],
    ["Phone", customer.phone],
    ["Email", customer.email || "-"],
    ...(customer.notes ? ([["Notes", customer.notes]] as [string, string][]) : []),
  ];
  const link = `${origin(input)}/schedule`;
  const subject = `New booking: ${oneLine(input.serviceName)} · ${oneLine(customer.name)} · ${when}`;
  const text = [
    "A customer booked a time on your website.",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Open your schedule: ${link}`,
  ].join("\n");
  const html = `<div style="${WRAP}">
<p>A customer booked a time on <strong>${escapeHtml(input.businessName)}</strong>'s website.</p>
${table(rows)}
<p><a href="${escapeHtml(link)}">Open your schedule</a></p>
</div>`;
  return { subject, text, html };
}

/** E-mail para o cliente: os detalhes, o telefone da empresa e o link para ver ou cancelar. */
export function buildCustomerBookingEmail(input: BookingEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const when = formatWhen(input.startAt, input.timeZone);
  const link = bookingLink(input);
  const rows: [string, string][] = [
    ["Service", input.serviceName],
    ["When", when],
    ...(input.staffName ? ([["With", input.staffName]] as [string, string][]) : []),
    ["Where", input.businessName],
  ];
  const subject = `Booking confirmed: ${oneLine(input.serviceName)} · ${when}`;
  const call = input.businessPhone ? `Questions? Call ${input.businessPhone}.` : "";
  const text = [
    `Hi ${customerFirstName(input.customer.name)}, your appointment with ${input.businessName} is booked.`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Need to cancel? Use this link: ${link}`,
    ...(call ? ["", call] : []),
  ].join("\n");
  const html = `<div style="${WRAP}">
<p>Hi ${escapeHtml(customerFirstName(input.customer.name))}, your appointment with <strong>${escapeHtml(input.businessName)}</strong> is booked.</p>
${table(rows)}
<p><a href="${escapeHtml(link)}">See or cancel your appointment</a></p>
${call ? `<p>${escapeHtml(call)}</p>` : ""}
</div>`;
  return { subject, text, html };
}

function customerFirstName(name: string): string {
  return oneLine(name, 60).split(" ")[0] || "there";
}

async function post(
  apiKey: string,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    console.error(`[notify] Resend failed (${res.status}): ${await res.text()}`);
    return false;
  }
  return true;
}

/**
 * Manda os dois e-mails (o do cliente só se ele deu e-mail). Sem chave, pula os dois. Um não
 * depende do outro, e nada aqui lança.
 */
export async function sendBookingNotifications(
  input: BookingEmailInput,
  env: NotifyEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<BookingEmailResult> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      owner: { sent: false, reason: "not_configured" },
      customer: { sent: false, reason: "not_configured" },
    };
  }
  return {
    owner: await sendToOwner(apiKey, input, env, fetchImpl),
    customer: await sendToCustomer(apiKey, input, env, fetchImpl),
  };
}

async function sendToOwner(
  apiKey: string,
  input: BookingEmailInput,
  env: NotifyEnv,
  fetchImpl: typeof fetch,
): Promise<NotifyResult> {
  try {
    const to = (await findOwnerEmail(input.ownerId, env, fetchImpl)) ?? input.businessEmail;
    if (!to) {
      console.warn(`[notify] no recipient for the booking e-mail of owner ${input.ownerId}`);
      return { sent: false, reason: "no_recipient" };
    }
    const { subject, text, html } = buildOwnerBookingEmail(input);
    const ok = await post(
      apiKey,
      {
        from: env.LEADS_FROM_EMAIL || DEFAULT_LEADS_FROM,
        to: [to],
        subject,
        text,
        html,
        // "Responder" no e-mail vai direto para o cliente que marcou.
        ...(input.customer.email ? { reply_to: input.customer.email } : {}),
      },
      fetchImpl,
    );
    return ok ? { sent: true, to } : { sent: false, reason: "send_failed" };
  } catch (error) {
    console.error("[notify] booking owner email failed", error);
    return { sent: false, reason: "send_failed" };
  }
}

async function sendToCustomer(
  apiKey: string,
  input: BookingEmailInput,
  env: NotifyEnv,
  fetchImpl: typeof fetch,
): Promise<NotifyResult> {
  const to = input.customer.email;
  if (!to) return { sent: false, reason: "no_recipient" };
  try {
    const { subject, text, html } = buildCustomerBookingEmail(input);
    const ok = await post(
      apiKey,
      {
        from: replyFromAddress(input.businessName, env),
        to: [to],
        subject,
        text,
        html,
        // "Responder" do cliente chega na empresa.
        ...(input.businessEmail ? { reply_to: input.businessEmail } : {}),
      },
      fetchImpl,
    );
    return ok ? { sent: true, to } : { sent: false, reason: "send_failed" };
  } catch (error) {
    console.error("[notify] booking customer email failed", error);
    return { sent: false, reason: "send_failed" };
  }
}
