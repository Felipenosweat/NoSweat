import { DEFAULT_LEADS_FROM, type NotifyEnv, type NotifyResult } from "./lead-email";

// Aviso para a equipe da No Sweat quando um prospect clica em "Make it yours" na prévia
// (/p/<token>): é o lead mais quente que existe, vale ligar na hora. Vai para SALES_EMAIL (ou
// ALERT_EMAIL). Mesmo caminho dos outros avisos: API HTTP da Resend, sem SDK; sem
// RESEND_API_KEY ou sem destinatário não faz nada. Nunca lança.

const TIMEOUT_MS = 5_000;

export type ProspectClaimInput = {
  business: string;
  phone: string | null;
  email: string | null;
  /** "Austin, TX" */
  city: string | null;
  /** Clicou já logado numa conta (senão, como visitante: ainda vai criar a conta). */
  withAccount: boolean;
  /** Origem do app (ex.: https://nosweatfd.com) para o link do painel. */
  appOrigin: string;
};

function oneLine(value: string, max = 80): string {
  return value
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, max);
}

/** Assunto e corpo (texto puro) do aviso. */
export function buildProspectClaimEmail(input: ProspectClaimInput): {
  subject: string;
  text: string;
} {
  const business = oneLine(input.business);
  const link = `${input.appOrigin.replace(/\/+$/, "")}/admin/prospects`;
  const lines = [
    `${input.business} clicked "Make it yours" on their preview and is editing the site now.`,
    input.withAccount
      ? "They already have an account."
      : "They don't have an account yet. A quick call now can close it.",
    "",
    input.phone ? `Phone: ${input.phone}` : null,
    input.email ? `Email: ${input.email}` : null,
    input.city ? `City: ${input.city}` : null,
    "",
    `Prospects: ${link}`,
  ].filter((line): line is string => line !== null);
  return { subject: `Hot lead: ${business} claimed their preview`, text: lines.join("\n") };
}

/** Envia o aviso. Sem chave ou sem destinatário, só pula. Nunca lança. */
export async function sendProspectClaimNotification(
  input: ProspectClaimInput,
  env: NotifyEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<NotifyResult> {
  try {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) return { sent: false, reason: "not_configured" };
    const to = (env.SALES_EMAIL || env.ALERT_EMAIL)?.trim();
    if (!to) return { sent: false, reason: "no_recipient" };
    const { subject, text } = buildProspectClaimEmail(input);
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.LEADS_FROM_EMAIL || DEFAULT_LEADS_FROM,
        to: [to],
        subject,
        text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[notify] Resend failed (${res.status}): ${await res.text()}`);
      return { sent: false, reason: "send_failed" };
    }
    return { sent: true, to };
  } catch (error) {
    console.error("[notify] prospect claim email failed", error);
    return { sent: false, reason: "send_failed" };
  }
}
