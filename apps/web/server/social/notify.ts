import { findOwnerEmail, type NotifyEnv } from "../notify/lead-email";
import { getSocialStore, type SocialStore } from "./store";

// Avisos por e-mail do módulo de redes sociais (post que falhou, conta que precisa reconectar).
// Mesmo jeito do aviso de pedidos: API HTTP da Resend, sem SDK. Sem RESEND_API_KEY não faz nada.
// Nunca lança: o estado do post já foi salvo e aparece em /social de qualquer jeito.

export const DEFAULT_SOCIAL_FROM = "No Sweat <hello@nosweatfd.com>";
const DEFAULT_ORIGIN = "https://www.nosweatfd.com";
const TIMEOUT_MS = 5_000;
/** No máximo um aviso de "reconectar" a cada 3 dias por dono. */
const RECONNECT_EMAIL_EVERY_MS = 3 * 24 * 60 * 60 * 1000;

export type SocialNotifyOptions = {
  env?: NotifyEnv;
  fetchImpl?: typeof fetch;
  store?: SocialStore;
  now?: Date;
};

function socialLink(env: NotifyEnv): string {
  const origin = (env.NEXT_PUBLIC_SITE_URL || DEFAULT_ORIGIN).replace(/\/+$/, "");
  return `${origin}/social`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wrapHtml(paragraphs: string[], link: string, linkText: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;max-width:560px">
${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n")}
<p><a href="${escapeHtml(link)}">${escapeHtml(linkText)}</a></p>
</div>`;
}

/** Envia pela Resend. `true` se a Resend aceitou. */
async function send(
  ownerId: string,
  subject: string,
  text: string,
  html: string,
  env: NotifyEnv,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return false;
  const to = await findOwnerEmail(ownerId, env, fetchImpl);
  if (!to) return false;
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.SOCIAL_FROM_EMAIL || DEFAULT_SOCIAL_FROM,
      to: [to],
      subject,
      text,
      html,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    console.error(`[social] Resend failed (${res.status}): ${await res.text()}`);
    return false;
  }
  return true;
}

/** Avisa o dono que um post não foi publicado (falha definitiva). */
export async function sendPostFailedEmail(
  ownerId: string,
  postId: string,
  reason: string,
  options: SocialNotifyOptions = {},
): Promise<void> {
  const env = options.env ?? process.env;
  try {
    if (!env.RESEND_API_KEY) return;
    const link = socialLink(env);
    const subject = "One of your Instagram posts was not published";
    const lines = [
      "We could not publish one of your scheduled Instagram posts.",
      `Reason: ${reason.replace(/[\r\n]+/g, " ").slice(0, 300)}`,
      "Open your social calendar to fix it or pick a new date.",
    ];
    const text = [...lines, "", link].join("\n");
    const html = wrapHtml(lines, link, "Open your social calendar");
    const sent = await send(ownerId, subject, text, html, env, options.fetchImpl ?? fetch);
    if (sent) {
      await (options.store ?? getSocialStore()).logEvent({
        ownerId,
        postId,
        action: "failed_email",
      });
    }
  } catch (error) {
    console.error("[social] failed-post email failed", error);
  }
}

/** Avisa o dono que a conta do Instagram precisa ser reconectada (no máximo 1 vez a cada 3 dias). */
export async function sendReconnectEmail(
  ownerId: string,
  options: SocialNotifyOptions = {},
): Promise<void> {
  const env = options.env ?? process.env;
  try {
    if (!env.RESEND_API_KEY) return;
    const store = options.store ?? getSocialStore();
    const now = options.now ?? new Date();
    const since = new Date(now.getTime() - RECONNECT_EMAIL_EVERY_MS).toISOString();
    if ((await store.countEventsSince(ownerId, "reconnect_email", since)) > 0) return;
    const link = socialLink(env);
    const subject = "Reconnect your Instagram account";
    const lines = [
      "Instagram stopped accepting posts from No Sweat for your account. This happens when the access expires or is removed.",
      "Your scheduled posts are paused. Reconnect your account and they will go back to the calendar.",
    ];
    const text = [...lines, "", link].join("\n");
    const html = wrapHtml(lines, link, "Reconnect Instagram");
    const sent = await send(ownerId, subject, text, html, env, options.fetchImpl ?? fetch);
    if (sent) await store.logEvent({ ownerId, action: "reconnect_email" });
  } catch (error) {
    console.error("[social] reconnect email failed", error);
  }
}
