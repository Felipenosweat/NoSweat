import { oneClickUnsubscribeUrl, unsubscribePageUrl } from "./unsubscribe-link";

// E-mail de boas-vindas da lista de lançamento (e-mail de MARKETING). Regras do CAN-SPAM que
// ele cumpre: remetente e assunto honestos, link para sair da lista em todo e-mail, cabeçalho
// List-Unsubscribe de um clique (exigido por Gmail/Yahoo) e endereço postal da empresa.
// Sem RESEND_API_KEY ou sem MARKETING_POSTAL_ADDRESS, não envia (o contato fica na lista).

export const DEFAULT_MARKETING_FROM = "No Sweat <hello@nosweatfd.com>";
const REPLY_TO = "hello@nosweatfd.com";

export type MarketingEnv = {
  [key: string]: string | undefined;
  RESEND_API_KEY?: string;
  MARKETING_FROM_EMAIL?: string;
  MARKETING_POSTAL_ADDRESS?: string;
};

export type WelcomeInput = { email: string; firstName: string | null; origin: string };

export type WelcomeResult =
  { sent: true } | { sent: false; reason: "not_configured" | "no_postal_address" | "send_failed" };

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildWelcomeEmail(
  input: WelcomeInput,
  postalAddress: string,
): { subject: string; text: string; html: string; headers: Record<string, string> } {
  const origin = input.origin.replace(/\/+$/, "");
  const unsubscribe = unsubscribePageUrl(origin, input.email);
  const hello = input.firstName
    ? `Hi ${input.firstName.replace(/[\r\n]+/g, " ").slice(0, 60)},`
    : "Hi,";
  const dashboard = `${origin}/dashboard`;

  const subject = "Welcome to No Sweat — you’re on the launch list";
  const text = [
    hello,
    "",
    "Thanks for creating your No Sweat account.",
    "",
    "You’re on our launch list. We’ll email you when paid plans go live and when we add something new, like more templates and features. Not often, and never sold to anyone.",
    "",
    "In the meantime, you can keep building and previewing your website for free:",
    dashboard,
    "",
    "Questions? Just reply to this email. A person on our team reads every message.",
    "",
    "— The No Sweat team",
    "",
    "---",
    "You’re receiving this because you checked “Email me about the launch” when you signed up.",
    `Unsubscribe: ${unsubscribe}`,
    `No Sweat · ${postalAddress}`,
  ].join("\n");

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#071B33;max-width:560px">
<p>${escapeHtml(hello)}</p>
<p>Thanks for creating your No Sweat account.</p>
<p>You’re on our launch list. We’ll email you when paid plans go live and when we add something new, like more templates and features. Not often, and never sold to anyone.</p>
<p>In the meantime, you can keep building and previewing your website for free.</p>
<p><a href="${escapeHtml(dashboard)}" style="display:inline-block;background:#0066FF;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">Go to my dashboard</a></p>
<p>Questions? Just reply to this email. A person on our team reads every message.</p>
<p>— The No Sweat team</p>
<hr style="border:none;border-top:1px solid #E2E8F0;margin:28px 0 16px">
<p style="font-size:13px;color:#64748B;margin:0 0 6px">You’re receiving this because you checked “Email me about the launch” when you signed up. <a href="${escapeHtml(unsubscribe)}" style="color:#64748B">Unsubscribe</a></p>
<p style="font-size:13px;color:#64748B;margin:0">No Sweat · ${escapeHtml(postalAddress)}</p>
</div>`;

  return {
    subject,
    text,
    html,
    headers: {
      "List-Unsubscribe": `<${oneClickUnsubscribeUrl(origin, input.email)}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

/** Envia o e-mail de boas-vindas. Nunca lança. */
export async function sendWelcomeEmail(
  input: WelcomeInput,
  env: MarketingEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<WelcomeResult> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "not_configured" };
  const postalAddress = env.MARKETING_POSTAL_ADDRESS?.trim();
  if (!postalAddress) {
    console.warn("[marketing] MARKETING_POSTAL_ADDRESS is not set; welcome email not sent.");
    return { sent: false, reason: "no_postal_address" };
  }
  try {
    const { subject, text, html, headers } = buildWelcomeEmail(input, postalAddress);
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.MARKETING_FROM_EMAIL || DEFAULT_MARKETING_FROM,
        to: [input.email],
        reply_to: REPLY_TO,
        subject,
        text,
        html,
        headers,
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      console.error(`[marketing] Resend failed (${res.status}): ${await res.text()}`);
      return { sent: false, reason: "send_failed" };
    }
    return { sent: true };
  } catch (error) {
    console.error("[marketing] welcome email failed", error);
    return { sent: false, reason: "send_failed" };
  }
}
