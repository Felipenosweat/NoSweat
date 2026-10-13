import { normalizeSupabaseUrl } from "../store/supabase";

// Aviso por e-mail ao dono quando chega um pedido pelo formulário do site.
// Envio pela API HTTP da Resend (sem SDK). Sem RESEND_API_KEY, não faz nada.
// Nunca lança erro: o pedido já foi salvo e aparece em /sites/[id] de qualquer jeito.

export const DEFAULT_LEADS_FROM = "NoSweat <leads@nosweatfd.com>";
const TIMEOUT_MS = 5_000;

export type LeadEmailInput = {
  siteId: string;
  siteName: string;
  ownerId: string | null;
  /** E-mail do negócio no SiteSpec: usado se não acharmos o e-mail da conta do dono. */
  fallbackEmail?: string | null;
  lead: { name: string; email: string | null; phone: string | null; message: string };
  /** Origem do app (ex.: https://nosweatfd.com) para o link do painel. */
  appOrigin: string;
};

/** Variáveis usadas (aceita `process.env` direto; nos testes, um objeto simples). */
export type NotifyEnv = {
  [key: string]: string | undefined;
  RESEND_API_KEY?: string;
  LEADS_FROM_EMAIL?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

export type NotifyResult =
  | { sent: true; to: string }
  | { sent: false; reason: "not_configured" | "no_recipient" | "send_failed" };

/** Remove quebras de linha (cabeçalho do e-mail) e limita o tamanho. */
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

/** Assunto e corpo (texto e HTML simples) do aviso. */
export function buildLeadEmail(input: LeadEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const { lead } = input;
  const link = `${input.appOrigin.replace(/\/+$/, "")}/sites/${input.siteId}`;
  const rows: [string, string][] = [
    ["Name", lead.name],
    ["Phone", lead.phone || "-"],
    ["Email", lead.email || "-"],
  ];

  const subject = `New request from your website: ${oneLine(lead.name)}`;
  const text = [
    `You have a new request from ${input.siteName}'s website.`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    lead.message,
    "",
    `See all requests: ${link}`,
  ].join("\n");

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;max-width:560px">
<p>You have a new request from <strong>${escapeHtml(input.siteName)}</strong>'s website.</p>
<table cellpadding="4" style="border-collapse:collapse">
${rows
  .map(
    ([label, value]) =>
      `<tr><td style="color:#666;padding-right:12px">${label}</td><td>${escapeHtml(value)}</td></tr>`,
  )
  .join("\n")}
</table>
<p style="color:#666;margin-bottom:4px">Message</p>
<p style="white-space:pre-wrap;margin-top:0">${escapeHtml(lead.message)}</p>
<p><a href="${escapeHtml(link)}">See all requests</a></p>
</div>`;

  return { subject, text, html };
}

/** E-mail da conta do dono pela API admin do Supabase Auth (service role). `null` se falhar. */
export async function findOwnerEmail(
  ownerId: string,
  env: NotifyEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetchImpl(
      `${normalizeSupabaseUrl(url)}/auth/v1/admin/users/${encodeURIComponent(ownerId)}`,
      {
        cache: "no-store",
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { email?: unknown; user?: { email?: unknown } };
    const email = body.email ?? body.user?.email;
    return typeof email === "string" && email.includes("@") ? email : null;
  } catch {
    return null;
  }
}

/** Envia o aviso. Sem chave ou sem destinatário, só pula. Nunca lança. */
export async function sendLeadNotification(
  input: LeadEmailInput,
  env: NotifyEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<NotifyResult> {
  try {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) return { sent: false, reason: "not_configured" };

    const ownerEmail = input.ownerId ? await findOwnerEmail(input.ownerId, env, fetchImpl) : null;
    const to = ownerEmail ?? input.fallbackEmail ?? null;
    if (!to) return { sent: false, reason: "no_recipient" };

    const { subject, text, html } = buildLeadEmail(input);
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.LEADS_FROM_EMAIL || DEFAULT_LEADS_FROM,
        to: [to],
        subject,
        text,
        html,
        // "Responder" no e-mail vai direto para o cliente que pediu.
        ...(input.lead.email ? { reply_to: input.lead.email } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[notify] Resend failed (${res.status}): ${await res.text()}`);
      return { sent: false, reason: "send_failed" };
    }
    return { sent: true, to };
  } catch (error) {
    console.error("[notify] lead email failed", error);
    return { sent: false, reason: "send_failed" };
  }
}
