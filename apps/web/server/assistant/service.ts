import {
  ASSISTANT_MAX_MESSAGES,
  type AssistantChatResponse,
  type AssistantConversationSummary,
  type AssistantSettingsResponse,
} from "@nosweat/schema";
import { ownerHasFeature, ownerHasLiveAccess } from "../billing";
import { liveBookingEndpoint } from "../booking/service";
import { refundSpend, spendOwnerCredits } from "../credits";
import { saveSiteLead } from "../leads";
import { RateLimiter } from "../notify/rate-limit";
import { liveSpec } from "../sites";
import { getSiteStore, type SiteRecord } from "../store";
import { revalidatePublicSite } from "../store/revalidate";
import { getAssistantResponder, type AssistantModelOutput, type AssistantResponder } from "./ai";
import {
  creditsForMessages,
  dailyConversationCap,
  fallbackReply,
  ipHourlyLimits,
  remainingMessages,
  verifiedLead,
} from "./rules";
import { getAssistantStore, type ConversationRecord } from "./store";

// Atendente de IA do site publicado (plano Premium): conversa com o visitante e cobra os
// créditos do DONO. Ordem de cada mensagem:
//   confere (ligado, plano, limites) → grava a mensagem (contagem sem corrida) → cobra se a
//   mensagem abre um bloco de 10 (1, 11, 21) → IA → salva a resposta e o pedido de contato.
// A IA falhou: os créditos voltam (refundSpend) e a cobrança da conversa é desfeita.

/** Conversas mostradas no painel do dono (/sites/[id]). */
export const OWNER_CONVERSATIONS = 30;
/** Resposta da IA cortada neste tamanho (o widget mostra texto curto). */
const REPLY_MAX = 1200;

export type ChatOutcome =
  | { ok: true; body: AssistantChatResponse }
  | { ok: false; status: number; code: string; message: string };

const fail = (status: number, code: string, message: string): ChatOutcome => ({
  ok: false,
  status,
  code,
  message,
});

// Limites por rede (hash do IP) em cada site: em memória, por instância (melhor esforço). O
// teto de conversas por site por dia (no banco) e os créditos do dono seguram o custo de verdade.
let limiters: { conversations: RateLimiter; messages: RateLimiter } | undefined;

function ipLimiters() {
  if (!limiters) {
    const limits = ipHourlyLimits();
    const hour = 60 * 60 * 1000;
    limiters = {
      conversations: new RateLimiter(limits.conversations, hour),
      messages: new RateLimiter(limits.messages, hour),
    };
  }
  return limiters;
}

/** Só para testes: zera os limites por rede. */
export function resetAssistantLimiters(): void {
  limiters = undefined;
}

export type ChatInput = {
  site: SiteRecord;
  conversationId?: string;
  message: string;
  /** Hash do IP (server/ip.ts); `null` se não deu para ler o IP. */
  ipHash: string | null;
  /** Chave dos limites por rede (o hash do IP ou, sem ele, o IP do proxy). */
  ipKey: string;
  /** Endereço do pedido (link do painel no e-mail do pedido de contato). */
  requestUrl: string;
  /** Testes: atendente fixo. */
  responder?: AssistantResponder | null;
};

function toSummary(record: ConversationRecord): AssistantConversationSummary {
  return {
    id: record.id,
    createdAt: record.createdAt,
    lastMessageAt: record.lastMessageAt,
    visitorMessages: record.visitorMessages,
    creditsCharged: record.creditsCharged,
    preview: record.preview,
    leadCaptured: record.leadCaptured,
  };
}

/** O atendente pode responder neste site agora (ligado, Premium, site no ar com plano)? */
async function siteReady(site: SiteRecord): Promise<boolean> {
  const ownerId = site.ownerId;
  if (!ownerId || site.status !== "published") return false;
  if (!(await getAssistantStore().isEnabled(site.id))) return false;
  const [feature, live] = await Promise.all([
    ownerHasFeature(ownerId, "aiAssistant"),
    ownerHasLiveAccess(ownerId),
  ]);
  return feature && live;
}

/** Uma mensagem do visitante: devolve a resposta do atendente (ou o erro já no formato da API). */
export async function chatWithAssistant(input: ChatInput): Promise<ChatOutcome> {
  const { site, message } = input;
  const ownerId = site.ownerId;
  if (!ownerId || !(await siteReady(site))) {
    return fail(404, "not_found", "Chat is not available on this website.");
  }
  const responder = input.responder === undefined ? getAssistantResponder() : input.responder;
  if (!responder) return fail(503, "ai_unavailable", "Chat is not available right now.");

  const spec = liveSpec(site);
  const phone = spec.business.phone?.trim() || undefined;
  const store = getAssistantStore();
  const key = `${input.ipKey}|${site.id}`;
  const busy = fail(
    429,
    "quota_exceeded",
    "Our chat is very busy right now. Please call us or use the contact form on this page.",
  );

  let conversation: ConversationRecord | null;
  if (input.conversationId) {
    conversation = await store.getConversation(input.conversationId, site.id);
    if (!conversation) {
      return fail(404, "not_found", "This chat has ended. Close it and open a new one.");
    }
  } else {
    if (!ipLimiters().conversations.take(key)) return busy;
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if ((await store.countConversationsSince(site.id, dayAgo)) >= dailyConversationCap()) {
      return busy;
    }
    conversation = await store.createConversation(site.id, ownerId);
  }
  if (!ipLimiters().messages.take(key)) return busy;
  const current: ConversationRecord = conversation;

  const done = async (
    reply: string,
    count: number,
    extra: Partial<AssistantChatResponse> = {},
  ): Promise<ChatOutcome> => {
    await store.addAssistantMessage(current.id, reply);
    return {
      ok: true,
      body: {
        conversationId: current.id,
        reply,
        offerBooking: false,
        leadSaved: false,
        ended: count >= ASSISTANT_MAX_MESSAGES,
        remainingMessages: remainingMessages(count),
        ...extra,
      },
    };
  };

  const count = await store.addVisitorMessage(current.id, site.id, message, ASSISTANT_MAX_MESSAGES);
  if (count === null) {
    return {
      ok: true,
      body: {
        conversationId: current.id,
        reply: fallbackReply(phone, "limit"),
        offerBooking: false,
        leadSaved: false,
        ended: true,
        remainingMessages: 0,
      },
    };
  }

  // Cobrança: 1 crédito por bloco de 10 mensagens (a 1ª, a 11ª e a 21ª abrem um bloco).
  const claimed = await store.claimCharge(current.id, creditsForMessages(count));
  const spends: (string | null)[] = [];
  const undoCharge = async (why: string) => {
    for (const spendId of spends) await refundSpend(ownerId, spendId, why);
    if (claimed > 0) await store.releaseCharge(current.id, claimed);
  };
  for (let i = 0; i < claimed; i++) {
    const spent = await spendOwnerCredits(ownerId, "assistant_chat", site.id);
    if (!spent.ok) {
      // Sem créditos: resposta educada, a conversa acaba e o widget some na próxima visita.
      await undoCharge("out_of_credits");
      revalidatePublicSite(site);
      return done(fallbackReply(phone, "unavailable"), count, {
        ended: true,
        remainingMessages: 0,
      });
    }
    spends.push(spent.spendId);
  }
  // Custo estimado do /admin (ai_usage): uma linha por crédito cobrado.
  for (let i = 0; i < claimed; i++) {
    try {
      await getSiteStore().recordAiUsage(ownerId, "assistant_chat");
    } catch (error) {
      console.error("[assistant] could not record the AI usage", error);
    }
  }

  const history = await store.listMessages(current.id);
  const bookingAvailable = Boolean(await liveBookingEndpoint(site.id, spec));
  let output: AssistantModelOutput;
  try {
    output = await responder.reply(
      { spec, bookingAvailable },
      history.map((item) => ({ role: item.role, text: item.text })),
    );
  } catch (error) {
    console.error("[assistant] the AI failed", error);
    await undoCharge("ai_failed");
    return fail(502, "generation_failed", fallbackReply(phone, "error"));
  }

  const reply = output.reply.trim().slice(0, REPLY_MAX) || fallbackReply(phone, "error");

  // Pedido de contato: só uma vez por conversa e só com o contato que o visitante digitou.
  let leadSaved = false;
  if (!current.leadId) {
    const visitorTexts = history.filter((item) => item.role === "visitor").map((item) => item.text);
    const lead = verifiedLead(output.lead, visitorTexts);
    if (lead) {
      try {
        const saved = await saveSiteLead(site, lead, input.ipHash, input.requestUrl);
        if (saved.ok) {
          await store.setLead(current.id, saved.lead.id);
          leadSaved = true;
        }
      } catch (error) {
        console.error("[assistant] could not save the lead", error);
      }
    }
  }

  return done(reply, count, {
    offerBooking: bookingAvailable && output.offerBooking === true,
    leadSaved,
  });
}

// ---------- Painel do dono ----------

/** Liga/desliga e as últimas conversas, para /sites/[id] e GET /api/sites/[id]/assistant. */
export async function assistantOverview(site: SiteRecord): Promise<AssistantSettingsResponse> {
  const store = getAssistantStore();
  const [enabled, available, conversations] = await Promise.all([
    store.isEnabled(site.id),
    site.ownerId ? ownerHasFeature(site.ownerId, "aiAssistant") : Promise.resolve(false),
    store.listConversations(site.id, OWNER_CONVERSATIONS),
  ]);
  return { enabled, available, conversations: conversations.map(toSummary) };
}

/** Liga/desliga o atendente e limpa o cache das páginas do site (o widget aparece ou some). */
export async function setAssistantEnabled(site: SiteRecord, enabled: boolean): Promise<void> {
  await getAssistantStore().setEnabled(site.id, enabled);
  revalidatePublicSite(site);
}

/** Conversa do site com as mensagens (painel do dono), ou `null`. */
export async function assistantTranscript(site: SiteRecord, conversationId: string) {
  const store = getAssistantStore();
  const conversation = await store.getConversation(conversationId, site.id);
  if (!conversation) return null;
  return {
    conversation: toSummary(conversation),
    messages: await store.listMessages(conversation.id),
  };
}
