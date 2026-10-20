// E-mails do plano liberado à mão (Pix/WhatsApp): "seu plano está ativo" e os lembretes de
// vencimento (server/billing/reminders.ts). Envio pela API HTTP da Resend (sem SDK), como em
// lead-email.ts. Sem RESEND_API_KEY não faz nada. Nunca lança erro.

export const DEFAULT_BILLING_FROM = "No Sweat <billing@nosweatfd.com>";
const DEFAULT_APP_URL = "https://www.nosweatfd.com";
const TIMEOUT_MS = 5_000;

/** Variáveis usadas (aceita `process.env` direto; nos testes, um objeto simples). */
export type AccessEmailEnv = {
  [key: string]: string | undefined;
  RESEND_API_KEY?: string;
  BILLING_FROM_EMAIL?: string;
  APP_URL?: string;
};

export type AccessEmailResult = "sent" | "not_configured" | "failed";

/** `true` quando dá para mandar e-mail (RESEND_API_KEY configurada). */
export function accessEmailConfigured(env: AccessEmailEnv = process.env): boolean {
  return Boolean(env.RESEND_API_KEY);
}

/** Endereço do painel nos links dos e-mails (APP_URL ou www.nosweatfd.com), sem "/" no fim. */
export function accessAppUrl(env: AccessEmailEnv = process.env): string {
  return (env.APP_URL || DEFAULT_APP_URL).replace(/\/+$/, "");
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** HTML simples a partir de parágrafos de texto (links viram <a>). */
export function simpleHtml(paragraphs: string[]): string {
  const body = paragraphs
    .map((paragraph) => {
      const escaped = escapeHtml(paragraph).replace(
        /(https?:\/\/[^\s<]+)/g,
        (url) => `<a href="${url}">${url}</a>`,
      );
      return `<p style="white-space:pre-wrap">${escaped}</p>`;
    })
    .join("\n");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;max-width:560px">\n${body}\n</div>`;
}

/**
 * Envia um e-mail. Sem chave: "not_configured". Erro da Resend ou de rede: "failed" (vai para o
 * log). Nunca lança.
 */
export async function sendAccessEmail(
  to: string,
  subject: string,
  text: string,
  html: string,
  env: AccessEmailEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<AccessEmailResult> {
  try {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) return "not_configured";
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.BILLING_FROM_EMAIL || DEFAULT_BILLING_FROM,
        to: [to],
        subject: subject.replace(/[\r\n]+/g, " ").slice(0, 200),
        text,
        html,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(
        `[notify] Resend failed for an access e-mail (${res.status}): ${await res.text()}`,
      );
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("[notify] access e-mail failed", error);
    return "failed";
  }
}
