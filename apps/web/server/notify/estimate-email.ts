import {
  DEFAULT_LEADS_FROM,
  findOwnerEmail,
  type NotifyEnv,
  type NotifyResult,
} from "./lead-email";

// Aviso por e-mail ao dono quando o cliente final aprova ou recusa um orçamento pelo link (/q).
// Mesmo caminho do aviso de pedido do site: API HTTP da Resend, sem SDK; sem RESEND_API_KEY não
// faz nada. Nunca lança erro: a resposta do cliente já foi salva e aparece no painel.

const TIMEOUT_MS = 5_000;

export type EstimateAnswerInput = {
  ownerId: string;
  estimateId: string;
  number: number;
  title: string;
  clientName: string;
  decision: "approved" | "declined";
  /** Nome que o cliente digitou ao aprovar. */
  approvedByName: string | null;
  /** Motivo da recusa (opcional, escrito pelo cliente). */
  declineReason: string | null;
  totalCents: number;
  /** E-mail da empresa (configurações do escritório): usado se não acharmos o da conta. */
  fallbackEmail: string | null;
  /** Origem do app (ex.: https://nosweatfd.com) para o link do painel. */
  appOrigin: string;
};

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

function money(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** Assunto e corpo (texto e HTML simples) do aviso. */
export function buildEstimateAnswerEmail(input: EstimateAnswerInput): {
  subject: string;
  text: string;
  html: string;
} {
  const link = `${input.appOrigin.replace(/\/+$/, "")}/estimates/${encodeURIComponent(input.estimateId)}`;
  const client = oneLine(input.clientName);
  const approved = input.decision === "approved";
  const what = `estimate #${input.number}${input.title ? ` (${oneLine(input.title)})` : ""}`;
  const subject = approved
    ? `${client} approved estimate #${input.number}`
    : `${client} declined estimate #${input.number}`;
  const lines = approved
    ? [
        `Good news: ${input.clientName} approved ${what} for ${money(input.totalCents)}.`,
        input.approvedByName ? `Signed by: ${input.approvedByName}` : null,
        "",
        "Next step: book the job or send the invoice.",
      ]
    : [
        `${input.clientName} declined ${what} for ${money(input.totalCents)}.`,
        input.declineReason ? `Their reason: ${input.declineReason}` : null,
        "",
        "You could call them to talk it over, or send a new estimate.",
      ];
  const body = lines.filter((line): line is string => line !== null);
  const text = [...body, "", `Open the estimate: ${link}`].join("\n");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;max-width:560px">
${body
  .filter((line) => line !== "")
  .map((line) => `<p>${escapeHtml(line)}</p>`)
  .join("\n")}
<p><a href="${escapeHtml(link)}">Open the estimate</a></p>
</div>`;
  return { subject, text, html };
}

/** Envia o aviso. Sem chave ou sem destinatário, só pula. Nunca lança. */
export async function sendEstimateAnswerNotification(
  input: EstimateAnswerInput,
  env: NotifyEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<NotifyResult> {
  try {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) return { sent: false, reason: "not_configured" };
    const to = (await findOwnerEmail(input.ownerId, env, fetchImpl)) ?? input.fallbackEmail;
    if (!to) {
      console.warn(`[notify] no recipient for the estimate e-mail ${input.estimateId}`);
      return { sent: false, reason: "no_recipient" };
    }
    const { subject, text, html } = buildEstimateAnswerEmail(input);
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.LEADS_FROM_EMAIL || DEFAULT_LEADS_FROM,
        to: [to],
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[notify] Resend failed (${res.status}): ${await res.text()}`);
      return { sent: false, reason: "send_failed" };
    }
    return { sent: true, to };
  } catch (error) {
    console.error("[notify] estimate email failed", error);
    return { sent: false, reason: "send_failed" };
  }
}
