import { DEFAULT_LEADS_FROM, type NotifyEnv } from "./lead-email";

// E-mail do dono para o cliente dele (resposta a um pedido do site, confirmação de serviço).
// Mesma API HTTP da Resend dos outros avisos (sem SDK). Diferente do aviso de pedido, aqui quem
// pede o envio está esperando na tela: o resultado diz o motivo da falha para a rota responder.

const TIMEOUT_MS = 8_000;

export type ClientReplyEmailInput = {
  to: string;
  /** E-mail do dono/empresa: "Responder" do cliente chega nele. */
  replyTo: string;
  /** Nome da empresa, mostrado como remetente. */
  companyName: string;
  subject: string;
  message: string;
};

export type ClientReplyEmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "send_failed" };

/** Uma linha só, sem aspas nem colchetes (nome que vai no cabeçalho `From`). */
function displayName(value: string): string {
  return value
    .replace(/[\r\n"<>\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Remetente: o endereço do envio da plataforma (`LEADS_FROM_EMAIL`) com o nome da empresa do dono.
 * Ex.: "NoSweat <leads@nosweatfd.com>" + "Joe's Plumbing" → "Joe's Plumbing <leads@nosweatfd.com>".
 */
export function replyFromAddress(companyName: string, env: NotifyEnv): string {
  const base = env.LEADS_FROM_EMAIL || DEFAULT_LEADS_FROM;
  const match = /<([^<>\s]+@[^<>\s]+)>/.exec(base);
  const address = match?.[1] ?? (base.includes("@") ? base.trim() : null);
  const name = displayName(companyName);
  if (!address || !name) return base;
  return `${name} <${address}>`;
}

/** Texto e HTML simples do e-mail: só o que o dono escreveu (nada de rodapé inventado). */
export function buildClientReplyEmail(input: Pick<ClientReplyEmailInput, "subject" | "message">): {
  subject: string;
  text: string;
  html: string;
} {
  const message = input.message.trim();
  return {
    subject: oneLine(input.subject).slice(0, 150),
    text: message,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;max-width:560px"><p style="white-space:pre-wrap;margin:0">${escapeHtml(message)}</p></div>`,
  };
}

/** Envia pela Resend. Sem chave: `not_configured` (a rota responde 503). Nunca lança. */
export async function sendClientReplyEmail(
  input: ClientReplyEmailInput,
  env: NotifyEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<ClientReplyEmailResult> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "not_configured" };
  try {
    const { subject, text, html } = buildClientReplyEmail(input);
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: replyFromAddress(input.companyName, env),
        to: [input.to],
        subject,
        text,
        html,
        reply_to: input.replyTo,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[notify] client reply failed (${res.status}): ${await res.text()}`);
      return { sent: false, reason: "send_failed" };
    }
    return { sent: true };
  } catch (error) {
    console.error("[notify] client reply failed", error);
    return { sent: false, reason: "send_failed" };
  }
}
