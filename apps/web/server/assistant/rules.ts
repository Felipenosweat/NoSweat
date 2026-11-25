import {
  ASSISTANT_MAX_MESSAGES,
  ASSISTANT_MESSAGES_PER_CREDIT,
  type AssistantMessageRole,
} from "@nosweat/schema";
import type { NewLead } from "../store";

// Regras do atendente de IA do site (puras, sem banco): cobrança, limites e o pedido de contato.
//
// Cobrança (decisão do fundador): 1 crédito do DONO por conversa; mensagens 1-10 do visitante = 1
// crédito, 11-20 = +1, 21-30 = +1. Cada vez que o visitante abre o painel é uma conversa nova
// (cobrada na primeira mensagem, não ao abrir). Máximo de 30 mensagens e 500 caracteres cada.

/** Créditos que uma conversa com `count` mensagens do visitante custa ao todo. */
export function creditsForMessages(count: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.ceil(Math.floor(count) / ASSISTANT_MESSAGES_PER_CREDIT);
}

/** Mensagens que o visitante ainda pode mandar depois de `count`. */
export function remainingMessages(count: number): number {
  return Math.max(0, ASSISTANT_MAX_MESSAGES - Math.max(0, count));
}

type Env = Record<string, string | undefined>;

function envInt(env: Env, name: string, fallback: number): number {
  const raw = env[name];
  const value = Number(raw);
  return raw !== undefined && raw !== "" && Number.isInteger(value) && value >= 0
    ? value
    : fallback;
}

/** Teto de conversas novas por site em 24 horas (custo máximo por dono e contra robôs). */
export const DEFAULT_DAILY_CONVERSATIONS_PER_SITE = 200;

export function dailyConversationCap(env: Env = process.env): number {
  return envInt(
    env,
    "ASSISTANT_DAILY_CONVERSATIONS_PER_SITE",
    DEFAULT_DAILY_CONVERSATIONS_PER_SITE,
  );
}

/** Limites por rede (IP com hash) em cada site, por hora. Melhor esforço, em memória. */
export function ipHourlyLimits(env: Env = process.env): {
  conversations: number;
  messages: number;
} {
  return {
    conversations: envInt(env, "ASSISTANT_IP_HOURLY_CONVERSATIONS", 6),
    messages: envInt(env, "ASSISTANT_IP_HOURLY_MESSAGES", 60),
  };
}

// ---------- Pedido de contato vindo da conversa ----------

/** Pedido de contato que a IA montou a partir da conversa (ainda não conferido). */
export type ModelLead = { name: string; phone?: string; email?: string; message: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (value: string) => value.replace(/\D/g, "");

/** Prefixo da mensagem do pedido: o dono sabe que veio do atendente, não do formulário. */
export const LEAD_PREFIX = "(Sent through the AI assistant on your website)";

/**
 * Confere o pedido que a IA devolveu contra o que o VISITANTE digitou: e-mail e telefone só
 * valem se aparecem nas mensagens dele (a IA nunca inventa contato). Sem e-mail nem telefone
 * conferidos, não há pedido. Nome que o visitante não digitou vira "Website visitor".
 */
export function verifiedLead(lead: ModelLead | undefined, visitorTexts: string[]): NewLead | null {
  if (!lead) return null;
  const typed = visitorTexts.join("\n");
  const typedLower = typed.toLowerCase();
  const typedDigits = digits(typed);

  const email = lead.email?.trim().toLowerCase() ?? "";
  const emailOk = email.length <= 200 && EMAIL.test(email) && typedLower.includes(email);
  const phone = lead.phone?.trim() ?? "";
  const phoneDigits = digits(phone);
  const phoneOk =
    phoneDigits.length >= 7 && phoneDigits.length <= 15 && typedDigits.includes(phoneDigits);
  if (!emailOk && !phoneOk) return null;

  const name = lead.name.trim().replace(/\s+/g, " ").slice(0, 120);
  const nameOk = name.length > 0 && typedLower.includes(name.toLowerCase());
  const summary = lead.message.trim().slice(0, 1500);
  return {
    name: nameOk ? name : "Website visitor",
    email: emailOk ? email : null,
    phone: phoneOk ? phone.slice(0, 40) : null,
    message: summary ? `${LEAD_PREFIX}\n\n${summary}` : LEAD_PREFIX,
  };
}

// ---------- Histórico para a IA ----------

export type Turn = { role: AssistantMessageRole; text: string };
export type ModelTurn = { role: "user" | "assistant"; content: string };

/**
 * Conversa no formato da API: começa no visitante, alterna os papéis (mensagens seguidas do
 * mesmo lado se juntam, ex.: uma resposta que falhou) e termina no visitante.
 */
export function toModelTurns(turns: Turn[]): ModelTurn[] {
  const out: ModelTurn[] = [];
  for (const turn of turns) {
    const role = turn.role === "visitor" ? "user" : "assistant";
    const text = turn.text.trim();
    if (!text) continue;
    if (out.length === 0 && role === "assistant") continue;
    const last = out[out.length - 1];
    if (last && last.role === role) last.content = `${last.content}\n\n${text}`;
    else out.push({ role, content: text });
  }
  while (out.length > 0 && out[out.length - 1]?.role === "assistant") out.pop();
  return out;
}

/** Resposta educada quando o atendente não pode continuar (sem créditos, erro, limite). */
export function fallbackReply(
  phone: string | undefined,
  reason: "unavailable" | "error" | "limit",
): string {
  const call = phone ? `call us at ${phone} or ` : "";
  if (reason === "limit") {
    return `This chat has reached its limit. To keep going, please ${call}send us a message with the contact form on this page.`;
  }
  if (reason === "error") {
    return `Sorry, I couldn't answer just now. Please try again in a moment, or ${call}use the contact form on this page.`;
  }
  return `Sorry, our chat assistant isn't available right now. Please ${call}use the contact form on this page and we'll get back to you.`;
}
